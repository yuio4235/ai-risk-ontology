import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Database,
  FileCheck2,
  GitBranch,
  Layers3,
  Network,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";
import { useState } from "react";
import type { Assessment, Overview, Run, UseCase } from "../api";
import type { AppPage } from "../domain/demoStory";
import OntologyGraph from "../components/OntologyGraph";
import { UseCaseWorkbench } from "../components/UseCaseWorkbench";
export function DashboardPage({
  data,
  onNew,
  onSelect,
  onPage,
}: {
  data: Overview | null;
  onNew: () => void;
  onSelect: (item: UseCase) => void;
  onPage: (page: AppPage) => void;
}) {
  const useCases = data?.useCases ?? [],
    assessments = data?.assessments ?? [],
    runs = data?.runs ?? [];
  const attention = runs.filter((r) =>
    /review|required|attention/i.test(r.outcome),
  );
  return (
    <div className="page-content">
      <section className="hero">
        <div className="hero-copy">
          <h1>
            From AI inventory
            <br />
            to <span>operating control.</span>
          </h1>
          <p>
            See the governance ontology connect AI use cases, policies, controls
            and evidence across the lifecycle.
          </p>
          <div className="hero-actions">
            <button className="button-primary" onClick={onNew}>
              <span>＋</span> Register a use case
            </button>
            <button
              className="button-ghost"
              onClick={() => onPage("Run history")}
            >
              <Activity size={16} /> Inspect live runs <ArrowRight size={14} />
            </button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="orbit orbit-outer" />
          <div className="orbit orbit-inner" />
          <div className="orbit-center">
            <div className="orbit-center-mark">
              <Network size={23} />
            </div>
            <span>
              AI GOVERNANCE
              <br />
              ONTOLOGY
            </span>
          </div>
          <div className="orbit-node orbit-n1">
            <Sparkles size={15} />
          </div>
          <div className="orbit-node orbit-n2">
            <ShieldCheck size={15} />
          </div>
          <div className="orbit-node orbit-n3">
            <Database size={15} />
          </div>
          <div className="orbit-node orbit-n4">
            <Workflow size={15} />
          </div>
        </div>
      </section>
      <div className="metrics-row">
        <Metric
          label="Governed use cases"
          value={data?.metrics.useCases ?? 0}
          icon={<Database />}
          foot={`${data?.metrics.submitted ?? 0} submitted`}
          tone="blue"
        />
        <Metric
          label="Active assessments"
          value={assessments.length}
          icon={<Layers3 />}
          foot="Registered policies"
          tone="violet"
        />
        <Metric
          label="Assessment runs"
          value={runs.length}
          icon={<Zap />}
          foot="Event-triggered evidence"
          tone="green"
        />
        <Metric
          label="Reviews surfaced"
          value={data?.metrics.attention ?? 0}
          icon={<ShieldAlert />}
          foot="Assessment outcomes"
          tone="amber"
        />
      </div>
      <OntologyGraph
        caseCount={useCases.length}
        assessmentCount={assessments.length}
        runCount={runs.length}
        onExplore={() => onPage("Ontology")}
      />
      <OperatingLoop />
      <UseCaseWorkbench
        items={useCases}
        runs={runs}
        onSelect={onSelect}
      />
      <div className="bottom-grid">
        <Signals
          runs={attention}
          useCases={useCases}
          onSelect={onSelect}
          onView={() => onPage("Run history")}
        />
        <LatestActivity
          runs={runs.slice(0, 4)}
          onView={() => onPage("Run history")}
        />
      </div>
      <footer className="page-foot">
        <span>ONTOLOGY AI GOVERNANCE CONTROL PLANE</span>
        <span>Deterministic demo evaluators · {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}
function Metric({
  label,
  value,
  icon,
  foot,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  foot: string;
  tone: string;
}) {
  return (
    <div className="metric-card">
      <div className="metric-top">
        <div className={`metric-icon ${tone}`}>{icon}</div>
      </div>
      <strong>{value}</strong>
      <b>{label}</b>
      <span className="metric-foot">{foot}</span>
    </div>
  );
}
function OperatingLoop() {
  const items = [
    ["01", "Business event", <Database />],
    ["02", "Ontology resolution", <Network />],
    ["03", "LangGraph runtime", <Workflow />],
    ["04", "Evidence lineage", <FileCheck2 />],
  ] as const;
  return (
    <section className="proof-strip">
      <div className="proof-intro">
        <span className="eyebrow">THE OPERATING LOOP</span>
        <b>
          Events become
          <br />
          governed action.
        </b>
      </div>
      {items.map(([n, title, icon], i) => (
        <div className="proof-group" key={n}>
          <div className="proof-step">
            <div className="proof-icon">{icon}</div>
            <div>
              <b>{title}</b>
            </div>
          </div>
          {i < items.length - 1 && (
            <div className="proof-arrow">
              <ArrowRight size={17} />
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
function Signals({
  runs,
  useCases,
  onSelect,
  onView,
}: {
  runs: Run[];
  useCases: UseCase[];
  onSelect: (x: UseCase) => void;
  onView: () => void;
}) {
  return (
    <section className="panel attention-panel">
      <div className="panel-head compact">
        <div>
          <h2>Signals that need a decision</h2>
        </div>
        <button className="text-action" onClick={onView}>
          View evidence <ArrowRight size={14} />
        </button>
      </div>
      {runs.slice(0, 3).map((r, i) => (
        <button
          className="signal-row"
          key={r.id}
          onClick={() => {
            const u = useCases.find((x) => x.id === r.useCaseId);
            if (u) onSelect(u);
          }}
        >
          <div className={`signal-icon signal-${i % 3}`}>
            <ShieldAlert size={16} />
          </div>
          <div className="signal-copy">
            <b>{r.outcome}</b>
            <span>
              {r.useCaseName} <i>·</i> {r.assessmentName}
            </span>
          </div>
          <span className="signal-score">
            {r.score}
            <small>/100</small>
          </span>
          <ArrowUpRight size={14} className="signal-arrow" />
        </button>
      ))}
      {runs.length === 0 && (
        <div className="calm-state">
          <CheckCircle2 size={17} /> No review signals in the current portfolio.
        </div>
      )}
    </section>
  );
}
function LatestActivity({ runs, onView }: { runs: Run[]; onView: () => void }) {
  return (
    <section className="panel activity-panel">
      <div className="panel-head compact">
        <div>
          <h2>Latest assessment activity</h2>
        </div>
        <button className="text-action" onClick={onView}>
          View all <ArrowRight size={14} />
        </button>
      </div>
      <div className="activity-list">
        {runs.map((r) => (
          <div className="activity-item" key={r.id}>
            <div
              className={`activity-dot ${/review|required|attention/i.test(r.outcome) ? "warn" : ""}`}
            >
              {/review|required|attention/i.test(r.outcome) ? (
                <ShieldAlert size={13} />
              ) : (
                <Check size={13} />
              )}
            </div>
            <div className="activity-content">
              <b>{r.assessmentName}</b>
              <span>
                {r.useCaseName} · {r.trigger}
              </span>
            </div>
            <div className="activity-time-col">
              <small>
                {new Date(r.createdAt).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </small>
              <span>
                {new Date(r.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        ))}
        {runs.length === 0 && (
          <div className="calm-state">
            Assessment activity will appear after submission.
          </div>
        )}
      </div>
    </section>
  );
}
