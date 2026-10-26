from __future__ import annotations

from datetime import datetime
from typing import Any

from pymongo import MongoClient, ReturnDocument


def clean(document: dict[str, Any] | None) -> dict[str, Any] | None:
    if document is None:
        return None
    document.pop("_id", None)
    return document


class MongoLifecycleRepository:
    def __init__(self, client: MongoClient, database_name: str):
        database = client[database_name]
        self.use_cases = database["useCases"]
        self.assessments = database["assessments"]
        self.runs = database["runs"]
        self.use_cases.create_index("id", unique=True)
        self.assessments.create_index("id", unique=True)
        self.runs.create_index([("useCaseId", 1), ("createdAt", -1)])
        self.runs.create_index([("status", 1), ("createdAt", -1)])

    def list_use_cases(self) -> list[dict[str, Any]]:
        return [clean(item) for item in self.use_cases.find().sort("updatedAt", -1)]

    def get_use_case(self, identifier: str) -> dict[str, Any] | None:
        return clean(self.use_cases.find_one({"id": identifier}))

    def save_use_case(self, value: dict[str, Any]) -> dict[str, Any]:
        self.use_cases.replace_one({"id": value["id"]}, value, upsert=True)
        return value

    def delete_use_case(self, identifier: str) -> None:
        self.use_cases.delete_one({"id": identifier})

    def list_assessments(self) -> list[dict[str, Any]]:
        return [clean(item) for item in self.assessments.find().sort("createdAt", 1)]

    def get_assessment(self, identifier: str) -> dict[str, Any] | None:
        return clean(self.assessments.find_one({"id": identifier}))

    def save_assessment(self, value: dict[str, Any]) -> dict[str, Any]:
        self.assessments.replace_one({"id": value["id"]}, value, upsert=True)
        return value

    def list_runs(self) -> list[dict[str, Any]]:
        return [clean(item) for item in self.runs.find().sort("createdAt", -1)]

    def list_runs_for_use_case(self, identifier: str) -> list[dict[str, Any]]:
        return [
            clean(item)
            for item in self.runs.find({"useCaseId": identifier}).sort("createdAt", -1)
        ]

    def get_run(self, identifier: str) -> dict[str, Any] | None:
        return clean(self.runs.find_one({"id": identifier}))

    def save_run(self, value: dict[str, Any]) -> dict[str, Any]:
        self.runs.replace_one({"id": value["id"]}, value, upsert=True)
        return value

    def append_run_log(self, identifier: str, item: dict[str, Any]) -> None:
        self.runs.update_one(
            {"id": identifier},
            {"$push": {"execution.logs": item}, "$set": {"updatedAt": datetime.now().astimezone()}},
        )

    def append_run_event(self, identifier: str, item: dict[str, Any]) -> None:
        self.runs.update_one(
            {"id": identifier},
            {"$push": {"execution.events": item}, "$set": {"updatedAt": datetime.now().astimezone()}},
        )

    def append_checkpoint(self, identifier: str, item: dict[str, Any]) -> None:
        self.runs.update_one(
            {"id": identifier, "execution.checkpoints.checkpointId": {"$ne": item["checkpointId"]}},
            {"$push": {"execution.checkpoints": item}, "$set": {"updatedAt": datetime.now().astimezone()}},
        )

    def update_run_fields(self, identifier: str, fields: dict[str, Any]) -> None:
        self.runs.update_one({"id": identifier}, {"$set": fields})

    def fail_active_runs(self) -> int:
        active = list(self.runs.find({"status": "running"}, {"id": 1}))
        for item in active:
            self.append_run_log(
                item["id"],
                {
                    "sequence": len((self.get_run(item["id"]) or {}).get("execution", {}).get("logs", [])) + 1,
                    "timestamp": datetime.now().astimezone(),
                    "level": "warning",
                    "event": "execution.interrupted",
                    "message": "The API restarted before this assessment completed.",
                },
            )
            self.update_run_fields(
                item["id"],
                {"status": "failed", "outcome": "Execution interrupted", "updatedAt": datetime.now().astimezone()},
            )
        return len(active)
