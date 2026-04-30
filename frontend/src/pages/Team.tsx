import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { Card, CardBody, CardHeader } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";

type Intern = { id: string; name: string; email: string; createdAt: string };

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "IN"
  );
}

function formatDate(date?: string) {
  if (!date) return "Not available";

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ProgressCircle({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-slate-200 bg-white text-center text-sm text-slate-700 shadow-soft">
      <div>
        <div className="text-2xl font-semibold text-slate-900">{value}%</div>
        <div>{label}</div>
      </div>
    </div>
  );
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

  useEffect(() => {
    load();
  }, []);

  const selected = useMemo(
    () => interns.find((i) => i.id === selectedId) || interns[0],
    [interns, selectedId]
  );

  if (err) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
        {err}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Interns"
          subtitle="Manager view of intern profiles and linked accounts."
          right={
            <Link to="/interns/new">
              <Button>Add intern</Button>
            </Link>
          }
        />

        <CardBody>
          <div className="grid gap-6 2xl:grid-cols-[minmax(780px,1fr)_360px]">
            {/* Main profile card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              {selected ? (
                <div className="grid gap-8 lg:grid-cols-[210px_1fr_120px] lg:items-center">
                  {/* Left profile block */}
                  <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                    <div className="flex h-40 w-40 items-center justify-center rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-200 to-slate-50 text-4xl font-semibold text-slate-700 shadow-soft">
                      {initials(selected.name)}
                    </div>

                    <div className="mt-5 w-full space-y-2">
                      <div className="text-sm text-slate-500">
                        Name:{" "}
                        <span className="font-medium text-slate-800">
                          {selected.name}
                        </span>
                      </div>

                      <div className="break-words text-sm text-slate-500">
                        E-mail:{" "}
                        <span className="font-medium text-slate-800">
                          {selected.email}
                        </span>
                      </div>
                    </div>

                    <button className="mt-5 inline-flex items-center rounded-full bg-[#1f7ae0] px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700">
                      Documents
                    </button>
                  </div>

                  {/* Middle details block */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="min-h-[112px] rounded-2xl bg-slate-50 p-5">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        University
                      </div>
                      <div className="mt-2 text-sm font-medium leading-relaxed text-slate-800">
                        Configured from profile
                      </div>
                    </div>

                    <div className="min-h-[112px] rounded-2xl bg-slate-50 p-5">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Team
                      </div>
                      <div className="mt-2 text-sm font-medium leading-relaxed text-slate-800">
                        Intern TaskHub
                      </div>
                    </div>

                    <div className="min-h-[112px] rounded-2xl bg-slate-50 p-5">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Joined
                      </div>
                      <div className="mt-2 text-sm font-medium leading-relaxed text-slate-800">
                        {formatDate(selected.createdAt)}
                      </div>
                    </div>

                    <div className="min-h-[112px] rounded-2xl bg-slate-50 p-5">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Role
                      </div>
                      <div className="mt-2">
                        <Badge>Intern</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Right progress block */}
                  <div className="flex justify-center gap-4 lg:flex-col lg:items-center">
                    <ProgressCircle value={0} label="Complete" />
                    <ProgressCircle value={0} label="Success" />
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-slate-500">
                  No interns found. Add your first intern to start assigning
                  tasks.
                </div>
              )}
            </div>

            {/* Roster card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold text-slate-800">
                    Intern roster
                  </div>
                  <div className="text-sm text-slate-500">
                    Select an intern to view details
                  </div>
                </div>
              </div>

              <div className="max-h-[520px] space-y-3 overflow-auto pr-1">
                {interns.map((i) => {
                  const active = i.id === selected?.id;

                  return (
                    <button
                      key={i.id}
                      onClick={() => setSelectedId(i.id)}
                      className={[
                        "flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left transition",
                        active
                          ? "border-[#1f7ae0] bg-[#eff6ff]"
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100",
                      ].join(" ")}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                          {initials(i.name)}
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-800">
                            {i.name}
                          </div>
                          <div className="truncate text-xs text-slate-500">
                            {i.email}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-xs text-slate-400">
                        {formatDate(i.createdAt)}
                      </div>
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