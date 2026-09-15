"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionProfile } from "@/lib/auth/session";
import { ehAdmin, apelidoParaEmailInterno } from "@/lib/auth/roles";
import type { Role } from "@/lib/types/database.types";

const SENHA_INICIAL = "1234";

async function exigirAdmin() {
  const profile = await getSessionProfile();
  if (!ehAdmin(profile.role)) {
    throw new Error("Somente o administrador gerencia usuários.");
  }
}

export async function cadastrarJogador(formData: FormData) {
  await exigirAdmin();

  const nome = String(formData.get("nome") || "").trim();
  const apelido = String(formData.get("apelido") || "").trim();
  const role = String(formData.get("role") || "player") as Role;
  const ehGoleiro = formData.get("eh_goleiro") === "on";

  if (!nome || !apelido) {
    throw new Error("Informe nome e apelido.");
  }
  if (role !== "player" && role !== "moderator") {
    throw new Error("Papel inválido.");
  }

  const admin = createAdminClient();
  const emailInterno = apelidoParaEmailInterno(apelido);

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: emailInterno,
    password: SENHA_INICIAL,
    email_confirm: true,
  });
  if (authError) throw new Error(authError.message);

  const { data: player, error: playerError } = await admin
    .from("players")
    .insert({ nome, apelido, eh_goleiro: ehGoleiro, posicao: ehGoleiro ? "goleiro" : "meia" })
    .select()
    .single();
  if (playerError) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    throw new Error(playerError.message);
  }

  await admin.from("player_attributes").insert({ player_id: player.id });

  const { error: profileError } = await admin.from("profiles").insert({
    id: authUser.user.id,
    nome,
    apelido,
    email_interno: emailInterno,
    role,
    player_id: player.id,
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    throw new Error(profileError.message);
  }

  revalidatePath("/admin/usuarios");
  revalidatePath("/jogadores");
}

export async function alterarStatusUsuario(profileId: string, ativo: boolean) {
  await exigirAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ ativo }).eq("id", profileId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/usuarios");
}
