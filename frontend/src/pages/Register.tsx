import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { Card, CardBody, CardHeader } from "../components/Card";
import { Input } from "../components/Input";
import { Button } from "../components/Button";

export function Register() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"MANAGER" | "INTERN">("INTERN");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setLoading(true);
    try {
      await api.post("/auth/register", { name, email, password, role });
      setOk("Account created. You can now sign in.");
      setTimeout(() => nav("/login"), 600);
    } catch (e: any) {
      setError(e?.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">

      <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-14">

        <div className="w-full max-w-md">

          <div className="mb-6">

            <div className="text-xs text-slate-400">Intern TaskHub</div>
            
            <h1 className="text-3xl font-semibold tracking-tight">Create account</h1>
          </div>

          <Card>
            <CardHeader title="Registration" subtitle="Passwords are securely hashed in the database" />
            <CardBody>
              <form className="space-y-4" onSubmit={onSubmit}>
                <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@csuf.edu" />
                <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} hint="Minimum 8 characters" />

                <label className="block space-y-1">
                  <span className="text-sm text-slate-200">Role</span>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                  >
                    <option value="INTERN">Intern</option>
                    <option value="MANAGER">Manager</option>
                  </select>
                  <span className="text-xs text-slate-500">
                    Managers can create tasks and view audit logs.
                  </span>
                </label>

                {error ? <div className="rounded-xl border border-rose-900/50 bg-rose-950/30 p-3 text-sm text-rose-200">{error}</div> : null}
                {ok ? <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/30 p-3 text-sm text-emerald-200">{ok}</div> : null}

                <Button className="w-full" disabled={loading}>{loading ? "Creating..." : "Create account"}</Button>

                <div className="text-center text-sm text-slate-400">
                  Already have an account?{" "}
                  <Link className="text-indigo-300 hover:text-indigo-200" to="/login">
                    Sign in
                  </Link>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
