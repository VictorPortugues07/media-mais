import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let interval: NodeJS.Timeout | null = null;
  let maxTimeout: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // Conexão encerrada pelo cliente
          if (interval) clearInterval(interval);
          if (maxTimeout) clearTimeout(maxTimeout);
        }
      };

      // Mensagem inicial de conexão bem-sucedida
      send({ type: "connected", userId: session.userId });

      // Polling a cada 5 segundos
      interval = setInterval(async () => {
        try {
          const naoLidas = await prisma.notificacao.count({
            where: { userId: session.userId, lida: false },
          });

          const latest = await prisma.notificacao.findMany({
            where: { userId: session.userId, lida: false },
            orderBy: { criadoEm: "desc" },
            take: 5,
          });

          send({ type: "update", naoLidas, latest });
        } catch {
          if (interval) clearInterval(interval);
        }
      }, 5000);

      // Limpeza imediata no evento de abort do cliente (fechamento da aba / navegação)
      request.signal.addEventListener("abort", () => {
        if (interval) clearInterval(interval);
        if (maxTimeout) clearTimeout(maxTimeout);
        try {
          controller.close();
        } catch {}
      });

      // Timeout máximo de segurança (30 minutos)
      maxTimeout = setTimeout(() => {
        if (interval) clearInterval(interval);
        try {
          controller.close();
        } catch {}
      }, 30 * 60 * 1000);
    },
    cancel() {
      if (interval) clearInterval(interval);
      if (maxTimeout) clearTimeout(maxTimeout);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
