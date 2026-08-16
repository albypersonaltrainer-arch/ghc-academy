#!/usr/bin/env bash
set -euo pipefail

export GAVE_ALLOW_PAID=false

REPO_ROOT="$(git rev-parse --show-toplevel)"
STATE_ROOT="$REPO_ROOT/.gave/lightning"
VENV="$STATE_ROOT/.venv"
CACHE="$STATE_ROOT/cache"
mkdir -p "$STATE_ROOT" "$CACHE"

export HF_HOME="$CACHE/huggingface"
export XDG_CACHE_HOME="$CACHE"

echo "=== GAVE LIGHTNING / CPU PREP ==="
echo "repo=$REPO_ROOT"
echo "python=$(python --version 2>&1)"

python -m pip install -q --upgrade pip uv
if [ ! -d "$VENV" ]; then
  uv venv "$VENV" --python 3.12 --seed
fi
source "$VENV/bin/activate"
uv pip install --upgrade fastvideo huggingface_hub

# IMPORTANT: do not import fastvideo on a CPU-only Studio. FastVideo imports
# Triton/CUDA runtime components at module import time and can fail with
# "0 active drivers" even when the package is installed correctly. We verify
# installation metadata only; the real import/CUDA test happens after switching
# to the free-credit GPU in run_gpu_smoke.sh.
python - <<'PY'
import json
import sys
from importlib.metadata import PackageNotFoundError, version

try:
    fastvideo_version = version("fastvideo")
except PackageNotFoundError as exc:
    raise SystemExit("FastVideo package was not installed") from exc

payload = {
    "status": "CPU_PREPARED",
    "python": sys.version.split()[0],
    "fastvideo": fastvideo_version,
    "cudaImportDeferredUntilGpu": True,
    "paidInferenceUsed": False,
    "actualSpendEur": 0,
    "imageGenerationUsed": False,
    "imageToVideoUsed": False,
    "productionTouched": False,
}
print(json.dumps(payload, indent=2))
PY

echo "=== CPU PREP COMPLETE ==="
echo "Do not run the GPU smoke script until the Studio is switched to a free-credit GPU."
