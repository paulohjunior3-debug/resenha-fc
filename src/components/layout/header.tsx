import { logout } from "@/app/(app)/actions";
import type { Profile } from "@/lib/types/database.types";

const ROLE_LABEL: Record<Profile["role"], string> = {
  admin: "Administrador",
  moderator: "Moderador",
  player: "Jogador",
};

export function Header({ profile }: { profile: Profile }) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-4 py-3">
      <div>
        <p className="font-semibold leading-tight">{profile.apelido}</p>
        <p className="text-xs text-muted">{ROLE_LABEL[profile.role]}</p>
      </div>
      <form action={logout}>
        <button type="submit" className="text-sm font-medium text-muted underline">
          Sair
        </button>
      </form>
    </header>
  );
}
