from __future__ import annotations

import json
import os
from pathlib import Path

from lightning_sdk import Machine, Studio


BRANCH = "gave/wan22-t2v-test-01"
DEFAULT_ORG = "GAVE"
DEFAULT_TEAMSPACE = "deploy-model-project"
DEFAULT_STUDIO = "deploy-model-devbox"
REMOTE_REPO = "ghc-academy"
REMOTE_STATE = f"{REMOTE_REPO}/.gave/lightning/output/worker_state.json"
LOCAL_OUT = Path("artifacts/lightning")


def required_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def main() -> int:
    # Authentication is intentionally injected by CI secrets only.
    required_env("LIGHTNING_USER_ID")
    required_env("LIGHTNING_API_KEY")

    if os.environ.get("GAVE_ALLOW_PAID", "false").lower() not in {"false", "0", "no"}:
        raise RuntimeError("GAVE_ALLOW_PAID must remain false")

    org = os.environ.get("LIGHTNING_ORG", DEFAULT_ORG)
    teamspace = os.environ.get("LIGHTNING_TEAMSPACE", DEFAULT_TEAMSPACE)
    studio_name = os.environ.get("LIGHTNING_STUDIO", DEFAULT_STUDIO)

    LOCAL_OUT.mkdir(parents=True, exist_ok=True)

    studio = Studio(name=studio_name, teamspace=teamspace, org=org)
    started = False
    try:
        # Interruptible T4 only. With the user's account having no payment method,
        # the run can consume free credits or fail when credits are unavailable,
        # but it must not create real-money inference spend.
        studio.start(Machine.T4, interruptible=True)
        started = True

        remote_command = f"""
set -euo pipefail
cd {REMOTE_REPO}
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

        studio.download_file(REMOTE_STATE, str(LOCAL_OUT / "worker_state.json"), progress_bar=False)
        state = json.loads((LOCAL_OUT / "worker_state.json").read_text(encoding="utf-8"))
        if state.get("status") != "GENERATED":
            raise RuntimeError(f"Remote worker did not finish GENERATED: {state}")

        remote_output = str(state.get("output", ""))
        marker = "/ghc-academy/"
        if marker in remote_output:
            remote_output = "ghc-academy/" + remote_output.split(marker, 1)[1]
        elif remote_output.startswith("ghc-academy/"):
            pass
        else:
            raise RuntimeError(f"Unexpected remote output path: {remote_output}")

        local_video = LOCAL_OUT / Path(remote_output).name
        studio.download_file(remote_output, str(local_video), progress_bar=False)
        print(f"GAVE_VIDEO={local_video}")
        return 0
    finally:
        if started:
            # Always stop compute, including failures.
            try:
                studio.stop()
            except Exception as exc:
                print(f"WARNING: Lightning Studio stop failed: {exc}")


if __name__ == "__main__":
    raise SystemExit(main())
