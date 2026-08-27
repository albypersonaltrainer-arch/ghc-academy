from gave.documentary.policy import evaluate_asset


def base_asset():
    return {
        "source": "wikimedia",
        "mediaType": "image",
        "landingUrl": "https://commons.wikimedia.org/wiki/File:X.jpg",
        "downloadUrl": "https://upload.wikimedia.org/x.jpg",
        "licenseCode": "CC BY 4.0",
        "commercialUse": True,
        "modificationAllowed": True,
        "aiGenerated": False,
        "categoryScanComplete": True,
        "title": "Real laboratory photograph",
        "categoriesText": "Laboratories",
        "metadataText": "photograph",
    }


def test_accepts_strict_ccby():
    decision = evaluate_asset(base_asset())
    assert decision.accepted, decision.reasons


def test_rejects_ai_marker():
    asset = base_asset()
    asset["categoriesText"] = "AI-generated images by subject"
    decision = evaluate_asset(asset)
    assert not decision.accepted
    assert any("AI" in reason for reason in decision.reasons)


def test_rejects_sharealike_in_v1():
    asset = base_asset()
    asset["licenseCode"] = "CC BY-SA 4.0"
    decision = evaluate_asset(asset)
    assert not decision.accepted
