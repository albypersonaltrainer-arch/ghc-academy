from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import time
from pathlib import Path

ASSETS = {
    "01_doramas.jpg": {
        "download": "https://upload.wikimedia.org/wikipedia/commons/6/66/Monumento_a_Doramas_Arucas.jpg",
        "source": "wikimedia",
        "license": "CC0 1.0",
        "landing": "https://commons.wikimedia.org/wiki/File:Monumento_a_Doramas_Arucas.jpg",
    },
    "02_cueva_pintada.jpg": {
        "download": "https://upload.wikimedia.org/wikipedia/commons/9/94/Cueva_Pintada_Verneau.jpg",
        "source": "wikimedia",
        "license": "Public Domain",
        "landing": "https://commons.wikimedia.org/wiki/File:Cueva_Pintada_Verneau.jpg",
    },
    "03_mapa_gran_canaria.jpg": {
        "download": "https://upload.wikimedia.org/wikipedia/commons/c/c5/Mapa_Gran_Canaria_Siglo_xviii.jpg",
        "source": "wikimedia",
        "license": "Public Domain",
        "landing": "https://commons.wikimedia.org/wiki/File:Mapa_Gran_Canaria_Siglo_xviii.jpg",
    },
    "04_bandama.jpg": {
        "download": "https://upload.wikimedia.org/wikipedia/commons/a/a6/Gran_Canaria%2C_View_over_the_Caldera_de_Bandama.jpg",
        "source": "wikimedia",
        "license": "CC0 1.0",
        "landing": "https://commons.wikimedia.org/wiki/File:Gran_Canaria,_View_over_the_Caldera_de_Bandama.jpg",
    },
    "05_arucas.jpg": {
        "download": "https://upload.wikimedia.org/wikipedia/commons/2/27/Cantonera_real_de_Arucas%2C_Arucas%2C_Gran_Canaria.jpg",
        "source": "wikimedia",
        "license": "CC0 1.0",
        "landing": "https://commons.wikimedia.org/wiki/File:Cantonera_real_de_Arucas,_Arucas,_Gran_Canaria.jpg",
    },
    "06_parque_doramas.jpg": {
        "download": "https://upload.wikimedia.org/wikipedia/commons/f/f0/Parque_Doramas_palmera.jpg",
        "source": "wikimedia",
        "license": "CC0 1.0",
        "landing": "https://commons.wikimedia.org/wiki/File:Parque_Doramas_palmera.jpg",
    },
    "07_benito_galdar.jpg": {
        "download": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Benito_%22El_Fraile%22%2C_Gran_Canaria.jpg",
        "source": "wikimedia",
        "license": "Public Domain Mark",
        "landing": "https://commons.wikimedia.org/wiki/File:Benito_%22El_Fraile%22,_Gran_Canaria.jpg",
    },
    "08_familia_galdar.jpg": {
        "download": "https://upload.wikimedia.org/wikipedia/commons/d/d0/Cho_Bartolo_y_familia%2C_G%C3%A1ldar_%28Gran_Canaria%29.jpg",
        "source": "wikimedia",
        "license": "Public Domain Mark",
        "landing": "https://commons.wikimedia.org/wiki/File:Cho_Bartolo_y_familia,_G%C3%A1ldar_(Gran_Canaria).jpg",
    },
    "09_roque_bentayga.jpg": {
        "download": "https://images.pexels.com/photos/6727547/pexels-photo-6727547.jpeg?cs=srgb&dl=pexels-magic-k-24827758-6727547.jpg&fm=jpg",
        "source": "pexels",
        "license": "Pexels License",
        "landing": "https://www.pexels.com/photo/roque-bentayga-of-canary-islands-spain-6727547/",
    },
}

