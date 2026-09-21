import type { UserRole } from "@prisma/client";

export interface AuthUser {
  id: number;
  email: string;
  nome: string;
  whatsapp?: string;
  avatarUrl?: string | null;
  role: UserRole;
  ativo?: boolean;
}
