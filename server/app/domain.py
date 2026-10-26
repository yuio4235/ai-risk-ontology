from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal
from uuid import uuid4

EvaluatorKind = Literal[
    "description-quality",
    "model-classification",
    "regulatory-risk",
    "financial-crime",
]
TRIGGERS = {"submission", "data-change", "assessment-registration", "manual"}
FIELDS = {
    "status",
    "technology",
    "description",
    "customerImpact",
    "controlImpact",
    "dataTypes",
}
EVALUATORS = {
    "description-quality",
    "model-classification",
    "regulatory-risk",
    "financial-crime",
}


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _definition(
    identifier: str,
    name: str,
    short_name: str,
    description: str,
    category: str,
    evaluator: EvaluatorKind,
    field: str,
    operator: str,
    value: str | None = None,
    version: str = "1.0",
) -> dict[str, Any]:
    return {
        "id": identifier,
        "name": name,
        "shortName": short_name,
        "description": description,
        "category": category,
        "evaluator": evaluator,
        "applicability": {
            "field": field,
            "operator": operator,
            **({"value": value} if value else {}),
        },
        "version": version,
        "enabled": True,
        "createdAt": datetime(2026, 1, 1, tzinfo=timezone.utc),
    }


BUILT_IN_ASSESSMENTS: list[dict[str, Any]] = [
    _definition(
        "uc-description",
        "UC Description Assessment",
        "Description",
        "Check completeness across the core use-case dimensions and suggest practical improvements.",
        "Intake",
        "description-quality",
        "status",
        "equals",
        "submitted",
    ),
    _definition(
        "am-i-a-model",
        "Am I a Model Assessment",
        "Model or NMND",
        "Classify the solution as a model or non-model, non-deterministic (NMND) automation.",
        "Technology",
        "model-classification",
        "status",
        "equals",
        "submitted",
    ),
    _definition(
        "regulatory-compliance",
        "Regulatory Compliance Assessment",
        "Regulatory compliance",
        "Identify regulatory exposure and whether a specialist review should be considered.",
        "Regulatory",
        "regulatory-risk",
        "description",
        "signal",
        version="1.1",
    ),
    _definition(
        "financial-crime",
        "Financial Crime Assessment",
        "Financial crime",
        "Assess potential impact to financial-crime controls and whether control-owner review is needed.",
        "Financial crime",
        "financial-crime",
        "description",
        "signal",
        version="1.1",
    ),
]


