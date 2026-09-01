import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { z } from "zod";

const telemetriaSchema = z.object({
  pontoId: z.number(),
  anuncioId: z.number().optional(),
  duracaoSegundos: z.number().optional(),
  tipoMidia: z.enum(["VIDEO", "IMAGEM"]).optional(),
  heartbeatOnly: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = telemetriaSchema.parse(body);

    // 1. Atualizar timestamp de última atividade do ponto (Heartbeat)
    await prisma.pontoMidia.update({
      where: { id: data.pontoId },
      data: {
        ultimaAtividade: new Date(),
      },
    });

    // 2. Se for uma exibição de anúncio finalizada, salvar registro
    if (!data.heartbeatOnly && data.anuncioId && data.duracaoSegundos && data.tipoMidia) {
      await prisma.registroExibicao.create({
        data: {
          anuncioId: data.anuncioId,
          pontoMidiaId: data.pontoId,
          duracaoSegundos: data.duracaoSegundos,
          tipoMidia: data.tipoMidia,
        },
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Telemetria error:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}
