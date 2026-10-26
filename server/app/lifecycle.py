from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
import logging
from typing import Any

from .domain import (
    BUILT_IN_ASSESSMENTS,
    is_applicable,
    new_id,
    utc_now,
    validate_definition,
)
from .repository import MongoLifecycleRepository
from .runtime.assessment_runtime import AssessmentRuntime

logger = logging.getLogger("ontology.lifecycle")

CREATE_FIELDS = {
    "name",
    "owner",
    "businessUnit",
    "status",
    "description",
    "technology",
    "dataTypes",
    "decisions",
    "customerImpact",
    "controlImpact",
    "dimensions",
}
UPDATE_FIELDS = CREATE_FIELDS - {"status"}
DIMENSION_KEYS = {"problem", "users", "data", "technology", "decisions", "controls"}


def _text(value: Any, name: str, required: bool = True) -> str:
    if not isinstance(value, str) or (required and not value.strip()):
        raise ValueError(f"{name} must be a non-empty string")
    return value.strip() if isinstance(value, str) else ""


def _assert_allowed_keys(value: dict[str, Any], allowed: set[str]) -> None:
    unsupported = next((key for key in value if key not in allowed), None)
    if unsupported:
        raise ValueError(f"Unsupported use-case field: {unsupported}")


def _dimensions(value: Any) -> dict[str, str]:
    if value is None:
        return {}
    if not isinstance(value, dict):
        raise ValueError("Dimensions must be an object")
    if any(key not in DIMENSION_KEYS or not isinstance(item, str) for key, item in value.items()):
        raise ValueError("Each use-case dimension must use a supported key and string value")
    return {key: item.strip() for key, item in value.items()}


def _data_types(value: Any) -> list[str]:
    if value is None:
        return []
    if not isinstance(value, list) or any(not isinstance(item, str) for item in value):
        raise ValueError("Data types must be a list of strings")
    return [item.strip() for item in value if item.strip()]


