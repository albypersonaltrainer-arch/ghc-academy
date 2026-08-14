from __future__ import annotations

import json
import os
import shutil
from pathlib import Path
from typing import Any

from gradio_client import Client


class ZeroCostGuardError(RuntimeError):
    pass


class HFGradioWan22TI2VAdapter:
    """Online Text-to-Video adapter for public Hugging Face Gradio Spaces.

    This adapter is intentionally conservative:
    - no image input is ever sent;
    - it never opts into paid inference providers;
    - generated remote files are downloaded immediately into GAVE storage;
    - the Space ID is configurable so the backend can be replaced without
      changing the documentary pipeline.
    """

    def __init__(
        self,
        space_ids: list[str],
        download_dir: str | Path,
        *,
        hf_token_env: str | None = None,
        allow_paid_fallback: bool = False,
    ) -> None:
        if allow_paid_fallback:
            raise ZeroCostGuardError("Paid fallback is forbidden for GAVE")
        self.space_ids = list(space_ids)
        self.download_dir = Path(download_dir)
        self.download_dir.mkdir(parents=True, exist_ok=True)
        self.hf_token_env = hf_token_env
        self._client: Client | None = None
        self._space_id: str | None = None
        self._api_name: str | None = None

    def _token(self) -> str | None:
        if not self.hf_token_env:
            return None
        return os.environ.get(self.hf_token_env)

    @staticmethod
    def _discover_generate_endpoint(api: dict[str, Any]) -> str:
        named = api.get("named_endpoints") or {}
        candidates = []
        for name, spec in named.items():
            lowered = name.lower()
            if "generate_video" in lowered or "video" in lowered:
                candidates.append(name)
        if len(candidates) == 1:
            return candidates[0]
        if "/generate_video" in named:
            return "/generate_video"
        if len(named) == 1:
            return next(iter(named))
        raise RuntimeError(
            "Could not uniquely identify the Gradio video-generation endpoint. "
            f"Available endpoints: {list(named)}"
        )

    def connect(self) -> dict[str, Any]:
        errors: dict[str, str] = {}
        token = self._token()

        for space_id in self.space_ids:
            try:
                client = Client(
                    space_id,
                    hf_token=token,
                    download_files=str(self.download_dir),
                    verbose=False,
                )
                api = client.view_api(return_format="dict")
                endpoint = self._discover_generate_endpoint(api)
                self._client = client
                self._space_id = space_id
                self._api_name = endpoint
                return {
                    "status": "PASS",
                    "spaceId": space_id,
                    "apiName": endpoint,
                    "paidInferenceUsed": False,
                    "actualSpendEur": 0,
                    "imageGenerationUsed": False,
                }
            except Exception as exc:
                errors[space_id] = f"{type(exc).__name__}: {exc}"

        raise RuntimeError(
            "No configured free Wan Gradio Space was reachable. "
            + json.dumps(errors, ensure_ascii=False)
        )

    def _ensure_connected(self) -> None:
        if self._client is None:
            self.connect()

    def generate_shot(self, shot: dict[str, Any]) -> dict[str, Any]:
        self._ensure_connected()
        assert self._client is not None
        assert self._space_id is not None
        assert self._api_name is not None

        # Hard rule: first positional input is None, meaning pure Text-to-Video.
        # The adapter never accepts an image path or image bytes.
        result = self._client.predict(
            None,
            shot["prompt"],
            int(shot["height"]),
            int(shot["width"]),
            float(shot["durationSeconds"]),
            int(shot["steps"]),
            float(shot["cfg"]),
            float(shot.get("shift", 5.0)),
            int(shot["seed"]),
            api_name=self._api_name,
        )

        if isinstance(result, (tuple, list)):
            if len(result) != 1:
                raise RuntimeError(f"Unexpected multi-output response: {result}")
            result = result[0]

        local_path = Path(str(result))
        if not local_path.exists():
            raise RuntimeError(f"Gradio returned no downloadable local video: {result}")

        suffix = local_path.suffix or ".mp4"
        final_path = self.download_dir / f"{shot['id'].lower()}{suffix}"
        if local_path.resolve() != final_path.resolve():
            shutil.copy2(local_path, final_path)

        return {
            "shotId": shot["id"],
            "status": "GENERATED",
            "backend": "HF_GRADIO_WAN22_TI2V",
            "spaceId": self._space_id,
            "apiName": self._api_name,
            "output": str(final_path),
            "paidInferenceUsed": False,
            "actualSpendEur": 0,
            "imageGenerationUsed": False,
            "imageToVideoUsed": False,
        }
