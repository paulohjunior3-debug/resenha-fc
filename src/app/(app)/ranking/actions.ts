"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth/session";
import { ehAdmin } from "@/lib/auth/roles";

async function exigirAdmin() {
  const profile = await getSessionProfile();
  if (!ehAdmin(profile.role)) {
    throw new Error("Somente o administrador pode gerenciar o ranking.");
  }
}

export async function iniciarRanking(formData: FormData) {
  await exigirAdmin();
  const supabase = await createClient();

  const periodo = String(formData.get("periodo") || "");
  const dataInicio = String(formData.get("data_inicio") || "");

  if (!periodo || !dataInicio) {
    throw new Error("Informe período e data de início.");
  }

  const { error } = await supabase.from("rankings").insert({ periodo, data_inicio: dataInicio });
  if (error) throw new Error(error.message);
  revalidatePath("/ranking");
}

export async function finalizarRanking(rankingId: string) {
  await exigirAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("finalizar_ranking", { p_ranking_id: rankingId });
  if (error) throw new Error(error.message);
  revalidatePath("/ranking");
}
