/**
 * Gera todas as mídias da demonstração em public/uploads/demo:
 *   - fotos dos estabelecimentos e anunciantes (WebP otimizado)
 *   - fotos de perfil (WebP 400px) e logotipos das marcas
 *   - artes dos anúncios em imagem (WebP 1920x1080)
 *   - vídeos dos anúncios (MP4 H.264 720p, 15s, com animação e faststart)
 *
 * Uso: npm run demo:midia   (requer internet na primeira execução e ffmpeg no PATH)
 * As fotos originais ficam em cache em <tmp>/media-mais-demo-raw.
 */
import sharp from "sharp";
import { spawn } from "child_process";
import { mkdir, writeFile, readFile, access, rm, stat } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import {
  FOTOS,
  AVATARES,
  PONTOS,
  ANUNCIANTES,
  ANUNCIOS,
  type DemoAnunciante,
  type DemoAnuncio,
} from "./demo-data";

const OUT = path.join(process.cwd(), "public", "uploads", "demo");
const RAW = path.join(tmpdir(), "media-mais-demo-raw");
const WORK = path.join(tmpdir(), "media-mais-demo-work");
const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";
const FONTE = "Segoe UI, Arial, Helvetica, sans-serif";

const W = 1920;
const H = 1080;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function existe(p: string) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function baixar(chave: string, url: string): Promise<Buffer> {
  const destino = path.join(RAW, `${chave}.jpg`);
  if (await existe(destino)) return readFile(destino);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao baixar ${chave} (${res.status}): ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(destino, buf);
  return buf;
}

const salvarWebp = (img: ReturnType<typeof sharp>, destino: string, qualidade = 78) =>
  img.webp({ quality: qualidade, effort: 5 }).toFile(destino);

function ffmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(FFMPEG, ["-hide_banner", "-loglevel", "error", ...args], { windowsHide: true });
    let err = "";
    p.stderr.on("data", (d) => (err += d.toString()));
    p.on("error", reject);
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(err || `ffmpeg código ${code}`))));
  });
}

