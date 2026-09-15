import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth/session";
import { ehAdmin, podeGerenciarOperacional } from "@/lib/auth/roles";
import type { MatchPlayer, Player, PlayerAttributes, Prize, Ranking } from "@/lib/types/database.types";
import { atualizarAtributos, marcarPremioUtilizado } from "./actions";

type PremioComRanking = Prize & { rankings: Pick<Ranking, "periodo"> };

const CAMPOS: { chave: keyof PlayerAttributes; label: string }[] = [
  { chave: "drible", label: "Drible" },
  { chave: "pe_direito", label: "Pé direito" },
  { chave: "pe_esquerdo", label: "Pé esquerdo" },
  { chave: "zagueiro", label: "Zagueiro" },
  { chave: "meia", label: "Meia" },
  { chave: "agilidade", label: "Agilidade" },
  { chave: "velocidade", label: "Velocidade" },
];

export default async function JogadorDetalhePage({ params }: PageProps<"/jogadores/[id]">) {
  const { id } = await params;
  const profile = await getSessionProfile();
  const supabase = await createClient();
  const admin = ehAdmin(profile.role);
  const ehStaff = podeGerenciarOperacional(profile.role);

  const { data: jogador } = await supabase.from("players").select("*").eq("id", id).maybeSingle<Player>();
  if (!jogador) notFound();

  const { data: atributos } = await supabase
    .from("player_attributes")
    .select("*")
    .eq("player_id", id)
    .maybeSingle<PlayerAttributes>();

  const { data: historico } = await supabase
    .from("match_players")
    .select("gols, assistencias, presenca")
    .eq("player_id", id)
    .eq("status", "confirmado")
    .returns<Pick<MatchPlayer, "gols" | "assistencias" | "presenca">[]>();

  const { data: premios } = ehStaff
    ? await supabase
        .from("prizes")
        .select("*, rankings(periodo)")
        .eq("player_id", id)
        .order("created_at", { ascending: false })
        .returns<PremioComRanking[]>()
    : { data: null };

  const totais = (historico ?? []).reduce(
    (acc, mp) => ({
      gols: acc.gols + mp.gols,
      assistencias: acc.assistencias + mp.assistencias,
      presencas: acc.presencas + (mp.presenca ? 1 : 0),
    }),
    { gols: 0, assistencias: 0, presencas: 0 }
  );

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border bg-surface p-4 text-center">
        <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
          {jogador.apelido.slice(0, 2).toUpperCase()}
        </div>
        <h1 className="text-lg font-bold">{jogador.apelido}</h1>
        <p className="text-sm text-muted">{jogador.nome}</p>
        <p className="mt-1 text-sm">
          {jogador.eh_goleiro ? "Goleiro" : jogador.posicao} · Classificação{" "}
          <strong>{jogador.classificacao}</strong>
        </p>
      </section>

      <section className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl border border-border bg-surface p-3">
          <p className="text-xl font-bold">{totais.gols}</p>
          <p className="text-xs text-muted">Gols</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3">
          <p className="text-xl font-bold">{totais.assistencias}</p>
          <p className="text-xs text-muted">Assistências</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3">
          <p className="text-xl font-bold">{totais.presencas}</p>
          <p className="text-xs text-muted">Presenças</p>
        </div>
      </section>

      {atributos && (
        <section className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="mb-3 font-semibold">Habilidades</h2>
          {admin ? (
            <form action={atualizarAtributos.bind(null, jogador.id)} className="space-y-3">
              {CAMPOS.map(({ chave, label }) => (
                <div key={chave}>
                  <div className="mb-1 flex justify-between text-xs text-muted">
                    <span>{label}</span>
                    <span>{atributos[chave]}</span>
                  </div>
                  <input
                    type="range"
                    name={chave}
                    min={0}
                    max={100}
                    defaultValue={atributos[chave] as number}
                    className="w-full accent-[#16A34A]"
                  />
                </div>
              ))}
              <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                Salvar habilidades
              </button>
            </form>
          ) : (
            <ul className="space-y-2">
              {CAMPOS.map(({ chave, label }) => (
                <li key={chave}>
                  <div className="mb-1 flex justify-between text-xs text-muted">
                    <span>{label}</span>
                    <span>{atributos[chave]}</span>
                  </div>
                  <div className="h-2 rounded-full bg-border">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${atributos[chave]}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {ehStaff && (
        <section className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="mb-2 font-semibold">Premiações</h2>
          {(premios ?? []).length === 0 ? (
            <p className="text-sm text-muted">Nenhuma premiação ainda.</p>
          ) : (
            <ul className="space-y-2">
              {(premios ?? []).map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-border p-3 text-sm"
                >
                  <span>
                    {p.posicao}º em {p.rankings.periodo} — racha grátis
                  </span>
                  <form action={marcarPremioUtilizado.bind(null, p.id, jogador.id, !p.utilizado)}>
                    <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold">
                      {p.utilizado ? "Marcar como não utilizado" : "Marcar como utilizado"}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
