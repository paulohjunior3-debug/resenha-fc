-- Funções centralizando regras de negócio (fila/suplente, rateio, ranking).
-- security definer + checagem interna de role: o cliente nunca decide por si
-- só se pode confirmar por outro jogador ou pular a fila.

create or replace function public.meu_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.meu_player_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select player_id from public.profiles where id = auth.uid()
$$;

-- Recalcula o valor devido por jogador de linha confirmado (goleiro = 0).
-- Não faz nada se a lista já estiver finalizada (valor fica congelado).
create or replace function public.recalcular_valores(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_valor_total numeric;
  v_status status_lista;
  v_count integer;
begin
  select valor_total, status into v_valor_total, v_status
  from matches where id = p_match_id;

  if v_status is null or v_status = 'finalizada' then
    return;
  end if;

  select count(*) into v_count
  from match_players mp
  join players p on p.id = mp.player_id
  where mp.match_id = p_match_id
    and mp.status = 'confirmado'
    and mp.tipo_vaga = 'titular'
    and not p.eh_goleiro;

  update match_players mp
  set valor_devido = case
    when p.eh_goleiro then 0
    when v_count = 0 then 0
    else round(v_valor_total / v_count, 2)
  end
  from players p
  where mp.player_id = p.id
    and mp.match_id = p_match_id
    and mp.status = 'confirmado';
end;
$$;

-- Confirma presença. p_player_id só pode ser informado por admin/moderador
-- (confirmar em nome de outro jogador); um jogador comum sempre confirma a
-- si mesmo (via profiles.player_id).
create or replace function public.confirmar_presenca(p_match_id uuid, p_player_id uuid default null)
returns match_players
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role user_role;
  v_caller_player_id uuid;
  v_player_id uuid;
  v_eh_goleiro boolean;
  v_match_status status_lista;
  v_next_pos integer;
  v_titulares_goleiro integer;
  v_titulares_linha integer;
  v_tipo_vaga tipo_vaga;
  v_row match_players;
begin
  select role, player_id into v_caller_role, v_caller_player_id
  from profiles where id = auth.uid();

  if p_player_id is not null then
    if v_caller_role not in ('admin', 'moderator') then
      raise exception 'Sem permissão para confirmar presença de outro jogador';
    end if;
    v_player_id := p_player_id;
  else
    if v_caller_player_id is null then
      raise exception 'Usuário não está vinculado a um jogador';
    end if;
    v_player_id := v_caller_player_id;
  end if;

  select status into v_match_status from matches where id = p_match_id for update;
  if v_match_status is null then
    raise exception 'Racha não encontrado';
  end if;
  if v_match_status <> 'aberta' then
    raise exception 'A lista deste racha não está aberta';
  end if;

  if exists (
    select 1 from match_players
    where match_id = p_match_id and player_id = v_player_id and status = 'confirmado'
  ) then
    raise exception 'Jogador já confirmado neste racha';
  end if;

  select eh_goleiro into v_eh_goleiro from players where id = v_player_id and ativo;
  if not found then
    raise exception 'Jogador inválido ou inativo';
  end if;

  select count(*) into v_titulares_goleiro
  from match_players mp join players p on p.id = mp.player_id
  where mp.match_id = p_match_id and mp.status = 'confirmado' and mp.tipo_vaga = 'titular' and p.eh_goleiro;

  select count(*) into v_titulares_linha
  from match_players mp join players p on p.id = mp.player_id
  where mp.match_id = p_match_id and mp.status = 'confirmado' and mp.tipo_vaga = 'titular' and not p.eh_goleiro;

  if v_eh_goleiro then
    v_tipo_vaga := case when v_titulares_goleiro < 2 then 'titular' else 'suplente' end;
  else
    v_tipo_vaga := case when v_titulares_linha < 15 then 'titular' else 'suplente' end;
  end if;

  select coalesce(max(posicao_lista), 0) + 1 into v_next_pos from match_players where match_id = p_match_id;

  insert into match_players (match_id, player_id, posicao_lista, tipo_vaga, status)
  values (p_match_id, v_player_id, v_next_pos, v_tipo_vaga, 'confirmado')
  returning * into v_row;

  perform public.recalcular_valores(p_match_id);

  return v_row;
end;
$$;

-- Desiste da presença. Promove automaticamente o próximo suplente do mesmo
-- tipo (goleiro só é substituído por goleiro) quando quem desiste é titular.
create or replace function public.desistir_presenca(p_match_id uuid, p_player_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role user_role;
  v_caller_player_id uuid;
  v_player_id uuid;
  v_match_status status_lista;
  v_tipo_vaga tipo_vaga;
  v_eh_goleiro boolean;
  v_suplente_id uuid;
begin
  select role, player_id into v_caller_role, v_caller_player_id
  from profiles where id = auth.uid();

  if p_player_id is not null then
    if v_caller_role not in ('admin', 'moderator') then
      raise exception 'Sem permissão para retirar outro jogador da lista';
    end if;
    v_player_id := p_player_id;
  else
    if v_caller_player_id is null then
      raise exception 'Usuário não está vinculado a um jogador';
    end if;
    v_player_id := v_caller_player_id;
  end if;

  select status into v_match_status from matches where id = p_match_id for update;
  if v_match_status <> 'aberta' then
    raise exception 'A lista deste racha não está aberta';
  end if;

  select tipo_vaga, (select eh_goleiro from players where id = v_player_id)
  into v_tipo_vaga, v_eh_goleiro
  from match_players
  where match_id = p_match_id and player_id = v_player_id and status = 'confirmado';

  if not found then
    raise exception 'Jogador não está confirmado neste racha';
  end if;

  update match_players
  set status = 'cancelado'
  where match_id = p_match_id and player_id = v_player_id;

  if v_tipo_vaga = 'titular' then
    select mp.id into v_suplente_id
    from match_players mp
    join players p on p.id = mp.player_id
    where mp.match_id = p_match_id
      and mp.status = 'confirmado'
      and mp.tipo_vaga = 'suplente'
      and p.eh_goleiro = v_eh_goleiro
    order by mp.posicao_lista asc
    limit 1;

    if v_suplente_id is not null then
      update match_players set tipo_vaga = 'titular', promovido_em = now() where id = v_suplente_id;
    end if;
  end if;

  perform public.recalcular_valores(p_match_id);
end;
$$;

-- Finaliza a lista: congela o rateio (último recálculo) e bloqueia novas entradas.
create or replace function public.finalizar_lista(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select role from profiles where id = auth.uid()) not in ('admin', 'moderator') then
    raise exception 'Sem permissão para finalizar a lista';
  end if;

  perform public.recalcular_valores(p_match_id);

  update matches set status = 'finalizada' where id = p_match_id and status = 'aberta';
end;
$$;

-- Reabre a lista (somente admin — ver seção 21 da spec).
create or replace function public.reabrir_lista(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select role from profiles where id = auth.uid()) <> 'admin' then
    raise exception 'Somente o administrador pode reabrir a lista';
  end if;

  update matches set status = 'aberta' where id = p_match_id and status = 'finalizada';
end;
$$;

-- Fecha o período de ranking: agrega gols/assistências/presenças de todos os
-- rachas do período, calcula pontuação (pesos em sincronia com
-- lib/business/scoring.ts) e registra a premiação dos 3 primeiros.
create or replace function public.finalizar_ranking(p_ranking_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_data_inicio date;
  v_data_fim date;
  v_peso_gol numeric := 3;
  v_peso_assistencia numeric := 2;
  v_peso_presenca numeric := 1;
begin
  if (select role from profiles where id = auth.uid()) <> 'admin' then
    raise exception 'Somente o administrador pode finalizar o ranking';
  end if;

  select data_inicio, coalesce(data_fim, current_date) into v_data_inicio, v_data_fim
  from rankings where id = p_ranking_id;

  if v_data_inicio is null then
    raise exception 'Ranking não encontrado';
  end if;

  delete from ranking_results where ranking_id = p_ranking_id;

  insert into ranking_results (ranking_id, player_id, gols, assistencias, presencas, pontuacao)
  select
    p_ranking_id,
    mp.player_id,
    sum(mp.gols),
    sum(mp.assistencias),
    count(*) filter (where mp.presenca),
    sum(mp.gols) * v_peso_gol + sum(mp.assistencias) * v_peso_assistencia
      + count(*) filter (where mp.presenca) * v_peso_presenca
  from match_players mp
  join matches m on m.id = mp.match_id
  where mp.status = 'confirmado'
    and m.data between v_data_inicio and v_data_fim
  group by mp.player_id;

  update ranking_results r
  set posicao = ranked.posicao
  from (
    select id, row_number() over (order by pontuacao desc) as posicao
    from ranking_results where ranking_id = p_ranking_id
  ) ranked
  where r.id = ranked.id;

  update rankings set finalizado = true, data_fim = v_data_fim where id = p_ranking_id;

  insert into prizes (player_id, ranking_id, posicao, beneficio)
  select player_id, ranking_id, posicao, 'racha_gratis'
  from ranking_results
  where ranking_id = p_ranking_id and posicao between 1 and 3
  on conflict (player_id, ranking_id) do nothing;
end;
$$;

grant execute on function
  public.confirmar_presenca(uuid, uuid),
  public.desistir_presenca(uuid, uuid),
  public.finalizar_lista(uuid),
  public.reabrir_lista(uuid),
  public.finalizar_ranking(uuid)
to authenticated;
