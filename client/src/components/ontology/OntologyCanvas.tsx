import type { OntologyModel } from "../../domain/ontology";

const nodeWidth = 196;
const nodeHeight = 78;

const edgePaths: Record<string, { d: string; x: number; y: number }> = {
  "belongs-to": { d: "M332 282 C250 264 224 197 226 160", x: 255, y: 230 },
  "uses-technology": { d: "M332 320 C245 342 222 420 226 455", x: 252, y: 388 },
  "uses-data-category": { d: "M332 300 L228 300", x: 280, y: 283 },
  "evaluated-by": { d: "M430 261 L430 140", x: 468, y: 205 },
  "governs-domain": { d: "M528 100 L652 100", x: 590, y: 84 },
  "creates-run": { d: "M518 127 C575 160 590 242 654 277", x: 582, y: 184 },
  "assesses-use-case": { d: "M652 300 L528 300", x: 590, y: 323 },
  "emits-evidence": { d: "M750 339 L750 461", x: 790, y: 405 },
};

export function OntologyCanvas({
  model,
  focus,
  query,
  selectedId,
  onSelect,
}: {
  model: OntologyModel;
  focus: "classes" | "relationships";
  query: string;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const search = query.trim().toLowerCase();
  const visibleClasses = new Set(
    model.classes
      .filter(
        (item) =>
          !search ||
          item.label.toLowerCase().includes(search) ||
          item.description.toLowerCase().includes(search) ||
          item.properties.some((property) =>
            property.name.toLowerCase().includes(search),
          ),
      )
      .map((item) => item.id),
  );
  const visibleRelationships = new Set(
    model.relationships
      .filter(
        (item) =>
          !search ||
          item.label.toLowerCase().includes(search) ||
          item.description.toLowerCase().includes(search) ||
          `${item.domain} ${item.range}`.toLowerCase().includes(search),
      )
      .map((item) => item.id),
  );
  return (
    <div
      className="ontology-canvas-scroll"
      aria-label="Ontology class and relationship graph"
    >
      <svg
        className={`ontology-model-svg focus-${focus}`}
        viewBox="0 0 960 570"
        role="img"
        aria-labelledby="ontology-graph-title ontology-graph-description"
      >
        <title id="ontology-graph-title">AI governance ontology graph</title>
        <desc id="ontology-graph-description">
          Eight ontology classes connected by typed business relationships.
          Select a class or edge to inspect it.
        </desc>
        <defs>
          <marker
            id="ontology-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" />
          </marker>
        </defs>
        <g className="ontology-edges">
          {model.relationships.map((relationship) => {
            const layout =
              edgePaths[relationship.id] ?? edgePaths["evaluated-by"]!;
            const matched =
              !search || visibleRelationships.has(relationship.id);
            const selected = selectedId === relationship.id;
            const muted = !matched;
            return (
              <g
                key={relationship.id}
                className={`ontology-edge ${selected ? "selected" : ""} ${muted ? "muted" : ""}`}
                role="button"
                tabIndex={0}
                aria-label={`${model.classes.find((item) => item.id === relationship.domain)?.label} ${relationship.label} ${model.classes.find((item) => item.id === relationship.range)?.label}`}
                onClick={() => onSelect(relationship.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(relationship.id);
                  }
                }}
              >
                <path className="ontology-edge-hit" d={layout.d} />
                <path
                  className="ontology-edge-line"
                  d={layout.d}
                  markerEnd="url(#ontology-arrow)"
                />
                <rect
                  className="ontology-edge-label-bg"
                  x={
                    layout.x -
                    (relationship.id === "uses-data-category" ? 52 : 59)
                  }
                  y={layout.y - 11}
                  width={
                    relationship.id === "uses-data-category" ? "104" : "118"
                  }
                  height="22"
                  rx="11"
                />
                <text
                  className="ontology-edge-label"
                  x={layout.x}
                  y={layout.y + 3}
                  textAnchor="middle"
                >
                  {relationship.label}
                </text>
              </g>
            );
          })}
        </g>
        <g className="ontology-nodes">
          {model.classes.map((item) => {
            const matched =
              !search ||
              visibleClasses.has(item.id) ||
              model.relationships.some(
                (relationship) =>
                  visibleRelationships.has(relationship.id) &&
                  (relationship.domain === item.id ||
                    relationship.range === item.id),
              );
            const muted = !matched;
            const selected = selectedId === item.id;
            return (
              <g
                key={item.id}
                className={`ontology-class-node layer-${item.layer} ${selected ? "selected" : ""} ${muted ? "muted" : ""}`}
                role="button"
                tabIndex={0}
                aria-label={`${item.label}, ${item.count} instances`}
                onClick={() => onSelect(item.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(item.id);
                  }
                }}
              >
                <rect
                  x={item.x - nodeWidth / 2}
                  y={item.y - nodeHeight / 2}
                  width={nodeWidth}
                  height={nodeHeight}
                  rx="13"
                />
                <circle
                  className="ontology-node-icon"
                  cx={item.x - 76}
                  cy={item.y}
                  r="14"
                />
                <text
                  className="ontology-node-glyph"
                  x={item.x - 76}
                  y={item.y + 4}
                  textAnchor="middle"
                >
                  {item.label.slice(0, 1)}
                </text>
                <text
                  className="ontology-node-title"
                  x={item.x - 52}
                  y={item.y - 5}
                >
                  {item.label}
                </text>
                <text
                  className="ontology-node-count"
                  x={item.x - 52}
                  y={item.y + 15}
                >
                  {item.count.toLocaleString()}{" "}
                  {item.count === 1 ? "instance" : "instances"}
                </text>
                <circle
                  className="ontology-node-status"
                  cx={item.x + 82}
                  cy={item.y - 25}
                  r="3.5"
                />
              </g>
            );
          })}
        </g>
      </svg>
      <div className="ontology-canvas-caption">
        <span className="live-pulse" /> LIVE DATA PROJECTION <i /> Select any
        class or predicate to inspect its contract
      </div>
    </div>
  );
}
