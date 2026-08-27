from __future__ import annotations

from dataclasses import dataclass
from typing import Any

ALLOWED_LICENSE_PREFIXES = (
    "cc0", "public domain", "public-domain", "pd",
    "cc by 1.0", "cc by 2.0", "cc by 2.5", "cc by 3.0", "cc by 4.0",
    "cc-by-1.0", "cc-by-2.0", "cc-by-2.5", "cc-by-3.0", "cc-by-4.0",
    "pexels",
)

AI_MARKERS = (
    "ai-generated", "ai generated", "artificial intelligence generated", "generative ai",
    "stable diffusion", "midjourney", "dall-e", "dalle", "flux ai", "comfyui",
    "synthetic image", "synthetic media",
)


@dataclass(frozen=True)
class PolicyDecision:
    accepted: bool
    reasons: tuple[str, ...]
    warnings: tuple[str, ...] = ()


def _norm(value: Any) -> str:
    return " ".join(str(value or "").lower().strip().split())


def _contains_ai_marker(asset: dict[str, Any]) -> bool:
    haystack = " ".join(
        _norm(asset.get(key))
        for key in ("title", "description", "categoriesText", "metadataText", "creator")
    )
    return any(marker in haystack for marker in AI_MARKERS)


def _allowed_license(code: str) -> bool:
    normalized = _norm(code)
    if not normalized:
        return False
    return any(normalized.startswith(prefix) for prefix in ALLOWED_LICENSE_PREFIXES)


def evaluate_asset(asset: dict[str, Any]) -> PolicyDecision:
    """Fail-closed reality/rights gate for GAVE Documentary V1."""
    reasons: list[str] = []
    warnings: list[str] = []

    if asset.get("mediaType") != "image":
        reasons.append("V1 accepts still images only")

    source = _norm(asset.get("source"))
    if source not in {"met", "wikimedia", "pexels"}:
        reasons.append(f"source not allowlisted: {source or 'missing'}")

    if asset.get("downloadUrl") in (None, ""):
        reasons.append("missing downloadable image URL")
    if asset.get("landingUrl") in (None, ""):
        reasons.append("missing source landing URL")
    if asset.get("aiGenerated") is True or _contains_ai_marker(asset):
        reasons.append("AI/synthetic-media marker detected")

    if source == "met":
        if asset.get("isPublicDomain") is not True:
            reasons.append("Met object is not explicitly public domain")
        if _norm(asset.get("licenseCode")) not in {"cc0", "public domain", "public-domain"}:
            reasons.append("Met asset missing CC0/public-domain license code")
    elif source == "pexels":
        if asset.get("sourceRealityPolicy") != "GENERATIVE_AI_UPLOADS_PROHIBITED":
            reasons.append("Pexels reality-policy evidence missing")
        if _norm(asset.get("licenseCode")) != "pexels":
            reasons.append("Pexels license marker missing")
    elif source == "wikimedia":
        if not _allowed_license(str(asset.get("licenseCode") or "")):
            reasons.append("Wikimedia license not in strict commercial/modification allowlist")
        if asset.get("categoryScanComplete") is not True:
            reasons.append("Wikimedia AI-category scan incomplete")

    if not _allowed_license(str(asset.get("licenseCode") or "")):
        reasons.append("license not approved for commercial modified use")
    if asset.get("commercialUse") is not True:
        reasons.append("commercial use not explicitly allowed")
    if asset.get("modificationAllowed") is not True:
        reasons.append("modification not explicitly allowed")

    if asset.get("containsRecognizablePeople") is True:
        warnings.append(
            "Do not imply illness, diagnosis, endorsement, misconduct, or other sensitive facts about recognizable people."
        )
    if asset.get("possibleTrademark") is True:
        warnings.append("Check visible trademarks/logos before final publication.")

    return PolicyDecision(accepted=not reasons, reasons=tuple(reasons), warnings=tuple(warnings))
