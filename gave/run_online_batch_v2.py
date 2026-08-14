from __future__ import annotations

import json
import os
import shutil
import time
from pathlib import Path
from typing import Any

from gradio_client import Client

MANIFEST_PATH = Path(os.environ.get('GAVE_MANIFEST', 'gave/tests/wan22_ti2v_test_02_first_day_directed.json'))
CONTROL_PATH = Path(os.environ.get('GAVE_CONTROL', 'gave/control/run_online_batch_v2.json'))
OVERRIDES_PATH = Path(os.environ.get('GAVE_OVERRIDES', 'gave/tests/v2_prompt_overrides.json'))
REVIEW_PATH = Path(os.environ.get('GAVE_REVIEW', 'gave/qa/v2_manual_review.json'))
OUT = Path(os.environ.get('GAVE_OUT', 'gave/runs/wan22_ti2v_test_02_first_day/online'))
OUT.mkdir(parents=True, exist_ok=True)
SPACE = os.environ.get('GAVE_SPACE', 'Upsampler/wan-2-2-5b-video')
HF_TOKEN = os.environ.get('HF_TOKEN')


class GaveSafetyError(RuntimeError):
    pass


def load_json(path: Path, default: dict[str, Any] | None = None) -> dict[str, Any]:
    if not path.exists():
        return {} if default is None else default
    return json.loads(path.read_text(encoding='utf-8'))


def extract_video_path(payload: Any) -> Path:
    value = payload.get('video') or payload.get('path') if isinstance(payload, dict) else payload
    if not value:
        raise RuntimeError(f'No video path in payload: {payload!r}')
    path = Path(str(value))
    if not path.exists():
        raise RuntimeError(f'Downloaded video missing: {path}')
    return path


def assert_safety(manifest: dict[str, Any], control: dict[str, Any]) -> None:
    for key in ('paidInferenceAllowed', 'productionAllowed', 'imageGenerationAllowed', 'imageToVideoAllowed'):
        if manifest.get(key) is not False:
            raise GaveSafetyError(f'{key} must be false')
    if float(manifest.get('actualSpendEur', -1)) != 0:
        raise GaveSafetyError('actualSpendEur must be 0')
    if control.get('allowPaidFallback') is not False:
        raise GaveSafetyError('Paid fallback forbidden')
    if control.get('allowImageInput') is not False:
        raise GaveSafetyError('Image input forbidden')
    if control.get('touchProduction') is not False:
        raise GaveSafetyError('Production forbidden')
    if not HF_TOKEN:
        raise GaveSafetyError('HF_TOKEN required')


def review_index(review: dict[str, Any]) -> dict[tuple[str, int], dict[str, Any]]:
    return {
        (str(item.get('shotId')), int(item.get('generatedVersion', 1))): item
        for item in review.get('manualReview', [])
    }


