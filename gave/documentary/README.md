# GAVE Documentary V1

Production path for GHC Academy documentaries built from **course PDFs + real, non-generative visual media**.

## Primary Academy path: PDF-first

The normal course workflow is now:

`course.pdf -> structured ingest -> academic blocks -> 5-7 min microdocumentaries -> documentary jobs -> real-media discovery -> rights/reality gates -> voice/subtitles -> cinematic render -> QA`

The course PDF is the canonical academic source. The user does **not** need to manually rewrite every course as a video script before GAVE can work with it.

Full contract: [`PDF_FIRST_SPEC.md`](./PDF_FIRST_SPEC.md)

## Non-negotiable guards

- Real media only; generative-AI images are forbidden.
- Paid assets are forbidden.
- Commercial use and modification permission must be machine-verifiable.
- Fail closed: uncertain rights or uncertain AI provenance => reject.
- Production/main is never touched by this branch.
- Every accepted external asset is recorded in `ASSET_LEDGER.json` with source, original ID, landing URL, download URL, creator, license and SHA-256 after download.
- PDF narration remains traceable to source filename, SHA-256, pages and exact source block IDs.
- OCR is not silently run. Suspected scanned pages are flagged for review.

## PDF semantic classes

The PDF ingest layer separates:

- headings and hierarchy;
- narratable paragraphs;
- lists;
- definitions;
- case studies;
- tables and table captions;
- figure captions and embedded figure objects;
- bibliography/references;
- repeated headers/footers.

Bibliography, tables, captions and page furniture are preserved as context but excluded from default narration.

## V1 source policy

1. **Wikimedia Commons**: only strict allowlist licenses (Public Domain, CC0, CC BY); AI/synthetic categories and metadata are rejected.
2. **The Metropolitan Museum of Art**: only objects explicitly marked public domain by the official API; recorded as CC0.
3. **Pexels** is designed as the next adapter because its upload policy prohibits generative-AI photos, but it is not enabled in the automatic V1 path until the free API-key/secret flow is configured safely.

Openverse/Europeana/Wellcome/Smithsonian are candidates for later adapters, but they are not allowed into the automatic path until each adapter has an equally strict machine-verifiable rights/reality contract.

## Editorial model

A 20-minute lesson should normally become 3-4 microdocumentaries of about 5-7 minutes. Narration is the spine. The planner divides narration into editorial beats, each receiving real visual assets. Rendering uses FFmpeg for slow push-ins, pans, detail crops, intentional B&W historical beats, color treatment, subtitles and audio muxing.

The renderer never creates a synthetic image. It only reframes/grades/crops source photographs as normal editorial transformations permitted by the accepted license.

## PDF-first CLI

```bash
python -m pip install -r gave/documentary/requirements-pdf.txt

python -m gave.documentary.pipeline ingest-pdf \
  --pdf course.pdf \
  --out course.ingest.json

python -m gave.documentary.pipeline plan-pdf \
  --ingest course.ingest.json \
  --out course.bundle.json \
  --jobs-dir course_jobs
```

The generated microdocumentary jobs then use the existing production stages:

```bash
python -m gave.documentary.pipeline discover --job course_jobs/microdoc_001.job.json --out ASSET_LEDGER.json
python -m gave.documentary.pipeline download --ledger ASSET_LEDGER.json --asset-dir assets
python -m gave.documentary.pipeline render --job course_jobs/microdoc_001.job.json --ledger ASSET_LEDGER.json --narration-audio narration.wav --out documentary.mp4
```

## QA status

PDF-first ingest/segmentation contract: **CI PASS**.
Rights/reality guards: **CI PASS**.
Visual documentary quality: **PENDING HUMAN TEST** until a complete real Academy PDF is run through the full visual/voice/render path.
