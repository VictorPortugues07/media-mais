import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { z } from "zod";

const telemetriaSchema = z.object({
  pontoId: z.number(),
  anuncioId: z.number().optional(),
  duracaoSegundos: z.number().optional(),
  tipoMidia: z.enum(["VIDEO", "IMAGEM"]).optional(),
  heartbeatOnly: z.boolean().optional(),
  offline: z.boolean().optional(),
  deviceType: z.enum(["SMART_TV", "DESKTOP", "TABLET", "MOBILE"]).optional(),
  screenResolution: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    let body: any;
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      body = await request.json();
    } else {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    }

    const data = telemetriaSchema.parse(body);

    // Se o player informou desconexão ou fechamento da aba
    if (data.offline) {
      await prisma.pontoMidia.update({
        where: { id: data.pontoId },
        data: { ultimaAtividade: null },
      });
      return Response.json({ success: true, offline: true });
    }

    // 1. Atualizar timestamp de última atividade do ponto (Heartbeat)
    //    Incluir dados do dispositivo para auditoria
    const updateData: Record<string, unknown> = {
      ultimaAtividade: new Date(),
    };

    // Salvar tipo de dispositivo e resolucao no ponto para auditoria do admin
    if (data.deviceType) {
      updateData.tipoDispositivo = data.deviceType;
    }
    if (data.screenResolution) {
      updateData.resolucaoTela = data.screenResolution;
    }

    await prisma.pontoMidia.update({
      where: { id: data.pontoId },
      data: updateData,
    });

    // 2. Se for uma exibição de anúncio finalizada, salvar registro (Proof of Play)
    //    Ignora celulares/dispositivos móveis para garantir que apenas TVs/monitores gerem métricas válidas
    if (
      !data.heartbeatOnly &&
      data.anuncioId &&
      data.duracaoSegundos &&
      data.tipoMidia &&
      data.deviceType !== "MOBILE"
    ) {
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
