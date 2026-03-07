import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Role = "MANAGER" | "INTERN";
type User = { id: string; name: string; email: string; role: Role };

type AuthCtx = {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

const LS_TOKEN = "taskhub_token";
const LS_USER = "taskhub_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(LS_TOKEN));
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(LS_USER);
    return raw ? (JSON.parse(raw) as User) : null;
  });

  useEffect(() => {
    if (token) localStorage.setItem(LS_TOKEN, token);
    else localStorage.removeItem(LS_TOKEN);
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem(LS_USER, JSON.stringify(user));
    else localStorage.removeItem(LS_USER);
  }, [user]);

  const value = useMemo<AuthCtx>(() => ({
    token,
    user,
    setAuth: (t, u) => { setToken(t); setUser(u); },
    logout: () => { setToken(null); setUser(null); },
  }), [token, user]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
