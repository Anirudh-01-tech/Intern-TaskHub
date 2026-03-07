import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string };

export function Input({ label, hint, className = "", ...props }: Props) {
  return (
    <label className="block space-y-1">
      {label ? <span className="text-sm text-slate-200">{label}</span> : null}
      <input
        className={[
          "w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-slate-100 placeholder:text-slate-500",
          "focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400/50",
          className,
        ].join(" ")}
        {...props}
      />
      {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}
