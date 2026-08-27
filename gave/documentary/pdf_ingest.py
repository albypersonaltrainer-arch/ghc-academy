from __future__ import annotations

import hashlib
import json
import math
import re
import statistics
from pathlib import Path
from typing import Any, Iterable

from .planner import plan_documentary

NARRATION_KINDS = {"PARAGRAPH", "LIST_ITEM", "DEFINITION", "CASE_STUDY"}
VISUAL_KINDS = {"FIGURE_CAPTION", "TABLE_CAPTION", "TABLE", "FIGURE_OBJECT"}
BIBLIOGRAPHY_HEADINGS = {
    "bibliografia", "bibliografía", "referencias", "referencias bibliograficas",
    "referencias bibliográficas", "fuentes", "fuentes y bibliografia", "fuentes y bibliografía",
}
FIGURE_RE = re.compile(r"^(figura|figure|fig\.)\s*\d+\b", re.I)
TABLE_RE = re.compile(r"^(tabla|table)\s*\d+\b", re.I)
BULLET_RE = re.compile(r"^(?:[•·▪◦‣-]|\d+[.)]|[a-zA-Z][.)])\s+")
NUMBERED_HEADING_RE = re.compile(r"^\d+(?:\.\d+){0,3}[.)]?\s+\S+")
DOI_RE = re.compile(r"\b10\.\d{4,9}/[-._;()/:A-Z0-9]+\b", re.I)
YEAR_CITATION_RE = re.compile(r"\b(?:19|20)\d{2}\b")


def _norm(text: str) -> str:
    return " ".join(str(text or "").strip().split())


def _norm_key(text: str) -> str:
    return _norm(text).casefold()


def _word_count(text: str) -> int:
    return len(re.findall(r"\b[\wÁÉÍÓÚÜÑáéíóúüñ'-]+\b", text, re.UNICODE))


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def _median(values: Iterable[float], default: float = 10.0) -> float:
    vals = [float(v) for v in values if v]
    return float(statistics.median(vals)) if vals else default


def _extract_lines(page: Any) -> list[dict[str, Any]]:
    words = page.extract_words(
        use_text_flow=True,
        keep_blank_chars=False,
        extra_attrs=["size", "fontname"],
    ) or []
    words = sorted(words, key=lambda w: (float(w.get("top", 0)), float(w.get("x0", 0))))
    groups: list[list[dict[str, Any]]] = []
    for word in words:
        top = float(word.get("top", 0))
        if not groups or abs(top - float(groups[-1][0].get("top", 0))) > 2.4:
            groups.append([word])
        else:
            groups[-1].append(word)

    lines: list[dict[str, Any]] = []
    for group in groups:
        group.sort(key=lambda w: float(w.get("x0", 0)))
        text = _norm(" ".join(str(w.get("text") or "") for w in group))
        if not text:
            continue
        sizes = [float(w.get("size") or 0) for w in group if w.get("size")]
        lines.append({
            "text": text,
            "top": min(float(w.get("top", 0)) for w in group),
            "bottom": max(float(w.get("bottom", w.get("top", 0))) for w in group),
            "x0": min(float(w.get("x0", 0)) for w in group),
            "x1": max(float(w.get("x1", 0)) for w in group),
            "fontSize": round(_median(sizes), 2),
            "fontName": str(group[0].get("fontname") or ""),
        })
    return lines


def _extract_tables(page: Any) -> tuple[list[dict[str, Any]], set[str]]:
    out: list[dict[str, Any]] = []
    cells: set[str] = set()
    try:
        tables = page.extract_tables() or []
    except Exception:
        tables = []
    for idx, table in enumerate(tables, 1):
        rows: list[list[str]] = []
        for row in table or []:
            clean = [_norm(cell or "") for cell in (row or [])]
            if not any(clean):
                continue
            rows.append(clean)
            for cell in clean:
                if cell:
                    cells.add(_norm_key(cell))
        if rows:
            out.append({"tableIndex": idx, "rows": rows, "rowCount": len(rows), "columnCount": max(len(r) for r in rows)})
    return out, cells


def _heading_level(text: str, font_size: float, body_size: float) -> int | None:
    clean = _norm(text)
    if not clean or len(clean) > 150:
        return None
    ratio = font_size / max(body_size, 1.0)
    if re.match(r"^\d+\.\d+\.\d+\s+", clean):
        return 3
    if re.match(r"^\d+\.\d+\s+", clean):
        return 2
    if re.match(r"^\d+[.)]?\s+", clean):
        return 1
    if ratio >= 1.48:
        return 1
    if ratio >= 1.22:
        return 2
    if len(clean) <= 90 and clean.isupper() and _word_count(clean) <= 12:
        return 2
    return None


