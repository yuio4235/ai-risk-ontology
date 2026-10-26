import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Network,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import type { Run, UseCase } from "../api";
export function UseCaseDrawer({
  item,
  runs,
  onClose,
  onSubmit,
  onUpdate,
  onEdit,
  onDelete,
}: {
  item: UseCase;
  runs: Run[];
  onClose: () => void;
  onSubmit: (id: string) => void;
  onUpdate: (id: string, value: Record<string, unknown>) => Promise<UseCase>;
  onEdit: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className="drawer-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside className="detail-drawer">
        <header className="drawer-head">
          <div>
            <span className="eyebrow">GOVERNED BUSINESS ENTITY</span>
            <h2>{item.name}</h2>
            <span className="drawer-id">
              UC-{item.id.slice(0, 8).toUpperCase()} · {item.businessUnit}
            </span>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <div className="drawer-status-row">
          <span className={`status-pill ${item.status}`}>
            {item.status === "submitted" ? (
              <CheckCircle2 size={12} />
            ) : (
              <Clock3 size={12} />
            )}{" "}
            {item.status}
          </span>
          {item.status === "draft" && (
            <button
              className="button-primary small"
              onClick={() => onSubmit(item.id)}
            >
              <Sparkles size={14} /> Submit & assess
            </button>
          )}
        </div>
        <div className="drawer-section">
          <div className="drawer-section-title">
            <span className="eyebrow">ONTOLOGY ATTRIBUTES</span>
            <button
              className="text-action"
              onClick={async () => {
                const description = window.prompt(
                  "Update use-case description",
                  item.description,
                );
                if (description !== null)
                  await onUpdate(item.id, { description });
              }}
            >
              Edit & trigger <ArrowUpRight size={13} />
            </button>
          </div>
          <DetailFact label="Accountable owner" value={item.owner} />
          <DetailFact label="Technology" value={item.technology} />
          <DetailFact label="Description" value={item.description} />
          <DetailFact label="Decision behavior" value={item.decisions} />
          <DetailFact label="Data types" value={item.dataTypes.join(", ")} />
          <DetailFact label="Customer impact" value={item.customerImpact} />
          <DetailFact label="Control impact" value={item.controlImpact} />
        </div>
        <div className="drawer-section">
          <div className="drawer-section-title">
            <span className="eyebrow">LINKED ASSESSMENT EVIDENCE</span>
            <span className="count-pill">{runs.length}</span>
          </div>
          {runs.map((run) => (
            <EvidenceCard
              key={run.id}
              run={run}
              onApply={(description) =>
                void onUpdate(item.id, { description }).catch(() => {})
              }
            />
          ))}
        </div>
        <div className="drawer-actions">
          <button
            className="delete-button"
            onClick={() => {
              const approved = window.confirm(
                "Delete this AI use case? Its immutable assessment evidence will remain in the run ledger.",
              );
              if (approved) onDelete(item.id);
            }}
          >
            Delete use case
          </button>
          <span>Assessment history is retained.</span>
        </div>
        <div className="drawer-proof">
          <Network size={15} />
          <span>
            Changes to this entity are propagated through ontology applicability
            and evaluated by the LangGraph runtime.
          </span>
        </div>
      </aside>
    </div>
  );
}
function EvidenceCard({
  run,
  onApply,
}: {
  run: Run;
  onApply: (description: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <article className="evidence-card">
      <button className="evidence-head" onClick={() => setOpen(!open)}>
        <span className="evidence-result-icon">
          {/review|required|attention/i.test(run.outcome) ? (
            <ShieldAlert size={15} />
          ) : (
            <CheckCircle2 size={15} />
          )}
        </span>
        <span className="evidence-title">
          <b>{run.assessmentName}</b>
          <small>
            {run.trigger} ·{" "}
            {new Date(run.createdAt).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </small>
        </span>
        <span className="evidence-score">
          {run.score}
          <small>/100</small>
        </span>
        <ChevronDown size={15} className={open ? "rotate" : ""} />
      </button>
      <div className="evidence-outcome">{run.outcome}</div>
      {open && (
        <div className="evidence-body">
          <p>{run.rationale}</p>
          <b>Evidence</b>
          <ul>
            {run.evidence.map((entry, index) => (
              <li key={index}>{entry}</li>
            ))}
          </ul>
          <b>Recommended action</b>
          <p>{run.recommendation}</p>
          {run.suggestedDescription && (
            <div className="description-suggestion">
              <div>
                <Sparkles size={12} /> ENHANCED DESCRIPTION SUGGESTION ·
                RULE-BASED
              </div>
              <p>{run.suggestedDescription}</p>
              <button
                type="button"
                onClick={() => onApply(run.suggestedDescription!)}
              >
                Use this description · re-run applicable assessments
              </button>
            </div>
          )}
          <div className="trace-chain">
            {(run.trace ?? []).map((step, index) => (
              <span key={index}>
                <i>{index + 1}</i>
                {step}
                {index < run.trace.length - 1 && <ArrowRight size={11} />}
              </span>
            ))}
          </div>
          <code className="trace-id">
            GRAPH EXECUTION · {run.graphExecutionId ?? run.id}
          </code>
        </div>
      )}
    </article>
  );
}
function DetailFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-fact">
      <span>{label}</span>
      <b>{value || "Not specified"}</b>
    </div>
  );
}
