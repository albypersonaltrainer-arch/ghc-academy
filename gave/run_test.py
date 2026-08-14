from __future__ import annotations

import argparse
import json
from pathlib import Path

from gave.adapters.comfyui_wan22_ti2v import ComfyUIWan22TI2VAdapter, GaveSafetyError
from gave.adapters.hf_gradio_wan22_ti2v import HFGradioWan22TI2VAdapter


def load_json(path: str | Path) -> dict:
    with Path(path).open("r", encoding="utf-8") as handle:
        return json.load(handle)


def assert_zero_cost_guards(config: dict, manifest: dict) -> None:
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
    if manifest.get("imageGenerationAllowed") is not False:
        raise GaveSafetyError("Manifest image generation must be false")
    if manifest.get("imageToVideoAllowed") is not False:
        raise GaveSafetyError("Manifest must be pure Text-to-Video")


def prepare_shots(config: dict, manifest: dict, only_shot: str | None) -> list[dict]:
    wan = config["wan22"]
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

    shots: list[dict] = []
    for source in manifest["shots"]:
        if only_shot and source["id"] != only_shot:
            continue
        shot = dict(source)
        shot["prompt"] = f"{master} {shot['prompt']}".strip()
        shot["negative_prompt"] = negative_master
        shot["seed"] = int(manifest.get("continuitySeed", wan.get("seed", 24081977)))
        shot["steps"] = int(manifest.get("steps", wan["steps"]))
        shot["cfg"] = float(manifest.get("cfg", wan["cfg"]))
        shot["shift"] = float(manifest.get("shift", wan.get("shift", 5.0)))
        shot["sampler"] = manifest.get("sampler", wan.get("sampler", "uni_pc"))
        shot["scheduler"] = manifest.get("scheduler", wan.get("scheduler", "simple"))
        shot["width"] = int(manifest.get("width", wan["width"]))
        shot["height"] = int(manifest.get("height", wan["height"]))
        shots.append(shot)

    if only_shot and not shots:
        raise ValueError(f"Unknown shot id: {only_shot}")
    return shots


def run_online(config: dict, manifest: dict, shots: list[dict]) -> dict:
    online = config["online"]
    adapter = HFGradioWan22TI2VAdapter(
        online["spaceCandidates"],
        online["downloadDir"],
        hf_token_env=online.get("hfTokenEnv"),
        allow_paid_fallback=bool(online.get("allowPaidFallback", False)),
    )

    connection = adapter.connect()
    results: list[dict] = []
    run_dir = Path(online["downloadDir"])
    run_dir.mkdir(parents=True, exist_ok=True)

    for shot in shots:
        result = adapter.generate_shot(shot)
        results.append(result)
        (run_dir / "run_state.json").write_text(
            json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        if result.get("status") != "GENERATED":
            break

    return {
        "testId": manifest["testId"],
        "backend": config["GAVE_VIDEO_BACKEND"],
        "connection": connection,
        "results": results,
        "paidInferenceUsed": False,
        "actualSpendEur": 0,
        "imageGenerationUsed": False,
        "imageToVideoUsed": False,
        "productionTouched": False,
    }


def run_local_comfy(config: dict, manifest: dict, shots: list[dict]) -> dict:
    comfy = config["comfyui"]
    wan = config["wan22"]
    adapter = ComfyUIWan22TI2VAdapter(
        comfy["baseUrl"],
        comfy["workflowApiPath"],
        poll_interval_seconds=int(comfy["pollIntervalSeconds"]),
        timeout_seconds=int(comfy["timeoutSeconds"]),
    )

    expected_models = {
        "diffusionModel": wan["diffusionModel"],
        "textEncoder": wan["textEncoder"],
        "vae": wan["vae"],
    }
    preflight = adapter.preflight(expected_models)

    run_dir = Path("gave/runs") / manifest["testId"].lower() / "local"
    run_dir.mkdir(parents=True, exist_ok=True)
    results: list[dict] = []

    for shot in shots:
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
            json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        if result["status"] != "GENERATED":
            break

    return {
        "testId": manifest["testId"],
        "backend": config["GAVE_VIDEO_BACKEND"],
        "preflight": preflight,
        "results": results,
        "paidInferenceUsed": False,
        "actualSpendEur": 0,
        "imageGenerationUsed": False,
        "imageToVideoUsed": False,
        "productionTouched": False,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Run a GAVE Wan2.2 T2V manifest shot by shot")
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--config", default="gave/config/gave_video_online.json")
    parser.add_argument("--shot", help="Run only one shot ID")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    config = load_json(args.config)
    manifest = load_json(args.manifest)
    assert_zero_cost_guards(config, manifest)
    shots = prepare_shots(config, manifest, args.shot)

    if args.dry_run:
        print(json.dumps({
            "status": "PASS",
            "mode": "DRY_RUN",
            "testId": manifest["testId"],
            "backend": config["GAVE_VIDEO_BACKEND"],
            "shots": [
                {
                    "id": s["id"],
                    "frames": s["frames"],
                    "durationSeconds": s["durationSeconds"],
                    "seed": s["seed"],
                }
                for s in shots
            ],
            "paidInferenceUsed": False,
            "actualSpendEur": 0,
            "imageGenerationUsed": False,
            "imageToVideoUsed": False,
            "productionTouched": False,
        }, indent=2, ensure_ascii=False))
        return 0

    backend = config["GAVE_VIDEO_BACKEND"]
    if backend == "HF_GRADIO_WAN22_TI2V":
        final = run_online(config, manifest, shots)
    elif backend == "WAN22_TI2V_5B_COMFYUI":
        final = run_local_comfy(config, manifest, shots)
    else:
        raise RuntimeError(f"Unsupported GAVE video backend: {backend}")

    output_dir = Path("gave/runs") / manifest["testId"].lower()
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "result.json").write_text(
        json.dumps(final, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(json.dumps(final, indent=2, ensure_ascii=False))
    return 0 if all(r.get("status") == "GENERATED" for r in final["results"]) else 2


if __name__ == "__main__":
    raise SystemExit(main())
