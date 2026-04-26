import { useEffect, useState } from "react";
import api from "../lib/api";
import { Card, CardBody, CardHeader } from "../components/Card";
import { Input } from "../components/Input";
import { Button } from "../components/Button";

type Intern = { id: string; name: string; email: string; createdAt: string };

export function AddIntern() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [interns, setInterns] = useState<Intern[]>([]);

  async function loadInterns() {
    const res = await api.get("/users");
    setInterns(res.data.interns || []);
  }

  useEffect(() => {
    loadInterns().catch(() => undefined);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSuccess(null);
    setSaving(true);
    try {
      const res = await api.post("/users", { name, email, password });
      setSuccess(`Intern ${res.data.intern.name} created successfully.`);
      setName("");
      setEmail("");
      setPassword("");
      await loadInterns();
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Failed to create intern");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Add Intern" subtitle="Create a new intern account linked to your manager profile." />
        <CardBody>
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <form onSubmit={submit} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
              <Input label="Intern name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Jordan Intern" />
              <Input label="Intern email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="intern2@taskhub.dev" />
              <Input label="Temporary password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Minimum 8 characters" hint="Share this temporary password with the intern." />
              <Button type="submit" disabled={saving}>{saving ? "Creating..." : "Add Intern"}</Button>
              {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div> : null}
              {err ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{err}</div> : null}
            </form>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
              <div className="mb-4 grid grid-cols-[1.3fr_1fr_auto] gap-3 border-b border-slate-200 pb-3 text-sm font-semibold text-slate-500">
                <div>Username</div>
                <div>Role</div>
                <div>Action</div>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-auto pr-1">
                {interns.map((intern) => (
                  <div key={intern.id} className="grid grid-cols-[1.3fr_1fr_auto] items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                    <div>
                      <div className="font-medium text-slate-800">{intern.name}</div>
                      <div className="text-xs text-slate-500">{intern.email}</div>
                    </div>
                    <div className="text-slate-600">Intern</div>
                    <div className="flex gap-2">
                      <button type="button" className="rounded-lg bg-[#1f7ae0] px-3 py-1.5 text-xs font-semibold text-white">Update</button>
                      <button type="button" className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white">Delete</button>
                    </div>
                  </div>
                ))}
                {interns.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">No interns created yet.</div> : null}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
