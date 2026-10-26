import { ArrowRight, Database, LoaderCircle, Sparkles } from "lucide-react";
import { Modal, Field } from "./Modal";
import type { UseCase } from "../api";
export function UseCaseForm({
  onClose,
  onSave,
  busy,
  initial,
}: {
  onClose: () => void;
  onSave: (
    id: string | null,
    value: Record<string, unknown>,
  ) => Promise<UseCase>;
  busy: boolean;
  initial?: UseCase;
}) {
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null;
    const intent = submitter?.value === "draft" ? "draft" : "submitted";
    const f = new FormData(event.currentTarget);
    const dimensions = Object.fromEntries(
      ["problem", "users", "data", "technology", "decisions", "controls"].map(
        (key) => [key, String(f.get(key) ?? "")],
      ),
    );
    const data = {
      name: f.get("name"),
      owner: f.get("owner"),
      businessUnit: f.get("businessUnit"),
      description: f.get("description"),
      technology: f.get("technology"),
      dataTypes: String(f.get("dataTypes"))
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      decisions: f.get("decisions"),
      customerImpact: f.get("customerImpact"),
      controlImpact: f.get("controlImpact"),
      dimensions,
      ...(initial ? {} : { status: intent }),
    };
    try {
      await onSave(initial?.id ?? null, data);
      onClose();
    } catch {
      // The shared lifecycle hook reports request failures in the global notice.
    }
  }
  return (
    <Modal
      title={initial ? "Edit an AI use case" : "Register an AI use case"}
      subtitle={
        initial
          ? "Saving changes reruns applicable assessments and preserves previous evidence."
          : "Submit to run applicable assessments."
      }
      onClose={onClose}
      wide
    >
      <form onSubmit={submit} className="case-form">
        <div className="form-grid">
          <Field
            label="Use case name"
            name="name"
            placeholder="e.g. Service request summarisation"
            required
            value={initial?.name}
          />
          <Field
            label="Accountable owner"
            name="owner"
            placeholder="e.g. Customer Operations"
            required
            value={initial?.owner}
          />
          <Field
            label="Business unit"
            name="businessUnit"
            placeholder="e.g. Retail Banking"
            required
            value={initial?.businessUnit}
          />
          <Field
            label="Technology"
            name="technology"
            placeholder="e.g. Approved enterprise LLM"
            value={initial?.technology}
          />
          <Field
            label="AI use case description"
            name="description"
            placeholder="What does it do, why, and how does it affect a person or business process?"
            area
            value={initial?.description}
          />
          <Field
            label="Decision behavior"
            name="decisions"
            placeholder="What does the system decide, recommend or automate?"
            area
            value={initial?.decisions}
          />
          <Field
            label="Users and impacted parties"
            name="users"
            placeholder="Who uses it or is affected?"
            value={initial?.dimensions.users}
          />
          <Field
            label="Problem and business outcome"
            name="problem"
            placeholder="What problem does it solve?"
            value={initial?.dimensions.problem}
          />
          <Field
            label="Data types (comma-separated)"
            name="dataTypes"
            placeholder="Customer data, Transactions"
            value={initial?.dataTypes.join(", ")}
          />
          <Field
            label="Data used"
            name="data"
            placeholder="Data sources, sensitivity and handling"
            value={initial?.dimensions.data}
          />
          <Field
            label="Customer impact"
            name="customerImpact"
            placeholder="Direct or indirect customer impact"
            value={initial?.customerImpact}
          />
          <Field
            label="Control impact"
            name="controlImpact"
            placeholder="Financial-crime or other control impact"
            value={initial?.controlImpact}
          />
          <Field
            label="Control environment"
            name="controls"
            placeholder="Monitoring, override and escalation"
            value={initial?.dimensions.controls}
          />
        </div>
        <div className="assessment-note">
          <Sparkles size={15} />
          <span>
            <b>Six-dimension description review</b> Problem, users, data,
            technology, decisions and controls are assessed on submission.
            Outcomes persist as LangGraph evidence.
          </span>
        </div>
        <div className="modal-footer">
          <button type="button" className="button-ghost" onClick={onClose}>
            Cancel
          </button>
          {initial ? (
            <button
              className="button-primary"
              type="submit"
              value="submitted"
              disabled={busy}
            >
              {busy ? (
                <LoaderCircle size={15} className="spin" />
              ) : (
                <Database size={15} />
              )}
              Save changes · re-run applicable assessments{" "}
              <ArrowRight size={14} />
            </button>
          ) : (
            <>
              <button
                className="button-ghost"
                type="submit"
                value="draft"
                disabled={busy}
              >
                <Database size={15} /> Save as draft
              </button>
              <button
                className="button-primary"
                type="submit"
                value="submitted"
                disabled={busy}
              >
                {busy ? (
                  <LoaderCircle size={15} className="spin" />
                ) : (
                  <Sparkles size={15} />
                )}
                Submit & assess <ArrowRight size={14} />
              </button>
            </>
          )}
        </div>
      </form>
    </Modal>
  );
}
