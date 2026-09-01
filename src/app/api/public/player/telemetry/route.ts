import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

const telemetrySchema = z.object({
  pontoId: z.number(),
  anuncioId: z.number().optional(),
  duracaoSegundos: z.number().optional(),
  tipoMidia: z.enum(["VIDEO", "IMAGEM"]).optional(),
  heartbeatOnly: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = telemetrySchema.parse(body);

    // 1. Atualizar timestamp de atividade da TV
    await prisma.pontoMidia.update({
      where: { id: data.pontoId },
      data: {
        ultimaAtividade: new Date(),
      },
    });

    // 2. Se for finalização de anúncio, registrar no Proof of Play
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

    return NextResponse.json(
      { success: true, timestamp: new Date().toISOString() },
      { status: 200, headers: corsHeaders() }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400, headers: corsHeaders() }
      );
    }
    console.error("Public telemetry error:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno" },
      { status: 500, headers: corsHeaders() }
    );
  }
}
