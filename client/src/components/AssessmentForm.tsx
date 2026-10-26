import { ArrowRight, LoaderCircle, Plus, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { resolveApplicability } from "../domain/applicability";
import { Modal, Field } from "./Modal";
import type { Assessment } from "../api";
export function AssessmentForm({
  onClose,
  onRegister,
  busy,
}: {
  onClose: () => void;
  onRegister: (value: Record<string, unknown>) => Promise<Assessment>;
  busy: boolean;
}) {
  const [evaluator, setEvaluator] = useState("regulatory-risk");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const evaluator = f.get("evaluator");
    try {
      await onRegister({
        name: f.get("name"),
        shortName: f.get("shortName"),
        description: f.get("description"),
        category: f.get("category"),
        evaluator,
        applicability: resolveApplicability(String(evaluator), {
          field: String(f.get("field")),
          operator: String(f.get("operator")),
          value: String(f.get("value")),
        }),
        enabled: true,
        version: "1.0",
      });
      onClose();
    } catch {
      // The shared lifecycle hook reports request failures in the global notice.
    }
  }
  return (
    <Modal
      title="Register an assessment policy"
      subtitle="Existing use cases are checked for applicability on registration."
      onClose={onClose}
    >
      <form onSubmit={submit} className="assessment-form">
        <Field
          label="Policy name"
          name="name"
          placeholder="e.g. Data residency assessment"
          required
        />
        <Field
          label="Display label"
          name="shortName"
          placeholder="e.g. Data residency"
          required
        />
        <Field
          label="Business description"
          name="description"
          placeholder="What does this policy evaluate?"
          area
          required
        />
        <div className="form-grid">
          <Field
            label="Governance domain"
            name="category"
            placeholder="e.g. Data governance"
            required
          />
          <label className="field">
            <span>Evaluator</span>
            <select
              name="evaluator"
              value={evaluator}
              onChange={(event) => setEvaluator(event.target.value)}
            >
              <option value="regulatory-risk">Regulatory risk review</option>
              <option value="financial-crime">Financial-crime control</option>
              <option value="description-quality">
                Description completeness
              </option>
              <option value="model-classification">Model classification</option>
            </select>
          </label>
        </div>
        <div className="condition-builder">
          <span className="eyebrow">APPLICABILITY PREDICATE</span>
          {evaluator === "regulatory-risk" ||
          evaluator === "financial-crime" ? (
            <div className="signal-applicability-note">
              <ShieldCheck size={14} />
              <span>
                Scans submitted descriptions, customer and control impact,
                decisions, and data types for relevant risk signals. Unrelated
                records are skipped.
              </span>
            </div>
          ) : (
            <>
              <div className="form-grid">
                <label className="field">
                  <span>Use-case fact</span>
                  <select name="field">
                    <option value="description">Description</option>
                    <option value="technology">Technology</option>
                    <option value="customerImpact">Customer impact</option>
                    <option value="controlImpact">Control impact</option>
                    <option value="dataTypes">Data types</option>
                    <option value="status">Lifecycle status</option>
                  </select>
                </label>
                <label className="field">
                  <span>Operator</span>
                  <select name="operator">
                    <option value="contains">Contains</option>
                    <option value="equals">Equals</option>
                  </select>
                </label>
              </div>
              <Field
                label="Match value"
                name="value"
                placeholder="e.g. customer"
                required
              />
            </>
          )}
        </div>
        <div className="assessment-note">
          <ShieldCheck size={15} />
          <span>
            Rules are validated and evaluated by a controlled LangGraph node.{" "}
            <b>No arbitrary code is executed.</b>
          </span>
        </div>
        <div className="modal-footer">
          <button type="button" className="button-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="button-primary" disabled={busy}>
            {busy ? (
              <LoaderCircle size={15} className="spin" />
            ) : (
              <Plus size={15} />
            )}{" "}
            Register & scan portfolio <ArrowRight size={14} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
