"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface TrocarSenhaState {
  error?: string;
}

export async function trocarSenha(_prevState: TrocarSenhaState, formData: FormData): Promise<TrocarSenhaState> {
  const novaSenha = String(formData.get("nova_senha") || "");
  const confirmarSenha = String(formData.get("confirmar_senha") || "");

  if (novaSenha.length < 6) {
    return { error: "A senha deve ter pelo menos 6 caracteres." };
  }
  if (novaSenha !== confirmarSenha) {
    return { error: "As senhas não coincidem." };
  }

  const supabase = await createClient();

  const { error: updateError } = await supabase.auth.updateUser({ password: novaSenha });
  if (updateError) {
    return { error: updateError.message };
  }

  const { error: rpcError } = await supabase.rpc("concluir_troca_senha");
  if (rpcError) {
    return { error: rpcError.message };
  }

  redirect("/dashboard");
}
