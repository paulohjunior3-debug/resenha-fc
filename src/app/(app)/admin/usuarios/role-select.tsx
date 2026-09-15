"use client";

import { useTransition } from "react";
import { alterarRole } from "./actions";
import type { Role } from "@/lib/types/database.types";

const OPCOES: { value: Role; label: string }[] = [
  { value: "player", label: "Jogador" },
  { value: "moderator", label: "Moderador" },
  { value: "admin", label: "Administrador" },
];

export function RoleSelect({ userId, roleAtual }: { userId: string; roleAtual: Role }) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={roleAtual}
      disabled={pending}
      onChange={(e) => {
        const novoRole = e.target.value as Role;
        startTransition(() => {
          alterarRole(userId, novoRole);
        });
      }}
      className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-medium disabled:opacity-60"
    >
      {OPCOES.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
