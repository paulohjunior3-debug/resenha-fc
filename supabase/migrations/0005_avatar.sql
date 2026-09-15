-- Bucket público para fotos de perfil dos jogadores. Público porque a foto
-- aparece pra todo mundo (lista do racha, pódio, perfil de outros jogadores).
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Cada jogador só pode escrever dentro da própria pasta (avatars/<player_id>/...).
create policy "avatars_insert_own"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select player_id::text from profiles where id = auth.uid())
);

create policy "avatars_update_own"
on storage.objects for update
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select player_id::text from profiles where id = auth.uid())
);

create policy "avatars_select_public"
on storage.objects for select
using (bucket_id = 'avatars');

-- Permite que o próprio jogador atualize sua foto sem abrir escrita geral na
-- tabela players (que continua restrita ao admin — ver 0003_rls.sql).
create or replace function public.atualizar_meu_avatar(p_avatar_url text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player_id uuid;
begin
  select player_id into v_player_id from profiles where id = auth.uid();

  if v_player_id is null then
    raise exception 'Usuário não está vinculado a um jogador';
  end if;

  update players set avatar_url = p_avatar_url where id = v_player_id;
end;
$$;

grant execute on function public.atualizar_meu_avatar(text) to authenticated;
