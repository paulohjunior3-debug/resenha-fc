-- Corrige data/valor de um racha já criado, recalculando o rateio dos
-- jogadores de linha já confirmados (não faz nada se a lista já estiver
-- finalizada — mesma trava de recalcular_valores).
create or replace function public.editar_racha(p_match_id uuid, p_data date, p_valor_total numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select role from profiles where id = auth.uid()) not in ('admin', 'moderator') then
    raise exception 'Sem permissão para editar o racha';
  end if;

  update matches set data = p_data, valor_total = p_valor_total where id = p_match_id;

  perform public.recalcular_valores(p_match_id);
end;
$$;

grant execute on function public.editar_racha(uuid, date, numeric) to authenticated;
