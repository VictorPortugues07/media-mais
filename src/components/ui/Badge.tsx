import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps {
  variant?: "success" | "warning" | "danger" | "info" | "default" | "brand";
  size?: "sm" | "md";
  children: React.ReactNode;
  className?: string;
}

export function Badge({
  variant = "default",
  size = "md",
  children,
  className,
}: BadgeProps) {
  const variants = {
    default: "bg-slate-100 text-slate-700 border-slate-200",
    brand: "bg-blue-50 text-blue-700 border-blue-200/80 font-semibold",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200/80 font-semibold",
    warning: "bg-amber-50 text-amber-700 border-amber-200/80 font-semibold",
    danger: "bg-rose-50 text-rose-700 border-rose-200/80 font-semibold",
    info: "bg-sky-50 text-sky-700 border-sky-200/80 font-semibold",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border shadow-2xs",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}
