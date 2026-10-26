import { ArrowUpRight, Boxes, GitBranch, Layers3, Link2 } from "lucide-react";
import type {
  OntologyClass,
  OntologyModel,
  OntologyRelationship,
} from "../../domain/ontology";

export function OntologyInspector({
  model,
  selectedId,
  onOpenUseCase,
}: {
  model: OntologyModel;
  selectedId: string;
  onOpenUseCase: (id: string) => void;
}) {
  const selectedClass = model.classes.find((item) => item.id === selectedId);
  const selectedRelationship = model.relationships.find(
    (item) => item.id === selectedId,
  );
  return (
    <aside className="ontology-inspector" aria-live="polite">
      {selectedClass ? (
        <ClassDetails
          model={model}
          item={selectedClass}
          onOpenUseCase={onOpenUseCase}
        />
      ) : selectedRelationship ? (
        <RelationshipDetails model={model} item={selectedRelationship} />
      ) : (
        <div className="ontology-inspector-empty">
          Select a class or relationship to inspect its ontology contract.
        </div>
      )}
    </aside>
  );
}

function ClassDetails({
  model,
  item,
  onOpenUseCase,
}: {
  model: OntologyModel;
  item: OntologyClass;
  onOpenUseCase: (id: string) => void;
}) {
  const relations = model.relationships.filter(
    (relation) => relation.domain === item.id || relation.range === item.id,
  );
  return (
    <>
      <div className="ontology-inspector-header">
        <span className={`ontology-type-icon layer-${item.layer}`}>
          <Boxes size={16} />
        </span>
        <div>
          <span className="eyebrow">ONTOLOGY CLASS</span>
          <h2>{item.label}</h2>
        </div>
      </div>
      <p className="ontology-detail-copy">{item.description}</p>
      <div className="ontology-count-card">
        <strong>{item.count.toLocaleString()}</strong>
        <span>LIVE INSTANCES</span>
        <small>{item.storageKind}</small>
      </div>
      <section className="ontology-detail-section">
        <div className="ontology-detail-title">
          <Layers3 size={14} />
          <h3>Data properties</h3>
          <span>{item.properties.length}</span>
        </div>
        <div className="ontology-property-list">
          {item.properties.map((property) => (
            <article className="ontology-property" key={property.name}>
              <div>
                <b>{property.name}</b>
                <code>{property.type}</code>
              </div>
              <p>{property.description}</p>
              <small>Source: {property.source}</small>
            </article>
          ))}
        </div>
      </section>
      <section className="ontology-detail-section">
        <div className="ontology-detail-title">
          <Link2 size={14} />
          <h3>Object properties</h3>
          <span>{relations.length}</span>
        </div>
        <div className="ontology-relation-list">
          {relations.map((relation) => (
            <div className="ontology-relation-chip" key={relation.id}>
              <b>
                {relation.domain === item.id
                  ? relation.label
                  : `← ${relation.label}`}
              </b>
              <span>
                {
                  model.classes.find(
                    (candidate) =>
                      candidate.id ===
                      (relation.domain === item.id
                        ? relation.range
                        : relation.domain),
                  )?.label
                }
              </span>
            </div>
          ))}
        </div>
      </section>
      <section className="ontology-detail-section">
        <div className="ontology-detail-title">
          <GitBranch size={14} />
          <h3>Live instances</h3>
          <span>
            Showing {Math.min(item.instances.length, 4)} of {item.count}
          </span>
        </div>
        <div className="ontology-instance-list">
          {item.instances.slice(0, 4).map((instance) => (
            <article className="ontology-instance" key={instance.id}>
              <b>{instance.label}</b>
              <span>{instance.summary}</span>
              <small>{instance.sourceLabel}</small>
              {instance.sourceRecordId && (
                <button onClick={() => onOpenUseCase(instance.sourceRecordId!)}>
                  Open use case <ArrowUpRight size={12} />
                </button>
              )}
            </article>
          ))}
          {item.instances.length === 0 && (
            <p className="ontology-empty-note">
              No records instantiate this class yet. The class remains part of
              the ontology contract.
            </p>
          )}
        </div>
      </section>
    </>
  );
}

function RelationshipDetails({
  model,
  item,
}: {
  model: OntologyModel;
  item: OntologyRelationship;
}) {
  const domain =
    model.classes.find((candidate) => candidate.id === item.domain)?.label ??
    item.domain;
  const range =
    model.classes.find((candidate) => candidate.id === item.range)?.label ??
    item.range;
  return (
    <>
      <div className="ontology-inspector-header">
        <span className="ontology-type-icon relation">
          <Link2 size={16} />
        </span>
        <div>
          <span className="eyebrow">OBJECT PROPERTY</span>
          <h2>{item.label}</h2>
        </div>
      </div>
      <p className="ontology-detail-copy">{item.description}</p>
      <div className="ontology-triple">
        <span>{domain}</span>
        <b>{item.label}</b>
        <span>{range}</span>
      </div>
      <div className="ontology-count-card">
        <strong>{item.count.toLocaleString()}</strong>
        <span>LIVE RELATIONSHIPS</span>
        <small>Resolved from current lifecycle records</small>
      </div>
      <section className="ontology-detail-section">
        <div className="ontology-detail-title">
          <Layers3 size={14} />
          <h3>Predicate contract</h3>
        </div>
        <div className="ontology-predicate-row">
          <span>Domain</span>
          <b>{domain}</b>
        </div>
        <div className="ontology-predicate-row">
          <span>Range</span>
          <b>{range}</b>
        </div>
        <div className="ontology-predicate-row">
          <span>Source mapping</span>
          <code>{item.sourceMapping}</code>
        </div>
      </section>
      <section className="ontology-detail-section">
        <div className="ontology-detail-title">
          <GitBranch size={14} />
          <h3>Observed triples</h3>
          <span>{Math.min(item.examples.length, 5)}</span>
        </div>
        <div className="ontology-triple-list">
          {item.examples.slice(0, 5).map((example, index) => (
            <code key={`${example}-${index}`}>{example}</code>
          ))}
          {item.examples.length === 0 && (
            <p className="ontology-empty-note">
              No matching relationships are observed yet. New lifecycle events
              can materialize this predicate.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
