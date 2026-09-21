import { prisma } from "@/lib/prisma";
import { verifyTVToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-tv-token",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

const telemetrySchema = z.object({
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

    const data = telemetrySchema.parse(body);

    const tvToken =
      request.headers.get("x-tv-token") ||
      request.nextUrl.searchParams.get("token") ||
      data.token;

    if (!tvToken) {
      return NextResponse.json(
        { success: false, error: "Acesso não autorizado. Token de TV é obrigatório." },
        { status: 401, headers: corsHeaders() }
      );
    }

    const tokenPontoId = await verifyTVToken(tvToken);
    if (!tokenPontoId || tokenPontoId !== data.pontoId) {
      return NextResponse.json(
        { success: false, error: "Token de TV inválido ou não corresponde ao ponto." },
        { status: 403, headers: corsHeaders() }
      );
    }

    if (data.offline) {
      await prisma.pontoMidia.update({
        where: { id: data.pontoId },
        data: { ultimaAtividade: new Date() },
      });
      return NextResponse.json(
        { success: true, offline: true },
        { status: 200, headers: corsHeaders() }
      );
    }

    const updateData: Record<string, unknown> = {
      ultimaAtividade: new Date(),
    };
    if (data.deviceType) updateData.tipoDispositivo = data.deviceType;
    if (data.screenResolution) updateData.resolucaoTela = data.screenResolution;

    await prisma.pontoMidia.update({
      where: { id: data.pontoId },
      data: updateData,
    });

    if (!data.heartbeatOnly && data.anuncioId) {
      if (data.deviceType === "MOBILE" || !data.deviceType) {
        return NextResponse.json(
          { success: false, error: "Dispositivos móveis não registram veiculações." },
          { status: 400, headers: corsHeaders() }
        );
      }

      if (!data.duracaoSegundos || !data.tipoMidia) {
        return NextResponse.json(
          { success: false, error: "Duração e tipo de mídia são obrigatórios." },
          { status: 400, headers: corsHeaders() }
        );
      }

      const anuncio = await prisma.anuncio.findUnique({
        where: { id: data.anuncioId },
        select: { id: true, pontoMidiaId: true, status: true },
      });

      if (!anuncio) {
        return NextResponse.json(
          { success: false, error: "Anúncio não encontrado." },
          { status: 404, headers: corsHeaders() }
        );
      }

      if (anuncio.pontoMidiaId !== data.pontoId) {
        return NextResponse.json(
          { success: false, error: "Anúncio não pertence a este ponto." },
          { status: 403, headers: corsHeaders() }
        );
      }

      if (anuncio.status !== "ATIVO") {
        return NextResponse.json(
          { success: false, error: "Anúncio não está ativo na grade." },
          { status: 400, headers: corsHeaders() }
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

    return NextResponse.json(
      { success: true, timestamp: new Date().toISOString() },
      { status: 200, headers: corsHeaders() }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message || "Dados inválidos" },
        { status: 400, headers: corsHeaders() }
      );
    }
    console.error("Public telemetry error:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500, headers: corsHeaders() }
    );
  }
}
