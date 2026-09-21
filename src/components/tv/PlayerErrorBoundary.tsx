"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class PlayerErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Player Error Boundary capturou falha:", error, errorInfo);
    // Reinicia o player automaticamente após 10 segundos em caso de falha de renderização
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    }, 10000);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen bg-[#0E1F66] text-white flex flex-col items-center justify-center p-8 text-center select-none font-sans">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-5 shadow-2xl border border-amber-400/30">
            <svg className="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading mb-3">
            Recuperando Transmissão...
          </h1>
          <p className="text-xs sm:text-sm text-blue-200/80 max-w-md leading-relaxed">
            Ocorreu uma instabilidade transitória na exibição. O reprodutor da TV será reiniciado automaticamente em 10 segundos para restaurar a grade de anúncios.
          </p>
          <div className="mt-8 inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-mono text-blue-200">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            Reiniciando canal automaticamente...
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
