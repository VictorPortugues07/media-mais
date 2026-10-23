import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { calcularPrecificacaoPonto } from "@/lib/precificacao";
import { criarCobrancaPix } from "@/lib/abacatepay";
import { confirmarPagamento } from "@/lib/pagamentos";
import { NextRequest } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

async function carregarAnuncio(request: NextRequest, ctx: Ctx) {
  const session = await getSession(request);
  if (!session || session.role !== "ANUNCIANTE") {
    return {
      erro: Response.json({ error: "Nao autorizado" }, { status: 401 }),
    };
  }

  const { id } = await ctx.params;
  const anuncioId = parseInt(id);
  if (isNaN(anuncioId)) {
    return { erro: Response.json({ error: "ID inválido" }, { status: 400 }) };
  }

  // Só o dono do anúncio consegue pagar/consultar
  const anuncio = await prisma.anuncio.findFirst({
    where: {
      id: anuncioId,
      deletadoEm: null,
      anunciante: { userId: session.userId },
    },
    include: { pontoMidia: true },
  });
  if (!anuncio) {
    return {
      erro: Response.json({ error: "Anúncio não encontrado" }, { status: 404 }),
    };
  }
  return { anuncio };
}

// Consulta de status (polling da tela). Também confere na AbacatePay,
// caso o webhook ainda não tenha chegado.
export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const r = await carregarAnuncio(request, ctx);
    if (r.erro) return r.erro;

    let cobranca = await prisma.cobranca.findFirst({
      where: { anuncioId: r.anuncio.id },
      orderBy: { criadoEm: "desc" },
    });

    if (cobranca && cobranca.status === "PENDENTE") {
      await confirmarPagamento(cobranca.abacateId);
      cobranca = await prisma.cobranca.findUnique({
        where: { id: cobranca.id },
      });
    }

    const anuncio = await prisma.anuncio.findUnique({
      where: { id: r.anuncio.id },
      select: { status: true },
    });

    return Response.json({
      cobranca: cobranca ? { status: cobranca.status } : null,
      anuncioStatus: anuncio?.status ?? null,
    });
  } catch (error) {
    console.error("Status pagamento error:", error);
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

// Gera (ou reaproveita) o PIX do anúncio aprovado
export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    const r = await carregarAnuncio(request, ctx);
    if (r.erro) return r.erro;
    const { anuncio } = r;

    if (anuncio.status !== "APROVADO") {
      return Response.json(
        { error: "Só é possível pagar anúncios aprovados pela moderação." },
        { status: 409 },
      );
    }

    // Reaproveita PIX ainda válido (evita gerar cobranças duplicadas)
    const existente = await prisma.cobranca.findFirst({
      where: {
        anuncioId: anuncio.id,
        status: "PENDENTE",
        OR: [{ expiraEm: null }, { expiraEm: { gt: new Date() } }],
      },
      orderBy: { criadoEm: "desc" },
    });
    if (existente) {
      return Response.json({
        cobranca: {
          status: existente.status,
          valorCentavos: existente.valorCentavos,
          brCode: existente.brCode,
          brCodeBase64: existente.brCodeBase64,
          expiraEm: existente.expiraEm,
        },
      });
    }

    // Valor SEMPRE calculado no servidor, nunca vindo do cliente
    const p = anuncio.pontoMidia;
    const cotaReais =
      p.cotaMensal ??
      calcularPrecificacaoPonto({
        fluxoDiarioEstimado: p.fluxoDiarioEstimado,
        tempoPermanencia: p.tempoPermanencia,
        notaFluxo: p.notaFluxo,
        notaTempo: p.notaTempo,
        notaPerfil: p.notaPerfil,
        notaExclusividade: p.notaExclusividade,
      }).cotaMensal;
    const valorCentavos = Math.round(cotaReais * 100);

    const pix = await criarCobrancaPix({
      valorCentavos,
      descricao: `Cota mensal Media+ - ${p.nomeEmpresa} - ${anuncio.titulo}`,
      metadata: {
        anuncioId: String(anuncio.id),
        pontoMidiaId: String(p.id),
        anuncianteId: String(anuncio.anuncianteId),
      },
    });

    const cobranca = await prisma.cobranca.create({
      data: {
        anuncioId: anuncio.id,
        abacateId: pix.id,
        valorCentavos,
        brCode: pix.brCode,
        brCodeBase64: pix.brCodeBase64,
        expiraEm: pix.expiresAt ? new Date(pix.expiresAt) : null,
      },
    });

    return Response.json(
      {
        cobranca: {
          status: cobranca.status,
          valorCentavos,
          brCode: cobranca.brCode,
          brCodeBase64: cobranca.brCodeBase64,
          expiraEm: cobranca.expiraEm,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Pagar anuncio error:", error);
    return Response.json(
      { error: "Não foi possível gerar o PIX agora." },
      { status: 500 },
    );
  }
}
