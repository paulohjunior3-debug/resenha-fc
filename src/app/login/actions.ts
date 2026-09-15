"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface LoginState {
  error?: string;
}

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const identificador = String(formData.get("identificador") || "").trim();
  const senha = String(formData.get("senha") || "");

  if (!identificador || !senha) {
    return { error: "Preencha nome/apelido e senha." };
  }

  const supabase = await createClient();

  const { data: email, error: lookupError } = await supabase.rpc("obter_email_login", {
    identificador,
  });

  if (lookupError || !email) {
    return { error: "Usuário não encontrado." };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error) {
    return { error: "Usuário ou senha inválidos." };
  }

  redirect("/dashboard");
}