def _classify_line(
    text: str,
    *,
    font_size: float,
    body_size: float,
    table_cells: set[str],
    in_bibliography: bool,
) -> tuple[str, int | None]:
    clean = _norm(text)
    key = _norm_key(clean)
    level = _heading_level(clean, font_size, body_size)
    if key in BIBLIOGRAPHY_HEADINGS:
        return "HEADING", level or 1
    if FIGURE_RE.match(clean):
        return "FIGURE_CAPTION", None
    if TABLE_RE.match(clean):
        return "TABLE_CAPTION", None
    if key in table_cells:
        return "TABLE_CELL", None
    if in_bibliography:
        return "BIBLIOGRAPHY_ENTRY", None
    if level is not None:
        return "HEADING", level
    if re.match(r"^(definici[oó]n|concepto clave|idea clave)\s*[:.-]", clean, re.I):
        return "DEFINITION", None
    if re.match(r"^(caso pr[aá]ctico|caso cl[ií]nico|ejemplo aplicado|situaci[oó]n pr[aá]ctica)\s*[:.-]", clean, re.I):
        return "CASE_STUDY", None
    if BULLET_RE.match(clean):
        return "LIST_ITEM", None
    if DOI_RE.search(clean) or (YEAR_CITATION_RE.search(clean) and re.search(r"\b(?:doi|vol\.|pp\.|et al\.|editorial|journal|revista)\b", clean, re.I)):
        return "BIBLIOGRAPHY_ENTRY", None
    return "PARAGRAPH", None


def _repeated_marginal_lines(page_lines: list[list[dict[str, Any]]], page_heights: list[float]) -> set[str]:
    counts: dict[str, set[int]] = {}
    for page_index, (lines, height) in enumerate(zip(page_lines, page_heights), 1):
        for line in lines:
            top = float(line["top"])
            bottom = float(line["bottom"])
            if top <= height * 0.11 or bottom >= height * 0.89:
                key = _norm_key(line["text"])
                if 2 <= len(key) <= 120:
                    counts.setdefault(key, set()).add(page_index)
    threshold = max(2, math.ceil(len(page_lines) * 0.5))
    return {key for key, pages in counts.items() if len(pages) >= threshold}


