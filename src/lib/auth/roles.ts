import type { Role } from "@/lib/types/database.types";

export const ROLES = {
  ADMIN: "admin",
  MODERATOR: "moderator",
  PLAYER: "player",
} as const satisfies Record<string, Role>;

export function podeGerenciarOperacional(role: Role): boolean {
  return role === ROLES.ADMIN || role === ROLES.MODERATOR;
}

export function ehAdmin(role: Role): boolean {
  return role === ROLES.ADMIN;
}

export function apelidoParaEmailInterno(apelido: string): string {
  const slug = apelido
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const dominio = process.env.AUTH_INTERNAL_EMAIL_DOMAIN || "resenhafc.internal";
  return `${slug}@${dominio}`;
}
