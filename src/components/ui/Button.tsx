"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "gradient" | "secondary" | "danger" | "ghost" | "success" | "outline-brand";
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
      "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 hover:shadow-blue-500/30 focus:ring-blue-500",
    gradient:
      "bg-brand-gradient hover:bg-brand-gradient-hover text-white shadow-md shadow-blue-500/25 focus:ring-blue-500",
    secondary:
      "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-950 focus:ring-blue-500",
    "outline-brand":
      "border border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-700 hover:border-blue-300 focus:ring-blue-500",
    danger:
      "bg-red-600 hover:bg-red-700 text-white shadow-red-500/20 focus:ring-red-500",
    ghost:
      "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 focus:ring-slate-400 shadow-none",
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
