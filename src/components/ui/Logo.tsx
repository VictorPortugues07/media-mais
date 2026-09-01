import React from "react";

export function Logo({
  className = "h-7 w-auto object-contain",
  showText = true,
  whiteText = false,
}: {
  className?: string;
  showText?: boolean;
  whiteText?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src="/logo.svg"
        alt="Media +"
        className={className}
      />
      {showText && (
        <span
          className={`font-bold tracking-tight text-lg sm:text-xl font-heading ${
            whiteText ? "text-white" : "text-slate-900"
          }`}
        >
          Media<span className="text-blue-600"> +</span>
        </span>
      )}
    </div>
  );
}
