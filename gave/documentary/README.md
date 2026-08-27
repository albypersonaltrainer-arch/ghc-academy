# GAVE Documentary V1

Production path for GHC Academy documentaries built from **real, non-generative visual media**.

## Non-negotiable guards

- Real media only; generative-AI images are forbidden.
- Paid assets are forbidden.
- Commercial use and modification permission must be machine-verifiable.
- Fail closed: uncertain rights or uncertain AI provenance => reject.
- Production/main is never touched by this branch.
- Every accepted asset is recorded in `ASSET_LEDGER.json` with source, original ID, landing URL, download URL, creator, license and SHA-256 after download.

## V1 source policy

1. **Wikimedia Commons**: only strict allowlist licenses (Public Domain, CC0, CC BY); AI/synthetic categories and metadata are rejected.
2. **The Metropolitan Museum of Art**: only objects explicitly marked public domain by the official API; recorded as CC0.
3. **Pexels** is designed as the next adapter because its upload policy prohibits generative-AI photos, but it is not enabled in the automatic V1 path until the free API-key/secret flow is configured safely.

Openverse/Europeana/Wellcome/Smithsonian are candidates for later adapters, but they are not allowed into the automatic path until each adapter has an equally strict machine-verifiable rights/reality contract.

## Editorial model

A 20-minute lesson should normally become 3-4 microdocumentaries of about 5-7 minutes. Narration is the spine. The planner divides narration into editorial beats, each receiving 1-4 real visual assets. Rendering uses FFmpeg for slow push-ins, pans, detail crops, intentional B&W historical beats, color grading, subtitles and audio muxing.

The renderer never creates a synthetic image. It only reframes/grades/crops source photographs as normal editorial transformations permitted by the accepted license.

## CLI

```bash
python -m gave.documentary.pipeline plan --text-file narration.txt --title "Title" --target-seconds 360 --out job.json
python -m gave.documentary.pipeline discover --job job.json --out ASSET_LEDGER.json
python -m gave.documentary.pipeline download --ledger ASSET_LEDGER.json --asset-dir assets
python -m gave.documentary.pipeline render --job job.json --ledger ASSET_LEDGER.json --narration-audio narration.wav --out documentary.mp4
```

## Current QA status

Architecture/guards: testable in CI.
Visual documentary quality: **PENDING HUMAN TEST** until the first narration is supplied and rendered.
