import {
  Activity,
  ArrowRight,
  BrainCircuit,
  Layers3,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import type { Assessment, Run } from "../api";
const icons = [BrainCircuit, Layers3, Workflow, Activity];
export function AssessmentsPage({
  assessments,
  runs,
  onRegister,
}: {
  assessments: Assessment[];
  runs: Run[];
  onRegister: () => void;
}) {
  return (
    <div className="page-content subpage">
      <div className="page-title-row">
        <div>
          <h1>Assessment policies</h1>
        </div>
        <button className="button-primary" onClick={onRegister}>
          ＋ Register assessment
        </button>
      </div>
      <div className="policy-grid">
        {assessments.map((assessment, index) => (
          <PolicyCard
            key={assessment.id}
            assessment={assessment}
            index={index}
            runs={runs.filter((run) => run.assessmentId === assessment.id)}
          />
        ))}
      </div>
      <section className="panel registry-panel">
        <div className="panel-head compact">
          <div>
            <h2>Policy execution path</h2>
          </div>
          <div className="registry-lock">
            <ShieldCheck size={16} /> Allow-listed evaluators
          </div>
        </div>
        <div className="contract-row">
          {[
            "Assessment definition",
            "Applicability predicate",
            "LangGraph execution",
            "Persisted evidence",
          ].map((item, index) => (
            <div className="contract-step" key={item}>
              <span>0{index + 1}</span>
              <b>{item}</b>
              {index < 3 && <ArrowRight size={15} />}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
function PolicyCard({
  assessment,
  index,
  runs,
}: {
  assessment: Assessment;
  index: number;
  runs: Run[];
}) {
  const Icon = icons[index % icons.length]!;
  const flagged = runs.filter((run) =>
    /review|required|attention/i.test(run.outcome),
  ).length;
  return (
    <article className="panel policy-card">
      <div className="policy-card-top">
        <div className={`policy-icon policy-tone-${index % 4}`}>
          <Icon size={19} />
        </div>
        <span className="version-badge">v{assessment.version}</span>
      </div>
      <span className="policy-category">{assessment.category}</span>
      <h3>{assessment.name}</h3>
      <p>{assessment.description}</p>
      <div className="policy-predicate">
        <span>APPLIES WHEN</span>
        <code>
          {assessment.applicability.operator === "signal"
            ? assessment.evaluator === "regulatory-risk"
              ? "Submitted record contains regulatory exposure signals"
              : "Submitted record contains financial-crime control signals"
            : `${assessment.applicability.field} ${assessment.applicability.operator} “${assessment.applicability.value ?? "all records"}”`}
        </code>
      </div>
      <div className="policy-card-footer">
        <span>
          <Activity size={13} />
          {runs.length} runs · {flagged} review signals
        </span>
        <span className="enabled-state">
          <i /> Enabled
        </span>
      </div>
    </article>
  );
}
