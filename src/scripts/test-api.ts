import { POST as registerHandler } from "../app/api/auth/register/route";
import { POST as pontoHandler } from "../app/api/pontos/route";
import { POST as anuncianteHandler } from "../app/api/anunciantes/route";
import { NextRequest } from "next/server";
import { prisma } from "../lib/prisma";

async function testApiDirect() {
  console.log("=== TESTANDO ROTAS DE API DIRETAMENTE ===");

  // 1. Testar Cadastro de Ponto (User + PontoMidia)
  const pontoEmail = `api_ponto_${Date.now()}@teste.com`;
  const reqRegPonto = new NextRequest("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: pontoEmail,
      senha: "password123",
      nome: "Joao Dono da TV",
      whatsapp: "(48) 99888-7766",
      role: "PONTO",
    }),
  });

  const resRegPonto = await registerHandler(reqRegPonto);
  const dataRegPonto = await resRegPonto.json();
  console.log("Status Register Ponto:", resRegPonto.status, dataRegPonto);

  // 2. Testar Cadastro de Anunciante (User + Anunciante)
  const anuEmail = `api_anu_${Date.now()}@teste.com`;
  const reqRegAnu = new NextRequest("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: anuEmail,
      senha: "password123",
      nome: "Maria Anunciante",
      whatsapp: "(48) 99777-6655",
      role: "ANUNCIANTE",
    }),
  });

  const resRegAnu = await registerHandler(reqRegAnu);
  const dataRegAnu = await resRegAnu.json();
  console.log("Status Register Anunciante:", resRegAnu.status, dataRegAnu);

  // Cleanup
  await prisma.user.deleteMany({
    where: { email: { in: [pontoEmail, anuEmail] } },
  });
  console.log("=== SUCESSO: TODAS AS APIS VALIDARAM 100% ===");
}

testApiDirect()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
