import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Player } from "@/lib/types/database.types";

const NIVEL_COR: Record<Player["classificacao"], string> = {
  A: "bg-gold/20 text-gold",
  B: "bg-primary/15 text-primary",
  C: "bg-primary/10 text-primary",
  D: "bg-warning/15 text-warning",
  E: "bg-warning/20 text-warning",
  F: "bg-danger/10 text-danger",
};

export default async function JogadoresPage() {
  const supabase = await createClient();
  const { data: jogadores } = await supabase
    .from("players")
    .select("*")
    .eq("ativo", true)
    .order("apelido", { ascending: true })
    .returns<Player[]>();

  return (
    <div className="space-y-3">
      <h1 className="text-lg font-bold">Jogadores</h1>
      <ul className="space-y-2">
        {(jogadores ?? []).map((j) => (
          <li key={j.id}>
            <Link
              href={`/jogadores/${j.id}`}
              className="flex items-center justify-between rounded-xl border border-border bg-surface p-3"
            >
              <div>
                <p className="font-medium">{j.apelido}</p>
                <p className="text-xs text-muted">{j.eh_goleiro ? "Goleiro" : j.posicao}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-sm font-bold ${NIVEL_COR[j.classificacao]}`}>
                {j.classificacao}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
