import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/database.types";
import { alterarStatusUsuario, cadastrarJogador } from "./actions";

const ROLE_LABEL: Record<Profile["role"], string> = {
  admin: "Administrador",
  moderator: "Moderador",
  player: "Jogador",
};

export default async function UsuariosPage() {
  const supabase = await createClient();
  const { data: usuarios } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Profile[]>();

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="mb-2 font-semibold">Cadastrar jogador</h2>
        <p className="mb-3 text-xs text-muted">
          Senha inicial padrão: <strong>1234</strong>. O jogador poderá alterá-la futuramente.
        </p>
        <form action={cadastrarJogador} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-muted">Nome completo</label>
            <input
              name="nome"
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Apelido (usado para login)</label>
            <input
              name="apelido"
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Papel</label>
            <select name="role" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option value="player">Jogador</option>
              <option value="moderator">Moderador</option>
            </select>
          </div>
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <input type="checkbox" name="eh_goleiro" />
            É goleiro (não paga o racha)
          </label>
          <div className="sm:col-span-2">
            <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Cadastrar
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="mb-3 font-semibold">Usuários cadastrados</h2>
        <ul className="space-y-2">
          {(usuarios ?? []).map((u) => (
            <li
              key={u.id}
              className="flex items-center justify-between rounded-xl border border-border p-3 text-sm"
            >
              <div>
                <p className="font-medium">
                  {u.nome} <span className="text-muted">({u.apelido})</span>
                </p>
                <p className="text-xs text-muted">
                  {ROLE_LABEL[u.role]} · {u.ativo ? "ativo" : "inativo"}
                </p>
              </div>
              {u.role !== "admin" && (
                <form action={alterarStatusUsuario.bind(null, u.id, !u.ativo)}>
                  <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold">
                    {u.ativo ? "Desativar" : "Ativar"}
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
