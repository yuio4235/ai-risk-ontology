import type { Assessment, Run, UseCase } from "../api";

export type OntologyInstance = {
  id: string;
  label: string;
  summary: string;
  sourceLabel: string;
  sourceRecordId?: string;
};

export type OntologyClass = {
  id: string;
  label: string;
  layer: "business" | "governance" | "evidence" | "reference";
  description: string;
  storageKind:
    "persisted entity" | "embedded projection" | "vocabulary projection";
  properties: Array<{
    name: string;
    type: string;
    source: string;
    description: string;
  }>;
  instances: OntologyInstance[];
  count: number;
  x: number;
  y: number;
};

export type OntologyRelationship = {
  id: string;
  label: string;
  domain: string;
  range: string;
  description: string;
  sourceMapping: string;
  count: number;
  examples: string[];
};

export type OntologyModel = {
  classes: OntologyClass[];
  relationships: OntologyRelationship[];
};

type SourceData = {
  useCases: UseCase[];
  assessments: Assessment[];
  runs: Run[];
};

const uniqueValues = (values: string[]) => [
  ...new Set(values.map((value) => value.trim()).filter(Boolean)),
];

export function buildOntologyModel(data: SourceData): OntologyModel {
  const useCaseInstances = data.useCases.map((item) => ({
    id: item.id,
    label: item.name,
    summary: `${item.status} · ${item.businessUnit}`,
    sourceLabel: "AI Use Case record",
    sourceRecordId: item.id,
  }));
  const assessmentInstances = data.assessments.map((item) => ({
    id: item.id,
    label: item.name,
    summary: `${item.evaluator} · v${item.version}`,
    sourceLabel: "Assessment registry",
  }));
  const runInstances = data.runs.map((item) => ({
    id: item.id,
    label: item.assessmentName,
    summary: `${item.outcome} · ${item.trigger}`,
    sourceLabel: `Assessment Run ${item.graphExecutionId.slice(0, 12)}`,
  }));
  const evidenceInstances = data.runs.flatMap((run) =>
    run.evidence.map((text, index) => ({
      id: `${run.id}-evidence-${index}`,
      label: text,
      summary: `Evidence for ${run.assessmentName}`,
      sourceLabel: `Assessment Run ${run.graphExecutionId.slice(0, 12)}`,
    })),
  );
  const businessUnits = uniqueValues(
    data.useCases.map((item) => item.businessUnit),
  );
  const technologies = uniqueValues(
    data.useCases.map((item) => item.technology),
  );
  const dataCategories = uniqueValues(
    data.useCases.flatMap((item) => item.dataTypes),
  );
  const domains = uniqueValues(data.assessments.map((item) => item.category));
  const classes: OntologyClass[] = [
    {
      id: "use-case",
      label: "AI Use Case",
      layer: "business",
      description:
        "A governed business application with an owner, purpose, technology, data, decisions, and lifecycle state.",
      storageKind: "persisted entity",
      properties: [
        {
          name: "name",
          type: "string",
          source: "UseCase.name",
          description: "Business-facing use-case name.",
        },
        {
          name: "owner",
          type: "string",
          source: "UseCase.owner",
          description: "Accountable business owner.",
        },
        {
          name: "status",
          type: "lifecycle state",
          source: "UseCase.status",
          description: "Current lifecycle position.",
        },
        {
          name: "dataTypes",
          type: "string[]",
          source: "UseCase.dataTypes",
          description: "Declared data categories.",
        },
        {
          name: "decisions",
          type: "string",
          source: "UseCase.decisions",
          description: "Decision or action supported.",
        },
      ],
      instances: useCaseInstances,
      count: useCaseInstances.length,
      x: 430,
      y: 300,
    },
    {
      id: "assessment",
      label: "Assessment Policy",
      layer: "governance",
      description:
        "A versioned policy definition with a controlled evaluator and a declarative applicability rule.",
      storageKind: "persisted entity",
      properties: [
        {
          name: "evaluator",
          type: "controlled evaluator",
          source: "Assessment.evaluator",
          description: "Allow-listed assessment behavior.",
        },
        {
          name: "applicability",
          type: "condition",
          source: "Assessment.applicability",
          description: "Declared facts used to resolve policy scope.",
        },
        {
          name: "version",
          type: "string",
          source: "Assessment.version",
          description: "Policy version recorded with each run.",
        },
      ],
      instances: assessmentInstances,
      count: assessmentInstances.length,
      x: 430,
      y: 100,
    },
    {
      id: "assessment-run",
      label: "Assessment Run",
      layer: "evidence",
      description:
        "An immutable execution record linking a lifecycle trigger to a policy decision and its trace.",
      storageKind: "persisted entity",
      properties: [
        {
          name: "trigger",
          type: "event type",
          source: "AssessmentRun.trigger",
          description: "Submission, data change, or policy registration.",
        },
        {
          name: "outcome",
          type: "decision",
          source: "AssessmentRun.outcome",
          description: "Human-readable evaluator outcome.",
        },
        {
          name: "graphExecutionId",
          type: "string",
          source: "AssessmentRun.graphExecutionId",
          description: "LangGraph execution lineage identifier.",
        },
      ],
      instances: runInstances,
      count: runInstances.length,
      x: 750,
      y: 300,
    },
    {
      id: "evidence-item",
      label: "Evidence Item",
      layer: "evidence",
      description:
        "A supporting evidence statement stored inside its parent Assessment Run.",
      storageKind: "embedded projection",
      properties: [
        {
          name: "statement",
          type: "string",
          source: "AssessmentRun.evidence[]",
          description: "A fact cited by the evaluator.",
        },
        {
          name: "parentRun",
          type: "Assessment Run",
          source: "AssessmentRun.id",
          description: "Execution that produced the evidence.",
        },
      ],
      instances: evidenceInstances,
      count: evidenceInstances.length,
      x: 750,
      y: 500,
    },
    {
      id: "business-unit",
      label: "Business Unit",
      layer: "reference",
      description:
        "A distinct business-unit value projected from active use-case records.",
      storageKind: "vocabulary projection",
      properties: [
        {
          name: "name",
          type: "string",
          source: "UseCase.businessUnit",
          description: "Business-unit vocabulary value.",
        },
      ],
      instances: businessUnits.map((value) => ({
        id: value,
        label: value,
        summary: `${data.useCases.filter((item) => item.businessUnit === value).length} use cases`,
        sourceLabel: "Projected from AI Use Case records",
      })),
      count: businessUnits.length,
      x: 130,
      y: 150,
    },
    {
      id: "technology",
      label: "Technology",
      layer: "reference",
      description: "A distinct technology value declared on use-case records.",
      storageKind: "vocabulary projection",
      properties: [
        {
          name: "name",
          type: "string",
          source: "UseCase.technology",
          description: "Technology or model approach.",
        },
      ],
      instances: technologies.map((value) => ({
        id: value,
        label: value,
        summary: `${data.useCases.filter((item) => item.technology === value).length} use cases`,
        sourceLabel: "Projected from AI Use Case records",
      })),
      count: technologies.length,
      x: 130,
      y: 465,
    },
    {
      id: "data-category",
      label: "Data Category",
      layer: "reference",
      description:
        "A distinct data sensitivity or information category declared on use-case records.",
      storageKind: "vocabulary projection",
      properties: [
        {
          name: "name",
          type: "string",
          source: "UseCase.dataTypes[]",
          description: "Declared data category or sensitivity label.",
        },
      ],
      instances: dataCategories.map((value) => ({
        id: value,
        label: value,
        summary: `${data.useCases.filter((item) => item.dataTypes.includes(value)).length} use cases`,
        sourceLabel: "Projected from AI Use Case records",
      })),
      count: dataCategories.length,
      x: 130,
      y: 300,
    },
    {
      id: "control-domain",
      label: "Control Domain",
      layer: "governance",
      description:
        "A governance-domain vocabulary value declared by an Assessment Policy.",
      storageKind: "vocabulary projection",
      properties: [
        {
          name: "name",
          type: "string",
          source: "Assessment.category",
          description: "Policy domain used for governance ownership.",
        },
      ],
      instances: domains.map((value) => ({
        id: value,
        label: value,
        summary: `${data.assessments.filter((item) => item.category === value).length} policies`,
        sourceLabel: "Projected from Assessment records",
      })),
      count: domains.length,
      x: 750,
      y: 100,
    },
  ];

  const uniqueRunPairs = new Set(
    data.runs.map((run) => `${run.assessmentId}:${run.useCaseId}`),
  );
  const useCasesById = new Map(data.useCases.map((item) => [item.id, item]));
  const assessmentsById = new Map(
    data.assessments.map((item) => [item.id, item]),
  );
  const relationships: OntologyRelationship[] = [
    {
      id: "belongs-to",
      label: "belongs to",
      domain: "use-case",
      range: "business-unit",
      description: "Places a use case in its accountable business area.",
      sourceMapping: "UseCase.businessUnit → Business Unit.name",
      count: data.useCases.filter((item) => item.businessUnit.trim()).length,
      examples: data.useCases
        .slice(0, 3)
        .map((item) => `${item.name} → ${item.businessUnit}`),
    },
    {
      id: "uses-technology",
      label: "uses technology",
      domain: "use-case",
      range: "technology",
      description:
        "Connects each use case to its declared solution technology.",
      sourceMapping: "UseCase.technology → Technology.name",
      count: data.useCases.filter((item) => item.technology.trim()).length,
      examples: data.useCases
        .slice(0, 3)
        .map((item) => `${item.name} → ${item.technology}`),
    },
    {
      id: "uses-data-category",
      label: "uses data category",
      domain: "use-case",
      range: "data-category",
      description:
        "Connects a use case to each declared data category and sensitivity label.",
      sourceMapping: "UseCase.dataTypes[] → Data Category.name",
      count: data.useCases.reduce(
        (count, item) =>
          count + item.dataTypes.filter((value) => value.trim()).length,
        0,
      ),
      examples: data.useCases
        .slice(0, 3)
        .flatMap((item) =>
          item.dataTypes.map((value) => `${item.name} → ${value}`),
        ),
    },
    {
      id: "evaluated-by",
      label: "evaluated by",
      domain: "use-case",
      range: "assessment",
      description:
        "An observed execution link exists when the policy has run for the use case.",
      sourceMapping: "AssessmentRun.useCaseId + AssessmentRun.assessmentId",
      count: uniqueRunPairs.size,
      examples: [
        ...new Set(
          data.runs.map(
            (run) =>
              `${useCasesById.get(run.useCaseId)?.name ?? run.useCaseName} → ${assessmentsById.get(run.assessmentId)?.name ?? run.assessmentName}`,
          ),
        ),
      ].slice(0, 3),
    },
    {
      id: "governs-domain",
      label: "governs domain",
      domain: "assessment",
      range: "control-domain",
      description: "Groups an assessment under its declared governance domain.",
      sourceMapping: "Assessment.category → Control Domain.name",
      count: data.assessments.filter((item) => item.category.trim()).length,
      examples: data.assessments
        .slice(0, 3)
        .map((item) => `${item.name} → ${item.category}`),
    },
    {
      id: "creates-run",
      label: "creates run",
      domain: "assessment",
      range: "assessment-run",
      description:
        "A matching policy execution materializes an immutable Assessment Run.",
      sourceMapping: "AssessmentRun.assessmentId → Assessment.id",
      count: data.runs.length,
      examples: data.runs
        .slice(0, 3)
        .map(
          (run) =>
            `${run.assessmentName} → ${run.graphExecutionId.slice(0, 12)}`,
        ),
    },
    {
      id: "assesses-use-case",
      label: "assesses",
      domain: "assessment-run",
      range: "use-case",
      description:
        "Each run captures the use-case snapshot assessed at execution time.",
      sourceMapping: "AssessmentRun.useCaseId → UseCase.id",
      count: data.runs.length,
      examples: data.runs
        .slice(0, 3)
        .map(
          (run) =>
            `${run.graphExecutionId.slice(0, 12)} → ${useCasesById.get(run.useCaseId)?.name ?? run.useCaseName}`,
        ),
    },
    {
      id: "emits-evidence",
      label: "emits evidence",
      domain: "assessment-run",
      range: "evidence-item",
      description:
        "Run evidence statements are embedded in and retained with the run record.",
      sourceMapping: "AssessmentRun.evidence[]",
      count: evidenceInstances.length,
      examples: evidenceInstances
        .slice(0, 3)
        .map((item) => `${item.sourceLabel} → ${item.label}`),
    },
  ];

  return { classes, relationships };
}
