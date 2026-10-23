"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "gradient" | "secondary" | "danger" | "ghost" | "success" | "outline-brand" | "navy" | "teal";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold tracking-[-0.005em] rounded-xl transition-all duration-200 ease-out focus:outline-none focus-visible:ring-4 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]";

  const variants = {
    primary:
      "bg-[#4F93C9] hover:bg-[#3D82B5] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_1px_2px_rgb(14_31_102/0.12)] focus-visible:ring-[#4F93C9]/25",
    navy:
      "bg-[#0E1F66] hover:bg-[#16297A] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_1px_2px_rgb(14_31_102/0.2)] focus-visible:ring-[#0E1F66]/20",
    gradient:
      "bg-brand-gradient hover:bg-brand-gradient-hover text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.15),0_2px_6px_-1px_rgb(14_31_102/0.25)] focus-visible:ring-[#4F93C9]/25",
    secondary:
      "border border-[#E4E7EC] bg-white hover:bg-[#F7F8FA] hover:border-[#D5DAE3] text-[#344054] hover:text-[#0E1F66] shadow-2xs focus-visible:ring-[#4F93C9]/15",
    "outline-brand":
      "border border-[#4F93C9]/25 bg-[#4F93C9]/[0.07] hover:bg-[#4F93C9]/15 text-[#0E1F66] focus-visible:ring-[#4F93C9]/20",
    teal:
      "bg-[#6F9483] hover:bg-[#5E8473] text-white shadow-2xs focus-visible:ring-[#8FAE9E]/30",
    danger:
      "bg-rose-600 hover:bg-rose-700 text-white shadow-2xs focus-visible:ring-rose-500/25",
    ghost:
      "text-[#344054] hover:bg-[#0E1F66]/[0.05] hover:text-[#0E1F66] focus-visible:ring-slate-300/40",
    success:
      "bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs focus-visible:ring-emerald-500/25",
  };

  const sizes = {
    sm: "px-3.5 py-1.5 text-xs gap-1.5 rounded-lg",
    md: "px-4 py-2 text-sm gap-2 rounded-xl",
    lg: "px-6 py-3 text-[15px] gap-2.5 rounded-xl",
  };

  return (
    <button
      disabled={disabled || loading}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
