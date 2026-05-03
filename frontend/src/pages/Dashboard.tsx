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
    return tasks.filter((t) => (t.title + " " + t.description).toLowerCase().includes(term));
  }, [tasks, q]);

  const summaryCards = [
    { label: "To do", value: metrics?.byStatus?.TODO ?? 0 },

    { label: "In progress", value: metrics?.byStatus?.IN_PROGRESS ?? 0 },

    { label: "Review", value: metrics?.byStatus?.READY_FOR_REVIEW ?? 0 },
    
    { label: "Overdue", value: metrics?.overdueCount ?? 0 },
  ];

  return (
    <div className="space-y-6">
      {user?.role === "MANAGER" ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            { title: "Task Control", caption: "Create and assign new work", to: "/tasks/new" },
            { title: "Intern Profiles", caption: "Review interns and linked accounts", to: "/team" },
            { title: "System Assistant", caption: "Navigate app flows and inspect code", to: "/assistant" },
          ].map((card) => (
            <Link key={card.title} to={card.to} className="rounded-2xl border border-slate-200 bg-[#ece9f0] p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="text-2xl font-semibold text-slate-800">{card.title}</div>
              <div className="mt-6 text-sm text-slate-500">{card.caption}</div>
            </Link>
          ))}
        </div>
      ) : null}

      <Card>
        <CardHeader
          title="Overview"
          subtitle={user?.role === "MANAGER" ? "Create tasks, review progress, and manage your interns." : "View your assigned tasks and keep status updated."}
          right={
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={overdue}
                  onChange={(e) => setOverdue(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Overdue only
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
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
          <div className="grid gap-4 md:grid-cols-4">
            {summaryCards.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-[#f7f9fc] p-4">
                <div className="text-sm text-slate-500">{item.label}</div>
                <div className="mt-2 text-3xl font-semibold text-slate-800">{item.value}</div>
              </div>
            ))}
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
              const isOverdue = due ? due.getTime() < Date.now() && t.status !== "DONE" : false;

              return (
                <Link
                  key={t.id}
                  to={`/tasks/${t.id}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-800">{t.title}</h3>
                        <Badge>{statusLabel(t.status)}</Badge>
                        {t.priority === "HIGH" ? <Badge>High</Badge> : null}
                        {isOverdue ? <span className="text-xs font-semibold text-rose-600">Overdue</span> : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">{t.description}</p>
                    </div>
                    <div className="min-w-[180px] rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                      {t.dueDate ? (
                        <>
                          <div className="text-xs uppercase tracking-wide text-slate-400">Due</div>
                          <div className={isOverdue ? "font-medium text-rose-600" : "font-medium text-slate-700"}>{new Date(t.dueDate).toLocaleString()}</div>
                        </>
                      ) : (
                        <div className="text-sm text-slate-400">No due date</div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">No tasks found.</div>
            ) : null}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
