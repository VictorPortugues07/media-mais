import { prisma } from "../lib/prisma";

async function main() {
  console.log("Applying schema adjustments directly...");
  
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "pontos_midia" ADD COLUMN IF NOT EXISTS "codigo_tv" TEXT;
    ALTER TABLE "pontos_midia" ADD COLUMN IF NOT EXISTS "fotos" TEXT[] DEFAULT ARRAY[]::TEXT[];
    ALTER TABLE "pontos_midia" ADD COLUMN IF NOT EXISTS "ultima_atividade" TIMESTAMP(3);
  `);

  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'pontos_midia_codigo_tv_key'
      ) THEN
        ALTER TABLE "pontos_midia" ADD CONSTRAINT "pontos_midia_codigo_tv_key" UNIQUE ("codigo_tv");
      END IF;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "pontos_midia_codigo_tv_idx" ON "pontos_midia"("codigo_tv");
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "anunciantes" ADD COLUMN IF NOT EXISTS "logo_url" TEXT;
    ALTER TABLE "anunciantes" ADD COLUMN IF NOT EXISTS "fotos" TEXT[] DEFAULT ARRAY[]::TEXT[];
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "registros_exibicao" (
      "id" SERIAL NOT NULL,
      "anuncio_id" INTEGER NOT NULL,
      "ponto_midia_id" INTEGER NOT NULL,
      "duracao_segundos" INTEGER NOT NULL DEFAULT 10,
      "tipo_midia" "TipoMidia" NOT NULL,
      "exibido_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT "registros_exibicao_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "registros_exibicao_anuncio_id_fkey" FOREIGN KEY ("anuncio_id") REFERENCES "anuncios"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "registros_exibicao_ponto_midia_id_fkey" FOREIGN KEY ("ponto_midia_id") REFERENCES "pontos_midia"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "registros_exibicao_anuncio_id_idx" ON "registros_exibicao"("anuncio_id");
    CREATE INDEX IF NOT EXISTS "registros_exibicao_ponto_midia_id_idx" ON "registros_exibicao"("ponto_midia_id");
    CREATE INDEX IF NOT EXISTS "registros_exibicao_exibido_em_idx" ON "registros_exibicao"("exibido_em");
  `);

  // Gerar códigos de TV para pontos existentes que ainda não tenham código
  const pontos = await prisma.pontoMidia.findMany({
    where: { codigoTv: null },
  });

  for (const ponto of pontos) {
    let codigo = "";
    let isUnique = false;
    while (!isUnique) {
      codigo = Math.floor(100000 + Math.random() * 900000).toString();
      const exists = await prisma.pontoMidia.findFirst({ where: { codigoTv: codigo } });
      if (!exists) isUnique = true;
    }
    await prisma.pontoMidia.update({
      where: { id: ponto.id },
      data: { codigoTv: codigo },
    });
    console.log(`Ponto ${ponto.id} (${ponto.nomeEmpresa}) recebeu o código de TV: ${codigo}`);
  }

  console.log("Database schema updated successfully!");
}

main()
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
