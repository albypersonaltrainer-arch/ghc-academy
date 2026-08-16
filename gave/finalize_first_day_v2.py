from __future__ import annotations

import json
import subprocess
from pathlib import Path

MANIFEST = Path('gave/tests/wan22_ti2v_test_02_first_day_directed.json')
OVERRIDES = Path('gave/tests/v2_prompt_overrides.json')
REVIEW = Path('gave/qa/v2_manual_review.json')
OUT = Path('gave/runs/wan22_ti2v_test_02_first_day/online')
WORK = OUT / '_assembly_v2'
FINAL = OUT / 'first_day_directed_v2_picture_lock.mp4'
STATE = OUT / 'picture_lock_v2_state.json'
FPS = 24


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding='utf-8'))


def run(cmd: list[str]) -> None:
    print('RUN', ' '.join(cmd), flush=True)
    subprocess.run(cmd, check=True)


def main() -> int:
    m = load(MANIFEST)
    o = load(OVERRIDES)
    r = load(REVIEW)
    shots = m['shots']
    timings = o['timingOverrides']
    override_map = o.get('overrides', {})
    rejected = {
        (x['shotId'], int(x.get('generatedVersion', 1)))
        for x in r.get('manualReview', [])
        if x.get('status') == 'REJECTED' or x.get('reuseAllowed') is False
    }

    if abs(sum(float(v) for v in timings.values()) - 30.0) > 0.001:
        raise SystemExit('V2 timing map is not exactly 30 seconds')

    WORK.mkdir(parents=True, exist_ok=True)
    normalized: list[Path] = []
    source_manifest: list[dict] = []

    for idx, shot in enumerate(shots, 1):
        shot_id = shot['id']
        version = int(override_map.get(shot_id, {}).get('nextVersion', 1))
        if (shot_id, version) in rejected:
            raise SystemExit(f'Refusing rejected shot {shot_id} v{version}')
        src = OUT / f'{shot_id.lower()}_v{version}.mp4'
        if not src.exists():
            raise SystemExit(f'Missing required V2 shot: {src}')
        duration = float(timings[shot_id])
        target_frames = round(duration * FPS)
        if abs(target_frames / FPS - duration) > 0.001:
            raise SystemExit(f'Timing for {shot_id} is not representable exactly at {FPS} fps: {duration}')
        dst = WORK / f'{idx:02d}_{shot_id.lower()}_v{version}.mp4'
        # Some generated clips are a few frames shorter than their directed timing.
        # Clone the last frame when needed, then trim by exact frame count so every
        # timingOverride is honored deterministically at 24 fps.
        vf = (
            'scale=768:448:force_original_aspect_ratio=decrease,'
            'pad=768:448:(ow-iw)/2:(oh-ih)/2,'
            f'fps={FPS},tpad=stop_mode=clone:stop_duration={duration:.3f},'
            f'trim=end_frame={target_frames},setpts=PTS-STARTPTS,format=yuv420p'
        )
        run([
            'ffmpeg', '-y', '-i', str(src),
            '-vf', vf,
            '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
            '-movflags', '+faststart', str(dst)
        ])
        normalized.append(dst)
        source_manifest.append({
            'shotId': shot_id,
            'version': version,
            'durationSeconds': duration,
            'targetFrames': target_frames,
            'transitionIn': shot.get('transitionIn'),
            'source': str(src),
        })

    concat = WORK / 'concat.txt'
    concat.write_text(''.join(f"file '{p.resolve()}'\n" for p in normalized), encoding='utf-8')
    run([
        'ffmpeg', '-y', '-f', 'concat', '-safe', '0', '-i', str(concat),
        '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
        '-r', str(FPS), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(FINAL)
    ])

    probe = subprocess.check_output([
        'ffprobe', '-v', 'error', '-show_entries', 'format=duration,size', '-of', 'json', str(FINAL)
    ], text=True)
    p = json.loads(probe)['format']
    duration = float(p['duration'])
    if abs(duration - 30.0) > (1.0 / FPS + 0.001):
        raise SystemExit(f'Unexpected V2 duration {duration}')

    state = {
        'testId': m['testId'],
        'status': 'PICTURE_LOCK_V2',
        'output': str(FINAL),
        'bytes': FINAL.stat().st_size,
        'durationSeconds': duration,
        'targetDurationSeconds': 30.0,
        'shotCount': len(shots),
        'shots': source_manifest,
        'audioStatus': 'NOT_ADDED',
        'voiceoverStatus': 'NOT_ADDED',
        'qaStatus': 'PENDING_HUMAN_REVIEW',
        'generatedBy': 'WAN2.2_TI2V_BACKEND',
        'assembledBy': 'FFMPEG_QA_AWARE_V2',
        'paidInferenceUsed': False,
        'actualSpendEur': 0,
        'imageGenerationUsed': False,
        'imageToVideoUsed': False,
        'productionTouched': False,
    }
    STATE.write_text(json.dumps(state, indent=2, ensure_ascii=False), encoding='utf-8')
    print(json.dumps(state, indent=2, ensure_ascii=False), flush=True)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
