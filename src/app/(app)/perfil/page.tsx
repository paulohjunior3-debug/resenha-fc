import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth/session";
import type { Player, PlayerAttributes, Prize, Ranking } from "@/lib/types/database.types";
import { PhotoForm } from "./photo-form";

type PremioComRanking = Prize & { rankings: Pick<Ranking, "periodo"> };

export default async function PerfilPage() {
  const profile = await getSessionProfile();
  const supabase = await createClient();

  if (!profile.player_id) {
    return <p className="text-sm text-muted">Seu usuário ainda não está vinculado a um jogador.</p>;
  }

  const { data: jogador } = await supabase
    .from("players")
    .select("*")
    .eq("id", profile.player_id)
    .maybeSingle<Player>();

  const { data: atributos } = await supabase
    .from("player_attributes")
    .select("*")
    .eq("player_id", profile.player_id)
    .maybeSingle<PlayerAttributes>();

  const { data: premios } = await supabase
    .from("prizes")
    .select("*, rankings(periodo)")
    .eq("player_id", profile.player_id)
    .order("created_at", { ascending: false })
    .returns<PremioComRanking[]>();

  if (!jogador) {
    return <p className="text-sm text-muted">Jogador não encontrado.</p>;
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border bg-surface p-4 text-center">
        <PhotoForm avatarUrl={jogador.avatar_url} apelido={jogador.apelido} />
        <h1 className="mt-2 text-lg font-bold">{jogador.apelido}</h1>
        <p className="text-sm text-muted">{jogador.nome}</p>
        <p className="mt-1 text-sm">
          {jogador.eh_goleiro ? "Goleiro" : jogador.posicao} · Classificação{" "}
          <strong>{jogador.classificacao}</strong>
        </p>
        <Link href={`/jogadores/${jogador.id}`} className="mt-2 inline-block text-sm font-medium text-primary underline">
          Ver estatísticas completas
        </Link>
      </section>

      {atributos && (
        <section className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="mb-2 font-semibold">Habilidades</h2>
          <p className="text-xs text-muted">
            Editadas apenas pelo administrador — reflete o que a comissão observa no seu jogo.
          </p>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="mb-2 font-semibold">Premiações</h2>
        {(premios ?? []).length === 0 ? (
          <p className="text-sm text-muted">Nenhuma premiação ainda. Fique entre os 3 primeiros do mês!</p>
        ) : (
          <ul className="space-y-2">
            {(premios ?? []).map((p) => (
              <li key={p.id} className="rounded-xl border border-border p-3 text-sm">
                {p.posicao}º lugar em {p.rankings.periodo} — 1 racha grátis:{" "}
                <strong>{p.utilizado ? "já utilizado" : "disponível"}</strong>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
