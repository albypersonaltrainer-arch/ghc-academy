# GAVE Documentary · PDF-First Contract V1

## Purpose

GAVE Documentary treats the course PDF as the canonical academic input. The user should not have to manually rewrite each course into a video script before production.

The pipeline is:

`course.pdf -> structured ingest -> academic blocks -> 5-7 min microdocumentaries -> documentary jobs -> real-media discovery -> rights/reality gates -> voice/subtitles -> cinematic render -> QA`

## Non-negotiable production rules

- Production/main is never touched by this experimental pipeline.
- `realMediaOnly=true`.
- AI-generated visual media is not allowed in Documentary V1.
- Paid visual assets are not allowed.
- Commercial use and modification rights must be demonstrable before an external asset is accepted.
- OCR is not automatic. A page that looks scanned is flagged for review instead of silently using OCR.
- Bibliography, headers, footers, figure labels and table content are not automatically narrated.
- The original PDF hash and every source block used by a microdocumentary remain traceable.

## Recommended Academy PDF authoring format

The parser is deliberately tolerant, but course PDFs should follow these rules when possible:

1. Use real selectable text, not scanned pages.
2. Use a clear hierarchy: Course -> Module -> Topic -> Subtopic.
3. Keep headings visually different from body text.
4. Prefer one-column body text.
5. Label figures as `Figura N. ...`.
6. Label tables as `Tabla N. ...`.
7. Put bibliography under a clear `Bibliografía`, `Referencias` or `Fuentes` heading.
8. Write definitions with labels such as `Definición:` or `Concepto clave:` when useful.
9. Write applied examples with labels such as `Caso práctico:` or `Caso clínico:` when useful.
10. Keep citations and bibliography separate from the explanatory body whenever possible.

These rules improve automatic classification but are not required for every page.

## GAVE_PDF_INGEST_V1

The ingest stage produces a JSON contract containing:

- source filename and SHA-256;
- page count;
- OCR status;
- pages suspected to be scans;
- estimated body font size;
- narrative word count;
- page summaries;
- hierarchical sections;
- classified source blocks;
- proposed 5-7 minute microdocumentaries.

### Block classes

`HEADING`
: Structural title. It defines hierarchy but is not automatically used as narration.

`PARAGRAPH`
: Normal explanatory course content. Eligible for narration.

`LIST_ITEM`
: Enumerated or bulleted academic content. Eligible for narration.

`DEFINITION`
: Explicit definition or key concept. Eligible for narration and useful for visual emphasis.

`CASE_STUDY`
: Applied or clinical case. Eligible for narration and useful for contextual real-world imagery.

`FIGURE_CAPTION`
: Caption of an existing figure. Visual context only.

`FIGURE_OBJECT`
: Embedded PDF image detected on the page. Visual context only in V1; it is not automatically extracted or reused.

`TABLE_CAPTION`
: Caption of an existing table. Visual context only.

`TABLE`
: Structured table detected from the PDF. Kept as academic context, not automatically narrated verbatim.

`TABLE_CELL`
: Text recognized as belonging to a table. Excluded from default narration.

`BIBLIOGRAPHY_ENTRY`
: Citation/reference material. Excluded from narration but retained for provenance/context.

`HEADER_FOOTER`
: Repeated page furniture. Excluded.

## Microdocumentary segmentation

Default editorial target:

- narration rate: 135 words/minute;
- minimum: 5 minutes;
- target: 6 minutes;
- maximum: 7 minutes.

GAVE prioritizes natural topic boundaries and then duration. It does not cut a section only because a timer reaches exactly six minutes.

Each proposed microdocumentary keeps:

- title;
- section path;
- source page range;
- source block IDs;
- related visual-context block IDs;
- word count;
- estimated narration duration;
- narration text.

Short or unusually long source sections are explicitly marked `SOURCE_LENGTH_EXCEPTION` instead of being padded with invented academic content.

## GAVE_PDF_DOCUMENTARY_BUNDLE_V1

`plan-pdf` converts every proposed microdocumentary into the existing GAVE documentary job format.

Each job receives `pdfContext` containing:

- PDF filename;
- PDF SHA-256;
- microdocumentary ID;
- section path;
- page range;
- exact source blocks;
- visual-context blocks.

This means every sentence in a produced video can be traced back to the course PDF.

## Scanned PDFs

GAVE V1 is fail-aware rather than OCR-first.

If a page contains almost no extractable text but contains embedded imagery, it is marked `scannedPageSuspected=true`. The document status becomes `REVIEW_SCANNED_PAGES`.

No OCR is silently launched. This prevents recognition errors from becoming unreviewed narration.

## Commands

Install the PDF runtime:

```bash
python -m pip install -r gave/documentary/requirements-pdf.txt
```

Ingest a course PDF:

```bash
python -m gave.documentary.pipeline ingest-pdf \
  --pdf course.pdf \
  --out course.ingest.json
```

Build the documentary bundle and individual jobs:

```bash
python -m gave.documentary.pipeline plan-pdf \
  --ingest course.ingest.json \
  --out course.bundle.json \
  --jobs-dir course_jobs
```

The resulting jobs feed the existing visual discovery, rights gate, voice, subtitles and renderer stages.

## V1 boundary

PDF-first V1 solves academic ingestion and traceable segmentation. It does not yet claim perfect semantic interpretation of every possible layout. Complex multi-column textbooks, mathematical typesetting, irregular sidebars and heavily designed magazine-style PDFs may require a later layout-analysis layer.
