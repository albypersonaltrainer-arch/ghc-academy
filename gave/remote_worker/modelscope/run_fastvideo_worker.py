from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path
from typing import Any

CONTRACT_DEFAULT = Path(__file__).with_name("worker_contract_v1.json")


class WorkerSafetyError(RuntimeError):
    pass


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def gpu_info() -> dict[str, Any]:
    cmd = [
        "nvidia-smi",
        "--query-gpu=name,memory.total,driver_version",
        "--format=csv,noheader,nounits",
    ]
    raw = subprocess.check_output(cmd, text=True).strip().splitlines()[0]
    name, memory_mb, driver = [x.strip() for x in raw.split(",", 2)]
    return {
        "name": name,
        "memoryTotalMb": int(float(memory_mb)),
        "memoryTotalGb": round(float(memory_mb) / 1024.0, 2),
        "driverVersion": driver,
    }


def assert_safety(contract: dict[str, Any], gpu: dict[str, Any]) -> None:
    safety = contract.get("safety", {})
    if safety.get("paidInferenceAllowed") is not False:
        raise WorkerSafetyError("paidInferenceAllowed must be false")
    if float(safety.get("actualSpendEur", -1)) != 0:
        raise WorkerSafetyError("actualSpendEur must be 0")
    if safety.get("imageGenerationAllowed") is not False:
        raise WorkerSafetyError("image generation is forbidden")
    if safety.get("imageToVideoAllowed") is not False:
        raise WorkerSafetyError("image-to-video is forbidden")
    if safety.get("productionAllowed") is not False:
        raise WorkerSafetyError("Production is forbidden")
    if safety.get("inputMode") != "TEXT_ONLY":
        raise WorkerSafetyError("worker must remain TEXT_ONLY")
    min_vram = float(contract.get("hardwareTarget", {}).get("minVramGb", 20))
    if float(gpu.get("memoryTotalGb", 0)) < min_vram:
        raise WorkerSafetyError(
            f"GPU has {gpu.get('memoryTotalGb')} GB; contract requires >= {min_vram} GB"
        )
    if os.environ.get("GAVE_ALLOW_PAID", "false").lower() not in {"false", "0", "no"}:
        raise WorkerSafetyError("GAVE_ALLOW_PAID cannot be enabled")


def resolve_mp4(result: Any, output_dir: Path, started: float) -> Path:
    candidates: list[Path] = []
    if isinstance(result, dict):
        for key in ("output_path", "video_path", "path", "output", "video"):
            value = result.get(key)
            if isinstance(value, str):
                candidates.append(Path(value))
            elif isinstance(value, dict):
                for nested_key in ("path", "video", "output_path"):
                    nested = value.get(nested_key)
                    if isinstance(nested, str):
                        candidates.append(Path(nested))
    elif isinstance(result, str):
        candidates.append(Path(result))

    for path in candidates:
        if path.exists() and path.suffix.lower() == ".mp4":
            return path

    recent = [
        p for p in output_dir.rglob("*.mp4")
        if p.is_file() and p.stat().st_mtime >= started - 2
    ]
    if recent:
        return max(recent, key=lambda p: p.stat().st_mtime)
    raise RuntimeError(f"FastVideo returned no MP4. Result: {result!r}")


def main() -> int:
    parser = argparse.ArgumentParser(description="GAVE zero-cost ModelScope A10 FastVideo worker")
    parser.add_argument("--contract", default=str(CONTRACT_DEFAULT))
    parser.add_argument("--output-dir", default="/mnt/workspace/gave-worker-output")
    args = parser.parse_args()

    contract_path = Path(args.contract)
    contract = load_json(contract_path)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    state_path = output_dir / "worker_state.json"

    gpu = gpu_info()
    assert_safety(contract, gpu)
    shot = contract["smokeTest"]
    backend = contract["backendOrder"][0]

    state: dict[str, Any] = {
        "schema": "GAVE_REMOTE_GPU_RUN_V1",
        "workerId": contract["workerId"],
        "provider": contract["provider"],
        "backend": backend["id"],
        "model": backend["model"],
        "shotId": shot["shotId"],
        "status": "STARTING",
        "gpu": gpu,
        "paidInferenceUsed": False,
        "actualSpendEur": 0,
        "imageGenerationUsed": False,
        "imageToVideoUsed": False,
        "productionTouched": False,
    }
    save_json(state_path, state)

    os.environ.setdefault("FASTVIDEO_ATTENTION_BACKEND", backend.get("attentionBackend", "TORCH_SDPA"))
    os.environ.setdefault("FASTVIDEO_TARGET_DEVICE", "cuda")
    os.environ.setdefault("HF_HOME", "/mnt/workspace/.cache/huggingface")

    try:
        import torch
        from fastvideo import VideoGenerator

        if not torch.cuda.is_available():
            raise RuntimeError("CUDA is not available inside the remote worker")

        torch.cuda.reset_peak_memory_stats()
        started = time.time()
        state["status"] = "LOADING_MODEL"
        save_json(state_path, state)

        generator = VideoGenerator.from_pretrained(
            backend["model"],
            num_gpus=1,
            dit_cpu_offload=True,
            text_encoder_cpu_offload=True,
            vae_cpu_offload=False,
        )

        state["status"] = "GENERATING"
        save_json(state_path, state)

        result = generator.generate_video(
            shot["prompt"],
            output_path=str(output_dir / f"{shot['shotId'].lower()}.mp4"),
            save_video=True,
            return_frames=False,
            num_inference_steps=int(shot["steps"]),
            guidance_scale=float(shot["guidance"]),
            num_frames=int(shot["numFrames"]),
            height=int(shot["height"]),
            width=int(shot["width"]),
            fps=int(shot["fps"]),
            seed=int(shot["seed"]),
        )
        mp4 = resolve_mp4(result, output_dir, started)
        elapsed = round(time.time() - started, 2)
        peak_vram = round(torch.cuda.max_memory_allocated() / (1024 ** 3), 2)

        state.update({
            "status": "GENERATED",
            "output": str(mp4),
            "bytes": mp4.stat().st_size,
            "elapsedSeconds": elapsed,
            "peakVramGb": peak_vram,
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
        print(json.dumps(state, indent=2, ensure_ascii=False), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
