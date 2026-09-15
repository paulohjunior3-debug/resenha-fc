"use client";

import Image from "next/image";
import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Image
            src="/icons/icon-512.png"
            alt="Resenha F.C"
            width={80}
            height={80}
            className="mx-auto mb-4 rounded-2xl"
            priority
          />
          <h1 className="text-2xl font-bold">Resenha F.C</h1>
          <p className="mt-1 text-sm text-muted">Entre com seu nome ou apelido</p>
        </div>

        <form action={formAction} className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div>
            <label htmlFor="identificador" className="mb-1 block text-sm font-medium">
              Nome ou apelido
            </label>
            <input
              id="identificador"
              name="identificador"
              type="text"
              autoComplete="username"
              required
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-base outline-none focus:border-primary"
              placeholder="Ex: João"
            />
          </div>

          <div>
            <label htmlFor="senha" className="mb-1 block text-sm font-medium">
              Senha
            </label>
            <input
              id="senha"
              name="senha"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-base outline-none focus:border-primary"
              placeholder="Senha inicial: 1234"
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
            {pending ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
