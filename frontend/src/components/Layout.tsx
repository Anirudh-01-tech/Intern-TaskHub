import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../state/auth";
import { setAuthToken } from "../lib/api";

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        [
          "rounded-xl px-3 py-2 text-sm font-medium transition",
          isActive ? "bg-slate-900 text-slate-100" : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60",
        ].join(" ")
      }
    >
      {children}
    </NavLink>
  );
}

export function Layout() {
  const { token, user, logout } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Intern TaskHub</div>
            <div className="text-2xl font-semibold tracking-tight">Welcome, {user?.name}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-200">
              {user?.role}
            </div>
            <button
              className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900"
              onClick={() => {
                logout();
                nav("/login");
              }}
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <aside className="md:col-span-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-3 shadow-soft">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Navigation</div>
              <div className="flex flex-col gap-1">
                <NavItem to="/">Dashboard</NavItem>
                {user?.role === "MANAGER" ? <NavItem to="/team">Team</NavItem> : null}
                {user?.role === "MANAGER" ? <NavItem to="/activity">Audit Log</NavItem> : null}
              </div>
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                <div className="text-xs text-slate-500">Signed in as</div>
                <div className="mt-1 text-sm text-slate-200">{user?.email}</div>
              </div>
            </div>
          </aside>

          <main className="md:col-span-9">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
