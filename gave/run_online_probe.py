from __future__ import annotations

import json
import os
import shutil
import time
from pathlib import Path

from gradio_client import Client

SPACE = os.environ.get("GAVE_SPACE", "Upsampler/wan-2-2-5b-video")
SHOT_ID = os.environ.get("GAVE_SHOT_ID", "SHOT_001_WAKE")
OUT = Path(os.environ.get("GAVE_OUT", "gave/runs/wan22_online_probe"))
OUT.mkdir(parents=True, exist_ok=True)

manifest = json.loads(
    Path("gave/tests/wan22_ti2v_test_01_first_day.json").read_text(encoding="utf-8")
)
shot = next(s for s in manifest["shots"] if s["id"] == SHOT_ID)
master = " ".join(
    x.strip()
    for x in [
        manifest.get("characterLock", ""),
        manifest.get("visualMaster", ""),
        manifest.get("storyRule", ""),
    ]
    if x.strip()
)
prompt = f"{master} {shot['prompt']}".strip()

def log(*args):
    print(*args, flush=True)

log(json.dumps({
    "status": "STARTING",
    "space": SPACE,
    "shotId": SHOT_ID,
    "paidInferenceUsed": False,
    "actualSpendEur": 0,
    "imageGenerationUsed": False,
    "imageToVideoUsed": False,
}, ensure_ascii=False))

started = time.time()
client = Client(SPACE, download_files=str(OUT), verbose=True)
log("CLIENT_CONNECTED", round(time.time() - started, 2))
api = client.view_api(return_format="dict")
log("API_DISCOVERED", round(time.time() - started, 2))
(OUT / "api.json").write_text(
    json.dumps(api, indent=2, ensure_ascii=False), encoding="utf-8"
)
named = api.get("named_endpoints") or {}
log("NAMED_ENDPOINTS", list(named))

api_name = None
for candidate in ("/generate_video", "/predict"):
    if candidate in named:
        api_name = candidate
        break
if api_name is None:
    for name in named:
        if "video" in name.lower() or "generate" in name.lower():
            api_name = name
            break
if api_name is None and len(named) == 1:
    api_name = next(iter(named))
if not api_name:
    raise RuntimeError(f"No usable generation endpoint found: {list(named)}")

seed = int(manifest.get("continuitySeed", 24081977))
steps = int(os.environ.get("GAVE_PROBE_STEPS", "8"))
probe_seconds = float(os.environ.get("GAVE_PROBE_SECONDS", "1.0"))
width = int(os.environ.get("GAVE_PROBE_WIDTH", "768"))
height = int(os.environ.get("GAVE_PROBE_HEIGHT", "448"))
log("QUEUEING", json.dumps({
    "space": SPACE,
    "apiName": api_name,
    "seconds": probe_seconds,
    "steps": steps,
    "width": width,
    "height": height,
    "image": None,
}, ensure_ascii=False))

if SPACE == "Upsampler/wan-2-2-5b-video":
    # API follows the official Wan TI2V Gradio shape:
    # image, prompt, height, width, duration_seconds, sampling_steps,
    # guide_scale, shift, seed. Image is deliberately None => T2V only.
    result = client.predict(
        None,
        prompt,
        height,
        width,
        probe_seconds,
        steps,
        5.0,
        5.0,
        seed,
        api_name=api_name,
    )
else:
    # OpenKing profile: prompt, image, width, height, frames, steps,
    # guidance_scale, seed. Kept only as a compatibility fallback.
    frames = max(25, int(round(probe_seconds * 24)))
    result = client.predict(
        prompt,
        None,
        width,
        height,
        frames,
        max(20, steps),
        5.0,
        seed,
        api_name=api_name,
    )

log("RAW_RESULT", repr(result))
video = result[0] if isinstance(result, (tuple, list)) else result
status_text = result[1] if isinstance(result, (tuple, list)) and len(result) > 1 else ""
if video is None:
    raise RuntimeError(f"Space returned no video. Status: {status_text}")

path = Path(str(video))
if not path.exists():
    raise RuntimeError(f"Downloaded video path does not exist: {path}")

final = OUT / f"{SHOT_ID.lower()}.mp4"
if path.resolve() != final.resolve():
    shutil.copy2(path, final)

report = {
    "status": "GENERATED",
    "space": SPACE,
    "apiName": api_name,
    "shotId": SHOT_ID,
    "durationRequestedSeconds": probe_seconds,
    "steps": steps,
    "width": width,
    "height": height,
    "elapsedSeconds": round(time.time() - started, 2),
    "output": str(final),
    "bytes": final.stat().st_size,
    "remoteStatus": str(status_text),
    "paidInferenceUsed": False,
    "actualSpendEur": 0,
    "imageGenerationUsed": False,
    "imageToVideoUsed": False,
}
(OUT / "result.json").write_text(
    json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8"
)
log(json.dumps(report, indent=2, ensure_ascii=False))
