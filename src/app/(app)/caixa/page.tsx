import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth/session";
import { podeGerenciarOperacional } from "@/lib/auth/roles";
import type { CashTransaction, Profile } from "@/lib/types/database.types";
import { lancarMovimentacao } from "./actions";

type TransacaoComAutor = CashTransaction & { profiles: Pick<Profile, "apelido"> };

export default async function CaixaPage() {
  const profile = await getSessionProfile();
  const supabase = await createClient();
  const ehStaff = podeGerenciarOperacional(profile.role);

  const { data: saldoRow } = await supabase.from("caixa_saldo").select("saldo").maybeSingle<{ saldo: number }>();
  const { data: transacoes } = await supabase
    .from("cash_transactions")
    .select("*, profiles(apelido)")
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<TransacaoComAutor[]>();

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border bg-surface p-4 text-center">
        <p className="text-sm text-muted">Saldo atual do caixa</p>
        <p className="text-3xl font-bold text-primary">R$ {Number(saldoRow?.saldo ?? 0).toFixed(2)}</p>
      </section>

      {ehStaff && (
        <section className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="mb-2 font-semibold">Lançar movimentação</h2>
          <form action={lancarMovimentacao} className="space-y-3">
            <div className="flex gap-2">
              <select name="tipo" className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </select>
              <input
                type="number"
                name="valor"
                step="0.01"
                min="0.01"
                required
                placeholder="Valor"
                className="w-32 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <input
              name="descricao"
              required
              placeholder="Descrição (ex: caixa do racha de hoje)"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Lançar
            </button>
          </form>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="mb-3 font-semibold">Histórico</h2>
        <ul className="space-y-2">
          {(transacoes ?? []).map((t) => (
            <li key={t.id} className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">
              <div>
                <p className="font-medium">{t.descricao}</p>
                <p className="text-xs text-muted">
                  {new Date(t.created_at).toLocaleDateString("pt-BR")} · lançado por {t.profiles.apelido}
                </p>
              </div>
              <span className={`font-semibold ${t.tipo === "entrada" ? "text-primary" : "text-danger"}`}>
                {t.tipo === "entrada" ? "+" : "-"} R$ {Number(t.valor).toFixed(2)}
              </span>
            </li>
          ))}
          {(transacoes ?? []).length === 0 && <p className="text-sm text-muted">Nenhuma movimentação ainda.</p>}
        </ul>
      </section>
    </div>
  );
}
