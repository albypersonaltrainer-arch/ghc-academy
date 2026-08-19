#!/usr/bin/env bash
set -euo pipefail

if [[ "${GAVE_ALLOW_PAID:-false}" != "false" ]]; then
  echo "Refusing to run: GAVE_ALLOW_PAID must be false" >&2
  exit 70
fi

ROOT="/teamspace/studios/this_studio/ghc-academy"
RUNTIME="$ROOT/.gave/lightning/skyreels_v2"
UPSTREAM="$RUNTIME/SkyReels-V2"
OUTROOT="$ROOT/.gave/lightning/output"
STATE="$OUTROOT/skyreels_continuity_state.json"
UPSTREAM_COMMIT="9351d13152207cc04de780e055346b08ade0b851"
MODEL_ID="Skywork/SkyReels-V2-DF-1.3B-540P"
PY="python"
BASE_FRAMES=49
NUM_FRAMES=49
OVERLAP=17
STEPS=16
FPS=24
SEED=19771220
STAGE="${GAVE_SKYREELS_STAGE:-FULL}"

case "$STAGE" in
  INITIAL|EXTEND|FULL) ;;
  *) echo "Unsupported GAVE_SKYREELS_STAGE=$STAGE" >&2; exit 69 ;;
esac

echo "GAVE SkyReels stage: $STAGE"
mkdir -p "$RUNTIME" "$OUTROOT"
cd "$ROOT"

$PY - <<'PY'
import json
from pathlib import Path
m = json.loads(Path('gave/tests/skyreels_v2_continuity_first_day.json').read_text())
s = m['safety']
assert s['paidInferenceAllowed'] is False
assert float(s['actualSpendEur']) == 0
assert s['productionAllowed'] is False
assert s['imageGenerationAllowed'] is False
assert s['imageToVideoAllowed'] is False
assert s['referenceImageAllowed'] is False
assert s['frameExtractionAllowed'] is False
print('GAVE SkyReels continuity safety: PASS')
PY

nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader
$PY --version

if [[ ! -d "$UPSTREAM/.git" ]]; then
  git clone https://github.com/SkyworkAI/SkyReels-V2.git "$UPSTREAM"
fi
cd "$UPSTREAM"
git fetch origin "$UPSTREAM_COMMIT" --depth=1
git checkout --detach "$UPSTREAM_COMMIT"

$PY -m pip install --upgrade pip setuptools wheel
$PY -m pip install \
  'diffusers>=0.31.0,<0.40' \
  'transformers==4.49.0' \
  'tokenizers==0.21.1' \
  'accelerate==1.6.0' \
  'opencv-python==4.10.0.84' \
  'numpy>=1.23.5,<2' \
  tqdm imageio easydict ftfy imageio-ffmpeg 'moviepy==1.0.3' huggingface_hub safetensors sentencepiece decord einops

$PY - <<'PY'
import torch
print('torch', torch.__version__)
print('cuda', torch.version.cuda)
print('cuda_available', torch.cuda.is_available())
if not torch.cuda.is_available():
    raise SystemExit('CUDA unavailable on SkyReels worker')
print('gpu', torch.cuda.get_device_name(0))
PY

# T4/Turing compatibility: fp16 + PyTorch SDPA fallback. Patches are idempotent.
$PY - <<'PY'
from pathlib import Path
p = Path('generate_video_df.py')
s = p.read_text()
s = s.replace('weight_dtype=torch.bfloat16', 'weight_dtype=torch.float16')
p.write_text(s)

t = Path('skyreels_v2_infer/modules/transformer.py')
s = t.read_text()
s = s.replace('from .attention import flash_attention', 'from .attention import attention')
s = s.replace(
    'flash_attention(q=q, k=k, v=v, window_size=self.window_size)',
    'attention(q=q, k=k, v=v, window_size=self.window_size, dtype=torch.float16)'
)
s = s.replace('flash_attention(q, k_img, v_img)', 'attention(q, k_img, v_img, dtype=torch.float16)')
s = s.replace('flash_attention(q, k, v)', 'attention(q, k, v, dtype=torch.float16)')
t.write_text(s)
print('SkyReels T4 patches: fp16 + SDPA fallback')
PY

