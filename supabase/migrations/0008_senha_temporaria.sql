-- Guarda a senha temporária gerada no cadastro para consulta pelo admin
-- enquanto o jogador ainda não trocou por uma definitiva. Depois que a
-- pessoa cria a própria senha (concluir_troca_senha), o valor é apagado —
-- a partir daí ninguém, nem o admin, consegue mais saber a senha real
-- (só existe o hash gerenciado pelo Supabase Auth).
alter table profiles add column senha_temporaria text;

-- Moderador também usa a tela de cadastro e precisa ver a lista completa de
-- usuários (antes a policy só deixava cada um ver a própria linha, exceto admin).
drop policy "profiles_select" on profiles;
create policy "profiles_select" on profiles for select
  using (id = auth.uid() or meu_role() in ('admin', 'moderator'));

create or replace function public.concluir_troca_senha()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update profiles set must_change_password = false, senha_temporaria = null where id = auth.uid();
end;
$$;