class LifecycleService:
    def __init__(
        self,
        repository: MongoLifecycleRepository,
        runtime: AssessmentRuntime,
        worker_count: int = 4,
    ):
        self.repository = repository
        self.runtime = runtime
        self.executor = ThreadPoolExecutor(
            max_workers=worker_count,
            thread_name_prefix="assessment-run",
        )

    def initialize(self) -> None:
        interrupted = self.repository.fail_active_runs()
        if interrupted:
            logger.warning("Marked %d previously active run(s) as interrupted", interrupted)
        existing_assessments = self.repository.list_assessments()
        existing_use_cases = self.repository.list_use_cases()
        for definition in BUILT_IN_ASSESSMENTS:
            existing = next((item for item in existing_assessments if item["id"] == definition["id"]), None)
            if existing and existing.get("version") == definition["version"]:
                continue
            for use_case in existing_use_cases:
                prior_runs = self.repository.list_runs_for_use_case(use_case["id"])
                migration_done = any(
                    run.get("assessmentId") == definition["id"]
                    and run.get("assessmentVersion") == definition["version"]
                    and run.get("trigger") == "assessment-registration"
                    for run in prior_runs
                )
                if not migration_done:
                    self.schedule_run(definition, use_case, "assessment-registration")
            self.repository.save_assessment(definition)

    def create_use_case(self, value: dict[str, Any], submit: bool = False) -> dict[str, Any]:
        _assert_allowed_keys(value, CREATE_FIELDS)
        now = utc_now()
        use_case = {
            "id": new_id(),
            "name": _text(value.get("name"), "Name"),
            "owner": _text(value.get("owner"), "Owner"),
            "businessUnit": _text(value.get("businessUnit"), "Business unit"),
            "status": "submitted" if submit else "draft",
            "description": _text(value.get("description", ""), "Description", False),
            "technology": _text(value.get("technology", ""), "Technology", False),
            "dataTypes": _data_types(value.get("dataTypes")),
            "decisions": _text(value.get("decisions", ""), "Decision behavior", False),
            "customerImpact": _text(value.get("customerImpact", ""), "Customer impact", False),
            "controlImpact": _text(value.get("controlImpact", ""), "Control impact", False),
            "dimensions": _dimensions(value.get("dimensions")),
            "createdAt": now,
            "updatedAt": now,
        }
        self.repository.save_use_case(use_case)
        if submit:
            self.schedule_applicable(use_case, "submission")
        return use_case

    def get_use_case(self, identifier: str) -> dict[str, Any] | None:
        return self.repository.get_use_case(identifier)

    def list_use_cases(self) -> list[dict[str, Any]]:
        return self.repository.list_use_cases()

    def delete_use_case(self, identifier: str) -> dict[str, Any]:
        existing = self.repository.get_use_case(identifier)
        if not existing:
            raise LookupError("Use case not found")
        self.repository.delete_use_case(identifier)
        return existing

    def update_use_case(self, identifier: str, value: dict[str, Any]) -> dict[str, Any]:
        existing = self.repository.get_use_case(identifier)
        if not existing:
            raise LookupError("Use case not found")
        _assert_allowed_keys(value, UPDATE_FIELDS)
        next_value = {**existing, **value}
        for key, label in (
            ("name", "Name"),
            ("owner", "Owner"),
            ("businessUnit", "Business unit"),
            ("description", "Description"),
            ("technology", "Technology"),
            ("decisions", "Decision behavior"),
            ("customerImpact", "Customer impact"),
            ("controlImpact", "Control impact"),
        ):
            next_value[key] = _text(value.get(key, existing.get(key, "")), label, key in {"name", "owner", "businessUnit"})
        next_value["dimensions"] = _dimensions(value["dimensions"]) if "dimensions" in value else existing.get("dimensions", {})
        next_value["dataTypes"] = _data_types(value["dataTypes"]) if "dataTypes" in value else existing.get("dataTypes", [])
        next_value["updatedAt"] = utc_now()
        self.repository.save_use_case(next_value)
        self.schedule_applicable(next_value, "data-change")
        return next_value

    def submit_use_case(self, identifier: str) -> dict[str, Any]:
        current = self.repository.get_use_case(identifier)
        if not current:
            raise LookupError("Use case not found")
        submitted = {**current, "status": "submitted", "updatedAt": utc_now()}
        self.repository.save_use_case(submitted)
        self.schedule_applicable(submitted, "submission")
        return submitted

    def register_assessment(self, value: Any) -> dict[str, Any]:
        definition = {
            **validate_definition(value),
            "id": new_id(),
            "createdAt": utc_now(),
        }
        self.repository.save_assessment(definition)
        for use_case in self.repository.list_use_cases():
            self.schedule_run(definition, use_case, "assessment-registration")
        return definition

    def schedule_applicable(self, use_case: dict[str, Any], trigger: str) -> list[dict[str, Any]]:
        return [
            self.schedule_run(assessment, use_case, trigger)
            for assessment in self.repository.list_assessments()
        ]

    def schedule_run(
        self,
        assessment: dict[str, Any],
        use_case: dict[str, Any],
        trigger: str,
    ) -> dict[str, Any]:
        run_id = new_id()
        graph_execution_id = new_id()
        now = utc_now()
        run = {
            "id": run_id,
            "assessmentId": assessment["id"],
            "assessmentName": assessment["name"],
            "assessmentVersion": assessment.get("version", "1.0"),
            "useCaseId": use_case["id"],
            "useCaseName": use_case["name"],
            "trigger": trigger,
            "status": "running",
            "outcome": "Running",
            "score": 0,
            "rationale": "",
            "evidence": [],
            "recommendation": "",
            "graphExecutionId": graph_execution_id,
            "trace": [],
            "execution": {
                "threadId": f"assessment-{graph_execution_id}",
                "startedAt": now,
                "completedAt": None,
                "durationMs": 0,
                "events": [],
                "logs": [],
                "checkpoints": [],
                "checkpointStore": "LangGraph MongoDBSaver",
            },
            "createdAt": now,
            "updatedAt": now,
        }
        self.repository.save_run(run)
        self.runtime._log(run_id, "info", "run.queued", None, "Assessment run queued", {"trigger": trigger})
        self.executor.submit(self.runtime.execute, run_id, assessment, use_case, trigger)
        return self.repository.get_run(run_id) or run

    def run_assessment(self, assessment_id: str, use_case_id: str) -> dict[str, Any]:
        assessment = self.repository.get_assessment(assessment_id)
        use_case = self.repository.get_use_case(use_case_id)
        if not assessment:
            raise LookupError("Assessment not found")
        if not use_case:
            raise LookupError("Use case not found")
        return self.schedule_run(assessment, use_case, "manual")

    def list_assessments(self) -> list[dict[str, Any]]:
        return self.repository.list_assessments()

    def list_runs(self) -> list[dict[str, Any]]:
        return self.repository.list_runs()

    def list_runs_for_use_case(self, identifier: str) -> list[dict[str, Any]]:
        return self.repository.list_runs_for_use_case(identifier)

    def close(self) -> None:
        self.executor.shutdown(wait=True, cancel_futures=False)
