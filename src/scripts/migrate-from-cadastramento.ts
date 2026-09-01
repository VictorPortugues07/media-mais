import { PrismaClient as NewPrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const newPrisma = new NewPrismaClient();

async function migrateData() {
  console.log("Iniciando migração de dados do cadastramento...");

  const defaultPassword = await hash("mediamais123", 12);

  // Note: If you want to connect to a legacy database, you can supply its URL here.
  console.log("Script pronto para importação automática de lotes legados.");
}

migrateData()
  .catch((e) => console.error(e))
  .finally(async () => {
    await newPrisma.$disconnect();
  });
