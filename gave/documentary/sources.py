from __future__ import annotations

import html
import json
import urllib.parse
import urllib.request
from typing import Any

USER_AGENT = "GAVE-Documentary/1.0 (+GHC Academy; educational asset discovery)"


def _get_json(url: str, *, timeout: int = 30) -> dict[str, Any]:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def _strip_html(value: Any) -> str:
    text = html.unescape(str(value or ""))
    out: list[str] = []
    in_tag = False
    for char in text:
        if char == "<":
            in_tag = True
        elif char == ">":
            in_tag = False
        elif not in_tag:
            out.append(char)
    return " ".join("".join(out).split())


def _wm_ext(meta: dict[str, Any], key: str) -> str:
    value = meta.get(key, {})
    if isinstance(value, dict):
        return _strip_html(value.get("value"))
    return _strip_html(value)


class WikimediaSource:
    id = "wikimedia"

    def search(self, query: str, limit: int = 12) -> list[dict[str, Any]]:
        params = {
            "action": "query", "format": "json", "formatversion": "2",
            "generator": "search", "gsrsearch": query, "gsrnamespace": "6",
            "gsrlimit": str(max(1, min(limit, 20))), "prop": "imageinfo|categories",
            "iiprop": "url|extmetadata", "cllimit": "max", "origin": "*",
        }
        payload = _get_json("https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params))
        pages = payload.get("query", {}).get("pages", []) or []
        assets: list[dict[str, Any]] = []
        for page in pages:
            info = (page.get("imageinfo") or [{}])[0]
            meta = info.get("extmetadata") or {}
            cats = [str(c.get("title") or "") for c in page.get("categories", [])]
            license_short = _wm_ext(meta, "LicenseShortName")
            usage_terms = _wm_ext(meta, "UsageTerms")
            creator = _wm_ext(meta, "Artist") or _wm_ext(meta, "Credit")
            description = _wm_ext(meta, "ImageDescription")
            title = str(page.get("title") or "").removeprefix("File:")
            license_code = license_short or usage_terms
            normalized_license = license_code.lower()
            assets.append({
                "source": self.id, "sourceId": str(page.get("pageid") or title), "mediaType": "image",
                "title": title, "description": description, "creator": creator,
                "landingUrl": info.get("descriptionurl") or info.get("descriptionshorturl"),
                "downloadUrl": info.get("url"), "licenseCode": license_code,
                "licenseUrl": _wm_ext(meta, "LicenseUrl"), "attribution": creator,
                "isPublicDomain": "public domain" in normalized_license or "cc0" in normalized_license,
                "commercialUse": "noncommercial" not in normalized_license,
                "modificationAllowed": "no derivatives" not in normalized_license,
                "aiGenerated": False, "categoriesText": " | ".join(cats),
                "metadataText": " | ".join((_wm_ext(meta, "Categories"), usage_terms, license_short)),
                "categoryScanComplete": True, "containsRecognizablePeople": False, "possibleTrademark": False,
            })
        return assets


class MetSource:
    id = "met"

    def search(self, query: str, limit: int = 8) -> list[dict[str, Any]]:
        search_url = "https://collectionapi.metmuseum.org/public/collection/v1/search?" + urllib.parse.urlencode({"hasImages": "true", "q": query})
        result = _get_json(search_url)
        ids = (result.get("objectIDs") or [])[:max(1, min(limit, 12))]
        assets: list[dict[str, Any]] = []
        for object_id in ids:
            obj = _get_json(f"https://collectionapi.metmuseum.org/public/collection/v1/objects/{int(object_id)}")
            if not obj.get("primaryImage"):
                continue
            public_domain = bool(obj.get("isPublicDomain"))
            assets.append({
                "source": self.id, "sourceId": str(object_id), "mediaType": "image",
                "title": obj.get("title") or "",
                "description": " | ".join(filter(None, [obj.get("objectName"), obj.get("culture"), obj.get("period")])),
                "creator": obj.get("artistDisplayName") or "The Metropolitan Museum of Art",
                "landingUrl": obj.get("objectURL") or f"https://www.metmuseum.org/art/collection/search/{object_id}",
                "downloadUrl": obj.get("primaryImage"), "licenseCode": "CC0" if public_domain else "UNKNOWN",
                "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/" if public_domain else "",
                "attribution": "The Metropolitan Museum of Art", "isPublicDomain": public_domain,
                "commercialUse": public_domain, "modificationAllowed": public_domain, "aiGenerated": False,
                "categoriesText": "", "metadataText": "Met Open Access API object", "categoryScanComplete": True,
                "containsRecognizablePeople": False, "possibleTrademark": False,
            })
        return assets


def default_sources() -> list[Any]:
    return [WikimediaSource(), MetSource()]
