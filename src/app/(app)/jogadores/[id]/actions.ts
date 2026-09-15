"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth/session";
import { ehAdmin, podeGerenciarOperacional } from "@/lib/auth/roles";
import { calcularClassificacao, calcularMediaAtributos } from "@/lib/business/classification";

const CAMPOS = ["drible", "pe_direito", "pe_esquerdo", "zagueiro", "meia", "agilidade", "velocidade"] as const;

export async function atualizarAtributos(playerId: string, formData: FormData) {
  const profile = await getSessionProfile();
  if (!ehAdmin(profile.role)) {
    throw new Error("Somente o administrador altera as habilidades do jogador.");
  }

  const supabase = await createClient();

  const valores = Object.fromEntries(
    CAMPOS.map((campo) => [campo, Math.max(0, Math.min(100, Number(formData.get(campo) || 0)))])
  ) as Record<(typeof CAMPOS)[number], number>;

  const { error: attrError } = await supabase
    .from("player_attributes")
    .update({ ...valores, updated_at: new Date().toISOString() })
    .eq("player_id", playerId);
  if (attrError) throw new Error(attrError.message);

  const classificacao = calcularClassificacao(calcularMediaAtributos(valores));
  const { error: playerError } = await supabase
    .from("players")
    .update({ classificacao })
    .eq("id", playerId);
  if (playerError) throw new Error(playerError.message);

  revalidatePath(`/jogadores/${playerId}`);
  revalidatePath("/jogadores");
}

export async function marcarPremioUtilizado(premioId: string, playerId: string, utilizado: boolean) {
  const profile = await getSessionProfile();
  if (!podeGerenciarOperacional(profile.role)) {
    throw new Error("Sem permissão para alterar premiações.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("prizes")
    .update({ utilizado, data_utilizacao: utilizado ? new Date().toISOString() : null })
    .eq("id", premioId);
  if (error) throw new Error(error.message);

  revalidatePath(`/jogadores/${playerId}`);
}