// ─────────────────────────────────────────────────────────────
// Logotipos
// ─────────────────────────────────────────────────────────────
function svgLogo(a: DemoAnunciante, tamanho = 400) {
  const fonte = a.sigla.length > 2 ? 150 : 190;
  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${tamanho}" height="${tamanho}" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${a.cor}"/>
      <stop offset="1" stop-color="${a.cor}" stop-opacity="0.82"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" rx="96" fill="url(#g)"/>
  <circle cx="330" cy="70" r="26" fill="${a.corDestaque}"/>
  <text x="200" y="${200 + fonte * 0.35}" text-anchor="middle" font-family="${FONTE}" font-weight="800"
        font-size="${fonte}" fill="#FFFFFF" letter-spacing="-6">${esc(a.sigla)}</text>
</svg>`);
}

// ─────────────────────────────────────────────────────────────
// Artes dos anúncios
// ─────────────────────────────────────────────────────────────
function larguraTexto(texto: string, fonte: number) {
  return texto.length * fonte * 0.6;
}

function svgGradiente(a: DemoAnunciante) {
  return `
  <defs>
    <linearGradient id="lado" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${a.cor}" stop-opacity="0.96"/>
      <stop offset="0.38" stop-color="${a.cor}" stop-opacity="0.86"/>
      <stop offset="0.72" stop-color="${a.cor}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="base" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.6" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.45"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#lado)"/>
  <rect width="${W}" height="${H}" fill="url(#base)"/>`;
}

function svgMarca(a: DemoAnunciante, y: number) {
  return `
  <g transform="translate(120 ${y})">
    <rect width="84" height="84" rx="22" fill="#FFFFFF" fill-opacity="0.12" stroke="#FFFFFF" stroke-opacity="0.35"/>
    <text x="42" y="${a.sigla.length > 2 ? 54 : 58}" text-anchor="middle" font-family="${FONTE}" font-weight="800"
          font-size="${a.sigla.length > 2 ? 28 : 36}" fill="${a.corDestaque}">${esc(a.sigla)}</text>
    <text x="108" y="38" font-family="${FONTE}" font-weight="700" font-size="34" fill="#FFFFFF">${esc(a.nomeEmpresa)}</text>
    <text x="108" y="74" font-family="${FONTE}" font-size="26" fill="#FFFFFF" fill-opacity="0.75">${esc(a.instagramSite)}</text>
  </g>`;
}

const SELO_MEDIA = `
  <g transform="translate(${W - 120} 90)">
    <text text-anchor="end" font-family="${FONTE}" font-weight="600" font-size="22" letter-spacing="4"
          fill="#FFFFFF" fill-opacity="0.7">PUBLICIDADE · MEDIA+</text>
  </g>`;

function svgOferta(a: DemoAnunciante, texto: string, x: number, y: number, fonte: number) {
  const largura = larguraTexto(texto, fonte) + fonte * 1.4;
  const altura = fonte * 1.9;
  return `
  <rect x="${x}" y="${y}" width="${largura}" height="${altura}" rx="${altura / 2}" fill="${a.corDestaque}"/>
  <text x="${x + largura / 2}" y="${y + altura * 0.67}" text-anchor="middle" font-family="${FONTE}" font-weight="800"
        font-size="${fonte}" fill="${a.cor}">${esc(texto)}</text>`;
}

/** Arte estática completa (anúncio em imagem). */
function svgPoster(ad: DemoAnuncio, a: DemoAnunciante) {
  const { chamada, titulo, subtitulo, oferta, cta } = ad.arte;
  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  ${svgGradiente(a)}
  ${SELO_MEDIA}
  <text x="120" y="290" font-family="${FONTE}" font-weight="700" font-size="34" letter-spacing="6" fill="${a.corDestaque}">${esc(chamada)}</text>
  ${titulo
    .map((l, i) => `<text x="114" y="${410 + i * 118}" font-family="${FONTE}" font-weight="800" font-size="112" fill="#FFFFFF">${esc(l)}</text>`)
    .join("")}
  <text x="120" y="${410 + titulo.length * 118 - 20}" font-family="${FONTE}" font-size="40" fill="#FFFFFF" fill-opacity="0.9">${esc(subtitulo)}</text>
  ${svgOferta(a, oferta, 120, 410 + titulo.length * 118 + 30, 50)}
  <text x="120" y="${410 + titulo.length * 118 + 210}" font-family="${FONTE}" font-weight="600" font-size="36" fill="#FFFFFF">${esc(cta)}  →</text>
  ${svgMarca(a, 920)}
</svg>`);
}

/** Vídeo — cena 1: chamada + título + subtítulo (texto sobre a foto em movimento). */
function svgCena1(ad: DemoAnuncio, a: DemoAnunciante) {
  const { chamada, titulo, subtitulo } = ad.arte;
  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  ${SELO_MEDIA}
  <text x="120" y="360" font-family="${FONTE}" font-weight="700" font-size="38" letter-spacing="6" fill="${a.corDestaque}">${esc(chamada)}</text>
  ${titulo
    .map((l, i) => `<text x="112" y="${500 + i * 135}" font-family="${FONTE}" font-weight="800" font-size="128" fill="#FFFFFF">${esc(l)}</text>`)
    .join("")}
  <text x="120" y="${500 + titulo.length * 135 - 10}" font-family="${FONTE}" font-size="44" fill="#FFFFFF" fill-opacity="0.92">${esc(subtitulo)}</text>
  ${svgMarca(a, 920)}
</svg>`);
}

/** Vídeo — cena 2: oferta em destaque + CTA. */
function svgCena2(ad: DemoAnuncio, a: DemoAnunciante) {
  const { oferta, cta } = ad.arte;
  const fonte = oferta.length > 12 ? 84 : 120;
  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  ${SELO_MEDIA}
  <text x="120" y="380" font-family="${FONTE}" font-weight="700" font-size="40" letter-spacing="6" fill="#FFFFFF" fill-opacity="0.85">APROVEITE</text>
  ${svgOferta(a, oferta, 120, 430, fonte)}
  <text x="120" y="${430 + fonte * 1.9 + 110}" font-family="${FONTE}" font-weight="700" font-size="54" fill="#FFFFFF">${esc(cta)}  →</text>
  ${svgMarca(a, 920)}
</svg>`);
}

