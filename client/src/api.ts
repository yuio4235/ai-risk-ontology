const API = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const payload = await response
      .json()
      .catch(() => ({ error: "Request failed" }));
    throw new Error(payload.error ?? "Request failed");
  }
  return response.json();
}
export type UseCase = {
  id: string;
  name: string;
  owner: string;
  businessUnit: string;
  status: string;
  description: string;
  technology: string;
  dataTypes: string[];
  decisions: string;
  customerImpact: string;
  controlImpact: string;
  dimensions: Record<string, string>;
  createdAt: string;
  updatedAt: string;
};
export type Assessment = {
  id: string;
  name: string;
  shortName: string;
  description: string;
  category: string;
  evaluator: string;
  applicability: { field: string; operator: string; value?: string };
  version: string;
  enabled: boolean;
};
export type Run = {
  id: string;
  graphExecutionId: string;
  trace: string[];
  assessmentId: string;
  assessmentName: string;
  assessmentVersion: string;
  useCaseId: string;
  useCaseName: string;
  trigger: string;
  status: string;
  outcome: string;
  score: number;
  rationale: string;
  evidence: string[];
  recommendation: string;
  suggestedDescription?: string;
  execution?: {
    threadId: string;
    startedAt: string;
    completedAt: string | null;
    durationMs: number;
    logs?: Array<{
      sequence: number;
      timestamp: string;
      level: "debug" | "info" | "warning" | "error";
      event: string;
      node?: string;
      message: string;
      details?: Record<string, unknown>;
    }>;
    events: Array<{
      sequence: number;
      node: string;
      status: "completed";
      startedAt: string;
      completedAt: string;
      durationMs: number;
      inputSummary: string;
      outputSummary: string;
    }>;
    checkpoints: Array<{
      checkpointId: string;
      step: number;
      source: string;
      createdAt: string | null;
      next: string[];
      channels: string[];
      stateSummary: Record<string, unknown>;
    }>;
    checkpointStore: string;
  };
  createdAt: string;
};
export type Overview = {
  useCases: UseCase[];
  assessments: Assessment[];
  runs: Run[];
  metrics: {
    useCases: number;
    submitted: number;
    assessments: number;
    runs: number;
    attention: number;
  };
};
export const api = {
  overview: () => request<Overview>("/api/overview"),
  create: (data: Record<string, unknown>) =>
    request<UseCase>("/api/use-cases", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  submit: (id: string) =>
    request<UseCase>(`/api/use-cases/${id}/submit`, { method: "POST" }),
  delete: (id: string) =>
    request<{ deleted: boolean; useCaseId: string }>(`/api/use-cases/${id}`, {
      method: "DELETE",
    }),
  update: (id: string, data: Record<string, unknown>) =>
    request<UseCase>(`/api/use-cases/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  register: (data: Record<string, unknown>) =>
    request<Assessment>("/api/assessments", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  runAssessment: (assessmentId: string, useCaseId: string) =>
    request<Run | null>(`/api/assessments/${assessmentId}/run`, {
      method: "POST",
      body: JSON.stringify({ useCaseId }),
    }),
};
