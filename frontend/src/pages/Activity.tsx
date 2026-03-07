import { useEffect, useState } from "react";
import api from "../lib/api";
import { Card, CardBody, CardHeader } from "../components/Card";
import { Badge } from "../components/Badge";

type Item = {
  id: string;
  type: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  actor: { name: string; email: string; role: "MANAGER" | "INTERN" } | null;
  task: { id: string; title: string } | null;
  metadata: any;
};

export function Activity() {
  const [items, setItems] = useState<Item[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    try {
      const res = await api.get("/activity");
      setItems(res.data.items);
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Failed to load audit log");
    }
  }

  useEffect(() => { load(); }, []);

  if (err) return <div className="rounded-2xl border border-rose-900/50 bg-rose-950/30 p-4 text-rose-200">{err}</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Audit Log" subtitle="Recent activity across the workspace (manager-only)." />
        <CardBody>
          <div className="space-y-3">
            {items.map((a) => (
              <div key={a.id} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm text-slate-100">
                    <span className="font-semibold">{a.type}</span>{" "}
                    <span className="text-slate-400">by</span>{" "}
                    <span className="font-semibold">{a.actor ? a.actor.name : "System"}</span>
                    {a.actor ? <span className="text-xs text-slate-500"> ({a.actor.role})</span> : null}
                    {a.task ? <span className="ml-2 text-xs text-slate-400">• Task: {a.task.title}</span> : null}
                  </div>
                  <div className="text-xs text-slate-500">{new Date(a.createdAt).toLocaleString()}</div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge>{a.entityType}</Badge>
                  <Badge>{a.entityId.slice(0, 8)}</Badge>
                </div>
                {a.metadata ? (
                  <pre className="mt-3 overflow-auto rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-300">{JSON.stringify(a.metadata, null, 2)}</pre>
                ) : null}
              </div>
            ))}
            {items.length === 0 ? <div className="text-slate-400">No activity yet.</div> : null}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
