import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { otimizarImagem, otimizarVideo, type VarianteImagem } from "./media-optimize";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const MIME_TO_EXT: Record<string, { ext: string; type: "VIDEO" | "IMAGEM" }> = {
  "video/mp4": { ext: "mp4", type: "VIDEO" },
  "video/webm": { ext: "webm", type: "VIDEO" },
  "image/jpeg": { ext: "jpg", type: "IMAGEM" },
  "image/png": { ext: "png", type: "IMAGEM" },
  "image/webp": { ext: "webp", type: "IMAGEM" },
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export type UploadResult = {
  url: string;
  filename: string;
  type: "VIDEO" | "IMAGEM";
};

export async function uploadFile(
  file: File,
  variante: VarianteImagem = "midia"
): Promise<UploadResult> {
  if (!file || typeof file.size !== "number") {
    throw new Error("Arquivo inválido.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Arquivo muito grande. Tamanho máximo permitido: 50MB");
  }

  const mimeInfo = MIME_TO_EXT[file.type];
  if (!mimeInfo) {
    throw new Error(
      "Tipo de arquivo não permitido. Formatos aceitos: MP4, WebM, JPEG, PNG, WebP"
    );
  }

  const subdir = mimeInfo.type === "VIDEO" ? "videos" : "images";
  const dirPath = path.join(UPLOAD_DIR, subdir);

  try {
    await mkdir(dirPath, { recursive: true });

    let buffer: Buffer = Buffer.from(await file.arrayBuffer());
    // A extensão é SEMPRE derivada do MIME type estrito verificado (ou do formato de saída da otimização),
    // nunca do nome enviado pelo cliente
    let ext = mimeInfo.ext;

    if (mimeInfo.type === "IMAGEM") {
      try {
        buffer = await otimizarImagem(buffer, variante);
        ext = "webp";
      } catch {
        throw new Error("Imagem inválida ou corrompida.");
      }
    } else {
      const otimizado = await otimizarVideo(buffer, mimeInfo.ext);
      if (otimizado) {
        buffer = otimizado;
        ext = "mp4";
      }
    }

    const filename = `${randomUUID()}.${ext}`;
    const filePath = path.join(dirPath, filename);
    await writeFile(filePath, buffer);

    return {
      url: `/uploads/${subdir}/${filename}`,
      filename,
      type: mimeInfo.type,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "Imagem inválida ou corrompida.") throw error;
    // Sanitizar erro para nunca expor caminhos absolutos do servidor para o cliente
    console.error("Falha ao salvar arquivo no servidor:", error);
    throw new Error("Falha ao processar e salvar o arquivo no servidor.");
  }
}

export async function deleteUploadedFile(url: string): Promise<boolean> {
  try {
    if (!url || typeof url !== "string") return false;
    const cleanUrl = url.replace(/^[/\\]+/, "");
    if (!cleanUrl.startsWith("uploads/")) return false;

    const publicUploads = path.resolve(process.cwd(), "public", "uploads");
    const fullPath = path.resolve(process.cwd(), "public", cleanUrl);

    if (!fullPath.startsWith(publicUploads)) {
      return false;
    }

    await unlink(fullPath);
    return true;
  } catch {
    return false;
  }
}
