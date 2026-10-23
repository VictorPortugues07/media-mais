"use client";

import React, { useEffect, useRef, useState } from "react";

/** Número que conta de 0 até o valor quando aparece na tela. */
export function CountUp({ value, duration = 1400, suffix = "" }: { value: number; duration?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [atual, setAtual] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      const inicio = performance.now();
      const tick = (agora: number) => {
        const t = Math.min((agora - inicio) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        setAtual(Math.round(value * eased));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {atual.toLocaleString("pt-BR")}
      {suffix}
    </span>
  );
}
