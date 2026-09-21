import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

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

export async function uploadFile(file: File): Promise<UploadResult> {
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

  // A extensão é SEMPRE derivada do MIME type estrito verificado, nunca do nome enviado pelo cliente
  const filename = `${randomUUID()}.${mimeInfo.ext}`;
  const subdir = mimeInfo.type === "VIDEO" ? "videos" : "images";
  const dirPath = path.join(UPLOAD_DIR, subdir);

  try {
    await mkdir(dirPath, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(dirPath, filename);
    await writeFile(filePath, buffer);

    return {
      url: `/uploads/${subdir}/${filename}`,
      filename,
      type: mimeInfo.type,
    };
  } catch (error) {
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
