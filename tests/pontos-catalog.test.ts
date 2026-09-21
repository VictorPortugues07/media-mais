import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { GET as getPontosHandler } from "../src/app/api/pontos/route";
import { PATCH as patchPontoHandler } from "../src/app/api/pontos/[id]/route";

describe("Módulo 1: Proteção e Sanitização do Catálogo de Pontos", () => {
  it("GET /api/pontos público não deve expor codigoTv nem codigoRotativo", async () => {
    const req = new NextRequest("http://localhost:3000/api/pontos", {
      method: "GET",
    });

    const res = await getPontosHandler(req);
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.ok(Array.isArray(data.pontos));

    for (const ponto of data.pontos) {
      assert.equal(
        ponto.codigoTv,
        undefined,
        `O ponto ${ponto.id} expôs codigoTv para acesso anônimo!`
      );
      assert.equal(
        ponto.codigoRotativo,
        undefined,
        `O ponto ${ponto.id} expôs codigoRotativo para acesso anônimo!`
      );
      assert.equal(
        ponto.codigoRotativoExpira,
        undefined,
        `O ponto ${ponto.id} expôs codigoRotativoExpira para acesso anônimo!`
      );
    }
  });

  it("PATCH /api/pontos/[id] deve rejeitar status arbitrários não permitidos", async () => {
    // Chamada sem autenticação admin
    const reqUnauth = new NextRequest("http://localhost:3000/api/pontos/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "HACKEADO" }),
    });

    const resUnauth = await patchPontoHandler(reqUnauth, {
      params: Promise.resolve({ id: "1" }),
    });

    assert.equal(resUnauth.status, 401);
  });
});
