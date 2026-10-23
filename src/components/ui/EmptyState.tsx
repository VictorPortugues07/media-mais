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
    <div className="flex flex-col items-center justify-center text-center px-8 py-12 bg-white border border-dashed border-[#DDE1E8] rounded-2xl">
      {icon ? (
        <div className="p-3 bg-[#4F93C9]/[0.08] text-[#4F93C9] rounded-2xl mb-4">
          {icon}
        </div>
      ) : (
        <div className="p-3 bg-[#F4F5F7] text-[#9AA3AF] rounded-2xl mb-4">
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
      <h4 className="text-[15px] font-semibold text-[#0E1F66] font-heading mb-1">{title}</h4>
      <p className="text-sm text-[#667085] max-w-sm mb-5 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
