"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Alterna palavras no título ("esperam", "treinam", "almoçam"...),
 * terminando no slogan oficial: "estão". A largura acompanha a palavra
 * com uma transição suave, para o título continuar centralizado.
 */
export function RotatingWord({ words, interval = 2200 }: { words: string[]; interval?: number }) {
  const [index, setIndex] = useState(0);
  const [largura, setLargura] = useState<number | undefined>(undefined);
  const medidas = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % words.length), interval);
    return () => clearInterval(timer);
  }, [words.length, interval]);

  useLayoutEffect(() => {
    const medir = () => setLargura(medidas.current[index]?.offsetWidth);
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, [index]);

  return (
    <span
      className="relative inline-block align-bottom text-left transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{ width: largura }}
    >
      {/* Medidores invisíveis de cada palavra */}
      <span aria-hidden="true" className="invisible absolute left-0 top-0 whitespace-nowrap">
        {words.map((w, i) => (
          <span key={w} ref={(el) => { medidas.current[i] = el; }} className="absolute left-0 top-0">
            {w}
          </span>
        ))}
      </span>
      <span key={index} className="inline-block whitespace-nowrap text-brand-gradient animate-word-in pb-[0.08em]" aria-live="polite">
        {words[index]}
      </span>
    </span>
  );
}
