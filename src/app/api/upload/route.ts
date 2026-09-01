import { getSession } from "@/lib/auth";
import { uploadFile } from "@/lib/upload";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Nao autorizado" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    const result = await uploadFile(file);
    return Response.json(result, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro no upload";
    return Response.json({ error: msg }, { status: 400 });
  }
}
