export type ApplicabilityInput = {
  field: string;
  operator: string;
  value: string;
};

export function resolveApplicability(
  evaluator: string,
  selected: ApplicabilityInput,
) {
  if (evaluator === "regulatory-risk" || evaluator === "financial-crime") {
    return { field: "description", operator: "signal" };
  }
  return selected;
}
