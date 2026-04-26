import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { Card, CardBody, CardHeader } from "../components/Card";
import { Button } from "../components/Button";
import { Input } from "../components/Input";

type Intern = { id: string; name: string; email: string };

export function CreateTask() {
  const nav = useNavigate();
  const [interns, setInterns] = useState<Intern[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const selectedInterns = useMemo(() => interns.filter((i) => assigneeIds.includes(i.id)), [interns, assigneeIds]);

  useEffect(() => {
    api.get("/users").then((res) => setInterns(res.data.interns || [])).catch((e) => {
      setErr(e?.response?.data?.error || "Failed to load interns");
    });
  }, []);

  function toggleAssignee(id: string) {
    setAssigneeIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      const payload = {
        title,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        assigneeIds,
      };
      const res = await api.post("/tasks", payload);
      nav(`/tasks/${res.data.task.id}`);
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Failed to create task");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Add Task" subtitle="Create a task, set priority, and assign one or more interns." />
        <CardBody>
          <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Task title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Build task comments page" required />
                <label className="block space-y-1">
                  <span className="text-sm text-slate-700">Priority</span>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1f7ae0]/30">
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </label>
              </div>

              <label className="block space-y-1">
                <span className="text-sm text-slate-700">Description</span>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} required className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1f7ae0]/30" placeholder="Describe the work, deliverables, and review instructions..." />
              </label>

              <Input label="Due date" type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />

              {err ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{err}</div> : null}

              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={saving || interns.length === 0 || assigneeIds.length === 0}>{saving ? "Creating..." : "Create task"}</Button>
                <Button type="button" variant="ghost" onClick={() => nav(-1)}>Cancel</Button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-slate-800">Assign interns</div>
                  <div className="text-sm text-slate-500">Choose one or more assignees</div>
                </div>
                <div className="rounded-full bg-[#eff6ff] px-3 py-1 text-sm font-medium text-[#1f7ae0]">{selectedInterns.length} selected</div>
              </div>

              <div className="mt-4 space-y-3 max-h-[430px] overflow-auto pr-1">
                {interns.map((intern) => {
                  const active = assigneeIds.includes(intern.id);
                  return (
                    <button key={intern.id} type="button" onClick={() => toggleAssignee(intern.id)} className={["flex w-full items-center justify-between rounded-2xl border p-4 text-left transition", active ? "border-[#1f7ae0] bg-[#eff6ff]" : "border-slate-200 bg-slate-50 hover:bg-slate-100"].join(" ")}>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{intern.name}</div>
                        <div className="text-sm text-slate-500">{intern.email}</div>
                      </div>
                      <div className={["flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold", active ? "border-[#1f7ae0] bg-[#1f7ae0] text-white" : "border-slate-300 text-slate-400"].join(" ")}>{active ? "✓" : ""}</div>
                    </button>
                  );
                })}
              </div>
              {interns.length === 0 ? <div className="mt-3 text-sm text-slate-500">No interns found. Add an intern first.</div> : null}
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
