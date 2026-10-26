import {
  ArrowUpRight,
  Database,
  GitBranch,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
export default function OntologyGraph({
  caseCount,
  assessmentCount,
  runCount,
  onExplore,
}: {
  caseCount: number;
  assessmentCount: number;
  runCount: number;
  onExplore: () => void;
}) {
  return (
    <section className="panel graph-panel">
      <div className="panel-head">
        <div>
          <h2>One model. Every control connected.</h2>
        </div>
        <button className="text-action" onClick={onExplore}>
          Explore ontology <ArrowUpRight size={15} />
        </button>
      </div>
      <div className="ontology-canvas">
        <div className="graph-lines">
          <svg viewBox="0 0 800 230" preserveAspectRatio="none">
            <path d="M140 116 C260 116 260 56 366 56" />
            <path d="M140 116 C260 116 260 174 366 174" />
            <path d="M433 56 C532 56 530 116 647 116" />
            <path d="M433 174 C532 174 530 116 647 116" />
            <path d="M140 116 C313 214 492 214 647 116" className="dashed" />
            <circle cx="253" cy="116" r="4" />
            <circle cx="538" cy="86" r="4" />
            <circle cx="538" cy="146" r="4" />
          </svg>
        </div>
        <div className="ontology-node node-usecase">
          <div className="node-icon blue">
            <Database size={18} />
          </div>
          <div>
            <b>AI Use Case</b>
            <small>{caseCount} governed records</small>
          </div>
          <span className="node-dot" />
        </div>
        <div className="ontology-node node-assess">
          <div className="node-icon violet">
            <GitBranch size={18} />
          </div>
          <div>
            <b>Assessment</b>
            <small>{assessmentCount} registered policies</small>
          </div>
        </div>
        <div className="ontology-node node-run">
          <div className="node-icon green">
            <Sparkles size={18} />
          </div>
          <div>
            <b>Assessment Run</b>
            <small>{runCount} explainable decisions</small>
          </div>
        </div>
        <div className="ontology-node node-control">
          <div className="node-icon amber">
            <ShieldCheck size={18} />
          </div>
          <div>
            <b>Control & Evidence</b>
            <small>Owners · rationale · lineage</small>
          </div>
        </div>
      </div>
    </section>
  );
}
