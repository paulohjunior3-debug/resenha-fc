import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth/session";
import type { Match, MatchPlayer, Ranking } from "@/lib/types/database.types";

const STATUS_LABEL: Record<Match["status"], string> = {
  fechada: "Lista fechada",
  aberta: "Lista aberta",
  finalizada: "Lista finalizada",
};

export default async function DashboardPage() {
  const profile = await getSessionProfile();
  const supabase = await createClient();

  const { data: proximoRacha } = await supabase
    .from("matches")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<Match>();

  let minhaConfirmacao: MatchPlayer | null = null;
  if (proximoRacha && profile.player_id) {
    const { data } = await supabase
      .from("match_players")
      .select("*")
      .eq("match_id", proximoRacha.id)
      .eq("player_id", profile.player_id)
      .eq("status", "confirmado")
      .maybeSingle<MatchPlayer>();
    minhaConfirmacao = data;
  }

  const { data: rankingAtual } = await supabase
    .from("rankings")
    .select("*")
    .eq("finalizado", false)
    .order("data_inicio", { ascending: false })
    .limit(1)
    .maybeSingle<Ranking>();

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="mb-2 font-semibold">Próximo racha</h2>
        {proximoRacha ? (
          <div className="space-y-1 text-sm">
            <p>
              Data: <strong>{new Date(`${proximoRacha.data}T00:00:00`).toLocaleDateString("pt-BR")}</strong>
            </p>
            <p>Status: {STATUS_LABEL[proximoRacha.status]}</p>
            <p>
              Valor total da quadra: <strong>R$ {Number(proximoRacha.valor_total).toFixed(2)}</strong>
            </p>
            {minhaConfirmacao ? (
              <>
                <p>
                  Você é: <strong>{minhaConfirmacao.tipo_vaga === "titular" ? "Titular" : "Suplente"}</strong>{" "}
                  (posição {minhaConfirmacao.posicao_lista})
                </p>
                <p>
                  A pagar: <strong>R$ {Number(minhaConfirmacao.valor_devido ?? 0).toFixed(2)}</strong> —{" "}
                  {minhaConfirmacao.pagou ? "pago" : "não pago"}
                </p>
              </>
            ) : (
              <p className="text-muted">Você ainda não confirmou presença.</p>
            )}
            <Link href="/racha" className="mt-2 inline-block font-medium text-primary underline">
              Ver lista completa
            </Link>
          </div>
        ) : (
          <p className="text-sm text-muted">Nenhum racha cadastrado ainda.</p>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="mb-2 font-semibold">Ranking do mês</h2>
        {rankingAtual ? (
          <div className="text-sm">
            <p>Período: {rankingAtual.periodo}</p>
            <Link href="/ranking" className="font-medium text-primary underline">
              Ver ranking e pódio
            </Link>
          </div>
        ) : (
          <p className="text-sm text-muted">Nenhum ranking em andamento.</p>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="mb-2 font-semibold">Sua classificação</h2>
        <Link href="/perfil" className="font-medium text-primary underline">
          Ver perfil completo
        </Link>
      </section>
    </div>
  );
}
