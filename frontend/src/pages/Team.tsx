import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { Card, CardBody, CardHeader } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";

type Intern = { id: string; name: string; email: string; createdAt: string };

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "IN";
}

export function Team() {
  const [interns, setInterns] = useState<Intern[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function load() {
    setErr(null);
    try {
      const res = await api.get("/users");
      const list = res.data.interns || [];
      setInterns(list);
      setSelectedId((prev) => prev || list[0]?.id || null);
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Failed to load team");
    }
  }

  useEffect(() => { load(); }, []);

  const selected = useMemo(() => interns.find((i) => i.id === selectedId) || interns[0], [interns, selectedId]);

  if (err) return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{err}</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Interns" subtitle="Manager view of intern profiles and linked accounts." right={<Link to="/interns/new"><Button>Add intern</Button></Link>} />
        <CardBody>
          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.9fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
              {selected ? (
                <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
                  <div>
                    <div className="flex h-40 w-40 items-center justify-center rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-200 to-slate-50 text-4xl font-semibold text-slate-700 shadow-soft">
                      {initials(selected.name)}
                    </div>
                    <div className="mt-4 text-sm text-slate-500">Name: <span className="font-medium text-slate-700">{selected.name}</span></div>
                    <div className="mt-2 text-sm text-slate-500">E-mail: <span className="font-medium text-slate-700">{selected.email}</span></div>
                    <div className="mt-4 inline-flex items-center rounded-full bg-[#1f7ae0] px-4 py-2 text-sm font-medium text-white">Documents</div>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="text-xs uppercase tracking-wide text-slate-400">University</div>
                        <div className="mt-2 text-sm font-medium text-slate-700">Configured from profile</div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="text-xs uppercase tracking-wide text-slate-400">Team</div>
                        <div className="mt-2 text-sm font-medium text-slate-700">Intern TaskHub</div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="text-xs uppercase tracking-wide text-slate-400">Joined</div>
                        <div className="mt-2 text-sm font-medium text-slate-700">{new Date(selected.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="text-xs uppercase tracking-wide text-slate-400">Role</div>
                        <div className="mt-2"><Badge>Intern</Badge></div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-slate-200 bg-white text-center text-sm text-slate-700 shadow-soft">
                        <div>
                          <div className="text-2xl font-semibold">0%</div>
                          <div>Complete</div>
                        </div>
                      </div>
                      <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-slate-200 bg-white text-center text-sm text-slate-700 shadow-soft">
                        <div>
                          <div className="text-2xl font-semibold">0%</div>
                          <div>Success</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-slate-500">No interns found. Add your first intern to start assigning tasks.</div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold text-slate-800">Intern roster</div>
                  <div className="text-sm text-slate-500">Select an intern to view details</div>
                </div>
              </div>
              <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
                {interns.map((i) => {
                  const active = i.id === selected?.id;
                  return (
                    <button key={i.id} onClick={() => setSelectedId(i.id)} className={["flex w-full items-center justify-between rounded-2xl border p-4 text-left transition", active ? "border-[#1f7ae0] bg-[#eff6ff]" : "border-slate-200 bg-slate-50 hover:bg-slate-100"].join(" ")}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">{initials(i.name)}</div>
                        <div>
                          <div className="text-sm font-semibold text-slate-800">{i.name}</div>
                          <div className="text-xs text-slate-500">{i.email}</div>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400">{new Date(i.createdAt).toLocaleDateString()}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
