from __future__ import annotations

import argparse
import json
import os
import subprocess
import time
from pathlib import Path
from typing import Any


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def gpu_info() -> dict[str, Any]:
    raw = subprocess.check_output([
        "nvidia-smi",
        "--query-gpu=name,memory.total,driver_version,compute_cap",
        "--format=csv,noheader,nounits",
    ], text=True).strip().splitlines()[0]
    name, memory_mb, driver, capability = [x.strip() for x in raw.split(",", 3)]
    return {
        "name": name,
        "memoryTotalMb": int(float(memory_mb)),
        "memoryTotalGb": round(float(memory_mb) / 1024.0, 2),
        "driverVersion": driver,
        "computeCapability": capability,
    }


def assert_safety(contract: dict[str, Any], gpu: dict[str, Any]) -> None:
    safety = contract["safety"]
    if safety.get("paidInferenceAllowed") is not False:
        raise RuntimeError("paid inference forbidden")
    if float(safety.get("actualSpendEur", -1)) != 0:
        raise RuntimeError("actualSpendEur must be 0")
    if safety.get("imageGenerationAllowed") is not False:
        raise RuntimeError("image generation forbidden")
    if safety.get("imageToVideoAllowed") is not False:
        raise RuntimeError("image-to-video forbidden")
    if safety.get("productionAllowed") is not False:
        raise RuntimeError("Production forbidden")
    if safety.get("inputMode") != "TEXT_ONLY":
        raise RuntimeError("TEXT_ONLY required")
    if os.environ.get("GAVE_ALLOW_PAID", "false").lower() not in {"false", "0", "no"}:
        raise RuntimeError("GAVE_ALLOW_PAID cannot be enabled")
    if float(gpu["memoryTotalGb"]) < float(contract["hardwareTarget"].get("minVramGb", 14)):
        raise RuntimeError("insufficient VRAM")


def main() -> int:
    parser = argparse.ArgumentParser(description="GAVE Lightning single-process Diffusers fallback")
    parser.add_argument("--contract", required=True)
    parser.add_argument("--output-dir", required=True)
    args = parser.parse_args()

    contract = load_json(Path(args.contract))
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    state_path = output_dir / "worker_state_diffusers.json"
    gpu = gpu_info()
    assert_safety(contract, gpu)
    shot = contract["smokeTest"]
    backend = contract["backendOrder"][0]

    state: dict[str, Any] = {
        "schema": "GAVE_REMOTE_GPU_RUN_V1",
        "workerId": contract["workerId"],
        "provider": contract["provider"],
        "backend": "FASTWAN21_DIFFUSERS_SINGLE_PROCESS",
        "model": backend["model"],
        "shotId": shot["shotId"],
        "status": "STARTING",
        "gpu": gpu,
        "runtimePrecision": "fp16",
        "paidInferenceUsed": False,
        "actualSpendEur": 0,
        "imageGenerationUsed": False,
        "imageToVideoUsed": False,
        "productionTouched": False,
    }
    save_json(state_path, state)

    try:
        import torch
        from diffusers import AutoencoderKLWan, WanPipeline
        from diffusers.schedulers.scheduling_unipc_multistep import UniPCMultistepScheduler
        from diffusers.utils import export_to_video

        if not torch.cuda.is_available():
            raise RuntimeError("CUDA is not available")

        torch.cuda.empty_cache()
        torch.cuda.reset_peak_memory_stats()
        started = time.time()
        state["status"] = "LOADING_MODEL"
        save_json(state_path, state)

        model_id = backend["model"]
        vae = AutoencoderKLWan.from_pretrained(
            model_id,
            subfolder="vae",
            torch_dtype=torch.float32,
            low_cpu_mem_usage=True,
        )
        pipe = WanPipeline.from_pretrained(
            model_id,
            vae=vae,
            torch_dtype=torch.float16,
            low_cpu_mem_usage=True,
        )
        # FastWan is a three-step DMD model. Use the Wan scheduler with the
        # FastWan training flow shift and keep components offloaded between use.
        pipe.scheduler = UniPCMultistepScheduler.from_config(
            pipe.scheduler.config,
            flow_shift=8.0,
        )
        pipe.enable_model_cpu_offload()
        pipe.vae.enable_tiling()

        generator = torch.Generator(device="cuda").manual_seed(int(shot["seed"]))
        negative_prompt = (
            "open air, rooftop, terrace, courtyard, patio, visible sky, exterior pavement, "
            "low quality, worst quality, blurry, deformed, malformed hands, extra limbs, "
            "text, subtitles, logo, watermark"
        )

        state["status"] = "GENERATING"
        save_json(state_path, state)
        output = pipe(
            prompt=shot["prompt"],
            negative_prompt=negative_prompt,
            height=int(shot["height"]),
            width=int(shot["width"]),
            num_frames=int(shot["numFrames"]),
            num_inference_steps=int(shot["steps"]),
            guidance_scale=float(shot["guidance"]),
            generator=generator,
            output_type="np",
        )
        frames = output.frames[0]
        mp4 = output_dir / f"{shot['shotId'].lower()}_diffusers.mp4"
        export_to_video(frames, str(mp4), fps=int(shot["fps"]))

        state.update({
            "status": "GENERATED",
            "output": str(mp4),
            "bytes": mp4.stat().st_size,
            "elapsedSeconds": round(time.time() - started, 2),
            "peakVramGb": round(torch.cuda.max_memory_allocated() / (1024 ** 3), 2),
            "reviewStatus": "PENDING_HUMAN_REVIEW",
        })
        save_json(state_path, state)
        print(json.dumps(state, indent=2, ensure_ascii=False))
        return 0
    except Exception as exc:
        state.update({
            "status": "FAIL",
            "errorType": type(exc).__name__,
            "error": str(exc),
            "reviewStatus": "NOT_TESTED",
        })
        save_json(state_path, state)
        print(json.dumps(state, indent=2, ensure_ascii=False))
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
