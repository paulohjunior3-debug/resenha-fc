"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/types/database.types";

interface NavItem {
  href: string;
  label: string;
}

const ITENS_BASE: NavItem[] = [
  { href: "/dashboard", label: "Início" },
  { href: "/racha", label: "Racha" },
  { href: "/ranking", label: "Ranking" },
  { href: "/jogadores", label: "Jogadores" },
  { href: "/caixa", label: "Caixa" },
  { href: "/perfil", label: "Perfil" },
];

const ITENS_ADMIN: NavItem[] = [{ href: "/admin/usuarios", label: "Usuários" }];

export function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const itens = role === "admin" ? [...ITENS_BASE, ...ITENS_ADMIN] : ITENS_BASE;

  return (
    <nav className="sticky bottom-0 z-10 border-t border-border bg-surface">
      <ul className="flex overflow-x-auto">
        {itens.map((item) => {
          const ativo = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className="flex-1 min-w-[64px]">
              <Link
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 px-2 py-3 text-xs font-medium ${
                  ativo ? "text-primary" : "text-muted"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
