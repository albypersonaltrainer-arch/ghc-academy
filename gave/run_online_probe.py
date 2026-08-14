from __future__ import annotations

import json
import os
import shutil
from pathlib import Path

from gradio_client import Client

SPACE = os.environ.get("GAVE_SPACE", "OpenKing/wan2-video-generation")
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

print(json.dumps({
    "status": "STARTING",
    "space": SPACE,
    "shotId": SHOT_ID,
    "paidInferenceUsed": False,
    "actualSpendEur": 0,
    "imageGenerationUsed": False,
    "imageToVideoUsed": False,
}, ensure_ascii=False))

client = Client(SPACE, download_files=str(OUT), verbose=True)
api = client.view_api(return_format="dict")
(OUT / "api.json").write_text(
    json.dumps(api, indent=2, ensure_ascii=False), encoding="utf-8"
)
named = api.get("named_endpoints") or {}
print("NAMED_ENDPOINTS", list(named))

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

# Connectivity/real-generation probe: 49 frames ~= 2 s at 24 fps.
# None is intentionally supplied as the image input: PURE TEXT-TO-VIDEO.
frames = int(os.environ.get("GAVE_PROBE_FRAMES", "49"))
steps = int(os.environ.get("GAVE_PROBE_STEPS", "20"))
seed = int(manifest.get("continuitySeed", 24081977))

result = client.predict(
    prompt,
    None,
    1280,
    704,
    frames,
    steps,
    5.0,
    seed,
    api_name=api_name,
)
print("RAW_RESULT", repr(result))

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
    "frames": frames,
    "steps": steps,
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
print(json.dumps(report, indent=2, ensure_ascii=False))
