"use client";

import { useActionState } from "react";
import { Camera } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { atualizarFoto, type FotoState } from "./actions";

const ESTADO_INICIAL: FotoState = {};

export function PhotoForm({ avatarUrl, apelido }: { avatarUrl: string | null; apelido: string }) {
  const [state, formAction, pending] = useActionState(atualizarFoto, ESTADO_INICIAL);

  return (
    <div className="mx-auto w-fit">
      <form action={formAction} className="relative">
        <Avatar src={avatarUrl} alt={apelido} size={80} />
        <label
          aria-label="Alterar foto"
          className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow"
        >
          <Camera size={14} />
          <input
            type="file"
            name="foto"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            disabled={pending}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
          />
        </label>
      </form>
      {pending && <p className="mt-1 text-center text-xs text-muted">Enviando...</p>}
      {state.error && <p className="mt-1 max-w-[160px] text-center text-xs text-danger">{state.error}</p>}
    </div>
  );
}
