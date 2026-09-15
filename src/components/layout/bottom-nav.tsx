"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home,
  CalendarDays,
  Trophy,
  Menu,
  X,
  Users,
  Wallet,
  UserRound,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/types/database.types";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const ITENS_PRINCIPAIS: NavItem[] = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/racha", label: "Racha", icon: CalendarDays },
  { href: "/ranking", label: "Ranking", icon: Trophy },
];

const ITENS_MAIS_BASE: NavItem[] = [
  { href: "/jogadores", label: "Jogadores", icon: Users },
  { href: "/caixa", label: "Caixa", icon: Wallet },
  { href: "/perfil", label: "Perfil", icon: UserRound },
];

const ITEM_ADMIN: NavItem = { href: "/admin/usuarios", label: "Usuários", icon: ShieldCheck };

export function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);

  const itensMais =
    role === "admin" || role === "moderator" ? [...ITENS_MAIS_BASE, ITEM_ADMIN] : ITENS_MAIS_BASE;
  const maisAtivo = itensMais.some((item) => pathname.startsWith(item.href));

  return (
    <>
      {aberto && (
        <div className="fixed inset-0 z-20 flex flex-col justify-end">
          <button
            aria-label="Fechar menu"
            onClick={() => setAberto(false)}
            className="flex-1 bg-black/40 backdrop-blur-[1px]"
          />
          <div className="rounded-t-2xl border-t border-border bg-surface p-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] shadow-[0_-8px_24px_rgba(0,0,0,0.12)]">
            <div className="flex items-center justify-between px-3 py-2">
              <p className="text-sm font-semibold text-muted">Mais opções</p>
              <button
                aria-label="Fechar"
                onClick={() => setAberto(false)}
                className="rounded-full p-1 text-muted hover:bg-background"
              >
                <X size={18} />
              </button>
            </div>
            <ul className="grid grid-cols-2 gap-2 p-2">
              {itensMais.map((item) => {
                const Icon = item.icon;
                const ativo = pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setAberto(false)}
                      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-4 text-sm font-medium transition-colors ${
                        ativo
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-border text-foreground active:bg-background"
                      }`}
                    >
                      <Icon size={22} strokeWidth={ativo ? 2.4 : 2} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      <nav className="sticky bottom-0 z-10 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <ul className="flex">
          {ITENS_PRINCIPAIS.map((item) => {
            const Icon = item.icon;
            const ativo = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                    ativo ? "text-primary" : "text-muted"
                  }`}
                >
                  <span
                    className={`flex h-8 w-12 items-center justify-center rounded-full transition-colors ${
                      ativo ? "bg-primary/15" : ""
                    }`}
                  >
                    <Icon size={20} strokeWidth={ativo ? 2.4 : 2} />
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li className="flex-1">
            <button
              onClick={() => setAberto(true)}
              className={`flex w-full flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                maisAtivo || aberto ? "text-primary" : "text-muted"
              }`}
            >
              <span
                className={`flex h-8 w-12 items-center justify-center rounded-full transition-colors ${
                  maisAtivo || aberto ? "bg-primary/15" : ""
                }`}
              >
                <Menu size={20} strokeWidth={maisAtivo || aberto ? 2.4 : 2} />
              </span>
              Mais
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
