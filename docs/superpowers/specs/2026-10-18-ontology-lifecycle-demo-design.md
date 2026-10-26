# AI Use Case Lifecycle Ontology Demo — Design

## Intent

Build an executive-ready, locally runnable demonstration of ontology-powered AI Use Case lifecycle management. The product should make the use case, its evidence, registered assessment definitions, applicability relationships, assessment runs, and resulting decisions visible as one connected operating model. The primary audience is a Chief AI Officer deciding whether this can become an enterprise governance capability: the demo must visibly prove that lifecycle events cause real, persisted workflow runs with traceable policy and evidence.

## Goals

- Provide persistent CRUD for AI Use Case records; deleting an entity preserves immutable assessment history and its name snapshot.
- Automatically run the UC Description Assessment on submission and on relevant record changes.
- Support four initial assessments: UC Description Assessment, Am I a Model Assessment, Regulatory Compliance Assessment, and Financial Crime Assessment.
- Register new assessment definitions and reevaluate existing use cases for applicability; run the assessment for applicable cases.
- Persist immutable run history, triggers, outcomes, and evidence for leadership demos.
- Show a polished, all-English executive cockpit with a relationship map and useful working detail views.
- Provide deterministic, transparent demo evaluators that can be replaced behind a controlled runtime contract.

## Non-goals

- Real model inference, regulatory advice, or production risk decisions.
- Arbitrary user-authored executable code or an untrusted-code sandbox.
- Enterprise authentication, multi-tenancy, or production deployment.

## Constraints

- All code, UI, specs, and product-facing text are English.
- Use the Docker MongoDB already running locally when available; make connection configurable.
- Keep the assessment runtime declarative and allow-listed; never eval assessment definitions.
- Every outcome must expose a human-readable rationale and evidence.
- A submitted or edited use case triggers applicable assessments; registering an assessment reevaluates stored use cases.

## Architecture

Use a TypeScript monorepo-style repository with an Express API, MongoDB persistence, a React/Vite client, and a LangGraph.js StateGraph assessment runtime. The API owns domain validation, the assessment registry, applicability matching, run history, and CRUD. Each run flows through explicit graph nodes for applicability resolution, controlled assessment execution, and persisted evidence. Assessment definitions use validated declarative conditions and an allow-listed evaluator kind. Demo evaluators provide explainable heuristics for description completeness, model-vs-deterministic classification, regulatory risk, and financial-crime control impact. The UI presents an executive dashboard, an ontology graph, use-case workbench, assessment catalog, and run evidence.

## Core lifecycle

1. Create a draft with structured dimensions; submission validates and persists it.
2. The orchestrator resolves registered assessment definitions against use-case facts.
3. Applicable definitions execute and store a run with trigger, status, result, rationale, evidence, and timestamps. Non-applicable relationships remain explainable in the graph/catalog.
4. A use-case change creates new runs for applicable definitions; previous runs remain immutable history.
5. Registering an assessment persists its definition, evaluates applicability against every existing use case, and runs it only for matches.

## Assumptions and design calls

- MongoDB is selected because the local Docker daemon already runs a MongoDB container.
- UC description enhancement is a transparent rules-based demo that composes an editable suggestion from a six-dimension checklist.
- Dynamic assessments are created from supported evaluator kinds and JSON conditions, not arbitrary scripts.
- Triggered runs execute as LangGraph.js StateGraph workflows in-process and sequentially for the demo. Each run receives a LangGraph `thread_id` and `MemorySaver` checkpointer; actual node events, timings, and checkpoint state summaries are persisted on the AssessmentRun for inspection. MongoDB stores a safe state summary, while complete checkpoint values remain in process memory and cannot resume after an API restart. This is workflow orchestration, not arbitrary-code sandboxing. A durable worker and persistent checkpointer can be added for production.
- English is the only product language for this build.

## Ontology Explorer and CAIO Storytelling

### Intent

Make the ontology a first-class, navigable product surface and give a presenter a concise, repeatable CAIO narrative that demonstrates the ontology operating over live lifecycle data.

### Ontology Explorer

- Add a dedicated Ontology page reachable from primary navigation and dashboard links.
- Render a graph of ontology classes and typed object-property relationships, including AI Use Case, Assessment, Assessment Run, Evidence Item, Business Unit, Technology, Data Category, and Control Domain.
- Build graph instance counts and relationship counts from the current overview data. Distinguish persisted entities from values projected from existing records.
- Selecting a class or relationship opens an inspector that shows its definition, data properties, object properties, source field mappings, and live examples.
- Allow users to search ontology elements and switch between class and relationship focus without leaving the graph.
- Describe the graph honestly as an application ontology projection over MongoDB records; do not imply an RDF/OWL triple store exists.

### CAIO Demo Guide

- Add an in-product guided story with five timed narrative beats: portfolio challenge, ontology model, lifecycle activation, policy expansion, and evidence/accountability.
- Each beat includes the on-screen destination, a presenter line, the proof point, and an action that navigates to that destination.
- Add a concise English presenter runbook to the README. Keep narrative guidance available in the application as well as documentation.
- All product UI, code, and specifications remain in English.
- Version changes to built-in applicability definitions must upgrade persisted definitions once, rescan existing use cases, and retain prior run evidence.