SEQUENCE = [
    ["03_mapa_gran_canaria.jpg", "04_bandama.jpg", "02_cueva_pintada.jpg"],
    ["07_benito_galdar.jpg", "08_familia_galdar.jpg", "01_doramas.jpg"],
    ["06_parque_doramas.jpg", "09_roque_bentayga.jpg", "04_bandama.jpg"],
    ["03_mapa_gran_canaria.jpg", "02_cueva_pintada.jpg", "01_doramas.jpg"],
    ["09_roque_bentayga.jpg", "04_bandama.jpg", "06_parque_doramas.jpg"],
    ["05_arucas.jpg", "01_doramas.jpg", "09_roque_bentayga.jpg"],
    ["01_doramas.jpg", "02_cueva_pintada.jpg", "03_mapa_gran_canaria.jpg"],
    ["09_roque_bentayga.jpg", "03_mapa_gran_canaria.jpg", "04_bandama.jpg"],
    ["06_parque_doramas.jpg", "08_familia_galdar.jpg", "01_doramas.jpg"],
    ["01_doramas.jpg", "04_bandama.jpg", "03_mapa_gran_canaria.jpg"],
]
MOVES = ["SLOW_PUSH", "PAN_RIGHT", "DETAIL_PUSH", "SLOW_PULL"]


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def download_assets(asset_dir: Path) -> None:
    asset_dir.mkdir(parents=True, exist_ok=True)
    user_agent = "GAVE-Documentary/1.0 (educational documentary; zero-cost; real-media-only)"
    for name, meta in ASSETS.items():
        target = asset_dir / name
        if target.exists() and target.stat().st_size > 0:
            continue
        print(f"Downloading {name}", flush=True)
        subprocess.run(
            [
                "curl", "-L", "--fail", "--retry", "8", "--retry-all-errors",
                "--retry-delay", "7", "--connect-timeout", "30", "--max-time", "240",
                "-A", user_agent, "-o", str(target), meta["download"],
            ],
            check=True,
        )
        if not target.exists() or target.stat().st_size == 0:
            raise RuntimeError(f"Empty asset: {name}")
        time.sleep(4)


def build(root: Path, narration_file: Path) -> None:
    root.mkdir(parents=True, exist_ok=True)
    asset_dir = root / "assets"
    download_assets(asset_dir)

    narration = narration_file.read_text(encoding="utf-8").strip()
    paragraphs = [p.strip() for p in narration.split("\n\n") if p.strip()]
    if len(paragraphs) != 10:
        raise RuntimeError(f"Expected 10 narration beats, got {len(paragraphs)}")
    total_words = sum(len(p.split()) for p in paragraphs)
    target = total_words / 135.0 * 60.0

    beats = []
    for idx, paragraph in enumerate(paragraphs, 1):
        words = len(paragraph.split())
        beats.append(
            {
                "id": f"B{idx:03d}",
                "narration": paragraph,
                "searchQuery": "CURATED_FROM_PDF",
                "tone": "BLACK_AND_WHITE" if idx in {1, 2, 4, 6, 7, 8} else "COLOR",
                "durationSeconds": round(target * words / total_words, 3),
                "assetCount": 3,
                "movementCycle": MOVES,
            }
        )

    job = {
        "schema": "GAVE_DOCUMENTARY_JOB_V1",
        "title": "Doramas - Resistencia y memoria en la conquista de Gran Canaria",
        "language": "es",
        "narrationText": narration,
        "targetDurationSeconds": round(target, 3),
        "sourceDocument": "Doramas_historia_conquista_Gran_Canaria_4_folios.pdf",
        "sourceScope": "Resumen documental de las cuatro páginas del PDF",
        "style": {
            "reference": "historical documentary, sober and cinematic",
            "resolution": "1920x1080",
            "fps": 25,
            "subtitleLanguage": "es",
            "colorStrategy": "intentional historical B&W mixed with documentary color",
        },
        "safety": {
            "realMediaOnly": True,
            "aiGeneratedMediaAllowed": False,
            "paidAssetsAllowed": False,
            "commercialUseRequired": True,
            "modificationRequired": True,
            "productionTouched": False,
        },
        "beats": beats,
    }
    (root / "job.json").write_text(json.dumps(job, ensure_ascii=False, indent=2), encoding="utf-8")

    items = []
    asset_index = 0
    for beat, filenames in zip(beats, SEQUENCE):
        for filename in filenames:
            asset_index += 1
            path = asset_dir / filename
            meta = ASSETS[filename]
            items.append(
                {
                    "id": f"A{asset_index:03d}",
                    "beatId": beat["id"],
                    "localPath": str(path),
                    "movement": MOVES[(asset_index - 1) % len(MOVES)],
                    "tone": beat["tone"] if asset_index % 3 else "COLOR",
                    "sha256": sha256(path),
                    "source": meta["source"],
                    "licenseCode": meta["license"],
                    "landingUrl": meta["landing"],
                    "policyAccepted": True,
                    "aiGenerated": False,
                    "commercialUse": True,
                    "modificationAllowed": True,
                    "realMediaEvidence": "Curated documentary photograph, historical scan/map, or physical monument; no synthetic asset created by GAVE.",
                }
            )

    ledger = {
        "schema": "GAVE_ASSET_LEDGER_V1",
        "items": items,
        "safety": {
            "realMediaOnly": True,
            "aiGeneratedMediaUsed": False,
            "paidAssetsUsed": False,
            "productionTouched": False,
        },
    }
    (root / "asset_ledger.json").write_text(json.dumps(ledger, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"status": "PREPARED", "words": total_words, "targetSeconds": round(target, 2), "clips": len(items)}))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", required=True)
    parser.add_argument("--narration", required=True)
    args = parser.parse_args()
    build(Path(args.root), Path(args.narration))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