def validate_definition(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ValueError("Assessment definition must be an object")
    if not isinstance(value.get("name"), str) or len(value["name"].strip()) < 3:
        raise ValueError("Assessment name must contain at least 3 characters")
    evaluator = value.get("evaluator")
    if evaluator not in EVALUATORS:
        raise ValueError("Unsupported evaluator kind")
    condition = value.get("applicability")
    if not isinstance(condition, dict):
        raise ValueError("Applicability condition is invalid")
    operator = condition.get("operator")
    if condition.get("field") not in FIELDS or operator not in {
        "contains",
        "equals",
        "always",
        "signal",
    }:
        raise ValueError("Applicability condition is invalid")
    if operator not in {"always", "signal"} and not str(
        condition.get("value", "")
    ).strip():
        raise ValueError("Applicability value is required")
    if operator == "signal" and evaluator not in {
        "regulatory-risk",
        "financial-crime",
    }:
        raise ValueError("Signal applicability requires a risk assessment evaluator")
    return {
        "name": value["name"].strip(),
        "shortName": value.get("shortName")
        if isinstance(value.get("shortName"), str)
        else value["name"].strip(),
        "description": value.get("description", "")
        if isinstance(value.get("description", ""), str)
        else "",
        "category": value.get("category", "Governance")
        if isinstance(value.get("category", "Governance"), str)
        else "Governance",
        "evaluator": evaluator,
        "applicability": (
            {"field": "description", "operator": "signal"}
            if evaluator in {"regulatory-risk", "financial-crime"}
            else {
                "field": condition["field"],
                "operator": operator,
                **({"value": condition["value"].strip()} if isinstance(condition.get("value"), str) else {}),
            }
        ),
        "version": value.get("version", "1.0"),
        "enabled": value.get("enabled") is not False,
    }


def is_applicable(assessment: dict[str, Any], record: dict[str, Any]) -> bool:
    if assessment.get("enabled") is False:
        return False
    condition = assessment["applicability"]
    operator = condition["operator"]
    if operator == "signal":
        if record.get("status") != "submitted":
            return False
        text = " ".join(
            str(record.get(key, ""))
            for key in (
                "description",
                "customerImpact",
                "controlImpact",
                "decisions",
                "dataTypes",
            )
        ).lower()
        expression = (
            r"customer|credit|decision|personal|financial|regulated|advice"
            if assessment["evaluator"] == "regulatory-risk"
            else r"financial crime|aml|money laundering|sanction|fraud|transaction monitoring|control"
        )
        import re

        return re.search(expression, text) is not None
    if operator == "always":
        return True
    actual = record.get(condition["field"], "")
    if isinstance(actual, list):
        actual = " ".join(str(part) for part in actual)
    actual = str(actual or "").lower()
    target = str(condition.get("value", "")).lower()
    return actual == target if operator == "equals" else target in actual


def evaluate_assessment(
    assessment: dict[str, Any], record: dict[str, Any]
) -> dict[str, Any]:
    evaluator = assessment["evaluator"]
    if evaluator == "description-quality":
        required = ["problem", "users", "data", "technology", "decisions", "controls"]
        dimensions = record.get("dimensions") or {}
        present = [key for key in required if len(str(dimensions.get(key, "")).strip()) >= 8]
        missing = [key for key in required if key not in present]
        score = round(len(present) / len(required) * 100)

        def value(key: str, label: str) -> str:
            return str(dimensions.get(key, "")).strip() or f"[add {label}]"

        enhanced = (
            f"This use case addresses {value('problem', 'the business problem')} for "
            f"{value('users', 'the intended users and impacted parties')}. It uses "
            f"{value('data', 'the data and its sensitivity')} with "
            f"{value('technology', 'the technology and model approach')} to "
            f"{value('decisions', 'the decisions or actions it supports')}. Its control "
            f"environment includes {value('controls', 'the safeguards, monitoring and escalation')}."
        )
        return _result(
            "Strong description"
            if score >= 80
            else "Enhancement suggested"
            if score >= 50
            else "Description needs attention",
            score,
            f"{len(present)} of {len(required)} core dimensions are sufficiently described.",
            [*(f"Covered dimension: {key}" for key in present), *(f"Needs detail: {key}" for key in missing)],
            f"Add specific details for {', '.join(missing)}."
            if missing
            else "Description covers the core dimensions; confirm the statements with the use-case owner.",
            enhanced,
        )
    if evaluator == "model-classification":
        import re

        text = f"{record.get('technology', '')} {record.get('description', '')} {record.get('decisions', '')}".lower()
        model = re.search(r"model|llm|machine learning|neural|generative|predict|classif|embedding", text) is not None
        return _result(
            "Model" if model else "NMND — Non-model, non-deterministic",
            88 if model else 82,
            "The declared technology or behavior indicates a statistical or generative model."
            if model
            else "The described behavior is deterministic rules-based automation without a model signal.",
            [f"Technology: {record.get('technology', '')}", f"Decision behavior: {record.get('decisions', '')}"],
            "Confirm model inventory, validation, and monitoring requirements."
            if model
            else "Confirm deterministic rules, change controls, and that no model dependency is embedded.",
        )
    if evaluator == "regulatory-risk":
        import re

        text = f"{record.get('description', '')} {record.get('customerImpact', '')} {' '.join(record.get('dataTypes') or [])}".lower()
        high = re.search(r"customer|credit|decision|personal|financial|regulated|advice", text) is not None
        return _result(
            "Potential regulatory risk — review recommended"
            if high
            else "No material regulatory signal detected",
            74 if high else 24,
            "Customer impact, regulated activity, or sensitive data warrants a closer regulatory review."
            if high
            else "The submitted facts contain limited direct indicators of regulatory exposure.",
            [*(f"Data type: {item}" for item in record.get("dataTypes") or []), f"Customer impact: {record.get('customerImpact', '')}"],
            "Route to the Regulatory Compliance team to confirm applicable obligations."
            if high
            else "Document the regulatory basis and revisit if scope or data changes.",
        )
    import re

    text = f"{record.get('controlImpact', '')} {record.get('description', '')} {record.get('decisions', '')}".lower()
    impacts = re.search(r"financial crime|aml|money laundering|sanction|fraud|transaction monitoring|control", text) is not None
    return _result(
        "Financial-crime control impact — review required"
        if impacts
        else "No direct control impact identified",
        85 if impacts else 18,
        "The use case may affect the design or effectiveness of a financial-crime control."
        if impacts
        else "The submitted facts do not directly indicate a change to financial-crime controls.",
        [f"Control impact: {record.get('controlImpact', '')}", f"Use-case behavior: {record.get('decisions', '')}"],
        "Engage the Financial Crime control owner before deployment."
        if impacts
        else "Retain the control-impact rationale and reassess on material scope changes.",
    )


def _result(
    outcome: str,
    score: int,
    rationale: str,
    evidence: list[str],
    recommendation: str,
    suggested_description: str | None = None,
) -> dict[str, Any]:
    return {
        "outcome": outcome,
        "score": score,
        "rationale": rationale,
        "evidence": evidence,
        "recommendation": recommendation,
        **({"suggestedDescription": suggested_description} if suggested_description else {}),
    }


def new_id() -> str:
    return str(uuid4())
