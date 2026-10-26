# Python Runtime and Assessment Observability Implementation Plan

> **For agentic workers:** This plan is executed inline in this session. Each task is a bounded implementation phase with a concrete verification command.

**Goal:** Replace the TypeScript backend with a modular Python FastAPI/LangGraph service and make AssessmentRun logs and checkpoints visible during and after execution.

**Architecture:** FastAPI provides the existing API contract, a repository-backed lifecycle service schedules runs, and LangGraph executes allow-listed assessment workflows with MongoDB checkpoint persistence. Run documents are incrementally updated with status, structured logs, node events, and safe checkpoint summaries; the React inspector polls active executions and presents the trace.

**Tech Stack:** Python 3.12, FastAPI, Pydantic, PyMongo, LangGraph, langgraph-checkpoint-mongodb, React, TypeScript, MongoDB, Docker Compose.

**Spec:** `docs/superpowers/specs/2026-10-25-python-runtime-observability-design.md`

## Global Constraints

- Keep all code, UI copy, and specifications in English.
- Keep the existing MongoDB volume and `useCases`, `assessments`, and `runs` collections; do not reset data.
- Preserve the current REST paths and compatibility with existing completed run documents.
- Keep assessment evaluators allow-listed; do not execute user-submitted code.
- Keep logs and returned checkpoint summaries free of raw use-case state.
- Keep modules separated by API, domain, lifecycle, persistence, runtime, and seed responsibilities.

## Review Focus

- Partial failure during graph execution: persist `failed` status and a safe terminal log without losing earlier progress.
- Inapplicable policy: record a transparent skip reason without presenting it as a completed outcome.
- Existing Node.js-era Mongo documents: deserialize missing/new fields safely and keep them visible.
- Concurrent status refresh while the lifecycle service is scheduling runs: avoid blocking the API and avoid duplicate run IDs.
- Empty versus populated MongoDB database: seed only an empty portfolio and preserve all existing records.

## Task 1: Python API and MongoDB foundation

**Files:**
- Create `server/pyproject.toml` or `server/requirements.txt` and Python modules under `server/app/`.
- Create Python modules for configuration, Pydantic domain models, repository protocol, PyMongo repository, FastAPI routes, seed data, and lifecycle orchestration.
- Modify `server/Dockerfile`, `docker-compose.yml`, root `package.json`, and `.env.example`.
- Remove the TypeScript server source/package after the Python service covers the existing endpoints.

**Interfaces:**
- `MongoLifecycleRepository` implements async/synchronous repository operations for use cases, assessments, and runs against the existing collections.
- `create_app(settings, repository)` creates the FastAPI application and the current REST route set.
- Lifecycle validation/evaluator behavior matches the current `server/src/domain/assessments.ts` and `server/src/services/lifecycle.ts` contracts.

- [ ] Implement the modular Python package and keep each endpoint's request/response shape compatible.
- [ ] Implement safe Mongo serialization for BSON datetimes and legacy documents.
- [ ] Update Docker Compose to run the Python API and remove Node server packaging.
- [ ] Run `python -m compileall server/app` and build the client and containers.
- [ ] Start the API and verify `/health`, `/api/overview`, existing record reads, and one CRUD round trip without deleting Mongo data.

## Task 2: Durable LangGraph runtime and incremental run logs

**Files:**
- Create `server/app/runtime/assessment_graph.py` and `server/app/runtime/run_logger.py`.
- Modify lifecycle service, run models, Mongo repository, and application lifespan wiring.

**Interfaces:**
- `AssessmentRuntime.start(assessment, use_case, trigger) -> AssessmentRun` persists a `running` shell and schedules execution.
- `AssessmentRuntime.execute(run_id, assessment, use_case, trigger) -> None` streams graph updates/checkpoints and persists safe progress.
- `LifecycleService.schedule_applicable(use_case, trigger) -> list[str]` schedules applicable run IDs after lifecycle events.
- Log item shape: `{sequence, timestamp, level, event, node?, message, details?}`.

- [ ] Compile one Python LangGraph `StateGraph` with applicability, evaluation, and evidence nodes and a MongoDB checkpointer.
- [ ] Persist ordered start/node/checkpoint/terminal/error logs and run status updates as execution advances.
- [ ] Preserve prior history and represent non-applicable policies transparently as skipped execution records.
- [ ] Run Python compile checks and verify logs/checkpoints persist in MongoDB after an execution.

## Task 3: Live execution inspector

**Files:**
- Modify `client/src/api.ts`, `client/src/hooks/useOntology.ts`, `client/src/pages/RunHistoryPage.tsx`, and `client/src/styles.css`.

**Interfaces:**
- Run status is `running | completed | skipped | failed`.
- Run execution adds `logs` with the structured log shape from Task 2.
- Overview polling uses the normal interval while idle and a short interval while a run is active.

- [ ] Render a visible running state and terminal failure/skip state in the run table and inspector.
- [ ] Add an ordered execution-log view with timestamps, levels, node names, and concise safe details.
- [ ] Keep node timing and checkpoint inspector, populated from durable MongoDB-backed state.
- [ ] Run the client production build and manually inspect active and completed-run screens against the running Docker stack.

## Task 4: Documentation and end-to-end verification

**Files:**
- Modify `README.md`, `.env.example`, root `package.json`, and Docker health checks.

- [ ] Document Python setup, Python backend architecture, run status/logs/checkpoints, and MongoDB checkpoint data boundary.
- [ ] Remove obsolete TypeScript backend instructions and update architecture/module diagrams.
- [ ] Run the complete container build, health checks, API smoke checks, and client production build.
- [ ] Confirm persisted use-case, assessment, run, and checkpoint documents remain available after the Python API restart.

## Decisions

- Use MongoDB-backed `MongoDBSaver` because the existing demo already runs MongoDB and durable checkpoint inspection is an explicit goal.
- Schedule runs on a bounded in-process thread pool to preserve the current single-container demo footprint; production multi-replica workers would need an external durable queue.
- Keep the current API paths and use additive run fields to avoid a frontend-wide API redesign.
