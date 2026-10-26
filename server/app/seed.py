from __future__ import annotations

from typing import Any

from .lifecycle import LifecycleService

EXAMPLES: list[dict[str, Any]] = [
    {
        "name": "Customer service copilot",
        "owner": "Customer Operations",
        "businessUnit": "Retail Banking",
        "description": "A generative assistant summarises customer service requests and proposes response guidance for branch colleagues. Colleagues review every suggestion before it is used.",
        "technology": "Approved enterprise LLM",
        "dataTypes": ["Customer data", "Service records"],
        "decisions": "Suggests a summary and response; a colleague makes the final decision.",
        "customerImpact": "Supports customer service; no autonomous customer decision.",
        "controlImpact": "No direct change to financial-crime controls.",
        "dimensions": {
            "problem": "Reduce time spent reading long service requests.",
            "users": "Branch colleagues review and edit each suggestion.",
            "data": "Customer service records with approved access controls.",
            "technology": "Approved enterprise LLM through a managed gateway.",
            "decisions": "The model suggests a summary; colleagues approve all responses.",
            "controls": "Human review, access control, monitoring and escalation are in place.",
        },
    },
    {
        "name": "Transaction monitoring alert prioritisation",
        "owner": "Financial Crime Analytics",
        "businessUnit": "Financial Crime",
        "description": "A machine-learning model ranks transaction monitoring alerts by estimated investigative priority. Analysts retain control over investigation and disposition.",
        "technology": "Gradient-boosted machine learning model",
        "dataTypes": ["Transaction data", "Customer identifiers"],
        "decisions": "Ranks alerts for human investigation; does not close or file cases.",
        "customerImpact": "Indirect impact through investigative prioritisation.",
        "controlImpact": "May affect the effectiveness and timeliness of financial-crime monitoring controls.",
        "dimensions": {
            "problem": "Help analysts prioritise high volumes of transaction monitoring alerts.",
            "users": "Financial-crime investigators review and disposition each alert.",
            "data": "Transaction data and customer identifiers under existing controls.",
            "technology": "Gradient-boosted machine-learning model with monitored features.",
            "decisions": "Ranks cases for analyst review; it cannot close an alert.",
            "controls": "Analyst review, threshold governance, performance monitoring and escalation.",
        },
    },
    {
        "name": "Digital onboarding eligibility rules",
        "owner": "Digital Channels",
        "businessUnit": "Wealth & Personal Banking",
        "description": "A deterministic rules service checks application fields against approved onboarding requirements and routes incomplete applications to an operations queue.",
        "technology": "Deterministic rules engine",
        "dataTypes": ["Application data", "Identity attributes"],
        "decisions": "Routes incomplete applications for review using fixed rules.",
        "customerImpact": "May affect onboarding time; no automated decline decision.",
        "controlImpact": "No direct impact to financial-crime control effectiveness.",
        "dimensions": {
            "problem": "Reduce avoidable onboarding rework.",
            "users": "Operations colleagues handle exception cases.",
            "data": "Application data and identity attributes.",
            "technology": "Version-controlled deterministic rules service.",
            "decisions": "Routes exceptions only; a person decides the outcome.",
            "controls": "Approved rules, change control, audit logs and operational escalation.",
        },
    },
    {
        "name": "Regulatory correspondence assistant",
        "owner": "Compliance Transformation",
        "businessUnit": "Group Compliance",
        "description": "A language model classifies incoming regulatory correspondence and drafts a response summary for a compliance specialist. No response is sent without human approval.",
        "technology": "Large language model",
        "dataTypes": ["Regulatory correspondence", "Internal policy"],
        "decisions": "Classifies and drafts; compliance specialists approve all responses.",
        "customerImpact": "No direct customer-facing decision.",
        "controlImpact": "Supports compliance operations without changing financial-crime control execution.",
        "dimensions": {
            "problem": "Improve response triage and consistency.",
            "users": "Compliance specialists review every draft.",
            "data": "Regulatory correspondence and approved internal policy.",
            "technology": "Large language model in an access-controlled environment.",
            "decisions": "Drafts for human approval; no autonomous external communication.",
            "controls": "Human approval, access controls, retained source references and monitoring.",
        },
    },
]


def seed_demo_portfolio(service: LifecycleService) -> None:
    if service.list_use_cases():
        return
    for example in EXAMPLES:
        service.create_use_case(example, submit=True)
    service.create_use_case(
        {
            "name": "Mortgage document quality review",
            "owner": "Home Lending",
            "businessUnit": "Wealth & Personal Banking",
            "description": "Early-stage exploration of document completeness checks.",
            "technology": "Under assessment",
            "dataTypes": ["Application data"],
            "decisions": "Not yet determined",
            "customerImpact": "To be assessed",
            "controlImpact": "To be assessed",
            "dimensions": {key: "" for key in ("problem", "users", "data", "technology", "decisions", "controls")},
        }
    )
