import type { Run, UseCase } from "../api";
import { UseCaseWorkbench } from "../components/UseCaseWorkbench";
export function UseCasesPage({
  items,
  runs,
  onNew,
  onSelect,
}: {
  items: UseCase[];
  runs: Run[];
  onNew: () => void;
  onSelect: (item: UseCase) => void;
}) {
  return (
    <div className="page-content subpage">
      <div className="page-title-row">
        <div>
          <h1>Use case lifecycle</h1>
        </div>
        <button className="button-primary" onClick={onNew}>
          ＋ Register use case
        </button>
      </div>
      <UseCaseWorkbench
        items={items}
        runs={runs}
        onSelect={onSelect}
      />
    </div>
  );
}
