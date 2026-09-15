"use client";

import { useActionState, useRef } from "react";
import { cadastrarJogador, type CadastroState } from "./actions";

const ESTADO_INICIAL: CadastroState = {};

export function CadastroForm({ podeEscolherPapel }: { podeEscolherPapel: boolean }) {
  const [state, formAction, pending] = useActionState(cadastrarJogador, ESTADO_INICIAL);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div>
      <form
        ref={formRef}
        action={async (formData) => {
          await formAction(formData);
          formRef.current?.reset();
        }}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
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
        {podeEscolherPapel ? (
          <div>
            <label className="mb-1 block text-xs text-muted">Papel</label>
            <select name="role" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option value="player">Jogador</option>
              <option value="moderator">Moderador</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        ) : (
          <input type="hidden" name="role" value="player" />
        )}
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input type="checkbox" name="eh_goleiro" />
          É goleiro (não paga o racha)
        </label>

        <div className="sm:col-span-2">
          <button
            disabled={pending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {pending ? "Cadastrando..." : "Cadastrar"}
          </button>
        </div>
      </form>

      {state.error && (
        <p className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>
      )}

      {state.sucesso && (
        <div className="mt-3 rounded-lg bg-primary/10 px-3 py-3 text-sm">
          <p>
            <strong>{state.sucesso.apelido}</strong> cadastrado! Senha temporária:
          </p>
          <p className="my-1 text-center text-2xl font-bold tracking-widest text-primary">
            {state.sucesso.senhaTemporaria}
          </p>
          <p className="text-xs text-muted">
            Repasse essa senha pro jogador — no primeiro login o app vai pedir pra ele criar a senha definitiva dele.
          </p>
        </div>
      )}
    </div>
  );
}
