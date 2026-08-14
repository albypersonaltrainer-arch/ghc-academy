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
negative_prompt = str(manifest.get("negativeMaster", ""))


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

api_name = "/generate_video" if "/generate_video" in named else None
if not api_name:
    for name in named:
        if "video" in name.lower() or "generate" in name.lower():
            api_name = name
            break
if not api_name:
    raise RuntimeError(f"No usable generation endpoint found: {list(named)}")

seed = int(manifest.get("continuitySeed", 24081977))
steps = int(os.environ.get("GAVE_PROBE_STEPS", "4"))
probe_seconds = float(os.environ.get("GAVE_PROBE_SECONDS", "2.0"))
width = int(os.environ.get("GAVE_PROBE_WIDTH", "768"))
height = int(os.environ.get("GAVE_PROBE_HEIGHT", "448"))
guidance = float(os.environ.get("GAVE_PROBE_GUIDANCE", "0.0"))

log("QUEUEING", json.dumps({
    "space": SPACE,
    "apiName": api_name,
    "seconds": probe_seconds,
    "steps": steps,
    "width": width,
    "height": height,
    "guidance": guidance,
    "seed": seed,
    "randomizeSeed": False,
    "image": None,
}, ensure_ascii=False))

if SPACE == "Upsampler/wan-2-2-5b-video":
    # Exact API discovered live from the running Space:
    # input_image, prompt, height, width, negative_prompt, duration_seconds,
    # guidance_scale, steps, seed, randomize_seed.
    # input_image=None is deliberate: PURE TEXT-TO-VIDEO.
    result = client.predict(
        None,
        prompt,
        height,
        width,
        negative_prompt,
        probe_seconds,
        guidance,
        steps,
        seed,
        False,
        api_name=api_name,
    )
else:
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
video_payload = result[0] if isinstance(result, (tuple, list)) else result
remote_seed = result[1] if isinstance(result, (tuple, list)) and len(result) > 1 else seed

if video_payload is None:
    raise RuntimeError("Space returned no video")

# Gradio 6 Video output arrives as {"video": <local downloaded path>, "subtitles": None}.
if isinstance(video_payload, dict):
    video_path_value = video_payload.get("video") or video_payload.get("path")
else:
    video_path_value = video_payload
if not video_path_value:
    raise RuntimeError(f"Video payload has no path: {video_payload!r}")

path = Path(str(video_path_value))
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
    "guidance": guidance,
    "requestedSeed": seed,
    "returnedSeed": remote_seed,
    "elapsedSeconds": round(time.time() - started, 2),
    "output": str(final),
    "bytes": final.stat().st_size,
    "paidInferenceUsed": False,
    "actualSpendEur": 0,
    "imageGenerationUsed": False,
    "imageToVideoUsed": False,
}
(OUT / "result.json").write_text(
    json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8"
)
log(json.dumps(report, indent=2, ensure_ascii=False))
