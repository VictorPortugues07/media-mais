import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { UserRole } from "@prisma/client";
import { prisma } from "./prisma";

export function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "FATAL: Variável de ambiente AUTH_SECRET não configurada. Defina AUTH_SECRET no seu arquivo .env"
    );
  }
  return new TextEncoder().encode(secret);
}

export const COOKIE_NAME = "mm_session";
export const EXPIRES_IN = 7 * 24 * 60 * 60; // 7 days

export interface SessionPayload {
  userId: number;
  email: string;
  nome: string;
  role: UserRole;
}

export async function generateToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${EXPIRES_IN}s`)
    .setIssuedAt()
    .sign(getAuthSecret());
}

export async function createSession(payload: SessionPayload): Promise<string> {
  const token = await generateToken(payload);

  try {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: EXPIRES_IN,
      path: "/",
    });
  } catch {
    // If called outside Next request store
  }

  return token;
}

export async function getSession(
  requestOrToken?: NextRequest | Request | string
): Promise<SessionPayload | null> {
  try {
    let token: string | undefined;

    if (typeof requestOrToken === "string") {
      token = requestOrToken;
    } else if (
      requestOrToken &&
      "cookies" in requestOrToken &&
      typeof (requestOrToken as any).cookies?.get === "function"
    ) {
      token = (requestOrToken as any).cookies.get(COOKIE_NAME)?.value;
    }

    if (!token) {
      try {
        const cookieStore = await cookies();
        token = cookieStore.get(COOKIE_NAME)?.value;
      } catch {
        // Fora do contexto do AsyncLocalStorage do Next.js
      }
    }

    if (!token) return null;

    const { payload } = await jwtVerify(token, getAuthSecret());
    const session = payload as unknown as SessionPayload;

    if (!session || !session.userId) return null;

    // Invalidação imediata de sessão para contas inativas ou removidas
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { ativo: true },
    });

    if (!user || !user.ativo) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
  } catch {
    // ignore
  }
}

export function createSessionResponse(
  body: Record<string, unknown>,
  token: string,
  status = 200
) {
  const response = NextResponse.json(body, { status });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: EXPIRES_IN,
    path: "/",
  });
  return response;
}

export async function signTVToken(pontoId: number): Promise<string> {
  return await new SignJWT({ pontoId, role: "TV_PLAYER" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .setIssuedAt()
    .sign(getAuthSecret());
}

export async function verifyTVToken(token: string): Promise<number | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    if (payload.role !== "TV_PLAYER") return null;
    return typeof payload.pontoId === "number" ? payload.pontoId : null;
  } catch {
    return null;
  }
}