$PY - <<'PY'
import json
from pathlib import Path
m = json.loads(Path('/teamspace/studios/this_studio/ghc-academy/gave/tests/skyreels_v2_continuity_first_day.json').read_text())
Path('/tmp/gave_shot_a.txt').write_text(m['shotA']['prompt'])
Path('/tmp/gave_shot_b.txt').write_text(m['shotBExtension']['prompt'])
PY
PROMPT_A="$(cat /tmp/gave_shot_a.txt)"
PROMPT_B="$(cat /tmp/gave_shot_b.txt)"
INITIAL_PERSIST="$OUTROOT/skyreels_first_day_initial_v1.mp4"
CONTINUITY_PERSIST="$OUTROOT/skyreels_first_day_continuity_v1.mp4"
START_TS=$(date +%s)

if [[ "$STAGE" == "INITIAL" || "$STAGE" == "FULL" ]]; then
  rm -rf result/gave_first_day_initial
  mkdir -p result/gave_first_day_initial
  rm -f "$STATE" "$INITIAL_PERSIST"
  if [[ "$STAGE" == "FULL" ]]; then
    rm -f "$CONTINUITY_PERSIST"
  fi

  # Stage A: pure text-to-video. No image or reference frame is supplied.
  $PY generate_video_df.py \
    --model_id "$MODEL_ID" \
    --resolution 540P \
    --ar_step 0 \
    --base_num_frames "$BASE_FRAMES" \
    --num_frames "$NUM_FRAMES" \
    --overlap_history "$OVERLAP" \
    --prompt "$PROMPT_A" \
    --addnoise_condition 20 \
    --guidance_scale 6.0 \
    --shift 8.0 \
    --inference_steps "$STEPS" \
    --fps "$FPS" \
    --seed "$SEED" \
    --offload \
    --outdir gave_first_day_initial

  INITIAL=$(find result/gave_first_day_initial -type f -name '*.mp4' -printf '%T@ %p\n' | sort -nr | head -1 | cut -d' ' -f2-)
  if [[ -z "${INITIAL:-}" || ! -s "$INITIAL" ]]; then
    echo "SkyReels initial segment missing" >&2
    exit 71
  fi
  cp "$INITIAL" "$INITIAL_PERSIST"

  END_INITIAL_TS=$(date +%s)
  $PY - <<PY
import json, subprocess
from pathlib import Path
initial = Path('$INITIAL_PERSIST')

def probe(path):
    cmd = ['ffprobe','-v','error','-show_entries','format=duration,size','-show_entries','stream=width,height,r_frame_rate,codec_name','-of','json',str(path)]
    try:
        return json.loads(subprocess.check_output(cmd, text=True))
    except Exception as exc:
        return {'probeError': str(exc)}

state = {
  'schema': 'GAVE_SKYREELS_CONTINUITY_STATE_V1',
  'status': 'INITIAL_GENERATED',
  'stage': 'INITIAL',
  'engine': 'SkyReels-V2-DF-1.3B-540P',
  'upstreamCommit': '$UPSTREAM_COMMIT',
  'initialOutput': '.gave/lightning/output/skyreels_first_day_initial_v1.mp4',
  'initialElapsedSeconds': int('$END_INITIAL_TS') - int('$START_TS'),
  'initialProbe': probe(initial),
  'qaStatus': 'PENDING_HUMAN_REVIEW',
  'paidInferenceUsed': False,
  'actualSpendEur': 0,
  'productionTouched': False,
  'imageGenerationUsed': False,
  'imageToVideoUsed': False,
  'referenceImageUsed': False,
  'frameExtractionUsed': False,
  'videoToVideoExtensionUsed': False,
  'benchmarkFramesPerSegment': $NUM_FRAMES,
  'benchmarkInferenceSteps': $STEPS
}
Path('$STATE').write_text(json.dumps(state, indent=2), encoding='utf-8')
print(json.dumps(state, indent=2))
PY

  echo "GAVE_SKYREELS_INITIAL=$INITIAL_PERSIST"
  if [[ "$STAGE" == "INITIAL" ]]; then
    exit 0
  fi
