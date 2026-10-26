from __future__ import annotations

import logging
import operator
import re
import time
from datetime import datetime, timezone
from typing import Annotated, Any, TypedDict

from langgraph.graph import END, START, StateGraph
from langgraph.checkpoint.mongodb import MongoDBSaver
from pymongo import MongoClient

from ..domain import evaluate_assessment, is_applicable, utc_now
from ..repository import MongoLifecycleRepository

logger = logging.getLogger("ontology.assessment")


class AssessmentState(TypedDict, total=False):
    runId: str
    assessment: dict[str, Any]
    useCase: dict[str, Any]
    trigger: str
    graphExecutionId: str
    applicable: bool
    result: dict[str, Any] | None
    trace: Annotated[list[str], operator.add]
    events: Annotated[list[dict[str, Any]], operator.add]


class AssessmentRuntime:
    def __init__(
        self,
        repository: MongoLifecycleRepository,
        mongo_client: MongoClient,
        database_name: str,
    ):
        self.repository = repository
        self.checkpointer = MongoDBSaver(
            mongo_client,
            db_name=database_name,
            checkpoint_collection_name="assessment_checkpoints",
            writes_collection_name="assessment_checkpoint_writes",
        )
        self.graph = self._build_graph()

    def _build_graph(self):
        def resolve_applicability(state: AssessmentState) -> dict[str, Any]:
            return self._node_result(
                state,
                "resolve_applicability",
                lambda: {
                    "applicable": is_applicable(state["assessment"], state["useCase"]),
                    "trace": [
                        "resolve_applicability:matched"
                        if is_applicable(state["assessment"], state["useCase"])
                        else "resolve_applicability:skipped"
                    ],
                },
                lambda output: (
                    "Applicability rules matched"
                    if output["applicable"]
                    else "Assessment skipped by applicability rules"
                ),
                lambda state: f"Policy {state['assessment']['id']} against use case {state['useCase']['id']}",
            )

        def execute_assessment(state: AssessmentState) -> dict[str, Any]:
            return self._node_result(
                state,
                "execute_assessment",
                lambda: {
                    "result": evaluate_assessment(state["assessment"], state["useCase"]),
                    "trace": [f"execute_assessment:{state['assessment']['evaluator']}"],
                },
                lambda output: f"{output['result']['outcome']}; score {output['result']['score']}; {len(output['result']['evidence'])} evidence items",
                lambda state: f"Evaluator {state['assessment']['evaluator']}; policy version {state['assessment']['version']}",
            )

        def prepare_evidence(state: AssessmentState) -> dict[str, Any]:
            return self._node_result(
                state,
                "prepare_evidence",
                lambda: {"trace": ["prepare_evidence:completed"]},
                lambda _output: f"{len((state.get('result') or {}).get('evidence', []))} evidence items ready for durable persistence",
                lambda _state: "Assessment result and evidence references",
            )

        builder = StateGraph(AssessmentState)
        builder.add_node("resolve_applicability", resolve_applicability)
        builder.add_node("execute_assessment", execute_assessment)
        builder.add_node("prepare_evidence", prepare_evidence)
        builder.add_edge(START, "resolve_applicability")
        builder.add_conditional_edges(
            "resolve_applicability",
            lambda state: "execute_assessment" if state.get("applicable") else END,
        )
        builder.add_edge("execute_assessment", "prepare_evidence")
        builder.add_edge("prepare_evidence", END)
        return builder.compile(checkpointer=self.checkpointer)

    def _node_result(
        self,
        state: AssessmentState,
        node: str,
        operation,
        summarize_output,
        summarize_input,
    ) -> dict[str, Any]:
        run_id = state["runId"]
        started = utc_now()
        started_perf = time.perf_counter()
        self._log(run_id, "info", "node.started", node, f"{node} started", {"input": summarize_input(state)})
        output = operation()
        completed = utc_now()
        duration_ms = max(0, round((time.perf_counter() - started_perf) * 1000))
        event = {
            "sequence": self._next_event_sequence(run_id),
            "node": node,
            "status": "completed",
            "startedAt": started,
            "completedAt": completed,
            "durationMs": duration_ms,
            "inputSummary": summarize_input(state),
            "outputSummary": summarize_output(output),
        }
        self.repository.append_run_event(run_id, event)
        self._log(
            run_id,
            "info",
            "node.completed",
            node,
            f"{node} completed in {duration_ms} ms",
            {"output": summarize_output(output)},
        )
        return {**output, "events": [event]}

    def _next_event_sequence(self, run_id: str) -> int:
        run = self.repository.get_run(run_id) or {}
        return len((run.get("execution") or {}).get("events", [])) + 1

    def _log(
        self,
        run_id: str,
        level: str,
        event: str,
        node: str | None,
        message: str,
        details: dict[str, Any] | None = None,
    ) -> None:
        run = self.repository.get_run(run_id) or {}
        logs = (run.get("execution") or {}).get("logs", [])
        item = {
            "sequence": len(logs) + 1,
            "timestamp": utc_now(),
            "level": level,
            "event": event,
            **({"node": node} if node else {}),
            "message": message,
            **({"details": details} if details else {}),
        }
        self.repository.append_run_log(run_id, item)
        getattr(logger, level if level in {"debug", "info", "warning", "error"} else "info")(
            "%s %s %s", run_id, event, message
        )

    def execute(
        self,
        run_id: str,
        assessment: dict[str, Any],
        use_case: dict[str, Any],
        trigger: str,
    ) -> None:
        run = self.repository.get_run(run_id)
        if not run:
            return
        started_at = run["execution"]["startedAt"]
        thread_id = run["execution"]["threadId"]
        config = {"configurable": {"thread_id": thread_id}}
        self.repository.update_run_fields(run_id, {"status": "running", "updatedAt": utc_now()})
        self._log(run_id, "info", "graph.started", None, "LangGraph execution started", {"trigger": trigger})
        try:
            final_state: dict[str, Any] = {}
            initial: AssessmentState = {
                "runId": run_id,
                "assessment": assessment,
                "useCase": use_case,
                "trigger": trigger,
                "graphExecutionId": run["graphExecutionId"],
                "applicable": False,
                "result": None,
                "trace": [],
                "events": [],
            }
            for update in self.graph.stream(initial, config=config, stream_mode="updates"):
                for node, values in update.items():
                    final_state.update(values)
                    snapshot = self.graph.get_state(config)
                    self.repository.append_checkpoint(run_id, self._checkpoint_summary(snapshot))
                    self._log(
                        run_id,
                        "debug",
                        "checkpoint.persisted",
                        node,
                        f"Checkpoint persisted after {node}",
                        {"checkpointId": self._checkpoint_summary(snapshot)["checkpointId"]},
                    )

            history = list(self.graph.get_state_history(config))
            for snapshot in reversed(history):
                self.repository.append_checkpoint(run_id, self._checkpoint_summary(snapshot))
            applicable = bool(final_state.get("applicable"))
            result = final_state.get("result")
            completed_at = utc_now()
            duration_ms = max(0, round((completed_at - started_at).total_seconds() * 1000))
            if not applicable:
                terminal = {
                    "status": "skipped",
                    "outcome": "Not applicable",
                    "rationale": "Applicability rules did not match the current use-case facts.",
                    "completedAt": completed_at,
                    "durationMs": duration_ms,
                }
                self._log(run_id, "info", "assessment.skipped", None, terminal["rationale"])
            else:
                terminal = {
                    **(result or {}),
                    "status": "completed",
                    "completedAt": completed_at,
                    "durationMs": duration_ms,
                }
                self._log(run_id, "info", "assessment.completed", None, str(terminal.get("outcome", "Assessment completed")))
            self.repository.update_run_fields(
                run_id,
                {
                    "status": terminal["status"],
                    "outcome": terminal.get("outcome", ""),
                    "score": terminal.get("score", 0),
                    "rationale": terminal.get("rationale", ""),
                    "evidence": terminal.get("evidence", []),
                    "recommendation": terminal.get("recommendation", ""),
                    "suggestedDescription": terminal.get("suggestedDescription"),
                    "trace": final_state.get("trace", []),
                    "execution.completedAt": completed_at,
                    "execution.durationMs": duration_ms,
                    "updatedAt": completed_at,
                },
            )
        except Exception as error:
            logger.exception("Assessment execution failed: %s", run_id)
            safe_message = re.sub(r"[\r\n\t]+", " ", str(error))[:400]
            self._log(
                run_id,
                "error",
                "assessment.failed",
                None,
                f"{type(error).__name__}: {safe_message}",
            )
            completed_at = utc_now()
            self.repository.update_run_fields(
                run_id,
                {
                    "status": "failed",
                    "outcome": "Assessment execution failed",
                    "rationale": safe_message,
                    "execution.completedAt": completed_at,
                    "execution.durationMs": max(0, round((completed_at - started_at).total_seconds() * 1000)),
                    "updatedAt": completed_at,
                },
            )

    @staticmethod
    def _checkpoint_summary(snapshot: Any) -> dict[str, Any]:
        config = getattr(snapshot, "config", {}) or {}
        configurable = config.get("configurable", {})
        values = getattr(snapshot, "values", {}) or {}
        assessment = values.get("assessment") or {}
        use_case = values.get("useCase") or {}
        result = values.get("result") or {}
        metadata = getattr(snapshot, "metadata", {}) or {}
        checkpoint_id = configurable.get("checkpoint_id")
        if not checkpoint_id:
            return {
                "checkpointId": f"step-{metadata.get('step', -1)}-{metadata.get('source', 'unknown')}",
                "step": metadata.get("step", -1),
                "source": metadata.get("source", "unknown"),
                "createdAt": None,
                "next": list(getattr(snapshot, "next", []) or []),
                "channels": sorted(values.keys()),
                "stateSummary": {},
            }
        return {
            "checkpointId": checkpoint_id,
            "step": metadata.get("step", -1),
            "source": metadata.get("source", "unknown"),
            "createdAt": getattr(snapshot, "created_at", None),
            "next": list(getattr(snapshot, "next", []) or []),
            "channels": sorted(values.keys()),
            "stateSummary": {
                "assessment": {
                    "id": assessment.get("id"),
                    "name": assessment.get("name"),
                    "version": assessment.get("version"),
                },
                "useCase": {
                    "id": use_case.get("id"),
                    "name": use_case.get("name"),
                    "status": use_case.get("status"),
                },
                "trigger": values.get("trigger"),
                "applicable": values.get("applicable"),
                "completedNodes": [event.get("node") for event in values.get("events", [])],
                "result": {
                    "outcome": result.get("outcome"),
                    "score": result.get("score"),
                    "evidenceCount": len(result.get("evidence", [])),
                }
                if result
                else None,
                "trace": values.get("trace", []),
            },
        }
