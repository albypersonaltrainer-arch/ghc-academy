#!/usr/bin/env bash
set -uo pipefail

export GAVE_ALLOW_PAID=false
export FASTVIDEO_ATTENTION_BACKEND=TORCH_SDPA
export FASTVIDEO_TARGET_DEVICE=cuda
export FASTVIDEO_WORKER_MULTIPROC_METHOD=spawn

REPO_ROOT="$(git rev-parse --show-toplevel)"
STATE_ROOT="$REPO_ROOT/.gave/lightning"
VENV="$STATE_ROOT/.venv"
OUT="$STATE_ROOT/output"
CACHE="$STATE_ROOT/cache"
mkdir -p "$OUT" "$CACHE"

export HF_HOME="$CACHE/huggingface"
export XDG_CACHE_HOME="$CACHE"

echo "=== GAVE LIGHTNING / GPU SAFETY CHECK ==="
nvidia-smi
GPU_MEM_MB=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits | head -n1 | tr -d ' ')
if [ "${GPU_MEM_MB:-0}" -lt 14000 ]; then
  echo "ERROR: requires at least 14 GB VRAM; detected ${GPU_MEM_MB:-0} MB"
  exit 10
fi

if [ ! -d "$VENV" ]; then
  echo "ERROR: CPU preparation has not been completed. Run prepare_cpu.sh first."
  exit 11
fi
source "$VENV/bin/activate"
cd "$REPO_ROOT"

CONTRACT=gave/remote_worker/lightning/worker_contract_t4_v1.json

echo "=== ATTEMPT 1: FASTVIDEO FP16 / T4 COMPATIBILITY ==="
python gave/remote_worker/lightning/run_fastvideo_worker.py \
  --contract "$CONTRACT" \
  --output-dir "$OUT"
FASTVIDEO_STATUS=$?

if [ "$FASTVIDEO_STATUS" -eq 0 ]; then
  echo "=== GAVE LIGHTNING GPU SMOKE FINISHED / FASTVIDEO ==="
  echo "Output: $OUT"
  exit 0
fi

echo "=== FASTVIDEO FAILED; STARTING SINGLE-PROCESS DIFFUSERS FALLBACK ==="
python - <<'PY'
import importlib.util, subprocess, sys
mods = ["diffusers", "transformers", "accelerate", "imageio_ffmpeg"]
missing = [m for m in mods if importlib.util.find_spec(m) is None]
if missing:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "--upgrade", "diffusers", "transformers", "accelerate", "imageio-ffmpeg"])
PY

python gave/remote_worker/lightning/run_diffusers_worker.py \
  --contract "$CONTRACT" \
  --output-dir "$OUT"
FALLBACK_STATUS=$?

if [ "$FALLBACK_STATUS" -eq 0 ]; then
  echo "=== GAVE LIGHTNING GPU SMOKE FINISHED / DIFFUSERS FALLBACK ==="
  echo "Output: $OUT"
  exit 0
fi

echo "=== BOTH ZERO-COST GPU PATHS FAILED ==="
exit 2
