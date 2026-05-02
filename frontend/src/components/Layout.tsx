import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../state/auth";
import { setAuthToken } from "../lib/api";
import { ActivityIcon, ClipboardIcon, CloseIcon, DashboardIcon, MenuIcon, PlusIcon, SparklesIcon, UsersIcon } from "./Icons";

type NavItemProps = { to: string; children: React.ReactNode; icon: React.ReactNode; onClick?: () => void };

function NavItem({ to, children, icon, onClick }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      onClick={onClick}
      className={({ isActive }) =>
        [
          "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition",
          isActive
            ? "bg-[#1f7ae0] text-white shadow-soft"
            : "text-slate-200 hover:text-white hover:bg-white/10",
        ].join(" ")
      }
    >
      <span className="h-4 w-4">{icon}</span>
      <span>{children}</span>
    </NavLink>
  );
}

const titles: Record<string, string> = {
  "/": "Home",
  "/tasks/new": "Add Task",
  "/interns/new": "Add Intern",
  "/team": "Interns",
  "/activity": "Tools / Audit Log",
  "/assistant": "AI Assistant",
};

export function Layout() {
  const { token, user, logout } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  const closeMenu = () => setOpen(false);
  const title = useMemo(() => titles[location.pathname] || "Intern Management System", [location.pathname]);

  return (
    <div className="min-h-screen bg-[#eef2f6] text-slate-800">
      <div className="flex min-h-screen">
        <aside
          className={[
            "fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-[#08284a] bg-[#03213f] px-4 py-5 text-white transition-transform duration-200 lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-lg font-bold tracking-wider">ISSD</div>
              <div>
                <div className="text-lg font-semibold text-white">Intern Management System</div>
                <div className="text-xs text-slate-300">Admin workspace</div>
              </div>
            </div>
            <button className="rounded-xl border border-white/15 p-2 text-slate-200 lg:hidden" onClick={() => setOpen(false)}>
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          <nav className="mt-8 space-y-1">
            <NavItem to="/" icon={<DashboardIcon />} onClick={closeMenu}>Home</NavItem>

            {user?.role === "MANAGER" ? <NavItem to="/team" icon={<UsersIcon />} onClick={closeMenu}>Interns</NavItem> : null}

            {user?.role === "MANAGER" ? <NavItem to="/tasks/new" icon={<ClipboardIcon />} onClick={closeMenu}>Add Task</NavItem> : null}

            
            {user?.role === "MANAGER" ? <NavItem to="/interns/new" icon={<PlusIcon />} onClick={closeMenu}>Add Intern</NavItem> : null}
            
            {user?.role === "MANAGER" ? <NavItem to="/activity" icon={<ActivityIcon />} onClick={closeMenu}>Tools</NavItem> : null}
            <NavItem to="/assistant" icon={<SparklesIcon />} onClick={closeMenu}>Assistant</NavItem>
            
          </nav>

          <div className="mt-auto space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Signed in</div>
              <div className="mt-3 text-sm font-semibold text-white">{user?.name}</div>
              <div className="text-xs text-slate-300">{user?.email}</div>
              <div className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-100">{user?.role}</div>
            </div>

            <button
              className="inline-flex w-full items-center justify-between rounded-2xl border border-[#335a81] bg-[#0a2d54] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#123762]"
              onClick={() => {
                logout();
                nav("/login");
              }}
            >
              <span>{user?.role === "MANAGER" ? "Admin" : "User"}</span>
              <span className="rounded-full border border-rose-400/40 bg-rose-500/10 px-2 py-1 text-xs text-rose-200">Logout</span>
            </button>
          </div>
        </aside>

        {open ? <button className="fixed inset-0 z-20 bg-black/30 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu" /> : null}

        <div className="flex-1 lg:ml-72">
          <header className="sticky top-0 z-10 bg-[#031c35] px-4 py-4 text-white shadow-sm sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button className="rounded-xl border border-white/15 p-2 text-slate-100 lg:hidden" onClick={() => setOpen(true)}>
                  <MenuIcon className="h-5 w-5" />
                </button>
                <div>
                  <div className="text-2xl font-semibold">Intern Management System</div>
                  <div className="text-sm text-slate-300">{title}</div>
                </div>
              </div>

              {user?.role === "MANAGER" ? (
                <NavLink to="/tasks/new" className="hidden items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#0d2748] shadow-soft hover:bg-slate-100 sm:inline-flex">
                  <ClipboardIcon className="h-4 w-4" />
                  New task
                </NavLink>
              ) : null}
            </div>
          </header>

          <main className="px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
