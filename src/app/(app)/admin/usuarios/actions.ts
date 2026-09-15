"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionProfile } from "@/lib/auth/session";
import { ehAdmin, podeGerenciarOperacional, apelidoParaEmailInterno } from "@/lib/auth/roles";
import type { Role } from "@/lib/types/database.types";

export interface CadastroState {
  error?: string;
  sucesso?: { apelido: string; senhaTemporaria: string };
}

function gerarSenhaTemporaria(): string {
  return randomInt(100000, 999999).toString();
}

async function exigirStaff() {
  const profile = await getSessionProfile();
  if (!podeGerenciarOperacional(profile.role)) {
    throw new Error("Sem permissão para cadastrar jogadores.");
  }
  return profile;
}

async function exigirAdmin() {
  const profile = await getSessionProfile();
  if (!ehAdmin(profile.role)) {
    throw new Error("Somente o administrador gerencia usuários.");
  }
}

export async function cadastrarJogador(_prevState: CadastroState, formData: FormData): Promise<CadastroState> {
  const quemCadastra = await exigirStaff();

  const nome = String(formData.get("nome") || "").trim();
  const apelido = String(formData.get("apelido") || "").trim();
  const roleSolicitado = String(formData.get("role") || "player") as Role;
  const ehGoleiro = formData.get("eh_goleiro") === "on";

  if (!nome || !apelido) {
    return { error: "Informe nome e apelido." };
  }
  if (roleSolicitado !== "player" && roleSolicitado !== "moderator") {
    return { error: "Papel inválido." };
  }
  // Moderador só pode cadastrar jogadores comuns, nunca outro moderador/admin.
  const role: Role = ehAdmin(quemCadastra.role) ? roleSolicitado : "player";

  const admin = createAdminClient();
  const emailInterno = apelidoParaEmailInterno(apelido);
  const senhaTemporaria = gerarSenhaTemporaria();

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: emailInterno,
    password: senhaTemporaria,
    email_confirm: true,
  });
  if (authError) {
    return { error: authError.message };
  }

  const { data: player, error: playerError } = await admin
    .from("players")
    .insert({ nome, apelido, eh_goleiro: ehGoleiro, posicao: ehGoleiro ? "goleiro" : "meia" })
    .select()
    .single();
  if (playerError) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    return { error: playerError.message };
  }

  await admin.from("player_attributes").insert({ player_id: player.id });

  const { error: profileError } = await admin.from("profiles").insert({
    id: authUser.user.id,
    nome,
    apelido,
    email_interno: emailInterno,
    role,
    player_id: player.id,
    must_change_password: true,
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    return { error: profileError.message };
  }

  revalidatePath("/admin/usuarios");
  revalidatePath("/jogadores");

  return { sucesso: { apelido, senhaTemporaria } };
}

export async function alterarStatusUsuario(profileId: string, ativo: boolean) {
  await exigirAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ ativo }).eq("id", profileId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/usuarios");
}
