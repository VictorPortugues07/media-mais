import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { confirmarPagamento } from "@/lib/pagamentos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function iguais(a: string, b: string): boolean {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}

function assinaturaValida(raw: string, header: string | null): boolean {
  const chave = process.env.ABACATEPAY_PUBLIC_KEY;
  if (!chave || !header) return false;
  const esperado = crypto
    .createHmac("sha256", chave)
    .update(Buffer.from(raw, "utf8"))
    .digest("base64");
  return iguais(esperado, header);
}

type Evento = {
  id?: string;
  event?: string;
  data?: {
    id?: string;
    transparent?: { id?: string };
    pixQrCode?: { id?: string };
  };
};

export async function POST(request: NextRequest) {
  // Camada 1: secret na query string da URL cadastrada na AbacatePay
  const secret = process.env.ABACATEPAY_WEBHOOK_SECRET;
  const recebido = request.nextUrl.searchParams.get("webhookSecret") ?? "";
  if (!secret || !iguais(recebido, secret)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Camada 2: assinatura HMAC-SHA256 do corpo CRU (antes de qualquer JSON.parse)
  const raw = await request.text();
  const assinatura =
    request.headers.get("x-webhook-signature") ??
    request.headers.get("x-abacate-signature");
  if (!assinaturaValida(raw, assinatura)) {
    return Response.json({ error: "Assinatura inválida" }, { status: 401 });
  }

  let evento: Evento;
  try {
    evento = JSON.parse(raw) as Evento;
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  // Só nos interessa pagamento de checkout transparente confirmado
  if (evento.event !== "transparent.completed") {
    return Response.json({ ok: true });
  }

  const abacateId =
    evento.data?.transparent?.id ??
    evento.data?.pixQrCode?.id ??
    evento.data?.id;
  if (!abacateId) {
    console.error("[abacatepay] webhook sem id de cobrança:", raw);
    return Response.json({ ok: true });
  }

  try {
    // Confere o status na API da AbacatePay e ativa o anúncio (idempotente)
    const resultado = await confirmarPagamento(abacateId);
    console.log(`[abacatepay] ${evento.event} ${abacateId} -> ${resultado}`);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[abacatepay] erro ao processar webhook:", error);
    // 500 faz a AbacatePay reenviar (até 7 tentativas)
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}
