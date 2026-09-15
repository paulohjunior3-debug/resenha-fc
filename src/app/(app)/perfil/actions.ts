"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth/session";

export interface FotoState {
  error?: string;
}

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];
const TAMANHO_MAXIMO = 5 * 1024 * 1024;

export async function atualizarFoto(_prevState: FotoState, formData: FormData): Promise<FotoState> {
  const profile = await getSessionProfile();
  if (!profile.player_id) {
    return { error: "Seu usuário não está vinculado a um jogador." };
  }

  const arquivo = formData.get("foto");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { error: "Selecione uma foto." };
  }
  if (!TIPOS_PERMITIDOS.includes(arquivo.type)) {
    return { error: "Formato inválido. Use JPG, PNG ou WebP." };
  }
  if (arquivo.size > TAMANHO_MAXIMO) {
    return { error: "A foto deve ter no máximo 5MB." };
  }

  const supabase = await createClient();
  const extensao = arquivo.type.split("/")[1];
  const caminho = `${profile.player_id}/avatar.${extensao}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(caminho, arquivo, { upsert: true, contentType: arquivo.type });
  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(caminho);
  const url = `${publicUrlData.publicUrl}?v=${Date.now()}`;

  const { error: rpcError } = await supabase.rpc("atualizar_meu_avatar", { p_avatar_url: url });
  if (rpcError) {
    return { error: rpcError.message };
  }

  revalidatePath("/perfil");
  revalidatePath("/racha");
  revalidatePath("/ranking");
  revalidatePath("/jogadores");
  revalidatePath(`/jogadores/${profile.player_id}`);

  return {};
}
