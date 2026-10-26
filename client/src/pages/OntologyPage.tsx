import { Box, Braces, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import type { Overview, UseCase } from "../api";
import { OntologyCanvas } from "../components/ontology/OntologyCanvas";
import { OntologyInspector } from "../components/ontology/OntologyInspector";
import { buildOntologyModel } from "../domain/ontology";

export function OntologyPage({
  data,
  onSelectUseCase,
}: {
  data: Overview | null;
  onSelectUseCase: (item: UseCase) => void;
}) {
  const [focus, setFocus] = useState<"classes" | "relationships">("classes");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("use-case");
  const model = useMemo(
    () =>
      buildOntologyModel({
        useCases: data?.useCases ?? [],
        assessments: data?.assessments ?? [],
        runs: data?.runs ?? [],
      }),
    [data],
  );
  const instanceCount = model.classes.reduce(
    (count, item) => count + item.count,
    0,
  );

  return (
    <div className="page-content subpage ontology-page">
      <div className="page-title-row ontology-title-row">
        <div>
          <h1>Ontology explorer</h1>
        </div>
      </div>

      <section className="ontology-summary-row" aria-label="Ontology summary">
        <Summary
          icon={<Box size={16} />}
          label="Ontology classes"
          value={model.classes.length}
        />
        <Summary
          icon={<Braces size={16} />}
          label="Typed relationships"
          value={model.relationships.length}
        />
        <Summary
          icon={<Search size={16} />}
          label="Projected instances"
          value={instanceCount}
        />
      </section>

      <section className="ontology-workspace panel">
        <div className="ontology-workspace-toolbar">
          <div
            className="ontology-focus-switch"
            role="tablist"
            aria-label="Ontology focus"
          >
            <button
              role="tab"
              aria-selected={focus === "classes"}
              className={focus === "classes" ? "active" : ""}
              onClick={() => {
                setFocus("classes");
                if (
                  model.relationships.some((item) => item.id === selectedId)
                ) {
                  setSelectedId(model.classes[0]?.id ?? "");
                }
              }}
            >
              Classes <span>{model.classes.length}</span>
            </button>
            <button
              role="tab"
              aria-selected={focus === "relationships"}
              className={focus === "relationships" ? "active" : ""}
              onClick={() => {
                setFocus("relationships");
                if (model.classes.some((item) => item.id === selectedId)) {
                  setSelectedId(model.relationships[0]?.id ?? "");
                }
              }}
            >
              Relationships <span>{model.relationships.length}</span>
            </button>
          </div>
          <label className="ontology-search">
            <Search size={15} />
            <input
              aria-label="Search ontology"
              placeholder="Find a class, property or predicate"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query && (
              <button type="button" onClick={() => setQuery("")}>
                Clear
              </button>
            )}
          </label>
          <div className="ontology-key">
            <i className="key-core" /> Core classes{" "}
            <i className="key-vocabulary" /> Projected vocabulary
          </div>
        </div>
        <div className="ontology-workspace-body">
          <div className="ontology-graph-column">
            <div className="ontology-graph-heading">
              <div>
                <b>AI governance operating model</b>
              </div>
              <span className="graph-version">MODEL v1.0</span>
            </div>
            <OntologyCanvas
              model={model}
              focus={focus}
              query={query}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
            <div className="ontology-workspace-foot">
              <span>
                <i /> Persisted entity
              </span>
              <span>
                <i /> Projected vocabulary
              </span>
              <span>Evidence Item is embedded in Assessment Run</span>
            </div>
          </div>
          <OntologyInspector
            model={model}
            selectedId={selectedId}
            onOpenUseCase={(id) => {
              const item = data?.useCases.find((useCase) => useCase.id === id);
              if (item) onSelectUseCase(item);
            }}
          />
        </div>
      </section>
      <div className="ontology-honesty-note">
        <ShieldCheck size={15} />
        <span>
          <b>Ontology view:</b> this demo projects typed classes and predicates
          from the application schema and MongoDB records. It demonstrates
          semantic relationships and executable lifecycle policy; it does not
          claim to run an RDF/OWL triple store.
        </span>
      </div>
    </div>
  );
}

function Summary({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="ontology-summary-card">
      <span>{icon}</span>
      <div>
        <strong>{value.toLocaleString()}</strong>
        <small>{label}</small>
      </div>
    </div>
  );
}
