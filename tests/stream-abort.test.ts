import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { GET as streamHandler } from "../src/app/api/notificacoes/stream/route";
import { generateToken } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";

describe("Módulo 5: SSE Stream de Notificações e Encerramento de Conexões", () => {
  it("Deve rejeitar conexão ao stream sem autenticação (401)", async () => {
    const req = new NextRequest("http://localhost:3000/api/notificacoes/stream", {
      method: "GET",
    });

    const res = await streamHandler(req);
    assert.equal(res.status, 401);
  });

  it("Deve abrir stream text/event-stream e responder ao sinal de abort sem travar o servidor", async () => {
    const testUser = await prisma.user.create({
      data: {
        email: `stream_test_${Date.now()}@mediamais.com`,
        senha: "hash",
        nome: "Stream User",
        whatsapp: "11900000000",
        role: "ADMIN",
        ativo: true,
      },
    });

    const token = await generateToken({
      userId: testUser.id,
      email: testUser.email,
      nome: testUser.nome,
      role: testUser.role,
    });

    const abortController = new AbortController();

    try {
      const req = new NextRequest("http://localhost:3000/api/notificacoes/stream", {
        method: "GET",
        headers: {
          Cookie: `mm_session=${token}`,
        },
        signal: abortController.signal,
      });

      const res = await streamHandler(req);
      assert.equal(res.status, 200);
      assert.equal(res.headers.get("Content-Type"), "text/event-stream");

      // Simular fechamento da aba / desconexão do cliente
      abortController.abort();
      assert.equal(abortController.signal.aborted, true);
    } finally {
      await prisma.user.delete({ where: { id: testUser.id } });
    }
  });
});
