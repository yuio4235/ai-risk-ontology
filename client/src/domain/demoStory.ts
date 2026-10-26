export type AppPage =
  "Overview" | "Ontology" | "Use cases" | "Assessments" | "Run history";

export type DemoStoryBeat = {
  title: string;
  destination: AppPage;
  duration: string;
  presenterLine: string;
  proofPoint: string;
  actionLabel: string;
};

export const demoStory: DemoStoryBeat[] = [
  {
    title: "The portfolio challenge",
    destination: "Overview",
    duration: "45 sec",
    presenterLine:
      "The executive question is not how many AI use cases we have; it is whether every one is connected to the right controls and accountable decisions.",
    proofPoint:
      "Live portfolio, assessment coverage, review signals, and recent lifecycle events.",
    actionLabel: "Show the control plane",
  },
  {
    title: "The ontology makes meaning explicit",
    destination: "Ontology",
    duration: "60 sec",
    presenterLine:
      "These are typed business concepts and relationships: the use case belongs to a business unit, is evaluated by a policy, and produces runs with evidence.",
    proofPoint:
      "Select a class or relationship to inspect its properties, source mapping, and live instances.",
    actionLabel: "Explore the ontology",
  },
  {
    title: "Lifecycle events activate governance",
    destination: "Use cases",
    duration: "60 sec",
    presenterLine:
      "A use case is a living governed entity. I will submit an early-stage record and let its facts resolve against policy scope, launching only the assessments that apply.",
    proofPoint:
      "Submit the Mortgage document quality review draft, then inspect the new LangGraph runs and description guidance.",
    actionLabel: "Open lifecycle workbench",
  },
  {
    title: "Governance expands without a portfolio reset",
    destination: "Assessments",
    duration: "60 sec",
    presenterLine:
      "When a new policy is registered, the same ontology checks existing use cases for scope and executes matches immediately.",
    proofPoint:
      "The registry exposes controlled evaluators, applicability, and the number of linked runs.",
    actionLabel: "Inspect policy registry",
  },
  {
    title: "Decisions remain explainable",
    destination: "Run history",
    duration: "45 sec",
    presenterLine:
      "Every outcome is traceable to the business event, policy version, assessed record, supporting evidence, and LangGraph execution path.",
    proofPoint:
      "Open a run through its use case to inspect rationale, evidence, recommendation, and graph trace.",
    actionLabel: "Show the evidence ledger",
  },
];