/** Vídeo — cena 3: assinatura da marca. */
function svgCena3(ad: DemoAnuncio, a: DemoAnunciante) {
  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <radialGradient id="r" cx="0.5" cy="0.45" r="0.75">
      <stop offset="0" stop-color="${a.cor}" stop-opacity="0.78"/>
      <stop offset="1" stop-color="${a.cor}"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#r)"/>
  <circle cx="${W - 180}" cy="160" r="300" fill="${a.corDestaque}" fill-opacity="0.08"/>
  <circle cx="160" cy="${H - 120}" r="220" fill="${a.corDestaque}" fill-opacity="0.06"/>
  <g transform="translate(${W / 2 - 110} 210)">
    <rect width="220" height="220" rx="56" fill="#FFFFFF" fill-opacity="0.1" stroke="${a.corDestaque}" stroke-width="4"/>
    <text x="110" y="${a.sigla.length > 2 ? 140 : 150}" text-anchor="middle" font-family="${FONTE}" font-weight="800"
          font-size="${a.sigla.length > 2 ? 76 : 100}" fill="${a.corDestaque}">${esc(a.sigla)}</text>
  </g>
  <text x="${W / 2}" y="560" text-anchor="middle" font-family="${FONTE}" font-weight="800" font-size="84" fill="#FFFFFF">${esc(a.nomeEmpresa)}</text>
  <text x="${W / 2}" y="650" text-anchor="middle" font-family="${FONTE}" font-size="44" fill="#FFFFFF" fill-opacity="0.85">${esc(ad.arte.cta)}</text>
  <text x="${W / 2}" y="760" text-anchor="middle" font-family="${FONTE}" font-weight="700" font-size="46" fill="${a.corDestaque}">${esc(a.instagramSite)}  •  ${esc(a.whatsapp)}</text>
  <text x="${W / 2}" y="${H - 70}" text-anchor="middle" font-family="${FONTE}" font-size="24" letter-spacing="4" fill="#FFFFFF" fill-opacity="0.55">ANÚNCIO EXIBIDO NA REDE MEDIA+</text>
</svg>`);
}

async function fundo(foto: Buffer, a: DemoAnunciante, posicao: string) {
  return sharp(foto)
    .resize(W, H, { fit: "cover", position: posicao })
    .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${svgGradiente(a)}</svg>`) }]);
}

async function gerarVideo(ad: DemoAnuncio, a: DemoAnunciante, foto: Buffer, destino: string) {
  const dir = path.join(WORK, ad.slug);
  await mkdir(dir, { recursive: true });
  const f = (n: string) => path.join(dir, n);

  await (await fundo(foto, a, "centre")).jpeg({ quality: 90 }).toFile(f("bg1.jpg"));
  await (await fundo(foto, a, "right")).jpeg({ quality: 90 }).toFile(f("bg2.jpg"));
  await sharp(svgCena1(ad, a)).png().toFile(f("t1.png"));
  await sharp(svgCena2(ad, a)).png().toFile(f("t2.png"));
  await sharp(svgCena3(ad, a)).png().toFile(f("c3.png"));

  // 3 cenas: 5,5s + 5,5s + 5s com transições de 0,5s = 15s
  const filtro = [
    "[0:v]scale=2880:1620,zoompan=z='min(zoom+0.0007,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=165:s=1280x720:fps=30,setsar=1[b1]",
    "[1:v]scale=1280:720,format=rgba,fade=t=in:st=0.3:d=0.7:alpha=1[t1]",
    "[b1][t1]overlay=0:0:shortest=1,format=yuv420p[v1]",
    "[2:v]scale=2880:1620,zoompan=z='1.15':x='(iw-iw/zoom)*(1-on/165)':y='ih/2-(ih/zoom/2)':d=165:s=1280x720:fps=30,setsar=1[b2]",
    "[3:v]scale=1280:720,format=rgba,fade=t=in:st=0.5:d=0.6:alpha=1[t2]",
    "[b2][t2]overlay=0:0:shortest=1,format=yuv420p[v2]",
    "[4:v]scale=1280:720,setsar=1,fps=30,format=yuv420p[v3]",
    "[v1][v2]xfade=transition=fade:duration=0.5:offset=5[v12]",
    "[v12][v3]xfade=transition=fade:duration=0.5:offset=10,format=yuv420p[v]",
  ].join(";");

  await ffmpeg([
    "-y",
    "-i", f("bg1.jpg"),
    "-loop", "1", "-framerate", "30", "-t", "5.5", "-i", f("t1.png"),
    "-i", f("bg2.jpg"),
    "-loop", "1", "-framerate", "30", "-t", "5.5", "-i", f("t2.png"),
    "-loop", "1", "-framerate", "30", "-t", "5", "-i", f("c3.png"),
    "-filter_complex", filtro,
    "-map", "[v]",
    "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-profile:v", "high",
    "-pix_fmt", "yuv420p", "-r", "30", "-movflags", "+faststart",
    destino,
  ]);
  await rm(dir, { recursive: true, force: true });
}

