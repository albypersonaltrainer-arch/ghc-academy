from __future__ import annotations

import argparse
import json
from pathlib import Path

from .assets import discover_for_job, download_ledger_assets, save_json
from .planner import plan_documentary, write_plan
from .renderer import render_documentary


def load(path: str | Path) -> dict:
    return json.loads(Path(path).read_text(encoding="utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser(description="GAVE Documentary V1: real-media documentary pipeline")
    sub = parser.add_subparsers(dest="command", required=True)

    p_plan = sub.add_parser("plan")
    p_plan.add_argument("--text-file", required=True)
    p_plan.add_argument("--title", default="GHC Academy Documentary")
    p_plan.add_argument("--target-seconds", type=float)
    p_plan.add_argument("--out", required=True)

    p_discover = sub.add_parser("discover")
    p_discover.add_argument("--job", required=True)
    p_discover.add_argument("--out", required=True)

    p_download = sub.add_parser("download")
    p_download.add_argument("--ledger", required=True)
    p_download.add_argument("--asset-dir", required=True)

    p_render = sub.add_parser("render")
    p_render.add_argument("--job", required=True)
    p_render.add_argument("--ledger", required=True)
    p_render.add_argument("--out", required=True)
    p_render.add_argument("--narration-audio")
    p_render.add_argument("--music-audio")

    args = parser.parse_args()
    if args.command == "plan":
        text = Path(args.text_file).read_text(encoding="utf-8")
        plan = plan_documentary(text, title=args.title, target_seconds=args.target_seconds)
        write_plan(args.out, plan)
        print(json.dumps({"status": "PLANNED", "beats": len(plan["beats"]), "out": args.out}, ensure_ascii=False))
        return 0

    if args.command == "discover":
        job = load(args.job)
        ledger = discover_for_job(job)
        save_json(args.out, ledger)
        print(json.dumps({"status": "DISCOVERED", "assets": len(ledger["items"]), "out": args.out}, ensure_ascii=False))
        return 0

    if args.command == "download":
        ledger = load(args.ledger)
        download_ledger_assets(ledger, args.asset_dir)
        save_json(args.ledger, ledger)
        print(json.dumps({"status": "DOWNLOADED", "assets": len(ledger["items"]), "ledger": args.ledger}, ensure_ascii=False))
        return 0

    if args.command == "render":
        state = render_documentary(
            load(args.job), load(args.ledger), args.out,
            narration_audio=args.narration_audio, music_audio=args.music_audio,
        )
        state_path = str(Path(args.out).with_suffix(".state.json"))
        save_json(state_path, state)
        print(json.dumps(state, ensure_ascii=False, indent=2))
        return 0

    return 2


if __name__ == "__main__":
    raise SystemExit(main())
