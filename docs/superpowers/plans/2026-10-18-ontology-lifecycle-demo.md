# AI Use Case Lifecycle Ontology Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished English full-stack demo showing persistent AI Use Case lifecycle management with ontology-aware assessment registration, applicability, automation, and auditable runs.

**Architecture:** A TypeScript Express API owns a MongoDB-backed domain, a LangGraph.js StateGraph runtime with explicit applicability/evaluation/evidence nodes, per-run MemorySaver checkpoints and observable execution events, a safe declarative assessment registry, deterministic explainable evaluators, and immutable run history. A React/Vite client provides an executive cockpit and working use-case, assessment, ontology, and evidence views.

**Tech Stack:** TypeScript, Node.js, Express, MongoDB driver, LangGraph.js, React, Vite, Vitest, Docker Compose.

**Spec:** `docs/superpowers/specs/2026-10-18-ontology-lifecycle-demo-design.md`

## Global Constraints

- All code, UI, specs, and product-facing text are English.
- Use Docker MongoDB when available and configure its connection.
- Never evaluate arbitrary assessment code; validate evaluator kinds and declarative conditions.
- Show human-readable rationale and evidence for assessment results.
- Submission/edit triggers applicable assessments; registration checks all existing use cases.
- Use-case deletion removes the active entity while preserving immutable assessment history.

## Review Focus

- Assessment definitions and use-case fields may contain malformed or unexpected input; validate at API boundaries.
- Assessment registration must not execute against non-applicable use cases.
- Re-running after edits must preserve previous run evidence and update current status.
- Database outages must produce actionable API errors rather than silently seeding or losing writes.
- Demo seed behavior must not overwrite a user's existing data.

---

### Task 1: Domain model and assessment runtime

**Files:** Create `server/src/domain/types.ts`, `server/src/domain/assessments.ts`, `server/src/domain/assessments.test.ts`, `server/package.json`, `server/tsconfig.json`.

**Interfaces:** Produces `AssessmentDefinition`, `UseCaseRecord`, `AssessmentRun`, `isApplicable`, and `evaluateAssessment` for API and tests.

- [ ] Write tests for each built-in evaluator, applicability matching, and malformed definitions.
- [ ] Run Vitest and observe expected failures.
- [ ] Implement typed models, allow-listed evaluators, transparent dimension/risk evidence, and definition validation.
- [ ] Run server tests and confirm all pass.

### Task 2: Mongo persistence and lifecycle API

**Files:** Create `server/src/db.ts`, `server/src/services/lifecycle.ts`, `server/src/services/lifecycle.test.ts`, `server/src/routes.ts`, `server/src/index.ts`, `.env.example`, `docker-compose.yml`.

**Interfaces:** Consumes Task 1 domain contracts; provides REST CRUD, assessment registry, applicability, and run-history endpoints.

- [ ] Write lifecycle tests for create/submit, update-triggered runs, registration scanning existing use cases, non-applicable skips, and immutable history.
- [ ] Run tests red.
- [ ] Implement Mongo collections, repository boundary, orchestration, validation, API routes, and an idempotent sample seed.
- [ ] Run server tests and confirm all pass.

### Task 3: Executive ontology cockpit and workbench

**Files:** Create `client/package.json`, `client/index.html`, `client/src/main.tsx`, `client/src/App.tsx`, `client/src/api.ts`, `client/src/styles.css`, `client/src/components/OntologyGraph.tsx`, `client/src/components/UseCaseWorkbench.tsx`, `client/vite.config.ts`.

**Interfaces:** Consumes Task 2 REST contract; provides responsive dashboard, ontology relationships, case create/edit/submit, assessment registry, and evidence/history panels.

- [ ] Implement a client API layer and dashboard layouts/components with English product text.
- [ ] Show trigger counts, lifecycle status, latest results, graph relationships, expandable evidence, and create/submit flows.
- [ ] Verify production client build.

### Task 4: Integration, docs, and verification

**Files:** Create root `package.json`, `README.md`; update `.gitignore`.

**Interfaces:** Root scripts orchestrate client/server; compose runs MongoDB and app; README explains setup, demo flows, and runtime boundaries.

- [ ] Add root install/dev/build/test scripts and Docker Compose services.
- [ ] Document local run and demo walkthrough in English.
- [ ] Run full test suite and client/server builds; start the application and verify API/UI availability.
- [ ] Review requirements against implementation and record any limitations.
