import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth/session";
import { ehAdmin } from "@/lib/auth/roles";
import { ConfirmButton } from "@/components/ui/confirm-button";
import type { Profile } from "@/lib/types/database.types";
import { alterarStatusUsuario, excluirUsuario } from "./actions";
import { CadastroForm } from "./cadastro-form";

const ROLE_LABEL: Record<Profile["role"], string> = {
  admin: "Administrador",
  moderator: "Moderador",
  player: "Jogador",
};

export default async function UsuariosPage() {
  const profile = await getSessionProfile();
  const admin = ehAdmin(profile.role);
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
          Uma senha temporária de 6 dígitos é gerada na hora — o jogador cria a senha definitiva no primeiro login.
        </p>
        <CadastroForm podeEscolherPapel={admin} />
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
              {admin && u.role !== "admin" && (
                <div className="flex gap-2">
                  <form action={alterarStatusUsuario.bind(null, u.id, !u.ativo)}>
                    <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold">
                      {u.ativo ? "Desativar" : "Ativar"}
                    </button>
                  </form>
                  <form action={excluirUsuario.bind(null, u.id)}>
                    <ConfirmButton
                      confirmMessage={`Excluir ${u.apelido} definitivamente? Isso apaga o login e todo o histórico dele (presenças, gols, ranking). Não pode ser desfeito.`}
                      className="rounded-lg border border-danger/30 px-3 py-1.5 text-xs font-semibold text-danger"
                    >
                      Excluir
                    </ConfirmButton>
                  </form>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
