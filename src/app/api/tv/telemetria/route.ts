import { prisma } from "@/lib/prisma";
import { verifyTVToken } from "@/lib/auth";
import { NextRequest } from "next/server";
import { z } from "zod";

const telemetriaSchema = z.object({
  pontoId: z.number().int().positive("ID do ponto inválido"),
  token: z.string().optional(),
  anuncioId: z.number().int().positive().optional(),
  duracaoSegundos: z
    .number()
    .int("Duração deve ser um número inteiro")
    .min(5, "Duração mínima para comprovação é de 5 segundos")
    .max(60, "Duração máxima permitida é de 60 segundos")
    .optional(),
  tipoMidia: z.enum(["VIDEO", "IMAGEM"]).optional(),
  heartbeatOnly: z.boolean().optional(),
  offline: z.boolean().optional(),
  deviceType: z.enum(["SMART_TV", "DESKTOP", "TABLET", "MOBILE"]).optional(),
  screenResolution: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      body = await request.json();
    } else {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    }

    const data = telemetriaSchema.parse(body);

    // 1. Verificação de Token de TV Pareada
    const tvToken =
      request.headers.get("x-tv-token") ||
      request.nextUrl.searchParams.get("token") ||
      data.token;

    if (!tvToken) {
      return Response.json(
        { error: "Acesso não autorizado. Token de TV pareada é obrigatório." },
        { status: 401 }
      );
    }

    const tokenPontoId = await verifyTVToken(tvToken);
    if (!tokenPontoId || tokenPontoId !== data.pontoId) {
      return Response.json(
        { error: "Token de pareamento inválido ou não corresponde ao ponto de TV." },
        { status: 403 }
      );
    }

    // 2. Se for aviso de desconexão (saída normal do player)
    // Preservar timestamp de última atividade para manter histórico de disponibilidade auditável
    if (data.offline) {
      await prisma.pontoMidia.update({
        where: { id: data.pontoId },
        data: { ultimaAtividade: new Date() },
      });
      return Response.json({ success: true, offline: true });
    }

    // 3. Atualizar timestamp de atividade e hardware do ponto (Heartbeat)
    const updateData: Record<string, unknown> = {
      ultimaAtividade: new Date(),
    };

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

    // 4. Se for registro de veiculação (Proof of Play)
    if (!data.heartbeatOnly && data.anuncioId) {
      // Rejeitar celulares ou clientes sem identificação de tela válida
      if (data.deviceType === "MOBILE" || !data.deviceType) {
        return Response.json(
          { error: "Telemetria de comprovação não é permitida para dispositivos móveis." },
          { status: 400 }
        );
      }

      if (!data.duracaoSegundos || !data.tipoMidia) {
        return Response.json(
          { error: "Duração e tipo de mídia são obrigatórios para comprovação de veiculação." },
          { status: 400 }
        );
      }

      // Validar existência, vínculo e status ativo no banco
      const anuncio = await prisma.anuncio.findUnique({
        where: { id: data.anuncioId },
        select: { id: true, pontoMidiaId: true, status: true },
      });

      if (!anuncio) {
        return Response.json({ error: "Anúncio não encontrado." }, { status: 404 });
      }

      if (anuncio.pontoMidiaId !== data.pontoId) {
        return Response.json(
          { error: "Anúncio não pertence a este ponto de TV." },
          { status: 403 }
        );
      }

      if (anuncio.status !== "ATIVO") {
        return Response.json(
          { error: `Anúncio não está ativo na grade (status atual: ${anuncio.status}).` },
          { status: 400 }
        );
      }

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
      return Response.json({ error: error.issues[0]?.message || "Dados inválidos" }, { status: 400 });
    }
    console.error("Telemetria error:", error);
    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
