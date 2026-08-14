# GAVE · Wan 2.2 TI2V-5B experimental backend

This folder is an **experimental GAVE branch only**. It must not be promoted to Production without explicit approval.

## Hard invariants

- `PAID_INFERENCE_ALLOWED = false`
- `actualSpendEur = 0`
- Text-to-Video only for this test.
- **No image generation, image editing, keyframes, reference images or Image-to-Video inputs.**
- If a ComfyUI workflow contains an active `LoadImage` node, the adapter rejects it.
- `main` / Production are not modified by this experiment.

## Backend

`GAVE_VIDEO_BACKEND = WAN22_TI2V_5B_COMFYUI`

Wan stays behind an adapter so GAVE can later swap the generator without rewriting the documentary pipeline.

## Official model files expected by ComfyUI

Place the following files in the local ComfyUI installation:

```text
ComfyUI/
└─ models/
   ├─ diffusion_models/
   │  └─ wan2.2_ti2v_5B_fp16.safetensors
   ├─ text_encoders/
   │  └─ umt5_xxl_fp8_e4m3fn_scaled.safetensors
   └─ vae/
      └─ wan2.2_vae.safetensors
```

The test assumes ComfyUI is available at `http://127.0.0.1:8188` and uses its local `/prompt` + `/history/{prompt_id}` API.

## Workflow file

In ComfyUI load the native template **Wan2.2 5B video generation**, keep it in pure Text-to-Video mode, then use **Export (API)** and save the resulting API-format workflow as:

```text
gave/workflows/wan22_ti2v_5b_api.json
```

The adapter discovers the positive prompt, negative prompt, KSampler, Wan latent and SaveVideo nodes by node type/title instead of relying on fixed node IDs.

## Test 01

`tests/wan22_ti2v_test_01_first_day.json`

Concept: ~30 s cinematic micro-story. A young man wakes up excited and nervous, crosses a New-York-like city, rides the subway and enters an unidentified business. The final reveal is that it is a gym and this is his first day as a personal trainer.

The film is generated shot-by-shot, not as one 30-second generation.

## Run

```bash
python -m gave.run_test --manifest gave/tests/wan22_ti2v_test_01_first_day.json
```

Dry-run validation without queueing inference:

```bash
python -m gave.run_test --manifest gave/tests/wan22_ti2v_test_01_first_day.json --dry-run
```

## Current test status

- Shot design: `PASS`
- Adapter scaffold: `IMPLEMENTED`
- ComfyUI native workflow: `REQUIRED`
- Wan model execution: `NOT TESTED`
- Character continuity: `SPECIFIED / NOT GUARANTEED`
- Image generation: `DISALLOWED`
- Paid inference: `FALSE`
- Actual spend: `0 €`