else
  if [[ ! -s "$INITIAL_PERSIST" ]]; then
    echo "Persistent SkyReels initial segment is missing; run INITIAL stage first" >&2
    exit 73
  fi
fi

# Stage B: extend the persisted generated video. This is video extension, not I2V.
rm -rf result/gave_first_day_extended
mkdir -p result/gave_first_day_extended
rm -f "$CONTINUITY_PERSIST"

$PY generate_video_df.py \
  --model_id "$MODEL_ID" \
  --resolution 540P \
  --ar_step 0 \
  --base_num_frames "$BASE_FRAMES" \
  --num_frames "$NUM_FRAMES" \
  --overlap_history "$OVERLAP" \
  --prompt "$PROMPT_B" \
  --addnoise_condition 20 \
  --guidance_scale 6.0 \
  --shift 8.0 \
  --inference_steps "$STEPS" \
  --fps "$FPS" \
  --seed "$SEED" \
  --offload \
  --video_path "$INITIAL_PERSIST" \
  --outdir gave_first_day_extended

EXTENDED=$(find result/gave_first_day_extended -type f -name '*.mp4' -printf '%T@ %p\n' | sort -nr | head -1 | cut -d' ' -f2-)
if [[ -z "${EXTENDED:-}" || ! -s "$EXTENDED" ]]; then
  echo "SkyReels extended segment missing" >&2
  exit 72
fi
cp "$EXTENDED" "$CONTINUITY_PERSIST"

END_TS=$(date +%s)
$PY - <<PY
import json, subprocess
from pathlib import Path
video = Path('$CONTINUITY_PERSIST')
initial = Path('$INITIAL_PERSIST')

def probe(path):
    cmd = ['ffprobe','-v','error','-show_entries','format=duration,size','-show_entries','stream=width,height,r_frame_rate,codec_name','-of','json',str(path)]
    try:
        return json.loads(subprocess.check_output(cmd, text=True))
    except Exception as exc:
        return {'probeError': str(exc)}

state = {
  'schema': 'GAVE_SKYREELS_CONTINUITY_STATE_V1',
  'status': 'GENERATED',
  'stage': 'EXTEND',
  'engine': 'SkyReels-V2-DF-1.3B-540P',
  'upstreamCommit': '$UPSTREAM_COMMIT',
  'initialOutput': '.gave/lightning/output/skyreels_first_day_initial_v1.mp4',
  'output': '.gave/lightning/output/skyreels_first_day_continuity_v1.mp4',
  'stageElapsedSeconds': int('$END_TS') - int('$START_TS'),
  'initialProbe': probe(initial),
  'outputProbe': probe(video),
  'continuityMechanism': 'VIDEO_EXTENSION_FROM_PERSISTED_GENERATED_SEGMENT',
  'qaStatus': 'PENDING_HUMAN_REVIEW',
  'paidInferenceUsed': False,
  'actualSpendEur': 0,
  'productionTouched': False,
  'imageGenerationUsed': False,
  'imageToVideoUsed': False,
  'referenceImageUsed': False,
  'frameExtractionUsed': False,
  'videoToVideoExtensionUsed': True,
  'benchmarkFramesPerSegment': $NUM_FRAMES,
  'benchmarkInferenceSteps': $STEPS
}
Path('$STATE').write_text(json.dumps(state, indent=2), encoding='utf-8')
print(json.dumps(state, indent=2))
PY

echo "GAVE_SKYREELS_VIDEO=$CONTINUITY_PERSIST"
