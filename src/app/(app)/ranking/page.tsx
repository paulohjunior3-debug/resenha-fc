import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth/session";
import { ehAdmin } from "@/lib/auth/roles";
import { Podium, type PodiumEntry } from "@/components/ranking/podium";
import type { Player, Ranking, RankingResult } from "@/lib/types/database.types";
import { finalizarRanking, iniciarRanking } from "./actions";

type ResultadoComJogador = RankingResult & { players: Pick<Player, "apelido" | "avatar_url"> };

export default async function RankingPage() {
  const profile = await getSessionProfile();
  const supabase = await createClient();
  const admin = ehAdmin(profile.role);

  const { data: rankings } = await supabase
    .from("rankings")
    .select("*")
    .order("data_inicio", { ascending: false })
    .returns<Ranking[]>();

  const atual = rankings?.[0] ?? null;
  const anteriores = rankings?.slice(1) ?? [];

  const { data: resultados } = atual
    ? await supabase
        .from("ranking_results")
        .select("*, players(apelido, avatar_url)")
        .eq("ranking_id", atual.id)
        .order("posicao", { ascending: true, nullsFirst: false })
        .returns<ResultadoComJogador[]>()
    : { data: null };

  const top3: (PodiumEntry | null)[] = [0, 1, 2].map((i) => {
    const r = (resultados ?? [])[i];
    return r ? { apelido: r.players.apelido, avatarUrl: r.players.avatar_url, pontuacao: Number(r.pontuacao) } : null;
  });

  return (
    <div className="space-y-4">
      {admin && (
        <section className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="mb-2 font-semibold">Gerenciar ranking</h2>
          {!atual || atual.finalizado ? (
            <form action={iniciarRanking} className="flex flex-wrap items-end gap-2">
              <div>
                <label className="mb-1 block text-xs text-muted">Período (ex: 2026-09)</label>
                <input
                  name="periodo"
                  required
                  placeholder="2026-09"
                  className="w-28 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Início</label>
                <input
                  type="date"
                  name="data_inicio"
                  required
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                Iniciar novo período
              </button>
            </form>
          ) : (
            <form action={finalizarRanking.bind(null, atual.id)}>
              <button className="rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white">
                Finalizar período {atual.periodo} e definir pódio
              </button>
            </form>
          )}
        </section>
      )}

      <section className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="mb-1 text-center font-semibold">
          {atual ? `Pódio — ${atual.periodo}` : "Pódio do mês"}
        </h2>
        <p className="mb-2 text-center text-xs text-muted">
          {atual
            ? atual.finalizado
              ? "Período finalizado"
              : "Em andamento — o pódio fecha quando o admin finalizar o período"
            : "Nenhum ranking iniciado ainda"}
        </p>
        <Podium entradas={top3} />
      </section>

      {atual && (resultados ?? []).length > 0 && (
        <section className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="mb-3 font-semibold">Classificação completa</h2>
          <ol className="space-y-2">
            {(resultados ?? []).map((r, i) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-xl border border-border p-3 text-sm"
              >
                <span>
                  {i + 1}º {r.players.apelido}
                </span>
                <span className="text-muted">
                  {r.gols}G · {r.assistencias}A · {r.presencas}P ·{" "}
                  <strong className="text-foreground">{r.pontuacao} pts</strong>
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {anteriores.length > 0 && (
        <section className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="mb-2 font-semibold">Histórico</h2>
          <ul className="space-y-1 text-sm text-muted">
            {anteriores.map((r) => (
              <li key={r.id}>
                {r.periodo} {r.finalizado ? "— finalizado" : "— em andamento"}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
