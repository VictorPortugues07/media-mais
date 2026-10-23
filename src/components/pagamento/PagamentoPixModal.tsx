"use client";

import { useEffect, useRef, useState } from "react";

type Cobranca = {
  status: string;
  valorCentavos: number;
  brCode: string;
  brCodeBase64: string;
  expiraEm: string | null;
};

export function PagamentoPixModal({
  anuncioId,
  onClose,
  onPago,
}: {
  anuncioId: number;
  onClose: () => void;
  onPago: () => void;
}) {
  const [cobranca, setCobranca] = useState<Cobranca | null>(null);
  const [erro, setErro] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [pago, setPago] = useState(false);
  const onPagoRef = useRef(onPago);
  onPagoRef.current = onPago;

  // Gera (ou reaproveita) o PIX ao abrir
  useEffect(() => {
    let ativo = true;
    fetch(`/api/anuncios/${anuncioId}/pagar`, { method: "POST" })
      .then(async (res) => {
        const data = await res.json();
        if (!ativo) return;
        if (!res.ok) setErro(data.error || "Não foi possível gerar o PIX.");
        else setCobranca(data.cobranca);
      })
      .catch(() => {
        if (ativo) setErro("Erro de conexão ao gerar o PIX.");
      });
    return () => {
      ativo = false;
    };
  }, [anuncioId]);

  // Consulta o pagamento a cada 4s (a tela atualiza sozinha)
  useEffect(() => {
    if (!cobranca || pago) return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/anuncios/${anuncioId}/pagar`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.cobranca?.status === "PAGO") {
          clearInterval(timer);
          setPago(true);
          setTimeout(() => onPagoRef.current(), 1500);
        }
      } catch {
        // tenta de novo no próximo ciclo
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [cobranca, anuncioId, pago]);

  const copiar = async () => {
    if (!cobranca) return;
    try {
      await navigator.clipboard.writeText(cobranca.brCode);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setErro("Não foi possível copiar. Selecione o código manualmente.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
        <h3 className="text-lg font-bold text-[#0E1F66]">Pagar com PIX</h3>

        {erro && (
          <p className="mt-4 text-sm font-semibold text-rose-600">{erro}</p>
        )}

        {!cobranca && !erro && (
          <p className="mt-4 text-sm text-slate-500">Gerando PIX...</p>
        )}

        {cobranca && pago && (
          <div className="mt-6">
            <p className="text-4xl">✅</p>
            <p className="mt-2 text-sm font-bold text-emerald-700">
              Pagamento confirmado! Atualizando seu painel...
            </p>
          </div>
        )}

        {cobranca && !pago && (
          <>
            <p className="mt-1 text-2xl font-black text-[#0E1F66]">
              {(cobranca.valorCentavos / 100).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>
            <p className="text-[11px] text-slate-500">
              Cota mensal de veiculação (30 dias)
            </p>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img loading="lazy" decoding="async"
              src={cobranca.brCodeBase64}
              alt="QR Code PIX"
              className="mx-auto mt-4 h-48 w-48"
            />

            <button
              type="button"
              onClick={copiar}
              className="mt-4 w-full rounded-xl bg-[#4F93C9] px-4 py-2 text-sm font-bold text-white hover:opacity-90"
            >
              {copiado ? "Copiado!" : "Copiar código PIX"}
            </button>

            <p className="mt-3 text-xs text-slate-500">
              Aguardando pagamento… esta tela atualiza sozinha.
            </p>
          </>
        )}

        {!pago && (
          <button
            type="button"
            onClick={onClose}
            className="mt-4 text-xs text-slate-500 underline"
          >
            Fechar
          </button>
        )}
      </div>
    </div>
  );
}
