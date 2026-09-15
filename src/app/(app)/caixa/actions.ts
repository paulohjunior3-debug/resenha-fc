"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth/session";
import { podeGerenciarOperacional } from "@/lib/auth/roles";

export async function lancarMovimentacao(formData: FormData) {
  const profile = await getSessionProfile();
  if (!podeGerenciarOperacional(profile.role)) {
    throw new Error("Sem permissão para lançar movimentações no caixa.");
  }

  const supabase = await createClient();
  const tipo = String(formData.get("tipo") || "entrada");
  const valor = Number(formData.get("valor") || 0);
  const descricao = String(formData.get("descricao") || "").trim();

  if (valor <= 0 || !descricao) {
    throw new Error("Informe um valor e uma descrição válidos.");
  }

  const { error } = await supabase.from("cash_transactions").insert({
    tipo,
    valor,
    descricao,
    created_by: profile.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/caixa");
}