def _build_sections(blocks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    stack: list[tuple[int, str, str]] = []
    sections: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None
    for block in blocks:
        if block["kind"] == "HEADING":
            level = int(block.get("level") or 1)
            while stack and stack[-1][0] >= level:
                stack.pop()
            stack.append((level, block["text"], block["id"]))
            block["headingPath"] = [item[1] for item in stack]
            current = {
                "id": f"S{len(sections)+1:03d}",
                "title": block["text"],
                "level": level,
                "headingBlockId": block["id"],
                "headingPath": list(block["headingPath"]),
                "blockIds": [],
            }
            sections.append(current)
        else:
            block["headingPath"] = [item[1] for item in stack]
            if current is None:
                current = {
                    "id": "S000", "title": "Inicio", "level": 0,
                    "headingBlockId": None, "headingPath": [], "blockIds": [],
                }
                sections.append(current)
            current["blockIds"].append(block["id"])
    return sections


def _split_long_text(text: str, max_words: int) -> list[str]:
    if _word_count(text) <= max_words:
        return [text]
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", _norm(text)) if s.strip()]
    chunks: list[str] = []
    current: list[str] = []
    count = 0
    for sentence in sentences:
        wc = _word_count(sentence)
        if current and count + wc > max_words:
            chunks.append(" ".join(current))
            current, count = [], 0
        current.append(sentence)
        count += wc
    if current:
        chunks.append(" ".join(current))
    return chunks


def _segment_microdocs(
    blocks: list[dict[str, Any]],
    *,
    title: str,
    words_per_minute: float,
    min_minutes: float,
    target_minutes: float,
    max_minutes: float,
) -> list[dict[str, Any]]:
    min_words = max(1, round(words_per_minute * min_minutes))
    target_words = max(min_words, round(words_per_minute * target_minutes))
    max_words = max(target_words, round(words_per_minute * max_minutes))

    units: list[dict[str, Any]] = []
    for block in blocks:
        if block["kind"] not in NARRATION_KINDS:
            continue
        for chunk in _split_long_text(block["text"], max_words):
            units.append({
                "text": chunk,
                "words": _word_count(chunk),
                "blockId": block["id"],
                "page": block["page"],
                "headingPath": block.get("headingPath") or [],
            })

    groups: list[list[dict[str, Any]]] = []
    current: list[dict[str, Any]] = []
    current_words = 0
    previous_top_heading: str | None = None
    for unit in units:
        top_heading = unit["headingPath"][0] if unit["headingPath"] else None
        natural_break = bool(current and current_words >= min_words and top_heading != previous_top_heading)
        over_limit = bool(current and current_words + unit["words"] > max_words)
        near_target = bool(current and current_words >= target_words)
        if natural_break or over_limit or near_target:
            groups.append(current)
            current, current_words = [], 0
        current.append(unit)
        current_words += unit["words"]
        previous_top_heading = top_heading
    if current:
        groups.append(current)

    if len(groups) >= 2:
        last_words = sum(u["words"] for u in groups[-1])
        prev_words = sum(u["words"] for u in groups[-2])
        if last_words < min_words and prev_words + last_words <= round(max_words * 1.18):
            groups[-2].extend(groups[-1])
            groups.pop()

    visuals = [b for b in blocks if b["kind"] in VISUAL_KINDS]
    microdocs: list[dict[str, Any]] = []
    for idx, group in enumerate(groups, 1):
        narration = _norm(" ".join(u["text"] for u in group))
        words = _word_count(narration)
        pages = sorted({int(u["page"]) for u in group})
        paths = [u["headingPath"] for u in group if u["headingPath"]]
        section_path = max(paths, key=len) if paths else []
        related_visuals = [
            b["id"] for b in visuals
            if int(b["page"]) in pages or (section_path and b.get("headingPath") == section_path)
        ]
        duration = words / max(words_per_minute, 1.0) * 60.0
        status = "TARGET_5_7_MIN" if min_minutes * 60 <= duration <= max_minutes * 60 else "SOURCE_LENGTH_EXCEPTION"
        microdocs.append({
            "id": f"MD{idx:03d}",
            "title": section_path[-1] if section_path else f"{title} · Parte {idx}",
            "sectionPath": section_path,
            "pageRange": [min(pages), max(pages)] if pages else [],
            "sourceBlockIds": list(dict.fromkeys(u["blockId"] for u in group)),
            "visualContextBlockIds": list(dict.fromkeys(related_visuals)),
            "wordCount": words,
            "estimatedDurationSeconds": round(duration, 2),
            "durationStatus": status,
            "narrationText": narration,
        })
    return microdocs


def ingest_pdf(
    pdf_path: str | Path,
    *,
    words_per_minute: float = 135.0,
    min_minutes: float = 5.0,
    target_minutes: float = 6.0,
    max_minutes: float = 7.0,
) -> dict[str, Any]:
    try:
        import pdfplumber
    except ImportError as exc:
        raise RuntimeError("PDF ingestion requires pdfplumber. Install gave/documentary/requirements-pdf.txt") from exc

    path = Path(pdf_path)
    if not path.is_file():
        raise FileNotFoundError(path)

    with pdfplumber.open(path) as pdf:
        page_lines: list[list[dict[str, Any]]] = []
        page_tables: list[list[dict[str, Any]]] = []
        page_table_cells: list[set[str]] = []
        page_heights: list[float] = []
        page_image_counts: list[int] = []
        all_sizes: list[float] = []
        for page in pdf.pages:
            lines = _extract_lines(page)
            tables, cells = _extract_tables(page)
            page_lines.append(lines)
            page_tables.append(tables)
            page_table_cells.append(cells)
            page_heights.append(float(page.height))
            page_image_counts.append(len(page.images or []))
            all_sizes.extend(float(line["fontSize"]) for line in lines if line.get("fontSize"))

    body_size = _median([s for s in all_sizes if 6.0 <= s <= 18.0], default=10.0)
    repeated = _repeated_marginal_lines(page_lines, page_heights)
    blocks: list[dict[str, Any]] = []
    page_summaries: list[dict[str, Any]] = []
    in_bibliography = False

    for page_no, (lines, tables, table_cells, image_count) in enumerate(
        zip(page_lines, page_tables, page_table_cells, page_image_counts), 1
    ):
        page_text_chars = 0
        for line in lines:
            text = line["text"]
            key = _norm_key(text)
            if key in repeated or re.fullmatch(r"(?:p[aá]gina\s+)?\d+", key):
                kind, level = "HEADER_FOOTER", None
            else:
                candidate_level = _heading_level(text, float(line["fontSize"]), body_size)
                if candidate_level is not None and _norm_key(text) not in BIBLIOGRAPHY_HEADINGS and in_bibliography:
                    in_bibliography = False
                kind, level = _classify_line(
                    text,
                    font_size=float(line["fontSize"]),
                    body_size=body_size,
                    table_cells=table_cells,
                    in_bibliography=in_bibliography,
                )
                if kind == "HEADING" and _norm_key(text) in BIBLIOGRAPHY_HEADINGS:
                    in_bibliography = True
            block = {
                "id": f"P{page_no:03d}B{len([b for b in blocks if b['page'] == page_no])+1:03d}",
                "page": page_no,
                "kind": kind,
                "text": text,
                "level": level,
                "fontSize": line["fontSize"],
                "narrationEligible": kind in NARRATION_KINDS,
                "visualContext": kind in VISUAL_KINDS,
            }
            blocks.append(block)
            if kind not in {"HEADER_FOOTER", "TABLE_CELL"}:
                page_text_chars += len(text)

        for table in tables:
            blocks.append({
                "id": f"P{page_no:03d}T{table['tableIndex']:03d}",
                "page": page_no,
                "kind": "TABLE",
                "text": " | ".join(" ; ".join(row) for row in table["rows"]),
                "level": None,
                "table": table,
                "narrationEligible": False,
                "visualContext": True,
            })
        for image_idx in range(1, image_count + 1):
            blocks.append({
                "id": f"P{page_no:03d}I{image_idx:03d}",
                "page": page_no,
                "kind": "FIGURE_OBJECT",
                "text": f"Embedded figure {image_idx} on page {page_no}",
                "level": None,
                "narrationEligible": False,
                "visualContext": True,
            })

        scanned_suspected = page_text_chars < 40 and image_count > 0
        page_summaries.append({
            "page": page_no,
            "textCharacters": page_text_chars,
            "tableCount": len(tables),
            "embeddedImageCount": image_count,
            "scannedPageSuspected": scanned_suspected,
        })

    sections = _build_sections(blocks)
    title_block = next((b for b in blocks if b["kind"] == "HEADING" and int(b.get("level") or 9) == 1), None)
    title = title_block["text"] if title_block else path.stem.replace("_", " ")
    microdocs = _segment_microdocs(
        blocks,
        title=title,
        words_per_minute=words_per_minute,
        min_minutes=min_minutes,
        target_minutes=target_minutes,
        max_minutes=max_minutes,
    )
    scanned_pages = [p["page"] for p in page_summaries if p["scannedPageSuspected"]]
    narrative_words = sum(_word_count(b["text"]) for b in blocks if b["kind"] in NARRATION_KINDS)

    return {
        "schema": "GAVE_PDF_INGEST_V1",
        "source": {
            "filename": path.name,
            "sha256": _sha256(path),
            "pageCount": len(page_summaries),
            "ocrUsed": False,
            "scannedPagesSuspected": scanned_pages,
            "status": "REVIEW_SCANNED_PAGES" if scanned_pages else "TEXT_READY",
        },
        "document": {
            "title": title,
            "language": "es",
            "bodyFontSize": round(body_size, 2),
            "narrativeWordCount": narrative_words,
        },
        "segmentationPolicy": {
            "wordsPerMinute": words_per_minute,
            "minMinutes": min_minutes,
            "targetMinutes": target_minutes,
            "maxMinutes": max_minutes,
        },
        "pageSummaries": page_summaries,
        "sections": sections,
        "blocks": blocks,
        "microdocumentaries": microdocs,
    }


def build_documentary_bundle(ingest: dict[str, Any]) -> dict[str, Any]:
    jobs: list[dict[str, Any]] = []
    source = ingest.get("source") or {}
    for microdoc in ingest.get("microdocumentaries", []):
        plan = plan_documentary(
            microdoc["narrationText"],
            title=microdoc["title"],
            target_seconds=float(microdoc["estimatedDurationSeconds"]),
            language=(ingest.get("document") or {}).get("language", "es"),
        )
        plan["schema"] = "GAVE_DOCUMENTARY_JOB_FROM_PDF_V1"
        plan["pdfContext"] = {
            "sourceFilename": source.get("filename"),
            "sourceSha256": source.get("sha256"),
            "microdocumentaryId": microdoc["id"],
            "sectionPath": microdoc.get("sectionPath") or [],
            "pageRange": microdoc.get("pageRange") or [],
            "sourceBlockIds": microdoc.get("sourceBlockIds") or [],
            "visualContextBlockIds": microdoc.get("visualContextBlockIds") or [],
        }
        jobs.append(plan)
    return {
        "schema": "GAVE_PDF_DOCUMENTARY_BUNDLE_V1",
        "source": source,
        "jobCount": len(jobs),
        "jobs": jobs,
        "safety": {
            "realMediaOnly": True,
            "aiGeneratedMediaAllowed": False,
            "paidAssetsAllowed": False,
            "productionTouched": False,
        },
    }


def save_json(path: str | Path, payload: dict[str, Any]) -> None:
    Path(path).write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
