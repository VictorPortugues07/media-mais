import sharp from "sharp";
import { spawn } from "child_process";
import { writeFile, readFile, unlink, stat } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { randomUUID } from "crypto";

/**
 * Otimização de mídia no upload.
 *
 * - Imagens: corrige rotação EXIF, remove metadados, redimensiona e converte para WebP.
 * - Vídeos: recomprime para H.264 (MP4) com CRF, limita a 1080p, áudio AAC leve
 *   e "faststart" (o player começa a tocar antes do download terminar).
 *   Requer ffmpeg no PATH (ou FFMPEG_PATH). Se indisponível ou se falhar,
 *   o arquivo original é mantido — o upload nunca quebra por causa da otimização.
 */

export type VarianteImagem = "midia" | "avatar";

const LIMITES_IMAGEM: Record<VarianteImagem, { largura: number; altura: number; qualidade: number }> = {
  midia: { largura: 1920, altura: 1080, qualidade: 80 },
  avatar: { largura: 512, altura: 512, qualidade: 82 },
};

export async function otimizarImagem(
  input: Buffer,
  variante: VarianteImagem = "midia"
): Promise<Buffer> {
  const { largura, altura, qualidade } = LIMITES_IMAGEM[variante];
  return sharp(input, { failOn: "none" })
    .rotate()
    .resize({ width: largura, height: altura, fit: "inside", withoutEnlargement: true })
    .webp({ quality: qualidade, effort: 4 })
    .toBuffer();
}

const FFMPEG_BIN = process.env.FFMPEG_PATH || "ffmpeg";
const VIDEO_TIMEOUT_MS = 5 * 60 * 1000;

function executarFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(FFMPEG_BIN, args, { windowsHide: true });
    let stderr = "";
    const timer = setTimeout(() => {
      proc.kill("SIGKILL");
      reject(new Error("ffmpeg excedeu o tempo limite"));
    }, VIDEO_TIMEOUT_MS);

    proc.stderr.on("data", (d) => {
      stderr = (stderr + d.toString()).slice(-2000);
    });
    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    proc.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg saiu com código ${code}: ${stderr}`));
    });
  });
}

export function argsCompressaoVideo(entrada: string, saida: string): string[] {
  return [
    "-y",
    "-i", entrada,
    "-map", "0:v:0",
    "-map", "0:a:0?",
    // Limita a 1080p mantendo proporção e dimensões pares (exigência do H.264)
    "-vf", "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2,fps=30",
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "28",
    "-maxrate", "2500k",
    "-bufsize", "5000k",
    "-profile:v", "high",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "96k",
    "-ac", "2",
    "-movflags", "+faststart",
    saida,
  ];
}

/**
 * Recomprime o vídeo. Retorna o buffer otimizado (sempre MP4) ou `null`
 * quando não foi possível otimizar / o resultado não ficou menor.
 */
export async function otimizarVideo(input: Buffer, extEntrada: string): Promise<Buffer | null> {
  const base = path.join(tmpdir(), `mm-${randomUUID()}`);
  const entrada = `${base}-in.${extEntrada}`;
  const saida = `${base}-out.mp4`;

  try {
    await writeFile(entrada, input);
    await executarFfmpeg(argsCompressaoVideo(entrada, saida));
    const { size } = await stat(saida);
    if (size <= 0 || size >= input.length) return null;
    return await readFile(saida);
  } catch (error) {
    console.warn("[media-optimize] Vídeo mantido sem otimização:", (error as Error).message);
    return null;
  } finally {
    await Promise.all([unlink(entrada).catch(() => {}), unlink(saida).catch(() => {})]);
  }
}
