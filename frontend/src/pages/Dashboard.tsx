import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../state/auth";
import { Card, CardBody, CardHeader } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Input } from "../components/Input";

type Task = {
  id: string;
  title: string;
  description: string;
  status: "TODO" | "IN_PROGRESS" | "BLOCKED" | "READY_FOR_REVIEW" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: string | null;
  updatedAt: string;
};

function statusLabel(s: Task["status"]) {
  switch (s) {
    case "TODO": return "To do";
    case "IN_PROGRESS": return "In progress";
    case "BLOCKED": return "Blocked";
    case "READY_FOR_REVIEW": return "Ready for review";
    case "DONE": return "Done";
  }
}

export function Dashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [status, setStatus] = useState<string>("");
  const [overdue, setOverdue] = useState(false);
  const [q, setQ] = useState("");

  async function load() {
    const res = await api.get("/tasks", { params: { status: status || undefined, overdue: overdue ? "true" : undefined } });
    setTasks(res.data.tasks);
    setMetrics(res.data.metrics);
  }

  useEffect(() => { load(); }, [status, overdue]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return tasks;
    return tasks.filter(t => (t.title + " " + t.description).toLowerCase().includes(term));
  }, [tasks, q]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Dashboard"
          subtitle={user?.role === "MANAGER" ? "Create tasks, assign interns, review work." : "Update status, comment, and submit tasks for review."}
          right={
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={overdue}
                  onChange={(e) => setOverdue(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-950"
                />
                Overdue
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
              >
                <option value="">All statuses</option>
                <option value="TODO">TODO</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="BLOCKED">BLOCKED</option>
                <option value="READY_FOR_REVIEW">READY_FOR_REVIEW</option>
                <option value="DONE">DONE</option>
              </select>
              <Button variant="secondary" onClick={load}>Refresh</Button>
            </div>
          }
        />
        <CardBody>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
              <div className="text-xs text-slate-500">Overdue</div>
              <div className="mt-1 text-2xl font-semibold">{metrics?.overdueCount ?? "—"}</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 md:col-span-2">
              <div className="text-xs text-slate-500">By status</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {["TODO","IN_PROGRESS","BLOCKED","READY_FOR_REVIEW","DONE"].map((s) => (
                  <Badge key={s}>
                    {s}: {metrics?.byStatus?.[s] ?? 0}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5">
            <Input label="Search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title or description..." />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Tasks" subtitle={`${filtered.length} shown`} />
        <CardBody>
          <div className="space-y-3">
            {filtered.map((t) => {
              const due = t.dueDate ? new Date(t.dueDate) : null;
              const isOverdue = due ? (due.getTime() < Date.now() && t.status !== "DONE") : false;

              return (
                <Link
                  key={t.id}
                  to={`/tasks/${t.id}`}
                  className="block rounded-2xl border border-slate-800 bg-slate-950/40 p-4 transition hover:bg-slate-900/40"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-100">{t.title}</h3>
                        <Badge>{statusLabel(t.status)}</Badge>
                        {t.priority === "HIGH" ? <Badge>High</Badge> : null}
                        {isOverdue ? <span className="text-xs font-semibold text-rose-300">Overdue</span> : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-400">{t.description}</p>
                    </div>
                    <div className="text-sm text-slate-400">
                      {t.dueDate ? (
                        <div>
                          <div className="text-xs text-slate-500">Due</div>
                          <div className={isOverdue ? "text-rose-200" : ""}>
                            {new Date(t.dueDate).toLocaleString()}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500">No due date</div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-8 text-center text-slate-400">
                No tasks found.
              </div>
            ) : null}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
