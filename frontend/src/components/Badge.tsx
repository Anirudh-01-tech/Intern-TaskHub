export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-xs text-slate-200">
      {children}
    </span>
  );
}
