import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { PUT as updatePontoPerfilHandler } from "../src/app/api/ponto/perfil/route";
import { generateToken } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";

describe("Módulo 5: Proteção de Dados e Prevenção de Perda de Perfil", () => {
  it("PUT /api/ponto/perfil deve rejeitar payload com campos vazios obrigatórios com 400", async () => {
    const user = await prisma.user.create({
      data: {
        email: `profile_guard_${Date.now()}@mediamais.com`,
        senha: "hash",
        nome: "Dono Perfil",
        whatsapp: "11900000000",
        role: "PONTO",
        ativo: true,
      },
    });

    const token = await generateToken({
      userId: user.id,
      email: user.email,
      nome: user.nome,
      role: user.role,
    });

    try {
      // Simulação da falha do formulário que enviava tudo vazio
      const req = new NextRequest("http://localhost:3000/api/ponto/perfil", {
        method: "PUT",
        headers: {
          Cookie: `mm_session=${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: "",
          whatsapp: "",
          nomeEmpresa: "",
          responsavel: "",
          cep: "",
          rua: "",
          numero: "",
          bairro: "",
          cidade: "",
          uf: "",
          categoria: "",
          descricao: "",
        }),
      });

      const res = await updatePontoPerfilHandler(req);
      assert.equal(res.status, 400, "Payload vazio deve ser rejeitado para não corromper cadastro");
    } finally {
      await prisma.user.delete({ where: { id: user.id } });
    }
  });
});
