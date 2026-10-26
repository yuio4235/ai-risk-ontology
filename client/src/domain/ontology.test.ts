import { describe, expect, it } from "vitest";
import type { Assessment, Run, UseCase } from "../api";
import { buildOntologyModel } from "./ontology";

const useCase = (
  id: string,
  businessUnit: string,
  technology: string,
): UseCase => ({
  id,
  name: `Use case ${id}`,
  owner: "AI Office",
  businessUnit,
  status: "submitted",
  description: "A test use case",
  technology,
  dataTypes: ["Customer data"],
  decisions: "Supports a human decision",
  customerImpact: "Supports service",
  controlImpact: "No direct impact",
  dimensions: {},
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
});

const assessment: Assessment = {
  id: "assessment-1",
  name: "Regulatory review",
  shortName: "Regulatory",
  description: "Identify regulatory signals",
  category: "Regulatory",
  evaluator: "regulatory-risk",
  applicability: { field: "description", operator: "signal" },
  version: "1.0",
  enabled: true,
};

const run = (id: string, useCaseId: string): Run => ({
  id,
  graphExecutionId: `graph-${id}`,
  trace: [
    "resolve_applicability:matched",
    "execute_assessment",
    "persist_evidence",
  ],
  assessmentId: assessment.id,
  assessmentName: assessment.name,
  assessmentVersion: "1.0",
  useCaseId,
  useCaseName: `Use case ${useCaseId}`,
  trigger: "submission",
  status: "completed",
  outcome: "Review recommended",
  score: 74,
  rationale: "Customer impact warrants review",
  evidence: ["Customer data", "Customer impact"],
  recommendation: "Route for review",
  createdAt: "2026-01-01T00:00:00Z",
});

describe("ontology projection", () => {
  it("projects live class and relationship counts from lifecycle records", () => {
    const model = buildOntologyModel({
      useCases: [
        useCase("uc-1", "Retail", "LLM"),
        useCase("uc-2", "Retail", "Rules Engine"),
      ],
      assessments: [assessment],
      runs: [run("run-1", "uc-1"), run("run-2", "uc-1")],
    });

    expect(model.classes.find((item) => item.id === "use-case")?.count).toBe(2);
    expect(
      model.classes.find((item) => item.id === "business-unit")?.count,
    ).toBe(1);
    expect(model.classes.find((item) => item.id === "technology")?.count).toBe(
      2,
    );
    expect(
      model.classes.find((item) => item.id === "data-category")?.count,
    ).toBe(1);
    expect(
      model.classes.find((item) => item.id === "assessment-run")?.count,
    ).toBe(2);
    expect(
      model.classes.find((item) => item.id === "evidence-item")?.count,
    ).toBe(4);
    expect(
      model.relationships.find((item) => item.id === "assesses-use-case")
        ?.count,
    ).toBe(2);
    expect(
      model.relationships.find((item) => item.id === "uses-data-category")
        ?.count,
    ).toBe(2);
    expect(
      model.relationships.find((item) => item.id === "emits-evidence")?.count,
    ).toBe(4);
  });

  it("keeps ontology schema visible when the portfolio is empty", () => {
    const model = buildOntologyModel({
      useCases: [],
      assessments: [],
      runs: [],
    });

    expect(model.classes.length).toBeGreaterThanOrEqual(7);
    expect(model.classes.every((item) => item.count === 0)).toBe(true);
    expect(model.relationships.length).toBeGreaterThanOrEqual(6);
  });

  it("marks embedded evidence as a projection from assessment-run records", () => {
    const model = buildOntologyModel({
      useCases: [useCase("uc-1", "Retail", "LLM")],
      assessments: [assessment],
      runs: [run("run-1", "uc-1")],
    });
    const evidence = model.classes.find((item) => item.id === "evidence-item");

    expect(evidence?.storageKind).toBe("embedded projection");
    expect(evidence?.instances[0]?.sourceLabel).toContain("Assessment Run");
  });
});
