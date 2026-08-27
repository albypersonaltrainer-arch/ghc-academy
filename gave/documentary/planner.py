from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path
from typing import Any

SPANISH_STOPWORDS = {
    "a", "al", "algo", "algunas", "algunos", "ante", "antes", "como", "con", "contra", "cual", "cuando",
    "de", "del", "desde", "donde", "durante", "e", "el", "ella", "ellas", "ellos", "en", "entre", "era",
    "es", "esa", "ese", "eso", "esta", "este", "esto", "fue", "ha", "han", "hasta", "hay", "la", "las",
    "le", "les", "lo", "los", "más", "mas", "me", "mi", "muy", "no", "nos", "o", "para", "pero", "por",
    "porque", "que", "qué", "se", "ser", "si", "sin", "sobre", "su", "sus", "también", "te", "tiene", "un",
    "una", "uno", "unos", "y", "ya"
}

DOMAIN_TRANSLATIONS = {
    "fuerza": "strength training", "entrenamiento": "training", "músculo": "muscle", "musculo": "muscle",
    "músculos": "muscles", "musculos": "muscles", "salud": "health", "laboratorio": "laboratory",
    "deporte": "sport", "atleta": "athlete", "atletas": "athletes", "gimnasio": "gym",
    "ejercicio": "exercise", "movimiento": "movement", "biomecánica": "biomechanics", "biomecanica": "biomechanics",
    "fisiología": "physiology", "fisiologia": "physiology", "corazón": "heart", "corazon": "heart",
    "pulmón": "lung", "pulmon": "lung", "nutrición": "nutrition", "nutricion": "nutrition",
    "historia": "history", "ciencia": "science", "científico": "scientific", "cientifica": "scientific",
}


def split_sentences(text: str) -> list[str]:
    clean = re.sub(r"\s+", " ", text.strip())
    if not clean:
        return []
    return [p.strip() for p in re.split(r"(?<=[.!?])\s+", clean) if p.strip()]


def _keywords(text: str, max_terms: int = 5) -> list[str]:
    words = [
        w.lower() for w in re.findall(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{4,}", text)
        if w.lower() not in SPANISH_STOPWORDS
    ]
    counts = Counter(words)
    return [w for w, _ in counts.most_common(max_terms)]


def build_search_query(text: str) -> str:
    translated = [DOMAIN_TRANSLATIONS.get(term, term) for term in _keywords(text)]
    return " ".join(dict.fromkeys(translated)) or "science education"


def _tone_for(text: str) -> str:
    normalized = text.lower()
    historical = ("historia", "histórico", "historico", "antigu", "siglo", "origen", "antes de")
    return "BLACK_AND_WHITE" if any(marker in normalized for marker in historical) else "COLOR"


def plan_documentary(
    text: str,
    *,
    title: str = "GHC Academy Documentary",
    target_seconds: float | None = None,
    language: str = "es",
) -> dict[str, Any]:
    sentences = split_sentences(text)
    if not sentences:
        raise ValueError("Narration text is empty")

    word_count = len(re.findall(r"\S+", text))
    duration = float(target_seconds) if target_seconds else max(20.0, word_count / 135.0 * 60.0)

    beats: list[dict[str, Any]] = []
    current: list[str] = []
    current_words = 0
    for sentence in sentences:
        sw = len(sentence.split())
        if current and current_words + sw > 28:
            beats.append({"narration": " ".join(current)})
            current, current_words = [], 0
        current.append(sentence)
        current_words += sw
    if current:
        beats.append({"narration": " ".join(current)})

    total_words = sum(max(1, len(b["narration"].split())) for b in beats)
    for idx, beat in enumerate(beats, 1):
        words = max(1, len(beat["narration"].split()))
        beat_duration = duration * words / total_words
        shot_count = max(1, min(4, round(beat_duration / 6.0)))
        beat.update({
            "id": f"B{idx:03d}",
            "searchQuery": build_search_query(beat["narration"]),
            "tone": _tone_for(beat["narration"]),
            "durationSeconds": round(beat_duration, 3),
            "assetCount": shot_count,
            "movementCycle": ["SLOW_PUSH", "PAN_RIGHT", "DETAIL_PUSH", "SLOW_PULL"],
        })

    return {
        "schema": "GAVE_DOCUMENTARY_JOB_V1",
        "title": title,
        "language": language,
        "narrationText": text.strip(),
        "targetDurationSeconds": round(duration, 3),
        "style": {
            "reference": "premium scientific documentary",
            "resolution": "1920x1080",
            "fps": 25,
            "defaultShotSeconds": 6.0,
            "subtitleLanguage": language,
            "colorStrategy": "editorial color with intentional B&W historical/context beats",
        },
        "safety": {
            "realMediaOnly": True,
            "aiGeneratedMediaAllowed": False,
            "paidAssetsAllowed": False,
            "commercialUseRequired": True,
            "modificationRequired": True,
            "productionTouched": False,
        },
        "sourceOrder": ["pexels", "wikimedia", "met"],
        "beats": beats,
    }


def write_plan(path: str | Path, plan: dict[str, Any]) -> None:
    Path(path).write_text(json.dumps(plan, ensure_ascii=False, indent=2), encoding="utf-8")
