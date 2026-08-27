from gave.documentary.pdf_ingest import (
    _classify_line,
    _segment_microdocs,
    build_documentary_bundle,
)


def test_pdf_classification_excludes_bibliography_and_recognizes_visuals():
    kind, level = _classify_line(
        "Bibliografía", font_size=16, body_size=10, table_cells=set(), in_bibliography=False
    )
    assert kind == "HEADING"
    assert level == 1

    kind, _ = _classify_line(
        "Figura 3. Arquitectura del sistema neuromuscular",
        font_size=9, body_size=10, table_cells=set(), in_bibliography=False,
    )
    assert kind == "FIGURE_CAPTION"

    kind, _ = _classify_line(
        "Tabla 2. Variables de carga",
        font_size=9, body_size=10, table_cells=set(), in_bibliography=False,
    )
    assert kind == "TABLE_CAPTION"

    kind, _ = _classify_line(
        "Autor, A. (2024). Journal of Training, vol. 2, pp. 10-20.",
        font_size=10, body_size=10, table_cells=set(), in_bibliography=True,
    )
    assert kind == "BIBLIOGRAPHY_ENTRY"


def test_microdocs_preserve_source_and_stay_near_five_to_seven_minutes():
    paragraph = (
        "La adaptación al entrenamiento depende de la interacción entre carga, recuperación, contexto y respuesta individual. "
        "El profesional debe interpretar la información antes de modificar el programa y justificar cada decisión aplicada. "
    )
    blocks = []
    for i in range(1, 42):
        blocks.append({
            "id": f"P001B{i:03d}",
            "page": 1 + (i // 14),
            "kind": "PARAGRAPH",
            "text": paragraph,
            "headingPath": ["Módulo 1", "Adaptación"],
        })
    blocks.append({
        "id": "P002T001", "page": 2, "kind": "TABLE", "text": "Carga | Respuesta",
        "headingPath": ["Módulo 1", "Adaptación"],
    })

    microdocs = _segment_microdocs(
        blocks,
        title="Curso de prueba",
        words_per_minute=135,
        min_minutes=5,
        target_minutes=6,
        max_minutes=7,
    )
    assert len(microdocs) >= 2
    assert all(m["sourceBlockIds"] for m in microdocs)
    assert any("P002T001" in m["visualContextBlockIds"] for m in microdocs)
    assert all(m["estimatedDurationSeconds"] > 0 for m in microdocs)


def test_pdf_bundle_inherits_real_media_zero_cost_safety():
    ingest = {
        "source": {"filename": "curso.pdf", "sha256": "abc", "status": "TEXT_READY"},
        "document": {"language": "es"},
        "microdocumentaries": [{
            "id": "MD001",
            "title": "Principios",
            "sectionPath": ["Módulo 1", "Principios"],
            "pageRange": [1, 3],
            "sourceBlockIds": ["P001B001"],
            "visualContextBlockIds": ["P002T001"],
            "wordCount": 40,
            "estimatedDurationSeconds": 30.0,
            "narrationText": (
                "El entrenamiento profesional exige observar, interpretar y decidir. "
                "La programación debe responder al contexto y a la evolución de la persona."
            ),
        }],
    }
    bundle = build_documentary_bundle(ingest)
    assert bundle["schema"] == "GAVE_PDF_DOCUMENTARY_BUNDLE_V1"
    assert bundle["jobCount"] == 1
    assert bundle["safety"]["realMediaOnly"] is True
    assert bundle["safety"]["aiGeneratedMediaAllowed"] is False
    assert bundle["safety"]["paidAssetsAllowed"] is False
    assert bundle["jobs"][0]["pdfContext"]["sourceFilename"] == "curso.pdf"
    assert bundle["jobs"][0]["safety"]["productionTouched"] is False
