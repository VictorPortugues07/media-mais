import { prisma } from "../lib/prisma";

async function main() {
  console.log("Applying enum and user ativo adjustments...");
  
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ativo" BOOLEAN NOT NULL DEFAULT true;
  `);

  // Adicionar novos valores no enum TipoNotificacao se ainda não existirem
  const novosTipos = ["ALERTA", "COBRANCA", "SISTEMA"];
  for (const tipo of novosTipos) {
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TYPE "TipoNotificacao" ADD VALUE IF NOT EXISTS '${tipo}';
      `);
    } catch (e) {
      console.log(`Tipo ${tipo} já existe ou erro ignorado`);
    }
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
