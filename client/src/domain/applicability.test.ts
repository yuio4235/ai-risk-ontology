import { describe, expect, it } from "vitest";
import { resolveApplicability } from "./applicability";

describe("assessment applicability form mapping", () => {
  it("explains the built-in risk evaluators with a cross-field signal predicate", () => {
    expect(
      resolveApplicability("financial-crime", {
        field: "controlImpact",
        operator: "contains",
        value: "sanctions",
      }),
    ).toEqual({ field: "description", operator: "signal" });
    expect(
      resolveApplicability("regulatory-risk", {
        field: "customerImpact",
        operator: "contains",
        value: "customer",
      }),
    ).toEqual({ field: "description", operator: "signal" });
  });

  it("preserves the selected fact predicate for non-risk evaluators", () => {
    expect(
      resolveApplicability("description-quality", {
        field: "dataTypes",
        operator: "contains",
        value: "personal",
      }),
    ).toEqual({
      field: "dataTypes",
      operator: "contains",
      value: "personal",
    });
  });
});
