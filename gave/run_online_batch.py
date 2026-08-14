from __future__ import annotations

import json
import os
import shutil
import time
from pathlib import Path
from typing import Any

from gradio_client import Client

MANIFEST_PATH = Path(os.environ.get(
    "GAVE_MANIFEST",
    "gave/tests/wan22_ti2v_test_01_first_day.json",
))
CONTROL_PATH = Path(os.environ.get(
    "GAVE_CONTROL",
    "gave/control/run_online_batch.json",
))
OUT = Path(os.environ.get(
    "GAVE_OUT",
    "gave/runs/wan22_ti2v_test_01_first_day/online",
))
OUT.mkdir(parents=True, exist_ok=True)

SPACE = os.environ.get("GAVE_SPACE", "Upsampler/wan-2-2-5b-video")
HF_TOKEN = os.environ.get("HF_TOKEN")


class GaveBatchSafetyError(RuntimeError):
    pass


def log(*args: Any) -> None:
    print(*args, flush=True)


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def assert_zero_cost(manifest: dict[str, Any], control: dict[str, Any]) -> None:
    required_false = {
        "paidInferenceAllowed": manifest.get("paidInferenceAllowed"),
        "productionAllowed": manifest.get("productionAllowed"),
        "imageGenerationAllowed": manifest.get("imageGenerationAllowed"),
        "imageToVideoAllowed": manifest.get("imageToVideoAllowed"),
    }
    bad = [key for key, value in required_false.items() if value is not False]
    if bad:
        raise GaveBatchSafetyError(f"Manifest violates zero-cost/T2V guards: {bad}")
    if float(manifest.get("actualSpendEur", -1)) != 0:
        raise GaveBatchSafetyError("Manifest actualSpendEur must be 0")
    if control.get("allowPaidFallback") is not False:
        raise GaveBatchSafetyError("Paid fallback is forbidden")
    if control.get("allowImageInput") is not False:
        raise GaveBatchSafetyError("Image input is forbidden for this test")
    if control.get("touchProduction") is not False:
        raise GaveBatchSafetyError("Production access is forbidden")
    if not HF_TOKEN:
        raise GaveBatchSafetyError(
            "HF_TOKEN is required for the authenticated Free-account batch runner. "
            "Do not paste it into source code or chat. Store it only as a GitHub Actions secret."
        )


def extract_video_path(payload: Any) -> Path:
    if isinstance(payload, dict):
        value = payload.get("video") or payload.get("path")
    else:
        value = payload
    if not value:
        raise RuntimeError(f"No video path in Gradio payload: {payload!r}")
    path = Path(str(value))
    if not path.exists():
        raise RuntimeError(f"Downloaded Gradio video path does not exist: {path}")
    return path


