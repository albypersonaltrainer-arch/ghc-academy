from __future__ import annotations

import re
from pathlib import Path
from typing import Any


def _stamp(seconds: float) -> str:
    ms = max(0, int(round(seconds * 1000)))
    hours, rem = divmod(ms, 3_600_000)
    minutes, rem = divmod(rem, 60_000)
    secs, millis = divmod(rem, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def cues_from_job(job: dict[str, Any], max_words: int = 10) -> list[tuple[float, float, str]]:
    cues: list[tuple[float, float, str]] = []
    cursor = 0.0
    for beat in job.get("beats", []):
        duration = float(beat.get("durationSeconds") or 1.0)
        words = re.findall(r"\S+", str(beat.get("narration") or ""))
        if not words:
            cursor += duration
            continue
        chunks = [words[i:i + max_words] for i in range(0, len(words), max_words)]
        weights = [len(chunk) for chunk in chunks]
        total = sum(weights)
        local = cursor
        for chunk, weight in zip(chunks, weights):
            chunk_duration = duration * weight / total
            cues.append((local, local + chunk_duration, " ".join(chunk)))
            local += chunk_duration
        cursor += duration
    return cues


def write_srt(job: dict[str, Any], path: str | Path) -> None:
    lines: list[str] = []
    for idx, (start, end, text) in enumerate(cues_from_job(job), 1):
        lines.extend([str(idx), f"{_stamp(start)} --> {_stamp(end)}", text, ""])
    Path(path).write_text("\n".join(lines), encoding="utf-8")
