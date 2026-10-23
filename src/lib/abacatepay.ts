const BASE_URL = "https://api.abacatepay.com/v2";

function apiKey(): string {
  const key = process.env.ABACATEPAY_API_KEY;
  if (!key) throw new Error("ABACATEPAY_API_KEY não configurada");
  return key;
}

export type CobrancaPix = {
  id: string;
  amount: number;
  status: string;
  brCode: string;
  brCodeBase64: string;
  expiresAt: string | null;
};

/** Cria uma cobrança PIX (checkout transparente). Valor em CENTAVOS. */
export async function criarCobrancaPix(params: {
  valorCentavos: number;
  descricao: string;
  expiraEmSegundos?: number;
  metadata?: Record<string, string>;
}): Promise<CobrancaPix> {
  const res = await fetch(`${BASE_URL}/transparents/create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      method: "PIX",
      data: {
        amount: params.valorCentavos,
        description: params.descricao.slice(0, 500),
        expiresIn: params.expiraEmSegundos ?? 86400,
        metadata: params.metadata,
      },
    }),
    signal: AbortSignal.timeout(15000),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success || !json?.data?.id) {
    console.error(
      "[abacatepay] erro ao criar cobrança:",
      res.status,
      JSON.stringify(json),
    );
    throw new Error("Falha ao gerar cobrança PIX");
  }
  return json.data as CobrancaPix;
}

/** Consulta o status real da cobrança direto na AbacatePay. */
export async function consultarStatusPix(
  id: string,
): Promise<"PENDING" | "PAID" | "EXPIRED" | "CANCELLED" | "UNKNOWN"> {
  const res = await fetch(
    `${BASE_URL}/transparents/check?id=${encodeURIComponent(id)}`,
    {
      headers: { Authorization: `Bearer ${apiKey()}` },
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    },
  );
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    console.error(
      "[abacatepay] erro ao consultar status:",
      res.status,
      JSON.stringify(json),
    );
    return "UNKNOWN";
  }
  const status = json.data?.status;
  return status === "PENDING" ||
    status === "PAID" ||
    status === "EXPIRED" ||
    status === "CANCELLED"
    ? status
    : "UNKNOWN";
}