def main() -> int:
    manifest = load_json(MANIFEST_PATH)
    control = load_json(CONTROL_PATH)
    assert_zero_cost(manifest, control)

    start_index = int(control.get("startShot", 1))
    max_shots = int(control.get("maxShots", 1))
    width = int(control.get("width", 768))
    height = int(control.get("height", 448))
    steps = int(control.get("steps", 4))
    guidance = float(control.get("guidance", 0.0))
    skip_existing = bool(control.get("skipExisting", True))

    if start_index < 1:
        raise ValueError("startShot is 1-based and must be >= 1")
    if max_shots < 1:
        raise ValueError("maxShots must be >= 1")

    shots = manifest["shots"]
    selected = shots[start_index - 1 : start_index - 1 + max_shots]
    if not selected:
        raise ValueError("Control selects no shots")

    master = " ".join(
        x.strip()
        for x in [
            manifest.get("characterLock", ""),
            manifest.get("visualMaster", ""),
            manifest.get("storyRule", ""),
        ]
        if x.strip()
    )
    negative_prompt = str(manifest.get("negativeMaster", ""))
    continuity_seed = int(manifest.get("continuitySeed", 24081977))

    log(json.dumps({
        "status": "STARTING",
        "space": SPACE,
        "selectedShots": [s["id"] for s in selected],
        "authenticated": True,
        "paidInferenceUsed": False,
        "actualSpendEur": 0,
        "imageGenerationUsed": False,
        "imageToVideoUsed": False,
        "productionTouched": False,
    }, ensure_ascii=False))

    client = Client(
        SPACE,
        token=HF_TOKEN,
        download_files=str(OUT / "_gradio_downloads"),
        verbose=True,
    )
    api = client.view_api(return_format="dict")
    named = api.get("named_endpoints") or {}
    if "/generate_video" not in named:
        raise RuntimeError(f"/generate_video missing. Available: {list(named)}")

    state_path = OUT / "batch_state.json"
    if state_path.exists():
        state = load_json(state_path)
    else:
        state = {
            "testId": manifest["testId"],
            "space": SPACE,
            "backend": "HF_ZERO_GPU_FASTWAN22_TI2V_5B",
            "results": [],
            "paidInferenceUsed": False,
            "actualSpendEur": 0,
            "imageGenerationUsed": False,
            "imageToVideoUsed": False,
            "productionTouched": False,
        }

    completed_ids = {
        item.get("shotId")
        for item in state.get("results", [])
        if item.get("status") == "GENERATED"
    }

    for shot in selected:
        shot_id = str(shot["id"])
        final_path = OUT / f"{shot_id.lower()}.mp4"

        if skip_existing and shot_id in completed_ids and final_path.exists():
            log("SKIP_EXISTING", shot_id)
            continue

        prompt = f"{master} {shot['prompt']}".strip()
        duration = float(shot["durationSeconds"])
        started = time.time()

        log("QUEUEING", json.dumps({
            "shotId": shot_id,
            "durationSeconds": duration,
            "width": width,
            "height": height,
            "steps": steps,
            "guidance": guidance,
            "seed": continuity_seed,
            "image": None,
        }, ensure_ascii=False))

        try:
            # Exact live API discovered from Upsampler/wan-2-2-5b-video:
            # input_image, prompt, height, width, negative_prompt,
            # duration_seconds, guidance_scale, steps, seed, randomize_seed.
            # input_image=None => pure Text-to-Video; randomize_seed=False => continuity seed.
            result = client.predict(
                None,
                prompt,
                height,
                width,
                negative_prompt,
                duration,
                guidance,
                steps,
                continuity_seed,
                False,
                api_name="/generate_video",
            )

            video_payload = result[0] if isinstance(result, (tuple, list)) else result
            returned_seed = (
                result[1]
                if isinstance(result, (tuple, list)) and len(result) > 1
                else continuity_seed
            )
            downloaded = extract_video_path(video_payload)
            if downloaded.resolve() != final_path.resolve():
                shutil.copy2(downloaded, final_path)

            item = {
                "shotId": shot_id,
                "status": "GENERATED",
                "version": 1,
                "durationRequestedSeconds": duration,
                "width": width,
                "height": height,
                "steps": steps,
                "guidance": guidance,
                "requestedSeed": continuity_seed,
                "returnedSeed": returned_seed,
                "elapsedSeconds": round(time.time() - started, 2),
                "output": str(final_path),
                "bytes": final_path.stat().st_size,
                "paidInferenceUsed": False,
                "actualSpendEur": 0,
                "imageGenerationUsed": False,
                "imageToVideoUsed": False,
                "reviewStatus": "PENDING",
            }
        except Exception as exc:
            item = {
                "shotId": shot_id,
                "status": "FAIL",
                "errorType": type(exc).__name__,
                "error": str(exc),
                "elapsedSeconds": round(time.time() - started, 2),
                "paidInferenceUsed": False,
                "actualSpendEur": 0,
                "imageGenerationUsed": False,
                "imageToVideoUsed": False,
                "reviewStatus": "NOT_TESTED",
            }

        state["results"] = [
            old for old in state.get("results", []) if old.get("shotId") != shot_id
        ] + [item]
        state_path.write_text(
            json.dumps(state, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        log(json.dumps(item, indent=2, ensure_ascii=False))

        if item["status"] != "GENERATED":
            log("STOP_AFTER_FAILURE", shot_id)
            break

    success = all(
        any(
            result.get("shotId") == shot["id"] and result.get("status") == "GENERATED"
            for result in state.get("results", [])
        )
        for shot in selected
        if not (skip_existing and (OUT / f"{shot['id'].lower()}.mp4").exists())
    )

    log(json.dumps({
        "status": "PASS" if success else "PARTIAL",
        "state": str(state_path),
        "paidInferenceUsed": False,
        "actualSpendEur": 0,
        "imageGenerationUsed": False,
        "imageToVideoUsed": False,
        "productionTouched": False,
    }, indent=2, ensure_ascii=False))
    return 0 if success else 2


if __name__ == "__main__":
    raise SystemExit(main())
