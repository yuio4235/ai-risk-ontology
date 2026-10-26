import {
  CheckCircle2,
  CircleDashed,
  Clock3,
  MoreHorizontal,
  Search,
  ShieldAlert,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Run, UseCase } from "../api";
export function UseCaseWorkbench({
  items,
  runs,
  onSelect,
}: {
  items: UseCase[];
  runs: Run[];
  onSelect: (item: UseCase) => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | UseCase["status"]>("all");
  const filtered = useMemo(
    () =>
      items.filter(
        (x) =>
          (status === "all" || x.status === status) &&
          `${x.name} ${x.businessUnit} ${x.owner} ${x.technology}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [items, query, status],
  );
  return (
    <section className="panel workbench">
      <div className="panel-head workbench-head">
        <div>
          <h2>
            AI use cases <span className="count-pill">{items.length}</span>
          </h2>
        </div>
      </div>
      <div className="table-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            placeholder="Search use cases, teams or technology…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <label className="filter-button">
          <select
            aria-label="Filter use cases by status"
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
          >
            <option value="all">All statuses</option>
            <option value="submitted">Submitted</option>
            <option value="draft">Draft</option>
            <option value="in-review">In review</option>
            <option value="approved">Approved</option>
          </select>
          <span>⌄</span>
        </label>
        <span className="table-count">{filtered.length} of {items.length}</span>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>USE CASE</th>
              <th>BUSINESS UNIT</th>
              <th>TECHNOLOGY</th>
              <th>LIFECYCLE</th>
              <th>ASSESSMENTS</th>
              <th>LAST ACTIVITY</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const caseRuns = runs.filter((x) => x.useCaseId === item.id);
              const alerts = caseRuns.filter((x) =>
                /review|required|attention/i.test(x.outcome),
              ).length;
              return (
                <tr
                  key={item.id}
                  tabIndex={0}
                  aria-label={`Open ${item.name}`}
                  onClick={() => onSelect(item)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(item);
                    }
                  }}
                >
                  <td>
                    <div className="uc-cell">
                      <div className="uc-avatar">
                        {item.name
                          .split(" ")
                          .slice(0, 2)
                          .map((x) => x[0])
                          .join("")}
                      </div>
                      <div>
                        <b>{item.name}</b>
                        <small>
                          {item.owner} <span>·</span> ID{" "}
                          {item.id.slice(0, 8).toUpperCase()}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="bu-name">{item.businessUnit}</span>
                  </td>
                  <td>
                    <span className="technology-chip">
                      {item.technology || "Not specified"}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${item.status}`}>
                      {item.status === "submitted" ? (
                        <CheckCircle2 size={12} />
                      ) : (
                        <CircleDashed size={12} />
                      )}{" "}
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <span className="assessment-count">
                      {caseRuns.length} <span>runs</span>
                    </span>
                    {alerts > 0 && (
                      <span className="alert-mini">
                        <ShieldAlert size={11} />
                        {alerts}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="activity-time">
                      <Clock3 size={12} />
                      {new Date(item.updatedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </td>
                  <td>
                    <button
                      className="icon-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(item);
                      }}
                    >
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-row">
                  No use cases match this search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
