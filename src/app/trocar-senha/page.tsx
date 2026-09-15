"use client";

import Image from "next/image";
import { useActionState } from "react";
import { trocarSenha, type TrocarSenhaState } from "./actions";

const ESTADO_INICIAL: TrocarSenhaState = {};

export default function TrocarSenhaPage() {
  const [state, formAction, pending] = useActionState(trocarSenha, ESTADO_INICIAL);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Image
            src="/icons/icon-512.png"
            alt="Resenha F.C"
            width={72}
            height={72}
            className="mx-auto mb-4 rounded-2xl"
            priority
          />
          <h1 className="text-xl font-bold">Crie sua senha</h1>
          <p className="mt-1 text-sm text-muted">
            Este é seu primeiro acesso. Escolha uma senha só sua pra continuar.
          </p>
        </div>

        <form action={formAction} className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div>
            <label htmlFor="nova_senha" className="mb-1 block text-sm font-medium">
              Nova senha
            </label>
            <input
              id="nova_senha"
              name="nova_senha"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-base outline-none focus:border-primary"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <label htmlFor="confirmar_senha" className="mb-1 block text-sm font-medium">
              Confirme a senha
            </label>
            <input
              id="confirmar_senha"
              name="confirmar_senha"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-base outline-none focus:border-primary"
              placeholder="Repita a senha"
            />
          </div>

          {state.error && (
            <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground transition disabled:opacity-60"
          >
            {pending ? "Salvando..." : "Salvar e entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