def main() -> int:
    manifest = load_json(MANIFEST_PATH)
    control = load_json(CONTROL_PATH)
    overrides = load_json(OVERRIDES_PATH, {'overrides': {}})
    review = load_json(REVIEW_PATH, {'manualReview': []})
    assert_safety(manifest, control)

    start = int(control.get('startShot', 1))
    max_shots = int(control.get('maxShots', 1))
    width = int(control.get('width', 768))
    height = int(control.get('height', 448))
    steps = int(control.get('steps', 4))
    guidance = float(control.get('guidance', 0.0))
    skip_existing = bool(control.get('skipExisting', True))
    shots = manifest['shots']
    selected = shots[start - 1:start - 1 + max_shots]
    if not selected:
        raise ValueError('No shots selected')

    master = ' '.join(x.strip() for x in [manifest.get('characterLock', ''), manifest.get('visualMaster', ''), manifest.get('storyRule', '')] if x.strip())
    negative = str(manifest.get('negativeMaster', ''))
    seed = int(manifest.get('continuitySeed', 24081977))
    reviews = review_index(review)
    override_map = overrides.get('overrides', {})

    state_path = OUT / 'batch_state_v2.json'
    state = load_json(state_path, {
        'testId': manifest['testId'], 'space': SPACE, 'backend': 'HF_ZERO_GPU_FASTWAN22_TI2V_5B', 'results': [],
        'paidInferenceUsed': False, 'actualSpendEur': 0, 'imageGenerationUsed': False,
        'imageToVideoUsed': False, 'productionTouched': False,
    })

    client = Client(SPACE, token=HF_TOKEN, download_files=str(OUT / '_gradio_downloads_v2'), verbose=True)
    api = client.view_api(return_format='dict')
    if '/generate_video' not in (api.get('named_endpoints') or {}):
        raise RuntimeError('/generate_video endpoint missing')

    any_failure = False
    for shot in selected:
        shot_id = str(shot['id'])
        ov = override_map.get(shot_id, {})
        version = int(ov.get('nextVersion', 1))
        prompt_body = str(ov.get('prompt') or shot['prompt'])
        final_path = OUT / f'{shot_id.lower()}_v{version}.mp4'
        prior_review = reviews.get((shot_id, version))
        rejected = bool(prior_review and prior_review.get('status') == 'REJECTED')
        reuse_allowed = not rejected and not (prior_review and prior_review.get('reuseAllowed') is False)

        already_good = any(
            r.get('shotId') == shot_id and int(r.get('version', 1)) == version and r.get('status') == 'GENERATED'
            for r in state.get('results', [])
        )
        if skip_existing and final_path.exists() and already_good and reuse_allowed:
            print('SKIP_EXISTING_APPROVED_OR_UNREJECTED', shot_id, 'v', version, flush=True)
            continue

        full_prompt = f'{master} {prompt_body}'.strip()
        duration = float(shot['durationSeconds'])
        started = time.time()
        print(json.dumps({'status': 'QUEUEING', 'shotId': shot_id, 'version': version, 'image': None, 'duration': duration, 'overrideUsed': bool(ov)}, ensure_ascii=False), flush=True)
        try:
            result = client.predict(None, full_prompt, height, width, negative, duration, guidance, steps, seed, False, api_name='/generate_video')
            video_payload = result[0] if isinstance(result, (tuple, list)) else result
            returned_seed = result[1] if isinstance(result, (tuple, list)) and len(result) > 1 else seed
            downloaded = extract_video_path(video_payload)
            if downloaded.resolve() != final_path.resolve():
                shutil.copy2(downloaded, final_path)
            item = {
                'shotId': shot_id, 'status': 'GENERATED', 'version': version, 'overrideUsed': bool(ov),
                'criticalQaGate': ov.get('criticalQaGate') or shot.get('criticalQaGate'),
                'durationRequestedSeconds': duration, 'width': width, 'height': height, 'steps': steps,
                'guidance': guidance, 'requestedSeed': seed, 'returnedSeed': returned_seed,
                'elapsedSeconds': round(time.time() - started, 2), 'output': str(final_path),
                'bytes': final_path.stat().st_size, 'paidInferenceUsed': False, 'actualSpendEur': 0,
                'imageGenerationUsed': False, 'imageToVideoUsed': False, 'reviewStatus': 'PENDING',
            }
        except Exception as exc:
            item = {
                'shotId': shot_id, 'status': 'FAIL', 'version': version, 'overrideUsed': bool(ov),
                'errorType': type(exc).__name__, 'error': str(exc), 'elapsedSeconds': round(time.time() - started, 2),
                'paidInferenceUsed': False, 'actualSpendEur': 0, 'imageGenerationUsed': False,
                'imageToVideoUsed': False, 'reviewStatus': 'NOT_TESTED',
            }
            any_failure = True

        state['results'] = [
            old for old in state.get('results', [])
            if not (old.get('shotId') == shot_id and int(old.get('version', 1)) == version)
        ] + [item]
        state_path.write_text(json.dumps(state, indent=2, ensure_ascii=False), encoding='utf-8')
        print(json.dumps(item, indent=2, ensure_ascii=False), flush=True)
        if item['status'] != 'GENERATED':
            break

    print(json.dumps({'status': 'PARTIAL' if any_failure else 'PASS', 'state': str(state_path), 'paidInferenceUsed': False, 'actualSpendEur': 0, 'imageGenerationUsed': False, 'imageToVideoUsed': False, 'productionTouched': False}, indent=2), flush=True)
    return 2 if any_failure else 0


if __name__ == '__main__':
    raise SystemExit(main())
