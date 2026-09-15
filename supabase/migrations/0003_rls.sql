-- Row Level Security. Regra geral: leitura ampla para autenticados (o app é
-- transparente sobre lista, ranking e caixa — ver spec seções 3.3, 8);
-- escrita restrita por role. Operações com regra de concorrência (fila de
-- confirmação) ficam só nas funções SECURITY DEFINER de 0002_functions.sql.

alter table players enable row level security;
alter table player_attributes enable row level security;
alter table profiles enable row level security;
alter table matches enable row level security;
alter table match_players enable row level security;
alter table rankings enable row level security;
alter table ranking_results enable row level security;
alter table prizes enable row level security;
alter table cash_transactions enable row level security;

-- profiles: cada um vê o próprio perfil; admin vê todos. Escrita apenas via
-- rota server-side com service role (cadastro de jogador/usuário cria
-- auth.users + profiles atomicamente) — sem policy de INSERT/UPDATE aqui.
create policy "profiles_select" on profiles for select
  using (id = auth.uid() or meu_role() = 'admin');

-- players: leitura para qualquer autenticado; escrita só admin.
create policy "players_select" on players for select
  using (auth.role() = 'authenticated');
create policy "players_write_admin" on players for all
  using (meu_role() = 'admin')
  with check (meu_role() = 'admin');

-- player_attributes: mesma regra de players.
create policy "player_attributes_select" on player_attributes for select
  using (auth.role() = 'authenticated');
create policy "player_attributes_write_admin" on player_attributes for all
  using (meu_role() = 'admin')
  with check (meu_role() = 'admin');

-- matches: leitura para todos; abrir/editar/finalizar por admin ou moderador.
create policy "matches_select" on matches for select
  using (auth.role() = 'authenticated');
create policy "matches_write_staff" on matches for all
  using (meu_role() in ('admin', 'moderator'))
  with check (meu_role() in ('admin', 'moderator'));

-- match_players: leitura para todos (lista de confirmados/suplentes é
-- pública dentro do app). Confirmar/desistir só via RPC (security definer).
-- Gols/assistências/pagamento são atualizados diretamente por admin/moderador.
create policy "match_players_select" on match_players for select
  using (auth.role() = 'authenticated');
create policy "match_players_update_staff" on match_players for update
  using (meu_role() in ('admin', 'moderator'))
  with check (meu_role() in ('admin', 'moderator'));

-- rankings: leitura para todos; abrir/finalizar só admin (RPC finalizar_ranking
-- cobre o "finalizar"; a criação do período é um INSERT simples do admin).
create policy "rankings_select" on rankings for select
  using (auth.role() = 'authenticated');
create policy "rankings_write_admin" on rankings for insert
  with check (meu_role() = 'admin');
create policy "rankings_update_admin" on rankings for update
  using (meu_role() = 'admin')
  with check (meu_role() = 'admin');

-- ranking_results: leitura para todos; escrita só via finalizar_ranking (RPC).
create policy "ranking_results_select" on ranking_results for select
  using (auth.role() = 'authenticated');

-- prizes: leitura para todos (jogador vê se ganhou benefício); marcar como
-- utilizado é uma ação operacional de admin/moderador.
create policy "prizes_select" on prizes for select
  using (auth.role() = 'authenticated');
create policy "prizes_update_staff" on prizes for update
  using (meu_role() in ('admin', 'moderator'))
  with check (meu_role() in ('admin', 'moderator'));

-- cash_transactions: leitura para todos (caixa transparente — spec seção 8);
-- lançamentos (hoje só entradas) por admin/moderador; sem update/delete
-- (histórico imutável).
create policy "cash_transactions_select" on cash_transactions for select
  using (auth.role() = 'authenticated');
create policy "cash_transactions_insert_staff" on cash_transactions for insert
  with check (meu_role() in ('admin', 'moderator'));
