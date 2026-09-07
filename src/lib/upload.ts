import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export type UploadResult = {
  url: string;
  filename: string;
  type: "VIDEO" | "IMAGEM";
};

export async function uploadFile(file: File): Promise<UploadResult> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Arquivo muito grande. Maximo: 50MB");
  }

  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);

  if (!isVideo && !isImage) {
    throw new Error(
      "Tipo de arquivo nao permitido. Permitidos: MP4, WebM, JPEG, PNG, WebP"
    );
  }

  const ext = file.name.split(".").pop() || (isVideo ? "mp4" : "jpg");
  const filename = `${randomUUID()}.${ext}`;
  const subdir = isVideo ? "videos" : "images";
  const dirPath = path.join(UPLOAD_DIR, subdir);

  await mkdir(dirPath, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = path.join(dirPath, filename);
  await writeFile(filePath, buffer);

  return {
    url: `/uploads/${subdir}/${filename}`,
    filename,
    type: isVideo ? "VIDEO" : "IMAGEM",
  };
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
