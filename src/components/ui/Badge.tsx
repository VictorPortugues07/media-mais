import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps {
  variant?:
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "default"
    | "brand"
    | "teal"
    | "coral"
    | "navy"
    | "live"
    | "fila"
    | "tier-ouro"
    | "tier-prata"
    | "tier-bronze";
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
    default: "bg-[#F4F5F7] text-[#475467] border-transparent",
    brand: "bg-[#4F93C9]/10 text-[#1F5A8A] border-transparent",
    navy: "bg-[#0E1F66]/[0.07] text-[#0E1F66] border-transparent",
    teal: "bg-[#8FAE9E]/15 text-[#1E4333] border-transparent",
    coral: "bg-[#F2795C]/12 text-[#9C3218] border-transparent",
    success: "bg-emerald-50 text-emerald-700 border-transparent",
    warning: "bg-amber-50 text-amber-700 border-transparent",
    danger: "bg-rose-50 text-rose-700 border-transparent",
    info: "bg-[#4F93C9]/10 text-[#1F5A8A] border-transparent",
    live: "bg-[#D8E8E1] text-[#1E4333] border-transparent",
    fila: "bg-[#FEF3C7]/70 text-[#B45309] border-transparent",
    "tier-ouro": "bg-[#FEF3C7]/70 text-[#92400E] border-[#FCD34D]/60 font-semibold",
    "tier-prata": "bg-[#F1F5F9] text-[#334155] border-[#CBD5E1]/70 font-semibold",
    "tier-bronze": "bg-[#FFEDD5]/70 text-[#9A3412] border-[#FDBA74]/60 font-semibold",
  };

  const sizes = {
    sm: "px-2 py-1 text-[11px]",
    md: "px-2.5 py-1.5 text-xs",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium leading-none whitespace-nowrap",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}
