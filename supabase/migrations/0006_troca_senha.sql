-- Login inicial passa a usar uma senha temporária (6 dígitos, gerada pelo
-- sistema) em vez de "1234" fixo — o Supabase Auth exige mínimo de 6
-- caracteres, e reaproveitamos essa senha temporária para forçar o jogador a
-- criar sua própria senha no primeiro acesso.
alter table profiles add column must_change_password boolean not null default true;

create or replace function public.concluir_troca_senha()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update profiles set must_change_password = false where id = auth.uid();
end;
$$;

grant execute on function public.concluir_troca_senha() to authenticated;
