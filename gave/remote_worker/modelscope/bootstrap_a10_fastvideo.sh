#!/usr/bin/env bash
set -euo pipefail

# GAVE ModelScope A10 worker bootstrap.
# Hard guarantees: text-to-video only, no paid inference, no Production.

export GAVE_ALLOW_PAID=false
export FASTVIDEO_ATTENTION_BACKEND=TORCH_SDPA
export FASTVIDEO_TARGET_DEVICE=cuda
export HF_HOME=/mnt/workspace/.cache/huggingface
export XDG_CACHE_HOME=/mnt/workspace/.cache

ROOT=/mnt/workspace/gave-remote-worker
REPO="$ROOT/ghc-academy"
OUT=/mnt/workspace/gave-worker-output
BRANCH=gave/wan22-t2v-test-01

mkdir -p "$ROOT" "$OUT" "$HF_HOME"

echo "=== GAVE REMOTE WORKER / HARDWARE CHECK ==="
nvidia-smi

GPU_MEM_MB=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits | head -n1 | tr -d ' ')
if [ "${GPU_MEM_MB:-0}" -lt 20000 ]; then
  echo "ERROR: this worker requires >=20 GB VRAM; detected ${GPU_MEM_MB:-0} MB"
  exit 10
fi

if [ -d "$REPO/.git" ]; then
  git -C "$REPO" fetch origin "$BRANCH" --depth 1
  git -C "$REPO" checkout -f "$BRANCH"
  git -C "$REPO" reset --hard "origin/$BRANCH"
else
  git clone --depth 1 --branch "$BRANCH" \
    https://github.com/albypersonaltrainer-arch/ghc-academy.git "$REPO"
fi

cd "$ROOT"
python -m pip install -q --upgrade pip uv
uv python install 3.12
if [ ! -d "$ROOT/.venv" ]; then
  uv venv "$ROOT/.venv" --python 3.12 --seed
fi
source "$ROOT/.venv/bin/activate"

# FastVideo is the primary speed path. ModelScope is installed as a zero-cost
# model-hub fallback for later baseline tests. We deliberately do NOT install
# paid inference SDKs or configure any billing-backed provider.
uv pip install --upgrade fastvideo modelscope

python - <<'PY'
import json
import os
import sys
try:
    import torch
    import fastvideo
    payload = {
        "python": sys.version.split()[0],
        "torch": torch.__version__,
        "cudaAvailable": torch.cuda.is_available(),
        "cudaDevice": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
        "fastvideo": getattr(fastvideo, "__version__", "unknown"),
        "attentionBackend": os.environ.get("FASTVIDEO_ATTENTION_BACKEND"),
        "paidInferenceUsed": False,
        "actualSpendEur": 0,
        "imageGenerationUsed": False,
        "imageToVideoUsed": False,
        "productionTouched": False,
    }
    print(json.dumps(payload, indent=2))
    if not payload["cudaAvailable"]:
        raise SystemExit(11)
except Exception as exc:
    print(f"ENVIRONMENT CHECK FAILED: {type(exc).__name__}: {exc}", file=sys.stderr)
    raise
PY

cd "$REPO"
python gave/remote_worker/modelscope/run_fastvideo_worker.py \
  --contract gave/remote_worker/modelscope/worker_contract_v1.json \
  --output-dir "$OUT"

echo "=== GAVE REMOTE WORKER FINISHED ==="
echo "MP4/state directory: $OUT"
