import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { signTVToken, verifyTVToken } from "../src/lib/auth";

describe("Módulo 4: Emissão e Validação de Tokens de TV Pareada", () => {
  it("Deve assinar e verificar token legítimo de TV com sucesso", async () => {
    const pontoId = 123;
    const token = await signTVToken(pontoId);

    assert.ok(typeof token === "string" && token.length > 20);

    const verifiedPontoId = await verifyTVToken(token);
    assert.equal(verifiedPontoId, 123);
  });

  it("Deve rejeitar tokens de TV adulterados ou com assinatura incorreta", async () => {
    const pontoId = 123;
    const token = await signTVToken(pontoId);
    const tamperedToken = token.slice(0, -5) + "abcde";

    const verified = await verifyTVToken(tamperedToken);
    assert.equal(verified, null, "Token adulterado deve retornar null");
  });

  it("Deve rejeitar tokens com role diferente de TV_PLAYER", async () => {
    // Token de usuário padrão
    const tokenUsuario = "invalid.token.structure";
    const verified = await verifyTVToken(tokenUsuario);
    assert.equal(verified, null);
  });
});
