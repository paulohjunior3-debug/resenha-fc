import Link from "next/link";
import { CalendarDays, ChevronRight, Trophy, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth/session";
import type { Match, MatchPlayer, Ranking } from "@/lib/types/database.types";

const STATUS_ESTILO: Record<Match["status"], string> = {
  fechada: "bg-border text-muted",
  aberta: "bg-primary/15 text-primary",
  finalizada: "bg-warning/15 text-warning",
};

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
    <div className="space-y-3">
      <Link
        href="/racha"
        className="block rounded-2xl border border-border bg-surface p-4 transition-colors active:bg-background"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <CalendarDays size={18} className="text-primary" />
            Próximo racha
          </div>
          <ChevronRight size={18} className="text-muted" />
        </div>

        {proximoRacha ? (
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">
                {new Date(`${proximoRacha.data}T00:00:00`).toLocaleDateString("pt-BR", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                })}
              </span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_ESTILO[proximoRacha.status]}`}>
                {STATUS_LABEL[proximoRacha.status]}
              </span>
            </div>
            <p className="text-muted">
              Valor total da quadra: <strong className="text-foreground">R$ {Number(proximoRacha.valor_total).toFixed(2)}</strong>
            </p>
            {minhaConfirmacao ? (
              <div className="flex items-center justify-between rounded-xl bg-background px-3 py-2">
                <span>
                  Você é <strong>{minhaConfirmacao.tipo_vaga === "titular" ? "titular" : "suplente"}</strong> (posição{" "}
                  {minhaConfirmacao.posicao_lista})
                </span>
                <span className={`font-semibold ${minhaConfirmacao.pagou ? "text-primary" : "text-danger"}`}>
                  {minhaConfirmacao.pagou ? "Pago" : `R$ ${Number(minhaConfirmacao.valor_devido ?? 0).toFixed(2)}`}
                </span>
              </div>
            ) : (
              <p className="rounded-xl bg-background px-3 py-2 text-muted">Você ainda não confirmou presença.</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted">Nenhum racha cadastrado ainda.</p>
        )}
      </Link>

      <Link
        href="/ranking"
        className="block rounded-2xl border border-border bg-surface p-4 transition-colors active:bg-background"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <Trophy size={18} className="text-gold" />
            Ranking do mês
          </div>
          <ChevronRight size={18} className="text-muted" />
        </div>
        <p className="mt-1 text-sm text-muted">
          {rankingAtual ? `Período ${rankingAtual.periodo} em andamento` : "Nenhum ranking em andamento."}
        </p>
      </Link>

      <Link
        href="/perfil"
        className="block rounded-2xl border border-border bg-surface p-4 transition-colors active:bg-background"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <Star size={18} className="text-primary" />
            Sua classificação
          </div>
          <ChevronRight size={18} className="text-muted" />
        </div>
        <p className="mt-1 text-sm text-muted">Ver perfil, habilidades e premiações</p>
      </Link>
    </div>
  );
}
