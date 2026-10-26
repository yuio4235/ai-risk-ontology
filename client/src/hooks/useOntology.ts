import { useCallback, useEffect, useState } from "react";
import { api, type Overview, type UseCase } from "../api";
export function useOntology() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setData(await api.overview());
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "API unavailable");
    } finally {
      setRefreshing(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    const hasActiveRuns = data?.runs.some((run) => run.status === "running") ?? false;
    const timer = setInterval(() => void refresh(), hasActiveRuns ? 1000 : 12000);
    return () => clearInterval(timer);
  }, [refresh, data?.runs.some((run) => run.status === "running")]);
  const perform = useCallback(
    async <T>(task: () => Promise<T>, success: string | ((result: T) => string)) => {
      setBusy(true);
      try {
        const result = await task();
        await refresh();
        setNotice(typeof success === "function" ? success(result) : success);
        return result;
      } catch (e) {
        setNotice(e instanceof Error ? e.message : "The operation failed");
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [refresh],
  );
  const createUseCase = useCallback(
    (value: Record<string, unknown>) =>
      perform(
        () => api.create(value),
        value.status === "submitted"
          ? "Use case submitted. Applicable assessments are running; follow progress in Run history."
          : "Draft saved to the governed portfolio.",
      ),
    [perform],
  );
  const submitUseCase = useCallback(
    (id: string) =>
      perform(
        () => api.submit(id),
        "Use case submitted. Applicable assessments are running; follow progress in Run history.",
      ),
    [perform],
  );
  const deleteUseCase = useCallback(
    (id: string) =>
      perform(
        () => api.delete(id),
        "Use case removed. Immutable assessment evidence remains in the ledger.",
      ),
    [perform],
  );
  const updateUseCase = useCallback(
    (id: string, value: Record<string, unknown>) =>
      perform(
        () => api.update(id, value),
        "Use case changed. Applicable assessments are running; follow progress in Run history.",
      ),
    [perform],
  );
  const registerAssessment = useCallback(
    (value: Record<string, unknown>) =>
      perform(
        () => api.register(value),
        "Assessment registered. Applicability checks are running across the portfolio.",
      ),
    [perform],
  );
  const runAssessment = useCallback(
    (assessmentId: string, useCaseId: string) =>
      perform(
        () => api.runAssessment(assessmentId, useCaseId),
        (run) => run
          ? "Assessment run started. Follow its live logs and checkpoints in Run history."
          : "Assessment could not be started.",
      ),
    [perform],
  );
  return {
    data,
    error,
    refreshing,
    busy,
    notice,
    setNotice,
    refresh,
    createUseCase,
    submitUseCase,
    updateUseCase,
    deleteUseCase,
    registerAssessment,
    runAssessment,
  };
}
export type UseOntology = ReturnType<typeof useOntology>;
export type SelectedUseCase = UseCase | null;
