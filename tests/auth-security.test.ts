import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SignJWT, jwtVerify } from "jose";
import { getAuthSecret, generateToken, SessionPayload } from "../src/lib/auth";

describe("Módulo 1: Segurança e Autenticação (Auth Core)", () => {
  it("Deve lançar erro fatal se AUTH_SECRET não estiver configurada no ambiente", () => {
    const originalSecret = process.env.AUTH_SECRET;
    delete process.env.AUTH_SECRET;

    try {
      assert.throws(
        () => {
          getAuthSecret();
        },
        /FATAL: Variável de ambiente AUTH_SECRET não configurada/
      );
    } finally {
      process.env.AUTH_SECRET = originalSecret;
    }
  });

  it("Deve gerar e verificar token JWT válido utilizando o segredo seguro", async () => {
    process.env.AUTH_SECRET = "super_segredo_para_testes_unitarios_123456";

    const payload: SessionPayload = {
      userId: 42,
      email: "teste@mediamais.com",
      nome: "Admin Teste",
      role: "ADMIN",
    };

    const token = await generateToken(payload);
    assert.ok(typeof token === "string" && token.length > 20);

    const secret = getAuthSecret();
    const { payload: verified } = await jwtVerify(token, secret);

    assert.equal((verified as any).userId, 42);
    assert.equal((verified as any).email, "teste@mediamais.com");
    assert.equal((verified as any).role, "ADMIN");
  });

  it("Deve rejeitar tokens forjados com o segredo antigo hardcoded de 2026", async () => {
    process.env.AUTH_SECRET = "novo_segredo_seguro_e_aleatorio_2026";

    const forgedSecret = new TextEncoder().encode("mediamais_plataforma_secret_2026");
    const forgedToken = await new SignJWT({
      userId: 999,
      email: "hacker@evil.com",
      role: "ADMIN",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("24h")
      .sign(forgedSecret);

    const currentSecret = getAuthSecret();
    await assert.rejects(async () => {
      await jwtVerify(forgedToken, currentSecret);
    });
  });
});
