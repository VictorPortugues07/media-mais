import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-[#E4E7EC]/80 shadow-xs overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn("px-6 py-4 border-b border-[#EEF0F3]", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardBody({ className, children, ...props }: CardProps) {
  return (
    <div className={cn("p-6", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn("px-6 py-4 border-t border-[#EEF0F3] bg-[#FAFBFC]", className)}
      {...props}
    >
      {children}
    </div>
  );
}
