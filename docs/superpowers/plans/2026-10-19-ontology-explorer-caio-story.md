# Ontology Explorer and CAIO Story Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the application ontology visibly explorable and provide an in-product CAIO presenter guide tied to the live demo screens.

**Architecture:** Build a pure frontend ontology projection from the existing overview payload, then render it through focused ontology canvas and inspector components. Add an idempotent version migration for changed built-in applicability definitions, then provide a five-beat story guide tied to app navigation and document the presenter runbook.

**Tech Stack:** React, TypeScript, Vite, Vitest, existing CSS design system.

**Spec:** `docs/superpowers/specs/2026-10-18-ontology-lifecycle-demo-design.md` — Ontology Explorer and CAIO Storytelling.

## Global Constraints

- All code, UI, specs, and product-facing text are English.
- Use live records already returned by the API; do not fabricate ontology instances or assessment results.
- Identify projected vocabularies as projections and do not claim RDF/OWL storage.
- Keep ontology schema, rendering, inspector, and story guide in focused modules.
- Keep the CAIO narrative concise, outcome-led, and navigable.

## Review Focus

- Empty API data should still render all ontology classes and their definitions without invalid graph counts.
- Evidence and category vocabularies are embedded/projected values and must be labeled accurately.
- Every story action must navigate to the stated screen.
- Small viewport layouts must preserve graph readability and access to the inspector.
- Dashboard, sidebar, and help navigation must not strand the presenter in a dead end.

### Task 1: Live ontology projection

**Files:** Create `client/src/domain/ontology.ts`, `client/src/domain/ontology.test.ts`; modify `client/package.json`, root `package.json`.

**Interfaces:** `buildOntologyModel(data: Pick<Overview, "useCases" | "assessments" | "runs">): OntologyModel`; model contains class definitions, typed relationships, instance summaries, and actual counts.

- [x] Add Vitest script in client workspace and make root `npm test` run all workspaces.
- [x] Write tests for actual instance counts, relationship counts, embedded evidence projection, and empty input behavior.
- [x] Run the focused client test and record expected failure.
- [x] Implement ontology definitions and projection from API data.
- [x] Run focused and full tests.

### Task 2: Ontology graph explorer

**Files:** Create `client/src/pages/OntologyPage.tsx`, `client/src/components/ontology/OntologyCanvas.tsx`, `client/src/components/ontology/OntologyInspector.tsx`; modify `client/src/App.tsx`, `client/src/components/OntologyGraph.tsx`, `client/src/pages/DashboardPage.tsx`, `client/src/styles.css`.

**Interfaces:** Ontology page consumes `OntologyModel`; graph selection uses element IDs; inspector renders selected class or relationship metadata and live examples.

- [x] Add primary navigation and route the dashboard relationship-map action to Ontology.
- [x] Build responsive typed graph with searchable class/relationship focus and selectable elements (AI Use Case, Assessment, Assessment Run, Evidence Item, Business Unit, Technology, Data Category, and Control Domain).
- [x] Build a detail inspector with properties, mappings, counts, and examples from live data.
- [x] Verify typecheck/build and inspect the running presentation layout.

### Task 3: Built-in policy version migration

**Files:** Modify `server/src/domain/assessments.ts`, `server/src/services/lifecycle.ts`, `server/src/services/lifecycle.test.ts`.

**Interfaces:** `LifecycleService.initialize()` installs missing built-in definitions and migrates versioned changes once; a changed definition is scanned against existing use cases using the `assessment-registration` trigger.

- [x] Write a regression test for upgrading old Regulatory Compliance and Financial Crime predicates, scanning matching records once, and retaining previous runs.
- [x] Run the focused test to verify it fails against current initialization behavior.
- [x] Version risk-signal definitions and make initialization persist and execute each changed version exactly once.
- [x] Make interrupted scans resumable by skipping already persisted versioned migration runs and advancing the definition after a successful portfolio scan.
- [x] Run lifecycle tests and confirm the migration remains idempotent and resumes after an injected persistence failure.

### Task 4: CAIO presenter guide

**Files:** Create `client/src/components/DemoGuide.tsx`, `client/src/domain/demoStory.ts`; modify `client/src/App.tsx`, `client/src/styles.css`, `README.md`.

**Interfaces:** `demoStory` contains five beats with title, destination page, spoken line, proof point, and action label; guide invokes `onNavigate(page)` and `onClose()`.

- [x] Write tests that every story destination is a valid app page and each beat has a presenter line and proof point.
- [x] Implement the five-beat narrative and an in-app guide opened from the top bar.
- [x] Add an English presenter runbook and click-by-click sequence to README; provide the spoken Chinese talk track in the conversational handoff.
- [x] Verify build, all tests, formatting, dependency audit output, and live Compose navigation.

## Decisions

- Keep the ontology projection in the client because the demo API already returns the complete records needed for a live model view.
- Persisted entities remain distinct from projected vocabulary instances in both counts and labels.
- Use the existing app navigation state for story actions rather than a second routing mechanism.
- Built-in policy version changes migrate during service initialization and preserve prior assessment runs.
