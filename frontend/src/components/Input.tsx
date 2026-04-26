import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string };

export function Input({ label, hint, className = "", ...props }: Props) {
  return (
    <label className="block space-y-1.5">
      {label ? <span className="text-sm font-medium text-slate-700">{label}</span> : null}
      <input
        className={[
          "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-700 placeholder:text-slate-400",
          "focus:outline-none focus:ring-2 focus:ring-[#1f7ae0]/30 focus:border-[#1f7ae0]/40",
          className,
        ].join(" ")}
        {...props}
      />
      {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}
