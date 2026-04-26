export function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-[28px] border border-slate-200 bg-[#f5f7fb] shadow-soft">{children}</div>;
}

export function CardHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-start">
      <div>
        <h2 className="text-[28px] font-semibold tracking-tight text-slate-800">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {right ? <div>{right}</div> : null}
    </div>
  );
}

export function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="px-5 py-5">{children}</div>;
}
