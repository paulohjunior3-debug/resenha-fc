import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth/session";
import { podeGerenciarOperacional } from "@/lib/auth/roles";
import type { Match, MatchPlayer, Player } from "@/lib/types/database.types";
import {
  abrirLista,
  atualizarEstatisticas,
  confirmarPresenca,
  criarRacha,
  desistirPresenca,
  finalizarLista,
  reabrirLista,
  registrarPagamento,
} from "./actions";

type MatchPlayerComJogador = MatchPlayer & { players: Pick<Player, "nome" | "apelido" | "eh_goleiro"> };

const STATUS_LABEL: Record<Match["status"], string> = {
  fechada: "Fechada (ainda não aberta)",
  aberta: "Aberta para confirmações",
  finalizada: "Finalizada",
};

export default async function RachaPage() {
  const profile = await getSessionProfile();
  const supabase = await createClient();
  const ehStaff = podeGerenciarOperacional(profile.role);

  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<Match>();

  const { data: lista } = match
    ? await supabase
        .from("match_players")
        .select("*, players(nome, apelido, eh_goleiro)")
        .eq("match_id", match.id)
        .eq("status", "confirmado")
        .order("tipo_vaga", { ascending: false })
        .order("posicao_lista", { ascending: true })
        .returns<MatchPlayerComJogador[]>()
    : { data: null };

  const titulares = (lista ?? []).filter((mp) => mp.tipo_vaga === "titular");
  const suplentes = (lista ?? []).filter((mp) => mp.tipo_vaga === "suplente");
  const minhaLinha = (lista ?? []).find((mp) => mp.player_id === profile.player_id);

  return (
    <div className="space-y-4">
      {ehStaff && (
        <section className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="mb-2 font-semibold">Criar novo racha</h2>
          <form action={criarRacha} className="flex flex-wrap items-end gap-2">
            <div>
              <label className="mb-1 block text-xs text-muted">Data</label>
              <input
                type="date"
                name="data"
                required
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Valor da quadra (R$)</label>
              <input
                type="number"
                name="valor_total"
                step="0.01"
                min="0"
                required
                className="w-28 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Criar
            </button>
          </form>
        </section>
      )}

      {!match && <p className="text-sm text-muted">Nenhum racha cadastrado ainda.</p>}

      {match && (
        <>
          <section className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">
                  {new Date(`${match.data}T00:00:00`).toLocaleDateString("pt-BR")}
                </h2>
                <p className="text-sm text-muted">{STATUS_LABEL[match.status]}</p>
                <p className="text-sm">Valor total: R$ {Number(match.valor_total).toFixed(2)}</p>
              </div>
              {ehStaff && (
                <div className="flex flex-col gap-2">
                  {match.status === "fechada" && (
                    <form action={abrirLista.bind(null, match.id)}>
                      <button className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
                        Abrir lista
                      </button>
                    </form>
                  )}
                  {match.status === "aberta" && (
                    <form action={finalizarLista.bind(null, match.id)}>
                      <button className="rounded-lg bg-danger px-3 py-2 text-sm font-semibold text-white">
                        Finalizar lista
                      </button>
                    </form>
                  )}
                  {match.status === "finalizada" && profile.role === "admin" && (
                    <form action={reabrirLista.bind(null, match.id)}>
                      <button className="rounded-lg border border-border px-3 py-2 text-sm font-semibold">
                        Reabrir lista
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>

            {match.status === "aberta" && !ehStaff && (
              <div className="mt-3">
                {minhaLinha ? (
                  <form action={desistirPresenca.bind(null, match.id)}>
                    <button className="rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white">
                      Desistir da presença
                    </button>
                  </form>
                ) : (
                  <form action={confirmarPresenca.bind(null, match.id)}>
                    <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                      Confirmar presença
                    </button>
                  </form>
                )}
              </div>
            )}
          </section>

          <ListaJogadores titulo="Titulares" itens={titulares} ehStaff={ehStaff} />
          <ListaJogadores titulo="Suplentes" itens={suplentes} ehStaff={ehStaff} />
        </>
      )}
    </div>
  );
}

function ListaJogadores({
  titulo,
  itens,
  ehStaff,
}: {
  titulo: string;
  itens: MatchPlayerComJogador[];
  ehStaff: boolean;
}) {
  if (itens.length === 0) {
    return (
      <section className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="font-semibold">{titulo}</h2>
        <p className="mt-1 text-sm text-muted">Ninguém aqui ainda.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <h2 className="mb-3 font-semibold">
        {titulo} ({itens.length})
      </h2>
      <ul className="space-y-3">
        {itens.map((mp) => (
          <li key={mp.id} className="rounded-xl border border-border p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {mp.posicao_lista}. {mp.players.apelido}{" "}
                  {mp.players.eh_goleiro && <span className="text-xs text-muted">(goleiro)</span>}
                </p>
                <p className="text-xs text-muted">
                  {mp.players.eh_goleiro
                    ? "Não paga"
                    : `Deve: R$ ${Number(mp.valor_devido ?? 0).toFixed(2)}`}
                </p>
              </div>
              {!mp.players.eh_goleiro && (
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    mp.pagou ? "bg-primary/15 text-primary" : "bg-danger/15 text-danger"
                  }`}
                >
                  {mp.pagou ? "Pago" : "Não pago"}
                </span>
              )}
            </div>

            {ehStaff && (
              <div className="mt-3 space-y-2 border-t border-border pt-3">
                <form action={atualizarEstatisticas} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="match_player_id" value={mp.id} />
                  <div>
                    <label className="mb-1 block text-xs text-muted">Gols</label>
                    <input
                      type="number"
                      name="gols"
                      min="0"
                      defaultValue={mp.gols}
                      className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted">Assist.</label>
                    <input
                      type="number"
                      name="assistencias"
                      min="0"
                      defaultValue={mp.assistencias}
                      className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-sm"
                    />
                  </div>
                  <label className="flex items-center gap-1 pb-2 text-xs">
                    <input type="checkbox" name="presenca" defaultChecked={mp.presenca} />
                    Presente
                  </label>
                  <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold">
                    Salvar
                  </button>
                </form>

                {!mp.players.eh_goleiro && (
                  <form action={registrarPagamento.bind(null, mp.id, !mp.pagou, mp.valor_devido)}>
                    <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold">
                      Marcar como {mp.pagou ? "não pago" : "pago"}
                    </button>
                  </form>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
