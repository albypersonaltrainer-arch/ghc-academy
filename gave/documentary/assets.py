from __future__ import annotations

import hashlib
import json
import mimetypes
import re
import urllib.request
from pathlib import Path
from typing import Any

from .policy import evaluate_asset
from .sources import default_sources


def _tokens(text: str) -> set[str]:
    return set(re.findall(r"[a-záéíóúüñ0-9]{3,}", text.lower()))


def relevance_score(asset: dict[str, Any], query: str) -> float:
    q = _tokens(query)
    if not q:
        return 0.0
    hay = _tokens(" ".join(str(asset.get(k) or "") for k in ("title", "description", "categoriesText")))
    overlap = len(q & hay)
    source_bonus = {"wikimedia": 1.2, "met": 0.8}.get(str(asset.get("source")), 0.0)
    return overlap * 3.0 + source_bonus


def discover_for_job(job: dict[str, Any], *, per_source_limit: int = 12) -> dict[str, Any]:
    sources = {source.id: source for source in default_sources()}
    configured_order = [s for s in job.get("sourceOrder", []) if s in sources]
    ledger_items: list[dict[str, Any]] = []
    seen: set[str] = set()

    for beat in job.get("beats", []):
        query = str(beat.get("searchQuery") or "").strip()
        need = max(1, int(beat.get("assetCount") or 1))
        candidates: list[dict[str, Any]] = []
        source_errors: list[dict[str, str]] = []
        for source_id in configured_order:
            source = sources[source_id]
            try:
                for asset in source.search(query, per_source_limit):
                    decision = evaluate_asset(asset)
                    asset["policyAccepted"] = decision.accepted
                    asset["policyReasons"] = list(decision.reasons)
                    asset["policyWarnings"] = list(decision.warnings)
                    if decision.accepted:
                        asset["relevanceScore"] = relevance_score(asset, query)
                        candidates.append(asset)
            except Exception as exc:
                source_errors.append({"source": source_id, "error": f"{type(exc).__name__}: {exc}"})

        candidates.sort(key=lambda a: (float(a.get("relevanceScore") or 0), str(a.get("source"))), reverse=True)
        chosen: list[dict[str, Any]] = []
        for candidate in candidates:
            key = str(candidate.get("downloadUrl") or candidate.get("landingUrl"))
            if not key or key in seen:
                continue
            seen.add(key)
            chosen.append(candidate)
            if len(chosen) >= need:
                break

        for shot_index, asset in enumerate(chosen, 1):
            cycle = beat.get("movementCycle") or ["SLOW_PUSH"]
            ledger_items.append({
                "beatId": beat["id"], "shotIndex": shot_index, "query": query,
                "tone": beat.get("tone", "COLOR"),
                "movement": cycle[(shot_index - 1) % len(cycle)], "asset": asset,
            })
        beat["assetDiscovery"] = {
            "requested": need, "accepted": len(chosen), "sourceErrors": source_errors,
            "status": "PASS" if len(chosen) >= need else "PARTIAL",
        }

    return {
        "schema": "GAVE_ASSET_LEDGER_V1", "title": job.get("title"),
        "realMediaOnly": True, "aiGeneratedMediaAllowed": False,
        "paidAssetsUsed": False, "items": ledger_items,
    }


def save_json(path: str | Path, payload: dict[str, Any]) -> None:
    Path(path).write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def download_ledger_assets(ledger: dict[str, Any], output_dir: str | Path) -> dict[str, Any]:
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    for idx, item in enumerate(ledger.get("items", []), 1):
        asset = item["asset"]
        url = str(asset["downloadUrl"])
        ext = Path(url.split("?", 1)[0]).suffix.lower()
        if ext not in {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"}:
            guessed = mimetypes.guess_extension(mimetypes.guess_type(url)[0] or "")
            ext = guessed if guessed in {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"} else ".jpg"
        target = out / f"asset_{idx:03d}{ext}"
        req = urllib.request.Request(url, headers={"User-Agent": "GAVE-Documentary/1.0"})
        with urllib.request.urlopen(req, timeout=60) as response, target.open("wb") as fh:
            while True:
                chunk = response.read(1024 * 1024)
                if not chunk:
                    break
                fh.write(chunk)
        item["localPath"] = str(target)
        item["sha256"] = hashlib.sha256(target.read_bytes()).hexdigest()
        item["bytes"] = target.stat().st_size
    return ledger
