from __future__ import annotations

import re
from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException, Request

from ..lifecycle import LifecycleService


def create_router() -> APIRouter:
    router = APIRouter()

    def get_service(request: Request) -> LifecycleService:
        return request.app.state.lifecycle

    @router.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok", "service": "ontology-lifecycle-api"}

    @router.get("/api/overview")
    def overview(service: LifecycleService = Depends(get_service)) -> dict[str, Any]:
        use_cases = service.list_use_cases()
        assessments = service.list_assessments()
        runs = service.list_runs()
        return {
            "useCases": use_cases,
            "assessments": assessments,
            "runs": runs,
            "metrics": {
                "useCases": len(use_cases),
                "submitted": sum(item.get("status") == "submitted" for item in use_cases),
                "assessments": len(assessments),
                "runs": sum(item.get("status") != "skipped" for item in runs),
                "attention": sum(
                    re.search(r"review|required|attention", item.get("outcome", ""), re.I) is not None
                    for item in runs
                ),
            },
        }

    @router.get("/api/use-cases")
    def list_use_cases(service: LifecycleService = Depends(get_service)) -> list[dict[str, Any]]:
        return service.list_use_cases()

    @router.post("/api/use-cases", status_code=201)
    def create_use_case(
        value: dict[str, Any] = Body(...),
        service: LifecycleService = Depends(get_service),
    ) -> dict[str, Any]:
        return service.create_use_case(value, value.get("status") == "submitted")

    @router.get("/api/use-cases/{use_case_id}")
    def get_use_case(use_case_id: str, service: LifecycleService = Depends(get_service)) -> dict[str, Any]:
        value = service.get_use_case(use_case_id)
        if not value:
            raise HTTPException(status_code=404, detail="Use case not found")
        return value

    @router.delete("/api/use-cases/{use_case_id}")
    def delete_use_case(use_case_id: str, service: LifecycleService = Depends(get_service)) -> dict[str, Any]:
        value = service.delete_use_case(use_case_id)
        return {"deleted": True, "useCaseId": value["id"], "name": value["name"]}

    @router.patch("/api/use-cases/{use_case_id}")
    def update_use_case(
        use_case_id: str,
        value: dict[str, Any] = Body(...),
        service: LifecycleService = Depends(get_service),
    ) -> dict[str, Any]:
        return service.update_use_case(use_case_id, value)

    @router.post("/api/use-cases/{use_case_id}/submit")
    def submit_use_case(use_case_id: str, service: LifecycleService = Depends(get_service)) -> dict[str, Any]:
        return service.submit_use_case(use_case_id)

    @router.get("/api/assessments")
    def list_assessments(service: LifecycleService = Depends(get_service)) -> list[dict[str, Any]]:
        return service.list_assessments()

    @router.post("/api/assessments", status_code=201)
    def register_assessment(
        value: dict[str, Any] = Body(...),
        service: LifecycleService = Depends(get_service),
    ) -> dict[str, Any]:
        return service.register_assessment(value)

    @router.get("/api/runs")
    def list_runs(service: LifecycleService = Depends(get_service)) -> list[dict[str, Any]]:
        return service.list_runs()

    @router.post("/api/assessments/{assessment_id}/run", status_code=201)
    def run_assessment(
        assessment_id: str,
        value: dict[str, Any] = Body(...),
        service: LifecycleService = Depends(get_service),
    ) -> dict[str, Any]:
        use_case_id = value.get("useCaseId")
        if not isinstance(use_case_id, str) or not use_case_id:
            raise HTTPException(status_code=400, detail="Use case ID is required")
        return service.run_assessment(assessment_id, use_case_id)

    @router.get("/api/use-cases/{use_case_id}/runs")
    def list_runs_for_use_case(
        use_case_id: str,
        service: LifecycleService = Depends(get_service),
    ) -> list[dict[str, Any]]:
        return service.list_runs_for_use_case(use_case_id)

    return router
