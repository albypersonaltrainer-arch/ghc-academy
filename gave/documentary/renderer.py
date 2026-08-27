from __future__ import annotations

import json
import math
import shutil
import subprocess
from pathlib import Path
from typing import Any

from .subtitles import write_srt


def _run(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True)


def _probe_duration(path: Path) -> float:
    raw = subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=nk=1:nw=1", str(path)
    ], text=True).strip()
    return float(raw)


def _vf(movement: str, tone: str, duration: float, fps: int) -> str:
    frames = max(1, math.ceil(duration * fps))
    base = "scale=2400:1350:force_original_aspect_ratio=increase,crop=2400:1350"
    if movement == "PAN_RIGHT":
        zoom = "zoompan=z='1.08':x='(iw-iw/zoom)*on/{f}':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps={fps}".format(f=frames, fps=fps)
    elif movement == "DETAIL_PUSH":
        zoom = "zoompan=z='min(1.0+0.0018*on,1.18)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps={fps}".format(fps=fps)
    elif movement == "SLOW_PULL":
        zoom = "zoompan=z='max(1.14-0.0012*on,1.0)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps={fps}".format(fps=fps)
    else:
        zoom = "zoompan=z='min(1.0+0.0009*on,1.10)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps={fps}".format(fps=fps)
    grade = "hue=s=0,eq=contrast=1.06:brightness=-0.02" if tone == "BLACK_AND_WHITE" else "eq=contrast=1.04:saturation=0.96:brightness=-0.01"
    return f"{base},{zoom},{grade},format=yuv420p"


def render_documentary(
    job: dict[str, Any],
    ledger: dict[str, Any],
    output_path: str | Path,
    *,
    narration_audio: str | Path | None = None,
    music_audio: str | Path | None = None,
) -> dict[str, Any]:
    if shutil.which("ffmpeg") is None or shutil.which("ffprobe") is None:
        raise RuntimeError("ffmpeg and ffprobe are required")

    output = Path(output_path)
    if output.suffix.lower() != ".mp4":
        raise ValueError("GAVE Documentary V1 output must be .mp4")
    output.parent.mkdir(parents=True, exist_ok=True)
    work = output.parent / (output.stem + "_work")
    work.mkdir(parents=True, exist_ok=True)
    fps = int(job.get("style", {}).get("fps", 25))

    total_target = float(job.get("targetDurationSeconds") or 1.0)
    if narration_audio:
        narration_duration = _probe_duration(Path(narration_audio))
        scale = narration_duration / total_target if total_target > 0 else 1.0
    else:
        narration_duration = total_target
        scale = 1.0

    by_beat: dict[str, list[dict[str, Any]]] = {}
    for item in ledger.get("items", []):
        if item.get("localPath"):
            by_beat.setdefault(str(item["beatId"]), []).append(item)

    clip_paths: list[Path] = []
    for beat in job.get("beats", []):
        items = by_beat.get(str(beat["id"]), [])
        if not items:
            raise RuntimeError(f"No downloaded approved assets for beat {beat['id']}")
        beat_duration = float(beat.get("durationSeconds") or 1.0) * scale
        each = beat_duration / len(items)
        for item in items:
            clip = work / f"clip_{len(clip_paths)+1:03d}.mp4"
            vf = _vf(str(item.get("movement") or "SLOW_PUSH"), str(item.get("tone") or "COLOR"), each, fps)
            _run([
                "ffmpeg", "-y", "-loop", "1", "-i", str(item["localPath"]),
                "-t", f"{each:.3f}", "-vf", vf, "-r", str(fps),
                "-c:v", "libx264", "-preset", "medium", "-crf", "18",
                "-pix_fmt", "yuv420p", "-an", str(clip),
            ])
            clip_paths.append(clip.resolve())

    concat_file = work / "concat.txt"
    concat_file.write_text("\n".join(f"file '{p.as_posix()}'" for p in clip_paths), encoding="utf-8")
    picture = work / "picture_lock.mp4"
    _run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat_file), "-c", "copy", str(picture)])

    srt = work / "subtitles_es.srt"
    subtitle_job = json.loads(json.dumps(job))
    for beat in subtitle_job.get("beats", []):
        beat["durationSeconds"] = float(beat.get("durationSeconds") or 0) * scale
    subtitle_job["targetDurationSeconds"] = narration_duration
    write_srt(subtitle_job, srt)

    # Spanish subtitles are a selectable MP4 text track. They are not forced/default,
    # so Academy can keep CC OFF by default and enable them when the learner wants them.
    if narration_audio:
        if music_audio:
            cmd = [
                "ffmpeg", "-y", "-i", str(picture), "-i", str(narration_audio),
                "-stream_loop", "-1", "-i", str(music_audio), "-i", str(srt),
                "-filter_complex",
                "[1:a]volume=1.0[voice];[2:a]volume=0.055[music];[voice][music]amix=inputs=2:duration=first:dropout_transition=2[a]",
                "-map", "0:v", "-map", "[a]", "-map", "3:0",
            ]
        else:
            cmd = [
                "ffmpeg", "-y", "-i", str(picture), "-i", str(narration_audio), "-i", str(srt),
                "-map", "0:v", "-map", "1:a", "-map", "2:0",
            ]
        cmd += [
            "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-c:s", "mov_text",
            "-metadata:s:s:0", "language=spa", "-metadata:s:s:0", "title=Español",
            "-disposition:s:0", "0", "-shortest", str(output),
        ]
        _run(cmd)
    else:
        _run([
            "ffmpeg", "-y", "-i", str(picture), "-i", str(srt),
            "-map", "0:v", "-map", "1:0", "-c:v", "copy", "-c:s", "mov_text",
            "-metadata:s:s:0", "language=spa", "-metadata:s:s:0", "title=Español",
            "-disposition:s:0", "0", str(output),
        ])

    return {
        "schema": "GAVE_DOCUMENTARY_RENDER_V1",
        "status": "PICTURE_LOCK" if not narration_audio else "AUDIO_PICTURE_LOCK",
        "output": str(output), "durationSeconds": round(_probe_duration(output), 3),
        "subtitles": str(srt), "subtitleTrackIncluded": True,
        "subtitleTrackLanguage": "es", "subtitleDefault": False,
        "realMediaOnly": True, "aiGeneratedMediaUsed": False,
        "paidAssetsUsed": False, "productionTouched": False,
        "qaStatus": "PENDING_HUMAN_REVIEW",
    }
