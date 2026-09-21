import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { uploadFile } from "../src/lib/upload";

describe("Módulo 2: Blindagem de Upload de Mídias", () => {
  it("Deve forçar extensão canônica a partir do MIME type, neutralizando extensões perigosas", async () => {
    // Simulando tentativa de exploit: arquivo com MIME de imagem mas nome 'exploit.php'
    const fakeContent = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]); // Magic bytes JPEG
    const maliciousFile = new File([fakeContent], "exploit.php", {
      type: "image/jpeg",
    });

    const result = await uploadFile(maliciousFile);

    assert.equal(result.type, "IMAGEM");
    assert.ok(
      result.filename.endsWith(".jpg"),
      `Extensão esperada .jpg, mas recebeu: ${result.filename}`
    );
    assert.ok(
      !result.filename.includes("php"),
      "O nome salvo nunca deve conter a extensão fornecida pelo cliente"
    );
  });

  it("Deve forçar extensão .mp4 para vídeos válidos, ignorando nome original", async () => {
    const videoContent = new Uint8Array([0x00, 0x00, 0x00, 0x18]);
    const videoFile = new File([videoContent], "video_anuncio.malware.sh", {
      type: "video/mp4",
    });

    const result = await uploadFile(videoFile);

    assert.equal(result.type, "VIDEO");
    assert.ok(result.filename.endsWith(".mp4"));
    assert.ok(!result.filename.includes("sh"));
  });

  it("Deve rejeitar arquivos com MIME types não permitidos", async () => {
    const dangerousFile = new File(["print('hello')"], "script.py", {
      type: "text/x-python",
    });

    await assert.rejects(
      async () => {
        await uploadFile(dangerousFile);
      },
      /Tipo de arquivo não permitido/
    );
  });

  it("Deve rejeitar arquivos que excedam o limite de 50MB", async () => {
    // Criando um mock de File com size simulado de 51MB
    const oversizedFile = {
      size: 51 * 1024 * 1024,
      type: "video/mp4",
      name: "huge.mp4",
    } as unknown as File;

    await assert.rejects(
      async () => {
        await uploadFile(oversizedFile);
      },
      /Arquivo muito grande/
    );
  });
});
