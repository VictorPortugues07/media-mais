import React from "react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-[#F7F8FA]/60 border border-dashed border-[#E4E7EC] rounded-2xl">
      {icon ? (
        <div className="p-3.5 bg-[#4F93C9]/10 text-[#4F93C9] rounded-2xl mb-3 shadow-xs border border-[#4F93C9]/20">
          {icon}
        </div>
      ) : (
        <div className="p-3.5 bg-[#F7F8FA] text-[#9AA3AF] rounded-2xl mb-3 border border-[#E4E7EC]">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
      )}
      <h4 className="text-base font-bold text-[#0E1F66] font-heading mb-1">{title}</h4>
      <p className="text-xs text-[#344054] max-w-sm mb-4 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
