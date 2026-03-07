import { useEffect, useState } from "react";
import api from "../lib/api";
import { Card, CardBody, CardHeader } from "../components/Card";
import { Badge } from "../components/Badge";

type Intern = { id: string; name: string; email: string; createdAt: string };

export function Team() {
  const [interns, setInterns] = useState<Intern[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    try {
      const res = await api.get("/users");
      setInterns(res.data.interns);
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Failed to load team");
    }
  }

  useEffect(() => { load(); }, []);

  if (err) return <div className="rounded-2xl border border-rose-900/50 bg-rose-950/30 p-4 text-rose-200">{err}</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Team" subtitle="Interns linked to your manager account." />
        <CardBody>
          <div className="space-y-3">
            {interns.map((i) => (
              <div key={i.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div>
                  <div className="text-sm font-semibold text-slate-100">{i.name}</div>
                  <div className="text-sm text-slate-400">{i.email}</div>
                </div>
                <div className="text-right">
                  <Badge>Intern</Badge>
                  <div className="mt-1 text-xs text-slate-500">Joined {new Date(i.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
            {interns.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-8 text-center text-slate-400">
                No interns found. (Seeded demo includes one intern.)
              </div>
            ) : null}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
