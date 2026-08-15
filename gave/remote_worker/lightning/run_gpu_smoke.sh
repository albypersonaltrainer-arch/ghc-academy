#!/usr/bin/env bash
set -euo pipefail

export GAVE_ALLOW_PAID=false
export FASTVIDEO_ATTENTION_BACKEND=TORCH_SDPA
export FASTVIDEO_TARGET_DEVICE=cuda

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
python gave/remote_worker/lightning/run_fastvideo_worker.py \
  --contract gave/remote_worker/lightning/worker_contract_t4_v1.json \
  --output-dir "$OUT"

echo "=== GAVE LIGHTNING GPU SMOKE FINISHED ==="
echo "Output: $OUT"
