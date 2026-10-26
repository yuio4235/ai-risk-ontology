import { describe, expect, it } from "vitest";
import { demoStory } from "./demoStory";

const validPages = [
  "Overview",
  "Ontology",
  "Use cases",
  "Assessments",
  "Run history",
];

describe("CAIO demo story", () => {
  it("contains five guided narrative beats with working app destinations", () => {
    expect(demoStory).toHaveLength(5);
    for (const beat of demoStory) {
      expect(validPages).toContain(beat.destination);
      expect(beat.presenterLine.trim()).not.toBe("");
      expect(beat.proofPoint.trim()).not.toBe("");
      expect(beat.actionLabel.trim()).not.toBe("");
    }
  });
});
