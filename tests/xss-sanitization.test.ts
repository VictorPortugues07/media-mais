import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { escapeHtml, sanitizeCssUrl } from "../src/lib/html-sanitize";

describe("Módulo 5: Sanitização de XSS e Injeções em Frontend", () => {
  it("Deve neutralizar tags HTML executáveis e scripts maliciosos", () => {
    const maliciousInput = "<script>alert('xss')</script><img src=x onerror=alert(1)>";
    const sanitized = escapeHtml(maliciousInput);

    assert.ok(!sanitized.includes("<script>"), "Tag <script> não deve existir");
    assert.ok(!sanitized.includes("<img"), "Tag <img> não deve existir");
    assert.ok(sanitized.includes("&lt;script&gt;"), "Deve conter entidades HTML escapadas");
    assert.ok(sanitized.includes("&lt;img"), "Deve conter entidades HTML escapadas");
  });

  it("Deve escapar aspas duplas, simples e caracteres especiais", () => {
    const input = `Padaria "O'Connor" & Filhos <TV 1>`;
    const sanitized = escapeHtml(input);

    assert.equal(sanitized, "Padaria &quot;O&#039;Connor&quot; &amp; Filhos &lt;TV 1&gt;");
  });

  it("Deve lidar graciosamente com valores nulos, indefinidos ou não-string", () => {
    assert.equal(escapeHtml(null), "");
    assert.equal(escapeHtml(undefined), "");
    assert.equal(escapeHtml("" as any), "");
  });

  it("Deve neutralizar esquemas de javascript: e quebras em URLs de CSS", () => {
    const jsUrl = "javascript:alert(document.cookie)";
    assert.equal(sanitizeCssUrl(jsUrl), "");

    const dataHtmlUrl = "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==";
    assert.equal(sanitizeCssUrl(dataHtmlUrl), "");

    // Tentativa de quebra de CSS: ') ; background-image:url(evil.com
    const breakCss = "image.jpg'); background-image:url('evil.com";
    const sanitizedCss = sanitizeCssUrl(breakCss);
    assert.ok(!sanitizedCss.includes("'"));
    assert.ok(!sanitizedCss.includes(")"));
    assert.ok(!sanitizedCss.includes("("));
  });

  it("Deve aceitar URLs de imagens limpas e legítimas", () => {
    const validUrl = "/uploads/images/padaria.jpg";
    assert.equal(sanitizeCssUrl(validUrl), "/uploads/images/padaria.jpg");
  });
});
