from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

ROOT = Path("gave/runs/wan22_ti2v_test_01_first_day/online")
PROBE_SHOT_001 = Path("gave/runs/wan22_online_probe/shot_001_wake.mp4")
ROOT.mkdir(parents=True, exist_ok=True)

SHOT_001 = ROOT / "shot_001_wake.mp4"
FINAL = ROOT / "first_day_picture_lock_v1.mp4"
REPORT = ROOT / "picture_lock_state.json"
WORK = ROOT / "_assembly"
WORK.mkdir(parents=True, exist_ok=True)

# Raw narrative plan totals ~32s. Trim exactly 2s while preserving all eight beats.
TRIMS = [
    ("shot_001_wake.mp4", 3.75),
    ("shot_002_exit_home.mp4", 3.75),
    ("shot_003_city.mp4", 3.75),
    ("shot_004_subway.mp4", 4.75),
    ("shot_005_last_blocks.mp4", 3.75),
    ("shot_006_door.mp4", 3.75),
    ("shot_007_reveal.mp4", 3.00),
    ("shot_008_trainer.mp4", 3.50),
]


def run(*args: str) -> None:
    print("RUN", " ".join(args), flush=True)
    subprocess.run(args, check=True)


def main() -> int:
    if not PROBE_SHOT_001.exists():
        raise FileNotFoundError(f"Missing validated SHOT 001: {PROBE_SHOT_001}")

    shutil.copy2(PROBE_SHOT_001, SHOT_001)

    missing = [name for name, _ in TRIMS if not (ROOT / name).exists()]
    if missing:
        raise FileNotFoundError(f"Missing generated shots: {missing}")

    run("ffmpeg", "-version")

    standardized: list[Path] = []
    for index, (name, duration) in enumerate(TRIMS, start=1):
        src = ROOT / name
        dst = WORK / f"{index:02d}.mp4"
        run(
            "ffmpeg", "-y",
            "-i", str(src),
            "-t", f"{duration:.2f}",
            "-an",
            "-vf", "fps=24,scale=768:448:flags=lanczos,format=yuv420p",
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", "18",
            "-movflags", "+faststart",
            str(dst),
        )
        standardized.append(dst)

    concat_file = WORK / "concat.txt"
    concat_file.write_text(
        "".join(f"file '{p.resolve()}'\n" for p in standardized),
        encoding="utf-8",
    )

    run(
        "ffmpeg", "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", str(concat_file),
        "-c", "copy",
        "-movflags", "+faststart",
        str(FINAL),
    )

    # Machine-readable duration verification; no frames/images are extracted.
    probe = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(FINAL),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    duration = float(probe.stdout.strip())

    state = {
        "testId": "WAN22_TI2V_TEST_01_FIRST_DAY",
        "status": "PICTURE_LOCK_V1",
        "output": str(FINAL),
        "bytes": FINAL.stat().st_size,
        "durationSeconds": duration,
        "targetDurationSeconds": 30.0,
        "shotCount": 8,
        "audioStatus": "NOT_ADDED",
        "voiceoverStatus": "NOT_ADDED",
        "qaStatus": "PENDING_HUMAN_REVIEW",
        "generatedBy": "WAN2.2_TI2V_BACKEND",
        "assembledBy": "FFMPEG",
        "paidInferenceUsed": False,
        "actualSpendEur": 0,
        "imageGenerationUsed": False,
        "imageToVideoUsed": False,
        "productionTouched": False,
    }
    REPORT.write_text(json.dumps(state, indent=2), encoding="utf-8")
    print(json.dumps(state, indent=2), flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
