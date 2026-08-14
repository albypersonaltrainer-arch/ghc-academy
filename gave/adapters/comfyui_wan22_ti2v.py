from __future__ import annotations

import copy
import json
import time
import uuid
from pathlib import Path
from typing import Any
from urllib import parse, request


class GaveSafetyError(RuntimeError):
    pass


class ComfyUIWan22TI2VAdapter:
    """Zero-cost local ComfyUI adapter for Wan 2.2 TI2V-5B in T2V-only mode."""

    def __init__(
        self,
        base_url: str,
        workflow_api_path: str | Path,
        *,
        poll_interval_seconds: int = 3,
        timeout_seconds: int = 43200,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.workflow_api_path = Path(workflow_api_path)
        self.poll_interval_seconds = poll_interval_seconds
        self.timeout_seconds = timeout_seconds
        self.client_id = str(uuid.uuid4())

    def _get_json(self, path: str) -> Any:
        with request.urlopen(f"{self.base_url}{path}") as response:
            return json.loads(response.read().decode("utf-8"))

    def _post_json(self, path: str, payload: dict[str, Any]) -> Any:
        data = json.dumps(payload).encode("utf-8")
        req = request.Request(
            f"{self.base_url}{path}",
            data=data,
            headers={"Content-Type": "application/json"},
        )
        with request.urlopen(req) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw) if raw else {}

    def load_workflow(self) -> dict[str, Any]:
        if not self.workflow_api_path.exists():
            raise FileNotFoundError(
                f"ComfyUI API workflow not found: {self.workflow_api_path}. "
                "Load the native Wan2.2 5B template and export it with Export (API)."
            )
        with self.workflow_api_path.open("r", encoding="utf-8") as handle:
            workflow = json.load(handle)
        self._assert_t2v_only(workflow)
        return workflow

    @staticmethod
    def _node_title(node: dict[str, Any]) -> str:
        meta = node.get("_meta") or {}
        return str(meta.get("title") or node.get("title") or "").lower()

    def _find_node(
        self,
        workflow: dict[str, Any],
        *,
        class_type: str,
        title_contains: str | None = None,
    ) -> tuple[str, dict[str, Any]]:
        matches: list[tuple[str, dict[str, Any]]] = []
        for node_id, node in workflow.items():
            if not isinstance(node, dict):
                continue
            if node.get("class_type") != class_type:
                continue
            if title_contains and title_contains.lower() not in self._node_title(node):
                continue
            matches.append((str(node_id), node))
        if len(matches) != 1:
            label = f"{class_type} ({title_contains})" if title_contains else class_type
            raise RuntimeError(f"Expected exactly one {label} node, found {len(matches)}")
        return matches[0]

    @staticmethod
    def _find_nodes_by_type(workflow: dict[str, Any], class_type: str) -> list[tuple[str, dict[str, Any]]]:
        return [
            (str(node_id), node)
            for node_id, node in workflow.items()
            if isinstance(node, dict) and node.get("class_type") == class_type
        ]

    def _assert_t2v_only(self, workflow: dict[str, Any]) -> None:
        # Hard rule for this test: no independent image generation or I2V input.
        forbidden_exact = {
            "LoadImage",
            "LoadImageOutput",
            "LoadImageMask",
        }
        for node_id, node in workflow.items():
            if not isinstance(node, dict):
                continue
            class_type = str(node.get("class_type") or "")
            if class_type in forbidden_exact:
                raise GaveSafetyError(
                    f"Image input node {class_type} detected at node {node_id}. "
                    "GAVE Test 01 is Text-to-Video only."
                )

        # Wan22ImageToVideoLatent is also the native hybrid latent node used by the
        # official 5B T2V workflow. It is allowed only when no start_image input is wired.
        for node_id, node in self._find_nodes_by_type(workflow, "Wan22ImageToVideoLatent"):
            start_image = (node.get("inputs") or {}).get("start_image")
            if start_image not in (None, "", []):
                raise GaveSafetyError(
                    f"start_image is wired on node {node_id}. Image-to-Video is not authorized."
                )

    def preflight(self, expected_models: dict[str, str]) -> dict[str, Any]:
        stats = self._get_json("/system_stats")
        checks: dict[str, Any] = {"system_stats": stats, "models": {}}

        folders = {
            "diffusionModel": "diffusion_models",
            "textEncoder": "text_encoders",
            "vae": "vae",
        }
        for key, folder in folders.items():
            expected = expected_models[key]
            available = self._get_json(f"/models/{folder}")
            present = expected in available
            checks["models"][key] = {
                "expected": expected,
                "present": present,
            }
            if not present:
                raise RuntimeError(f"Required model missing from ComfyUI/{folder}: {expected}")
        return checks

    def prepare_workflow(self, shot: dict[str, Any]) -> dict[str, Any]:
        workflow = copy.deepcopy(self.load_workflow())

        _, positive = self._find_node(
            workflow, class_type="CLIPTextEncode", title_contains="positive"
        )
        _, negative = self._find_node(
            workflow, class_type="CLIPTextEncode", title_contains="negative"
        )
        _, sampler = self._find_node(workflow, class_type="KSampler")
        _, latent = self._find_node(workflow, class_type="Wan22ImageToVideoLatent")
        save_nodes = self._find_nodes_by_type(workflow, "SaveVideo")
        if len(save_nodes) != 1:
            raise RuntimeError(f"Expected exactly one SaveVideo node, found {len(save_nodes)}")
        _, save_video = save_nodes[0]

        positive.setdefault("inputs", {})["text"] = shot["prompt"]
        negative.setdefault("inputs", {})["text"] = shot["negative_prompt"]

        sampler_inputs = sampler.setdefault("inputs", {})
        sampler_inputs["seed"] = int(shot["seed"])
        sampler_inputs["steps"] = int(shot["steps"])
        sampler_inputs["cfg"] = float(shot["cfg"])
        sampler_inputs["sampler_name"] = shot["sampler"]
        sampler_inputs["scheduler"] = shot["scheduler"]

        latent_inputs = latent.setdefault("inputs", {})
        latent_inputs["width"] = int(shot["width"])
        latent_inputs["height"] = int(shot["height"])
        latent_inputs["length"] = int(shot["frames"])
        if "batch_size" in latent_inputs:
            latent_inputs["batch_size"] = 1
        latent_inputs.pop("start_image", None)

        save_inputs = save_video.setdefault("inputs", {})
        if "filename_prefix" in save_inputs:
            save_inputs["filename_prefix"] = f"GAVE/{shot['id']}"

        self._assert_t2v_only(workflow)
        return workflow

    def queue(self, workflow: dict[str, Any]) -> str:
        result = self._post_json(
            "/prompt",
            {"prompt": workflow, "client_id": self.client_id},
        )
        prompt_id = result.get("prompt_id")
        if not prompt_id:
            raise RuntimeError(f"ComfyUI did not return prompt_id: {result}")
        return str(prompt_id)

    def wait_for_result(self, prompt_id: str) -> dict[str, Any]:
        deadline = time.time() + self.timeout_seconds
        while time.time() < deadline:
            history = self._get_json(f"/history/{prompt_id}")
            if prompt_id in history:
                return history[prompt_id]
            time.sleep(self.poll_interval_seconds)
        raise TimeoutError(f"Timed out waiting for ComfyUI prompt {prompt_id}")

    @staticmethod
    def collect_output_files(history_item: dict[str, Any]) -> list[dict[str, str]]:
        found: list[dict[str, str]] = []

        def walk(value: Any) -> None:
            if isinstance(value, dict):
                if "filename" in value:
                    found.append(
                        {
                            "filename": str(value["filename"]),
                            "subfolder": str(value.get("subfolder") or ""),
                            "type": str(value.get("type") or "output"),
                        }
                    )
                for child in value.values():
                    walk(child)
            elif isinstance(value, list):
                for child in value:
                    walk(child)

        walk(history_item.get("outputs") or {})

        unique: list[dict[str, str]] = []
        seen: set[tuple[str, str, str]] = set()
        for item in found:
            key = (item["filename"], item["subfolder"], item["type"])
            if key not in seen:
                seen.add(key)
                unique.append(item)
        return unique

    def download_output(self, file_ref: dict[str, str], destination: str | Path) -> Path:
        query = parse.urlencode(file_ref)
        destination = Path(destination)
        destination.parent.mkdir(parents=True, exist_ok=True)
        with request.urlopen(f"{self.base_url}/view?{query}") as response:
            destination.write_bytes(response.read())
        return destination

    def generate_shot(self, shot: dict[str, Any]) -> dict[str, Any]:
        workflow = self.prepare_workflow(shot)
        prompt_id = self.queue(workflow)
        history = self.wait_for_result(prompt_id)
        outputs = self.collect_output_files(history)
        return {
            "shotId": shot["id"],
            "promptId": prompt_id,
            "status": "GENERATED" if outputs else "FAIL",
            "outputs": outputs,
            "historyStatus": history.get("status"),
        }
