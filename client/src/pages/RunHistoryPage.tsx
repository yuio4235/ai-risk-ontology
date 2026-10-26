import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Database,
  Network,
  Play,
  RefreshCw,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { useState } from "react";
import type { Run, UseCase } from "../api";
export function RunHistoryPage({
  runs,
  useCases,
  onSelect,
  onRefresh,
  onRun,
  busy,
}: {
  runs: Run[];
  useCases: UseCase[];
  onSelect: (item: UseCase) => void;
  onRefresh: () => void;
  onRun: (assessmentId: string, useCaseId: string) => Promise<Run | null>;
  busy: boolean;
}) {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const selectedRun = runs.find((run) => run.id === selectedRunId) ?? runs[0] ?? null;
  const flagged = runs.filter((run) =>
    /review|required|attention/i.test(run.outcome),
  ).length;
  return (
    <div className="page-content subpage">
      <div className="page-title-row">
        <div>
          <h1>Assessment run history</h1>
        </div>
        <button className="button-ghost" onClick={onRefresh}>
          <RefreshCw size={15} /> Refresh ledger
        </button>
      </div>
      <div className="run-summary">
        <RunSummary
          icon={<Activity />}
          label="Total persisted runs"
          value={runs.length}
        />
        <RunSummary
          icon={<ShieldAlert />}
          label="Review outcomes"
          value={flagged}
        />
        <RunSummary
          icon={<Network />}
          label="Ontology triggers"
          value={new Set(runs.map((run) => run.trigger)).size}
        />
        <RunSummary
          icon={<Database />}
          label="Evidence store"
          value="MongoDB"
        />
      </div>
      <section className="panel history-panel">
        <div className="panel-head compact">
          <div>
            <h2>LangGraph executions</h2>
          </div>
          <span className="ledger-badge">
            <i /> DURABLE RECORDS
          </span>
        </div>
        <div className="history-table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th>ASSESSMENT / ENTITY</th>
                <th>TRIGGER EVENT</th>
                <th>OUTCOME</th>
                <th>GRAPH EXECUTION</th>
                <th>TIME</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr
                  key={run.id}
                  tabIndex={0}
                  aria-label={`Inspect LangGraph execution for ${run.useCaseName}`}
                  className={selectedRunId === run.id ? "selected-run-row" : ""}
                  onClick={() => setSelectedRunId(run.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedRunId(run.id);
                    }
                  }}
                >
                  <td>
                    <b>{run.assessmentName}</b>
                    <small>{run.useCaseName}</small>
                  </td>
                  <td>
                    <span className={`trigger-tag trigger-${run.trigger}`}>
                      {triggerLabel(run.trigger)}
                    </span>
                  </td>
                  <td>
                    <span
                      className={
                        run.status === "running"
                          ? "outcome-running"
                          : run.status === "failed" ||
                              run.status === "skipped" ||
                              /review|required|attention/i.test(run.outcome)
                            ? "outcome-warn"
                            : "outcome-good"
                      }
                    >
                      <i />
                      {run.status === "running" ? "Running" : run.outcome}
                    </span>
                  </td>
                  <td>
                    <code className="execution-id">
                      {run.graphExecutionId?.slice(0, 16) ??
                        run.id.slice(0, 16)}
                    </code>
                  </td>
                  <td>
                    {new Date(run.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td>
                    <ArrowUpRight size={14} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {runs.length === 0 && (
            <div className="empty-history">
              <Activity size={21} />
              <b>No assessment runs yet</b>
              <span>Submit an AI use case to start the evidence ledger.</span>
            </div>
          )}
        </div>
      </section>
      {selectedRun && (
        <section className="panel execution-inspector" aria-live="polite">
          <div className="panel-head compact">
            <div>
              <h2>{selectedRun.assessmentName}</h2>
              <p>{selectedRun.useCaseName} · {selectedRun.trigger} · {selectedRun.graphExecutionId}</p>
            </div>
            <button
              className="button-ghost"
              disabled={busy}
              onClick={async () => {
                const nextRun = await onRun(selectedRun.assessmentId, selectedRun.useCaseId);
                if (nextRun) setSelectedRunId(nextRun.id);
              }}
            >
              <Play size={14} /> Run again
            </button>
            <button
              className="button-ghost"
              onClick={() => {
                const useCase = useCases.find((item) => item.id === selectedRun.useCaseId);
                if (useCase) onSelect(useCase);
              }}
            >
              Open use case <ArrowRight size={14} />
            </button>
          </div>
          {selectedRun.execution ? (
            <>
              <div className="execution-metadata">
                <span><b>Thread</b><code>{selectedRun.execution.threadId}</code></span>
                <span><b>Elapsed</b><strong>{formatDuration(elapsed(selectedRun))}</strong></span>
                <span><b>Graph events</b><strong>{selectedRun.execution.events.length}</strong></span>
                <span><b>Checkpoints</b><strong>{selectedRun.execution.checkpoints.length}</strong></span>
              </div>
              <div className="execution-inspector-grid">
                <div className="execution-stream">
                  <div className="execution-section-head">
                    <div><h3>Execution event stream</h3></div>
                    <span className={`execution-live-tag execution-status-${selectedRun.status}`}>
                      <i /> {selectedRun.status.toUpperCase()}
                    </span>
                  </div>
                  {selectedRun.execution.events.map((event) => (
                    <article className="execution-event" key={`${event.sequence}-${event.node}`}>
                      <div className="execution-event-marker"><CheckCircle2 size={15} /></div>
                      <div className="execution-event-body">
                        <div className="execution-event-title">
                          <b>{event.node}</b><code>{formatDuration(event.durationMs)}</code>
                        </div>
                        <p><span>Input</span>{event.inputSummary}</p>
                        <p><span>Output</span>{event.outputSummary}</p>
                        <small>{new Date(event.startedAt).toLocaleTimeString("en-US")} → {new Date(event.completedAt).toLocaleTimeString("en-US")}</small>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="checkpoint-panel">
                  <div className="execution-section-head">
                    <div><h3>Checkpoints</h3></div>
                    <Database size={15} />
                  </div>
                  <p className="checkpoint-store-note">{selectedRun.execution.checkpointStore}</p>
                  {selectedRun.execution.checkpoints.map((checkpoint) => (
                    <details className="checkpoint-item" key={checkpoint.checkpointId}>
                      <summary>
                        <span><b>Step {checkpoint.step}</b><small>{checkpoint.source}</small></span>
                        <code>{checkpoint.checkpointId.slice(0, 12)}</code>
                        <ChevronDown size={14} />
                      </summary>
                      <div className="checkpoint-detail">
                        <span>Next nodes: <b>{checkpoint.next.length ? checkpoint.next.join(", ") : "END"}</b></span>
                        <span>State channels: <b>{checkpoint.channels.join(", ") || "None"}</b></span>
                        <span>Created: <b>{checkpoint.createdAt ? new Date(checkpoint.createdAt).toLocaleTimeString("en-US") : "Not reported"}</b></span>
                        <pre>{JSON.stringify(checkpoint.stateSummary, null, 2)}</pre>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
              <div className="execution-log-panel">
                <div className="execution-section-head">
                  <h3>Execution log</h3>
                  <span>{selectedRun.execution.logs?.length ?? 0}</span>
                </div>
                {selectedRun.execution.logs?.length ? (
                  <ol className="execution-log-list">
                    {selectedRun.execution.logs.map((entry) => (
                      <li className={`execution-log-entry log-${entry.level}`} key={entry.sequence}>
                        <time>{new Date(entry.timestamp).toLocaleTimeString("en-US")}</time>
                        <span className="log-level">{entry.level}</span>
                        <code>{entry.event}</code>
                        {entry.node && <b>{entry.node}</b>}
                        <span>{entry.message}</span>
                        {entry.details && <small>{JSON.stringify(entry.details)}</small>}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="execution-log-empty">No runtime log entries for this historical run.</p>
                )}
              </div>
              <div className="execution-audit-note"><Zap size={15} /><span>Node timings and state history are captured from this LangGraph execution. AssessmentRun evidence is saved to MongoDB; full use-case state is not copied into application logs.</span></div>
            </>
          ) : (
            <div className="legacy-execution-note"><Activity size={16} /><span>This historical run predates execution telemetry. Trigger a new assessment to inspect its node events and checkpoint history.</span></div>
          )}
        </section>
      )}
    </div>
  );
}
function RunSummary({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="run-summary-card">
      <div>{icon}</div>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}
function triggerLabel(trigger: string) {
  return trigger === "assessment-registration"
    ? "Policy registration"
    : trigger === "data-change"
      ? "Data change"
      : trigger === "submission"
        ? "Use-case submission"
        : "Manual run";
}
function formatDuration(durationMs: number) {
  return durationMs < 1 ? "<1 ms" : `${durationMs} ms`;
}
function elapsed(run: Run) {
  const execution = run.execution;
  if (!execution) return 0;
  if (execution.completedAt) return execution.durationMs;
  return Math.max(0, Date.now() - new Date(execution.startedAt).getTime());
}
