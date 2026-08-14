from __future__ import annotations

import argparse
import json
from pathlib import Path

from gave.adapters.comfyui_wan22_ti2v import ComfyUIWan22TI2VAdapter, GaveSafetyError


def load_json(path: str | Path) -> dict:
    with Path(path).open("r", encoding="utf-8") as handle:
        return json.load(handle)


def main() -> int:
    parser = argparse.ArgumentParser(description="Run a GAVE Wan2.2 T2V manifest shot by shot")
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--config", default="gave/config/gave_video.json")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    config = load_json(args.config)
    manifest = load_json(args.manifest)

    if config.get("PAID_INFERENCE_ALLOWED") is not False:
        raise GaveSafetyError("PAID_INFERENCE_ALLOWED must be false")
    if float(config.get("actualSpendEur", -1)) != 0:
        raise GaveSafetyError("actualSpendEur must be 0")
    if config.get("productionAllowed") is not False:
        raise GaveSafetyError("Production access must remain disabled")
    if config.get("imageGenerationAllowed") is not False:
        raise GaveSafetyError("Image generation must remain disabled")
    if config.get("imageToVideoAllowed") is not False:
        raise GaveSafetyError("Image-to-Video must remain disabled")

    if manifest.get("imageGenerationAllowed") is not False or manifest.get("imageToVideoAllowed") is not False:
        raise GaveSafetyError("Test manifest must be pure Text-to-Video")

    comfy = config["comfyui"]
    wan = config["wan22"]
    adapter = ComfyUIWan22TI2VAdapter(
        comfy["baseUrl"],
        comfy["workflowApiPath"],
        poll_interval_seconds=int(comfy["pollIntervalSeconds"]),
        timeout_seconds=int(comfy["timeoutSeconds"]),
    )

    master = " ".join(
        part.strip()
        for part in [
            manifest.get("characterLock", ""),
            manifest.get("visualMaster", ""),
            manifest.get("storyRule", ""),
        ]
        if part.strip()
    )
    negative_master = manifest.get("negativeMaster", "")

    prepared_shots = []
    for index, source in enumerate(manifest["shots"], start=1):
        shot = dict(source)
        shot["prompt"] = f"{master} {shot['prompt']}".strip()
        shot["negative_prompt"] = negative_master
        shot["seed"] = int(manifest.get("continuitySeed", 24081977))
        shot["steps"] = int(manifest.get("steps", wan["steps"]))
        shot["cfg"] = float(manifest.get("cfg", wan["cfg"]))
        shot["sampler"] = manifest.get("sampler", wan["sampler"])
        shot["scheduler"] = manifest.get("scheduler", wan["scheduler"])
        shot["width"] = int(manifest.get("width", wan["width"]))
        shot["height"] = int(manifest.get("height", wan["height"]))
        prepared_shots.append(shot)

    if args.dry_run:
        print(json.dumps({
            "status": "PASS",
            "mode": "DRY_RUN",
            "testId": manifest["testId"],
            "backend": manifest["backend"],
            "shots": [
                {
                    "id": s["id"],
                    "frames": s["frames"],
                    "durationSeconds": s["durationSeconds"],
                    "seed": s["seed"],
                }
                for s in prepared_shots
            ],
            "paidInferenceUsed": False,
            "actualSpendEur": 0,
            "imageGenerationUsed": False,
        }, indent=2, ensure_ascii=False))
        return 0

    expected_models = {
        "diffusionModel": wan["diffusionModel"],
        "textEncoder": wan["textEncoder"],
        "vae": wan["vae"],
    }
    preflight = adapter.preflight(expected_models)

    run_dir = Path("gave/runs") / manifest["testId"].lower()
    run_dir.mkdir(parents=True, exist_ok=True)
    results = []

    for shot in prepared_shots:
        result = adapter.generate_shot(shot)
        downloaded = []
        for idx, file_ref in enumerate(result["outputs"], start=1):
            suffix = Path(file_ref["filename"]).suffix or ".bin"
            destination = run_dir / f"{shot['id'].lower()}_{idx:02d}{suffix}"
            try:
                adapter.download_output(file_ref, destination)
                downloaded.append(str(destination))
            except Exception as exc:
                downloaded.append(f"DOWNLOAD_FAIL: {exc}")
        result["downloaded"] = downloaded
        results.append(result)
        (run_dir / "run_state.json").write_text(
            json.dumps(results, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

        if result["status"] != "GENERATED":
            break

    final = {
        "testId": manifest["testId"],
        "backend": manifest["backend"],
        "results": results,
        "paidInferenceUsed": False,
        "actualSpendEur": 0,
        "imageGenerationUsed": False,
        "productionTouched": False,
    }
    (run_dir / "result.json").write_text(
        json.dumps(final, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print(json.dumps(final, indent=2, ensure_ascii=False))
    return 0 if all(r["status"] == "GENERATED" for r in results) else 2


if __name__ == "__main__":
    raise SystemExit(main())
