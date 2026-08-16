from __future__ import annotations

import json
import os
from pathlib import Path

from lightning_sdk import Machine, Studio

BRANCH = "gave/wan22-t2v-test-01"
DEFAULT_ORG = "GAVE"
DEFAULT_TEAMSPACE = "deploy-model-project"
DEFAULT_STUDIO = "deploy-model-devbox"
REMOTE_REPO_ABS = "/teamspace/studios/this_studio/ghc-academy"
REMOTE_REPO_REL = "ghc-academy"
REMOTE_STATE_REL = f"{REMOTE_REPO_REL}/.gave/lightning/output/worker_state.json"
REMOTE_LAST_VIDEO_REL = f"{REMOTE_REPO_REL}/.gave/lightning/output/lightning_t4_gym_reveal_001_diffusers.mp4"
REQUEST_PATH = Path("gave/control/lightning_request.json")
LOCAL_OUT = Path("artifacts/lightning")


def required_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def load_request() -> dict:
    request = json.loads(REQUEST_PATH.read_text(encoding="utf-8"))
    if request.get("paidInferenceAllowed") is not False:
        raise RuntimeError("paidInferenceAllowed must remain false")
    if float(request.get("actualSpendEur", -1)) != 0:
        raise RuntimeError("actualSpendEur must remain 0")
    if request.get("productionAllowed") is not False:
        raise RuntimeError("productionAllowed must remain false")
    if request.get("imageGenerationAllowed") is not False:
        raise RuntimeError("imageGenerationAllowed must remain false")
    if request.get("imageToVideoAllowed") is not False:
        raise RuntimeError("imageToVideoAllowed must remain false")
    return request


def download(studio: Studio, remote_path: str, local_path: Path) -> None:
    local_path.parent.mkdir(parents=True, exist_ok=True)
    studio.download_file(remote_path, str(local_path))


def recover_last(studio: Studio) -> None:
    # Lightning SDK file transfers use paths relative to the Studio content root.
    # Studio storage persists while sleeping; this does not require GPU compute.
    download(studio, REMOTE_LAST_VIDEO_REL, LOCAL_OUT / Path(REMOTE_LAST_VIDEO_REL).name)
    try:
        download(studio, REMOTE_STATE_REL, LOCAL_OUT / "worker_state.json")
    except Exception as exc:
        print(f"WARNING: state recovery failed but video recovery succeeded: {exc}")
    print(f"GAVE_VIDEO={LOCAL_OUT / Path(REMOTE_LAST_VIDEO_REL).name}")


def generate_smoke(studio: Studio) -> None:
    started = False
    try:
        studio.start(Machine.T4, interruptible=True)
        started = True

        remote_command = f"""
set -euo pipefail
cd {REMOTE_REPO_ABS}
git fetch origin {BRANCH}
git checkout {BRANCH}
git reset --hard origin/{BRANCH}
export GAVE_ALLOW_PAID=false
bash gave/remote_worker/lightning/run_gpu_smoke.sh
""".strip()
        output, exit_code = studio.run_with_exit_code(remote_command)
        print(output)
        if exit_code != 0:
            raise RuntimeError(f"Remote generation failed with exit code {exit_code}")

        download(studio, REMOTE_STATE_REL, LOCAL_OUT / "worker_state.json")
        state = json.loads((LOCAL_OUT / "worker_state.json").read_text(encoding="utf-8"))
        if state.get("status") != "GENERATED":
            raise RuntimeError(f"Remote worker did not finish GENERATED: {state}")

        remote_output = str(state.get("output", ""))
        if not remote_output:
            raise RuntimeError("Remote worker state contains no output path")
        if "/ghc-academy/" in remote_output:
            remote_output = "ghc-academy/" + remote_output.split("/ghc-academy/", 1)[1]
        elif remote_output.startswith("ghc-academy/"):
            pass
        else:
            remote_output = f"{REMOTE_REPO_REL}/{remote_output.lstrip('/')}"
        local_video = LOCAL_OUT / Path(remote_output).name
        download(studio, remote_output, local_video)
        print(f"GAVE_VIDEO={local_video}")
    finally:
        if started:
            try:
                studio.stop()
            except Exception as exc:
                print(f"WARNING: Lightning Studio stop failed: {exc}")


def main() -> int:
    os.environ["LIGHTNING_USER_ID"] = required_env("LIGHTNING_USER_ID")
    os.environ["LIGHTNING_API_KEY"] = required_env("LIGHTNING_API_KEY")

    if os.environ.get("GAVE_ALLOW_PAID", "false").lower() not in {"false", "0", "no"}:
        raise RuntimeError("GAVE_ALLOW_PAID must remain false")

    request = load_request()
    if not request.get("enabled", False):
        print("GAVE Lightning request disabled; nothing to do.")
        return 0

    org = os.environ.get("LIGHTNING_ORG", DEFAULT_ORG).strip()
    teamspace = os.environ.get("LIGHTNING_TEAMSPACE", DEFAULT_TEAMSPACE).strip()
    studio_name = os.environ.get("LIGHTNING_STUDIO", DEFAULT_STUDIO).strip()
    studio = Studio(name=studio_name, teamspace=teamspace, org=org)
    LOCAL_OUT.mkdir(parents=True, exist_ok=True)

    operation = str(request.get("operation", "")).upper()
    if operation == "RECOVER_LAST":
        recover_last(studio)
        return 0
    if operation == "SMOKE_TEST":
        generate_smoke(studio)
        return 0
    raise RuntimeError(f"Unsupported GAVE Lightning operation: {operation}")


if __name__ == "__main__":
    raise SystemExit(main())
