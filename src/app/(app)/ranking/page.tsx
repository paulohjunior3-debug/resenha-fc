import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth/session";
import { ehAdmin } from "@/lib/auth/roles";
import type { Player, Ranking, RankingResult } from "@/lib/types/database.types";
import { finalizarRanking, iniciarRanking } from "./actions";

type ResultadoComJogador = RankingResult & { players: Pick<Player, "apelido"> };

const MEDALHA: Record<number, { emoji: string; cor: string }> = {
  1: { emoji: "🥇", cor: "text-gold" },
  2: { emoji: "🥈", cor: "text-silver" },
  3: { emoji: "🥉", cor: "text-bronze" },
};

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
        .select("*, players(apelido)")
        .eq("ranking_id", atual.id)
        .order("posicao", { ascending: true, nullsFirst: false })
        .returns<ResultadoComJogador[]>()
    : { data: null };

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

      {!atual && <p className="text-sm text-muted">Nenhum ranking iniciado ainda.</p>}

      {atual && (
        <section className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="mb-1 font-semibold">
            Período {atual.periodo} {atual.finalizado ? "(finalizado)" : "(em andamento)"}
          </h2>

          {(resultados ?? []).length === 0 ? (
            <p className="mt-2 text-sm text-muted">Ainda sem estatísticas registradas.</p>
          ) : (
            <>
              <div className="mt-4 mb-4 flex items-end justify-center gap-3">
                {(resultados ?? []).slice(0, 3).map((r, i) => (
                  <div key={r.id} className="text-center">
                    <p className={`text-3xl ${MEDALHA[i + 1]?.cor}`}>{MEDALHA[i + 1]?.emoji}</p>
                    <p className="text-sm font-semibold">{r.players.apelido}</p>
                    <p className="text-xs text-muted">{r.pontuacao} pts</p>
                  </div>
                ))}
              </div>

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
            </>
          )}
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
