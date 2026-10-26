import { useEffect, useState } from "react";
import {
  Activity,
  BrainCircuit,
  ChevronDown,
  CircleHelp,
  Database,
  FileCheck2,
  Layers3,
  Network,
  RefreshCw,
  ShieldCheck,
  Workflow,
  X,
} from "lucide-react";
import type { UseCase } from "./api";
import { DemoGuide } from "./components/DemoGuide";
import type { AppPage } from "./domain/demoStory";
import { AssessmentForm } from "./components/AssessmentForm";
import { UseCaseDrawer } from "./components/UseCaseDrawer";
import { UseCaseForm } from "./components/UseCaseForm";
import { useOntology } from "./hooks/useOntology";
import { AssessmentsPage } from "./pages/AssessmentsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { RunHistoryPage } from "./pages/RunHistoryPage";
import { OntologyPage } from "./pages/OntologyPage";
import { UseCasesPage } from "./pages/UseCasesPage";
import "./styles.css";
import "./theme-hsbc.css";
type Page = AppPage;
type Dialog = "case" | "edit" | "assessment" | null;
const navIcons = [BrainCircuit, Network, Database, Layers3, Activity];
export default function App() {
  const [page, setPage] = useState<Page>("Overview");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [selected, setSelected] = useState<UseCase | null>(null);
  const [editing, setEditing] = useState<UseCase | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideStep, setGuideStep] = useState(0);
  const state = useOntology();
  const overview = state.data;
  const useCases = overview?.useCases ?? [];
  const runs = overview?.runs ?? [];
  useEffect(() => {
    const handler = (event: Event) =>
      setPage((event as CustomEvent<Page>).detail);
    window.addEventListener("ontology:navigate", handler);
    return () => window.removeEventListener("ontology:navigate", handler);
  }, []);
  return (
    <div className="app-shell">
      <Sidebar
        page={page}
        onPage={setPage}
        policyCount={overview?.assessments.length ?? 0}
        runCount={runs.length}
        coverage={
          overview?.metrics.submitted
            ? Math.min(
                100,
                Math.round(
                  (runs.length /
                    (overview.metrics.submitted *
                      Math.max(1, overview.metrics.assessments))) *
                    100,
                ),
              )
            : 0
        }
      />
      <main className="main-shell">
        <Topbar
          page={page}
          refreshing={state.refreshing}
          onRefresh={() => void state.refresh()}
          onGuide={() => setGuideOpen(true)}
        />
        {state.error && (
          <div className="api-banner">
            <ShieldCheck size={16} />
            <span>
              API connection unavailable: {state.error}. Start MongoDB and the
              API with <code>npm run dev</code>.
            </span>
            <button onClick={() => void state.refresh()}>Retry</button>
          </div>
        )}
        {page === "Overview" && (
          <DashboardPage
            data={overview}
            onNew={() => setDialog("case")}
            onSelect={setSelected}
            onPage={setPage}
          />
        )}
        {page === "Use cases" && (
          <UseCasesPage
            items={useCases}
            runs={runs}
            onNew={() => setDialog("case")}
            onSelect={setSelected}
          />
        )}
        {page === "Ontology" && (
          <OntologyPage data={overview} onSelectUseCase={setSelected} />
        )}
        {page === "Assessments" && (
          <AssessmentsPage
            assessments={overview?.assessments ?? []}
            runs={runs}
            onRegister={() => setDialog("assessment")}
          />
        )}
        {page === "Run history" && (
          <RunHistoryPage
            runs={runs}
            useCases={useCases}
            onSelect={setSelected}
            onRefresh={() => void state.refresh()}
            onRun={(assessmentId, useCaseId) =>
              state.runAssessment(assessmentId, useCaseId)
            }
            busy={state.busy}
          />
        )}
      </main>
      {(dialog === "case" || dialog === "edit") && (
        <UseCaseForm
          initial={dialog === "edit" ? (editing ?? undefined) : undefined}
          onClose={() => {
            setDialog(null);
            setEditing(null);
          }}
          onSave={(id, value) =>
            id ? state.updateUseCase(id, value) : state.createUseCase(value)
          }
          busy={state.busy}
        />
      )}
      {dialog === "assessment" && (
        <AssessmentForm
          onClose={() => setDialog(null)}
          onRegister={state.registerAssessment}
          busy={state.busy}
        />
      )}
      {selected && (
        <UseCaseDrawer
          item={useCases.find((x) => x.id === selected.id) ?? selected}
          runs={runs.filter((x) => x.useCaseId === selected.id)}
          onClose={() => setSelected(null)}
          onSubmit={(id) => void state.submitUseCase(id)}
          onUpdate={state.updateUseCase}
          onEdit={() => {
            setEditing(useCases.find((x) => x.id === selected.id) ?? selected);
            setSelected(null);
            setDialog("edit");
          }}
          onDelete={(id) => {
            void state.deleteUseCase(id).catch(() => {});
            setSelected(null);
          }}
        />
      )}
      {guideOpen && (
        <DemoGuide
          activeIndex={guideStep}
          onActiveIndexChange={setGuideStep}
          onClose={() => setGuideOpen(false)}
          onNavigate={setPage}
        />
      )}
      {state.notice && (
        <div className="toast">
          <ShieldCheck size={16} />
          {state.notice}
          <button onClick={() => state.setNotice("")}>
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
function Sidebar({
  page,
  onPage,
  policyCount,
  runCount,
  coverage,
}: {
  page: Page;
  onPage: (page: Page) => void;
  policyCount: number;
  runCount: number;
  coverage: number;
}) {
  const pages: Page[] = [
    "Overview",
    "Ontology",
    "Use cases",
    "Assessments",
    "Run history",
  ];
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <Network size={19} />
        </div>
        <div className="brand-name">
          ONTOLOGY<span>AI GOVERNANCE</span>
        </div>
      </div>
      <div className="workspace-switch">
        <div className="workspace-glyph">H</div>
        <div>
          <b>Group AI Office</b>
          <small>Enterprise workspace</small>
        </div>
        <ChevronDown size={14} />
      </div>
      <div className="nav-section-label">CONTROL PLANE</div>
      <nav>
        {pages.map((item, index) => {
          const Icon = navIcons[index]!;
          return (
            <button
              key={item}
              className={`nav-link ${page === item ? "active" : ""}`}
              aria-label={item}
              title={item}
              onClick={() => onPage(item)}
            >
              <Icon size={17} />
              <span>{item}</span>
              {item === "Run history" && runCount > 0 && (
                <span className="nav-count">{runCount}</span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="sidebar-divider" />
      <div className="nav-section-label">GOVERNANCE</div>
      <button className="nav-link" onClick={() => onPage("Assessments")}>
        <ShieldCheck size={17} />
        <span>Policy registry</span>
        {policyCount > 0 && <span className="nav-count">{policyCount}</span>}
      </button>
      <button className="nav-link" onClick={() => onPage("Run history")}>
        <FileCheck2 size={17} />
        <span>Evidence ledger</span>
      </button>
      <div className="sidebar-bottom">
        <div className="runtime-card">
          <div className="runtime-card-head">
            <span className="live-pulse" /> PLATFORM STATUS
          </div>
          <div className="runtime-status">
            <b>Runtime online</b>
            <span>LangGraph · MongoDB</span>
          </div>
          <div className="runtime-card-line">
            <span>Policy coverage</span>
            <b>{coverage}%</b>
          </div>
          <div className="runtime-progress">
            <i style={{ width: `${coverage}%` }} />
          </div>
        </div>
        <div className="profile">
          <div className="profile-avatar">AZ</div>
          <div>
            <b>Alex Zhang</b>
            <small>Chief AI Office</small>
          </div>
          <ChevronDown size={15} />
        </div>
      </div>
    </aside>
  );
}
function Topbar({
  page,
  refreshing,
  onRefresh,
  onGuide,
}: {
  page: Page;
  refreshing: boolean;
  onRefresh: () => void;
  onGuide: () => void;
}) {
  return (
    <header className="topbar">
      <div className="breadcrumb">
        <span>Enterprise</span>
        <span className="crumb-slash">/</span>
        <b>{page}</b>
        <span className="env-tag">
          <i />
          DEMO ENVIRONMENT
        </span>
      </div>
      <div className="topbar-actions">
        <div className="system-status">
          <span className="live-pulse" /> All systems operational
        </div>
        <button className="top-icon" title="Refresh data" onClick={onRefresh}>
          <RefreshCw size={15} className={refreshing ? "spin" : ""} />
        </button>
        <button className="help-button" onClick={onGuide}>
          <CircleHelp size={15} /> CAIO demo guide
        </button>
      </div>
    </header>
  );
}
