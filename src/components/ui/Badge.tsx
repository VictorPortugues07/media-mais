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
    default: "bg-[#F7F8FA] text-[#344054] border-[#E4E7EC]",
    brand: "bg-[#4F93C9]/10 text-[#0E1F66] border-[#4F93C9]/30 font-semibold",
    navy: "bg-[#0E1F66]/10 text-[#0E1F66] border-[#0E1F66]/20 font-semibold",
    teal: "bg-[#8FAE9E]/15 text-[#1E4333] border-[#8FAE9E]/40 font-semibold",
    coral: "bg-[#F2795C]/15 text-[#9C3218] border-[#F2795C]/40 font-semibold",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold",
    warning: "bg-amber-50 text-amber-800 border-amber-300 font-semibold",
    danger: "bg-rose-50 text-rose-700 border-rose-200 font-semibold",
    info: "bg-[#4F93C9]/10 text-[#0E1F66] border-[#4F93C9]/30 font-semibold",
    live: "bg-[#D8E8E1] text-[#1E4333] border-[#8FAE9E]/50 font-bold",
    fila: "bg-[#FEF3C7] text-[#B45309] border-[#FCD34D] font-bold",
    "tier-ouro": "bg-[#FEF3C7] text-[#92400E] border-[#FCD34D] font-black",
    "tier-prata": "bg-[#F1F5F9] text-[#334155] border-[#CBD5E1] font-black",
    "tier-bronze": "bg-[#FFEDD5] text-[#9A3412] border-[#FDBA74] font-black",
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
