"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth/session";
import { podeGerenciarOperacional, ehAdmin } from "@/lib/auth/roles";

async function exigirStaff() {
  const profile = await getSessionProfile();
  if (!podeGerenciarOperacional(profile.role)) {
    throw new Error("Sem permissão para esta ação.");
  }
  return profile;
}

export async function criarRacha(formData: FormData) {
  const profile = await exigirStaff();
  const supabase = await createClient();

  const data = String(formData.get("data") || "");
  const valorTotal = Number(formData.get("valor_total") || 0);

  if (!data || valorTotal < 0) {
    throw new Error("Informe uma data e um valor válido.");
  }

  const { error } = await supabase.from("matches").insert({
    data,
    valor_total: valorTotal,
    status: "fechada",
    created_by: profile.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/racha");
}

export async function abrirLista(matchId: string) {
  await exigirStaff();
  const supabase = await createClient();
  const { error } = await supabase.from("matches").update({ status: "aberta" }).eq("id", matchId);
  if (error) throw new Error(error.message);
  revalidatePath("/racha");
}

export async function finalizarLista(matchId: string) {
  await exigirStaff();
  const supabase = await createClient();
  const { error } = await supabase.rpc("finalizar_lista", { p_match_id: matchId });
  if (error) throw new Error(error.message);
  revalidatePath("/racha");
}

export async function reabrirLista(matchId: string) {
  const profile = await getSessionProfile();
  if (!ehAdmin(profile.role)) {
    throw new Error("Somente o administrador pode reabrir a lista.");
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("reabrir_lista", { p_match_id: matchId });
  if (error) throw new Error(error.message);
  revalidatePath("/racha");
}

export async function confirmarPresenca(matchId: string) {
  await getSessionProfile();
  const supabase = await createClient();
  const { error } = await supabase.rpc("confirmar_presenca", { p_match_id: matchId, p_player_id: null });
  if (error) throw new Error(error.message);
  revalidatePath("/racha");
  revalidatePath("/dashboard");
}

export async function desistirPresenca(matchId: string) {
  await getSessionProfile();
  const supabase = await createClient();
  const { error } = await supabase.rpc("desistir_presenca", { p_match_id: matchId, p_player_id: null });
  if (error) throw new Error(error.message);
  revalidatePath("/racha");
  revalidatePath("/dashboard");
}

export async function atualizarEstatisticas(formData: FormData) {
  await exigirStaff();
  const supabase = await createClient();

  const matchPlayerId = String(formData.get("match_player_id"));
  const gols = Number(formData.get("gols") || 0);
  const assistencias = Number(formData.get("assistencias") || 0);
  const presenca = formData.get("presenca") === "on";

  const { error } = await supabase
    .from("match_players")
    .update({ gols, assistencias, presenca })
    .eq("id", matchPlayerId);

  if (error) throw new Error(error.message);
  revalidatePath("/racha");
}

export async function registrarPagamento(matchPlayerId: string, pago: boolean, valorDevido: number | null) {
  await exigirStaff();
  const supabase = await createClient();

  const { error } = await supabase
    .from("match_players")
    .update({ pagou: pago, valor_pago: pago ? valorDevido : null })
    .eq("id", matchPlayerId);

  if (error) throw new Error(error.message);
  revalidatePath("/racha");
}
