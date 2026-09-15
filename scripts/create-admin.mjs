// Cria o primeiro usuário administrador (não existe autocadastro no MVP —
// ver seção 3.1 da spec: só admin cadastra jogadores/usuários).
//
// Uso:
//   node --env-file=.env.local scripts/create-admin.mjs "Nome Completo" "apelido" [senha]
//
// Se a senha não for informada, uma temporária de 6 dígitos é gerada — o
// Supabase Auth exige mínimo de 6 caracteres, e o primeiro login força a
// troca por uma senha definitiva escolhida pelo próprio usuário.

import { randomInt } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const [, , nome, apelido, senhaInformada] = process.argv;

if (!nome || !apelido) {
  console.error('Uso: node --env-file=.env.local scripts/create-admin.mjs "Nome Completo" "apelido" [senha]');
  process.exit(1);
}

const senha = senhaInformada || randomInt(100000, 999999).toString();

function apelidoParaEmailInterno(valor) {
  const slug = valor
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const dominio = process.env.AUTH_INTERNAL_EMAIL_DOMAIN || "resenhafc.internal";
  return `${slug}@${dominio}`;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const emailInterno = apelidoParaEmailInterno(apelido);

const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
  email: emailInterno,
  password: senha,
  email_confirm: true,
});

if (authError) {
  console.error("Erro ao criar usuário de autenticação:", authError.message);
  process.exit(1);
}

const { data: player, error: playerError } = await supabase
  .from("players")
  .insert({ nome, apelido, posicao: "meia", eh_goleiro: false })
  .select()
  .single();

if (playerError) {
  console.error("Erro ao criar jogador:", playerError.message);
  process.exit(1);
}

await supabase.from("player_attributes").insert({ player_id: player.id });

const { error: profileError } = await supabase.from("profiles").insert({
  id: authUser.user.id,
  nome,
  apelido,
  email_interno: emailInterno,
  role: "admin",
  player_id: player.id,
  must_change_password: true,
});

if (profileError) {
  console.error("Erro ao criar profile:", profileError.message);
  process.exit(1);
}

console.log(`Admin criado com sucesso: ${apelido} (senha temporária: ${senha})`);
console.log("No primeiro login, o app vai pedir pra trocar essa senha por uma definitiva.");
