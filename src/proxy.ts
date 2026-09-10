import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "mediamais_plataforma_secret_2026"
);

const PUBLIC_ROUTES = ["/", "/login", "/cadastro", "/player"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // TV player pareado é a rota pública legítima para telas
  if (pathname === "/player") {
    return NextResponse.next();
  }

  // Rota direta /tv/[pontoId] é de uso exclusivo de administradores (preview).
  // Qualquer outro usuário ou Smart TV deve obrigatoriamente usar /player com código de pareamento.
  if (pathname.startsWith("/tv/")) {
    const token = request.cookies.get("mm_session")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/player", request.url));
    }
    try {
      const { payload } = await jwtVerify(token, SECRET);
      if (payload.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/player", request.url));
      }
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL("/player", request.url));
    }
  }

  // Public routes - allow
  if (PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"))) {
    return NextResponse.next();
  }

  // API routes - let the route handler manage auth
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/uploads") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Protected routes - check session
  const token = request.cookies.get("mm_session")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);
    const role = payload.role as string;

    // Role-based route protection
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (pathname.startsWith("/anunciante") && role !== "ANUNCIANTE") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (pathname.startsWith("/ponto") && role !== "PONTO") {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
