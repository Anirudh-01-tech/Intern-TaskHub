import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../state/auth";
import { Card, CardBody, CardHeader } from "../components/Card";
import { Input } from "../components/Input";
import { Button } from "../components/Button";

export function Login() {
  const nav = useNavigate();
  const { setAuth } = useAuth();
  const [email, setEmail] = useState("manager@taskhub.dev");
  const [password, setPassword] = useState("Passw0rd!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      setAuth(res.data.token, res.data.user);
      nav("/");
    } catch (e: any) {
      setError(e?.response?.data?.error || "Login failed");
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
            <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
          </div>

          <Card>
            <CardHeader title="Account" subtitle="Secure access with JWT authentication" />
            <CardBody>
              <form className="space-y-4" onSubmit={onSubmit}>
                <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@csuf.edu" />
                <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                {error ? <div className="rounded-xl border border-rose-900/50 bg-rose-950/30 p-3 text-sm text-rose-200">{error}</div> : null}
                <Button className="w-full" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</Button>

                <div className="text-center text-sm text-slate-400">
                  New here?{" "}
                  <Link className="text-indigo-300 hover:text-indigo-200" to="/register">
                    Create an account
                  </Link>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-300">
                  <div className="font-semibold text-slate-200">Demo users</div>
                  <div className="mt-1">Manager: manager@taskhub.dev / Passw0rd!</div>
                  <div>Intern: intern@taskhub.dev / Passw0rd!</div>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