// ─────────────────────────────────────────────────────────────
async function main() {
  for (const sub of ["pontos", "anunciantes", "avatars", "logos", "anuncios", "videos"]) {
    await mkdir(path.join(OUT, sub), { recursive: true });
  }
  await mkdir(RAW, { recursive: true });
  await mkdir(WORK, { recursive: true });

  console.log("› Baixando fotos de origem...");
  const fotos: Record<string, Buffer> = {};
  for (const [chave, url] of Object.entries(FOTOS)) fotos[chave] = await baixar(chave, url);

  console.log("› Fotos dos estabelecimentos");
  const fotosPonto = new Set(PONTOS.flatMap((p) => p.fotos));
  for (const chave of fotosPonto) {
    await salvarWebp(sharp(fotos[chave]!).resize(1600, 900, { fit: "cover" }), path.join(OUT, "pontos", `${chave}.webp`));
  }

  console.log("› Fotos dos anunciantes");
  const fotosAnunciante = new Set(ANUNCIANTES.flatMap((a) => a.fotos));
  for (const chave of fotosAnunciante) {
    await salvarWebp(sharp(fotos[chave]!).resize(1600, 900, { fit: "cover" }), path.join(OUT, "anunciantes", `${chave}.webp`));
  }

  console.log("› Fotos de perfil");
  for (const [slug, url] of Object.entries(AVATARES)) {
    const buf = await baixar(`avatar-${slug}`, url);
    await salvarWebp(sharp(buf).resize(400, 400, { fit: "cover" }), path.join(OUT, "avatars", `${slug}.webp`), 80);
  }
  // Admin: símbolo da marca Media+
  await salvarWebp(
    sharp(path.join(process.cwd(), "public", "logo.png"))
      .resize(300, 300, { fit: "contain", background: "#FFFFFF" })
      .extend({ top: 50, bottom: 50, left: 50, right: 50, background: "#FFFFFF" })
      .flatten({ background: "#FFFFFF" }),
    path.join(OUT, "avatars", "admin.webp"),
    85
  );

  console.log("› Logotipos");
  for (const a of ANUNCIANTES) {
    await salvarWebp(sharp(svgLogo(a)), path.join(OUT, "logos", `${a.slug}.webp`), 88);
  }

  console.log("› Anúncios");
  const anunciantes = Object.fromEntries(ANUNCIANTES.map((a) => [a.slug, a]));
  for (const ad of ANUNCIOS) {
    const a = anunciantes[ad.anunciante]!;
    const foto = fotos[ad.arte.foto]!;
    if (ad.tipoMidia === "IMAGEM") {
      const destino = path.join(OUT, "anuncios", `${ad.slug}.webp`);
      const img = (await fundo(foto, a, "centre")).png();
      const comFundo = await img.toBuffer();
      await salvarWebp(sharp(comFundo).composite([{ input: svgPoster(ad, a) }]), destino, 80);
      console.log(`   imagem  ${ad.slug}  ${((await stat(destino)).size / 1024).toFixed(0)} KB`);
    } else {
      const destino = path.join(OUT, "videos", `${ad.slug}.mp4`);
      await gerarVideo(ad, a, foto, destino);
      console.log(`   vídeo   ${ad.slug}  ${((await stat(destino)).size / 1024).toFixed(0)} KB`);
    }
  }

  await rm(WORK, { recursive: true, force: true });
  console.log("\n✓ Mídias da demonstração geradas em public/uploads/demo");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
