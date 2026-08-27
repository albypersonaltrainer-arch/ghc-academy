from gave.documentary.planner import plan_documentary


def test_plan_has_real_only_guard_and_beats():
    text = (
        "La fuerza no depende de una sola estructura. El músculo produce tensión, pero el sistema nervioso organiza el movimiento. "
        "La biomecánica permite estudiar cómo se distribuyen las cargas durante el ejercicio."
    )
    plan = plan_documentary(text, title="Test", target_seconds=30)
    assert plan["safety"]["realMediaOnly"] is True
    assert plan["safety"]["aiGeneratedMediaAllowed"] is False
    assert len(plan["beats"]) >= 2
    assert all(b["searchQuery"] for b in plan["beats"])
    assert abs(sum(b["durationSeconds"] for b in plan["beats"]) - 30) < 0.05
