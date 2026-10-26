# Python Runtime and Assessment Observability

## Intent

Move the complete API and assessment backend from TypeScript/Express to Python so the implementation matches the team's primary stack. Make AssessmentRun execution understandable while it is running and after it completes, with durable, structured logs and inspectable LangGraph checkpoints.

## Goals

- Replace the Node.js backend with a modular Python API, domain, lifecycle, persistence, and runtime implementation.
- Keep the React client, MongoDB collections, existing API paths, and existing portfolio data usable.
- Run assessments in the Python LangGraph runtime.
- Persist a run shell before execution, then update its status, structured logs, node events, result, and checkpoint summaries as the graph advances.
- Use MongoDB-backed LangGraph checkpoint persistence so state history survives API restarts.
- Display running/completed/failed states and ordered logs in Run history. Refresh more frequently only while runs are active.
- Keep assessment execution allow-listed; do not enable uploaded Python or arbitrary code execution.
- Keep all implementation, UI copy, and documentation in English.

## Non-goals

- Rebuild the React frontend in Python.
- Introduce a separate database or external observability SaaS.
- Add LLM calls, user-uploaded evaluators, or a general-purpose code sandbox.
- Change the meaning of the four existing assessment evaluators or overwrite historical runs.

## Architecture

- FastAPI exposes the existing REST surface and OpenAPI documentation.
- A `ThreadPoolExecutor` owned by the lifecycle service schedules automatic runs after each use-case submission/change and assessment registration. Requests persist the business entity and return without waiting for every graph execution.
- A repository interface isolates MongoDB CRUD. Existing `useCases`, `assessments`, and `runs` collections remain the source of truth and retain their document shapes where possible.
- A Python LangGraph `StateGraph` uses a MongoDB checkpointer. Every run has a stable run ID and `thread_id`; the run document moves through `running`, then `completed`, `skipped`, or `failed`.
- Structured log entries and node events contain summaries only. Full use-case state is not copied to application logs. LangGraph checkpoints remain available in the checkpointer collection and the inspector receives a safe projection.
- The React app continues using the current API paths. Its overview polling interval shortens while any run is active, and Run history renders running status and timestamped log entries alongside node events and checkpoints.

## Data and compatibility

- Keep MongoDB database and business collections unchanged; do not clear the persistent volume.
- Existing completed run documents remain readable. Missing `logs` or execution metadata renders as legacy history.
- New run status is represented as `running`, `completed`, `skipped`, or `failed`. A skipped applicability evaluation may be logged but does not count as a completed assessment outcome.
- Keep current validation rules, evaluator kinds, applicability behavior, lifecycle triggers, and response fields. New status/log fields are additive.
- Seed built-in assessments and demo portfolio only under the existing empty-database conditions.

## Runtime observability

Each run records an ordered structured log with timestamp, level, event, node, message, and safe summary metadata. Logs cover run creation, graph start, node start/completion, checkpoint creation, applicability skips, terminal outcomes, and exceptions. The UI groups these by execution, distinguishes active and terminal states, and exposes checkpoint identifiers and summarized state. Failures retain the error class and a safe message for diagnosis.

## Security and privacy

- Only allow-listed evaluators and validated applicability conditions can run.
- Never return or log raw checkpoint payloads. Return selected IDs, lifecycle status, completed node names, result summary, and channel names.
- Checkpointer persistence stores graph state needed for recovery in the local MongoDB volume; document this data boundary.
- Keep CORS, request-size limits, health checks, and current field validation behavior.

## Acceptance criteria

- `docker compose up --build` starts a Python API, React client, and MongoDB; API health is healthy.
- Existing MongoDB records appear without reset and remain editable.
- Submitting, updating, registering a policy, and manually running an assessment schedule LangGraph executions and persist lifecycle results.
- Run history displays `running` progress, structured logs, node updates, checkpoints, and terminal status; new logs arrive without a full page reload.
- A server restart retains run logs and checkpoint history.
- No Node.js server package or runtime remains in the backend deployment.
- Python compilation, client build, container health, and HTTP smoke checks succeed.
