import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "mediamais_plataforma_secret_2026"
);

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
    .sign(SECRET);
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

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) return null;

    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
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
