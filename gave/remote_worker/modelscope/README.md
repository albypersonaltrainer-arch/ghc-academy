# GAVE Remote Worker — ModelScope A10

Status: `PREPARED_NOT_REMOTE_TESTED`

Purpose: replace Hugging Face ZeroGPU as the primary experimental video factory with a remote GPU worker that remains **0 EUR**, **Text-to-Video only**, and completely isolated from Production.

## Target

- Provider: ModelScope Notebook
- GPU target: NVIDIA A10, ~24 GB VRAM
- Persistent workspace: `/mnt/workspace`
- Primary backend: FastVideo + `FastVideo/FastWan2.1-T2V-1.3B-Diffusers`
- Safe attention backend for first test: `TORCH_SDPA`
- Resolution: 832x480
- Smoke test: ~3 seconds, 49 frames at 16 fps
- Seed: 24081977
- Images: forbidden
- I2V: forbidden
- Paid inference: forbidden
- Production: forbidden

## Why the first test uses FastWan2.1 1.3B

The first remote test is a capacity/speed proof, not a final backend decision. We deliberately start with a smaller accelerated T2V model so we can answer four questions quickly:

1. Does the free A10 environment actually run GAVE video generation reliably?
2. How many seconds does a ~3 s / 480p shot take end to end?
3. What is peak VRAM?
4. Is visual quality already competitive with the HF ZeroGPU FastWan2.2 path?

After this proof we can A/B against Wan2.2 5B, LightX2V and other engines on the same worker.

## Human gate: start the free notebook

ModelScope account login / cloud-account binding cannot be performed by GAVE. Once the user has started a free NVIDIA A10 notebook, open its terminal and run the bootstrap below.

## Bootstrap

```bash
mkdir -p /mnt/workspace/gave-bootstrap
cd /mnt/workspace/gave-bootstrap
curl -fsSL 'https://raw.githubusercontent.com/albypersonaltrainer-arch/ghc-academy/gave/wan22-t2v-test-01/gave/remote_worker/modelscope/bootstrap_a10_fastvideo.sh' -o bootstrap_a10_fastvideo.sh
bash bootstrap_a10_fastvideo.sh
```

The script performs:

1. `nvidia-smi` hardware validation.
2. Refuses GPUs below 20 GB VRAM.
3. Clones only the experimental `gave/wan22-t2v-test-01` branch.
4. Creates an isolated Python 3.12 environment under `/mnt/workspace`.
5. Installs FastVideo and ModelScope.
6. Forces `FASTVIDEO_ATTENTION_BACKEND=TORCH_SDPA` for the first compatibility test.
7. Runs the zero-cost T2V smoke test.
8. Writes the MP4 and `worker_state.json` to `/mnt/workspace/gave-worker-output`.

## Expected output

```text
/mnt/workspace/gave-worker-output/
  remote_a10_gym_reveal_001.mp4
  worker_state.json
```

`worker_state.json` records GPU, elapsed time, peak VRAM, backend, model, cost guards and review status.

## Acceptance

A remote test is technically successful only if:

- an MP4 exists;
- `status == GENERATED`;
- `paidInferenceUsed == false`;
- `actualSpendEur == 0`;
- `imageGenerationUsed == false`;
- `imageToVideoUsed == false`;
- `productionTouched == false`;
- GPU and peak VRAM are reported.

Visual acceptance remains a human/GAVE QA gate. A technically generated clip is not automatically approved.

## Next stage after PASS

Do not rebuild the documentary pipeline. Add the ModelScope worker behind the existing adapter boundary and then test, in this order:

1. FastWan2.1 1.3B speed baseline.
2. Wan2.2 TI2V-5B / FastWan2.2 5B if the A10 path fits reliably.
3. LightX2V accelerated Wan variants.
4. Quality/speed matrix on identical prompts and seeds.
5. Queue automation so GAVE can submit shots without manual notebook interaction.
