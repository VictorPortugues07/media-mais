import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      // Send initial connection message
      send({ type: "connected", userId: session.userId });

      // Poll for new notifications every 5 seconds
      const interval = setInterval(async () => {
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
          // Connection might be closed
        }
      }, 5000);

      // Clean up on close
      const cleanup = () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      // Keep connection alive for max 30 minutes
      setTimeout(cleanup, 30 * 60 * 1000);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
