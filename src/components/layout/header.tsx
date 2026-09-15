import Image from "next/image";
import { LogOut } from "lucide-react";
import { logout } from "@/app/(app)/actions";
import type { Profile } from "@/lib/types/database.types";

const ROLE_LABEL: Record<Profile["role"], string> = {
  admin: "Administrador",
  moderator: "Moderador",
  player: "Jogador",
};

export function Header({ profile }: { profile: Profile }) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface/95 px-4 py-2.5 backdrop-blur">
      <div className="flex items-center gap-2.5">
        <Image
          src="/icons/icon-192.png"
          alt=""
          width={32}
          height={32}
          className="rounded-lg"
        />
        <div>
          <p className="font-semibold leading-tight">{profile.apelido}</p>
          <p className="text-xs text-muted">{ROLE_LABEL[profile.role]}</p>
        </div>
      </div>
      <form action={logout}>
        <button
          type="submit"
          aria-label="Sair"
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted transition-colors active:bg-background"
        >
          <LogOut size={16} />
          Sair
        </button>
      </form>
    </header>
  );
}
