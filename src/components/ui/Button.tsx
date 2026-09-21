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
    "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs";

  const variants = {
    primary:
      "bg-[#4F93C9] hover:bg-[#3D82B5] text-white shadow-sm shadow-[#4F93C9]/25 focus:ring-[#4F93C9]",
    navy:
      "bg-[#0E1F66] hover:bg-[#0A174E] text-white shadow-sm shadow-[#0E1F66]/20 focus:ring-[#0E1F66]",
    gradient:
      "bg-brand-gradient hover:bg-brand-gradient-hover text-white shadow-md shadow-[#0E1F66]/20 focus:ring-[#4F93C9]",
    secondary:
      "border border-[#E4E7EC] bg-white hover:bg-[#F7F8FA] text-[#344054] hover:text-[#0E1F66] focus:ring-[#4F93C9]",
    "outline-brand":
      "border border-[#4F93C9]/40 bg-[#4F93C9]/10 hover:bg-[#4F93C9]/20 text-[#0E1F66] focus:ring-[#4F93C9]",
    teal:
      "bg-[#8FAE9E] hover:bg-[#7A9C8D] text-white shadow-sm focus:ring-[#8FAE9E]",
    danger:
      "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20 focus:ring-rose-500",
    ghost:
      "text-[#344054] hover:bg-slate-100/80 hover:text-[#0E1F66] focus:ring-slate-400 shadow-none",
    success:
      "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 focus:ring-emerald-500",
  };

  const sizes = {
    sm: "px-3.5 py-1.5 text-xs gap-1.5 rounded-lg",
    md: "px-4 py-2 text-sm gap-2 rounded-xl",
    lg: "px-6 py-3 text-base gap-2.5 rounded-xl font-bold",
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
