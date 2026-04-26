import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

const variants: Record<string, string> = {
  primary: "bg-[#1f7ae0] hover:bg-[#1769c5] text-white",
  secondary: "bg-white hover:bg-slate-100 text-slate-700 border border-slate-300",
  ghost: "bg-transparent hover:bg-slate-100 text-slate-700 border border-slate-300",
  danger: "bg-rose-600 hover:bg-rose-500 text-white",
};

export function Button({ className = "", variant = "primary", ...props }: Props) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition shadow-soft focus:outline-none focus:ring-2 focus:ring-[#1f7ae0]/30 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        className,
      ].join(" ")}
      {...props}
    />
  );
}
