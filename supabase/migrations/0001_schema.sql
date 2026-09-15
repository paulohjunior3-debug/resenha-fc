-- Resenha F.C — schema inicial
-- Aplicar no SQL Editor do Supabase (ou via `supabase db push`) na ordem numérica dos arquivos.

create extension if not exists pgcrypto;

create type user_role as enum ('admin', 'moderator', 'player');
create type posicao_jogador as enum ('goleiro', 'zagueiro', 'meia', 'atacante');
create type classificacao_nivel as enum ('F', 'E', 'D', 'C', 'B', 'A');
create type status_lista as enum ('fechada', 'aberta', 'finalizada');
create type tipo_vaga as enum ('titular', 'suplente');
create type status_confirmacao as enum ('confirmado', 'cancelado');
create type tipo_transacao_caixa as enum ('entrada', 'saida');
create type beneficio_premiacao as enum ('racha_gratis');

-- Vagas por racha: 2 goleiros + 15 linha (regra de negócio fixa do MVP, ver seção 4 da spec).
create table players (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  apelido text not null unique,
  posicao posicao_jogador not null default 'meia',
  eh_goleiro boolean not null default false,
  ativo boolean not null default true,
  classificacao classificacao_nivel not null default 'F',
  avatar_url text,
  created_at timestamptz not null default now()
);

create table player_attributes (
  player_id uuid primary key references players(id) on delete cascade,
  drible smallint not null default 50 check (drible between 0 and 100),
  pe_direito smallint not null default 50 check (pe_direito between 0 and 100),
  pe_esquerdo smallint not null default 50 check (pe_esquerdo between 0 and 100),
  zagueiro smallint not null default 50 check (zagueiro between 0 and 100),
  meia smallint not null default 50 check (meia between 0 and 100),
  agilidade smallint not null default 50 check (agilidade between 0 and 100),
  velocidade smallint not null default 50 check (velocidade between 0 and 100),
  updated_at timestamptz not null default now()
);

-- Perfil de autenticação. id = auth.users.id. Login é feito por apelido; o
-- e-mail interno é sintético e nunca exposto na UI (ver lib/auth/roles.ts).
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  apelido text not null unique,
  email_interno text not null unique,
  role user_role not null default 'player',
  player_id uuid references players(id) on delete set null,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table matches (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  valor_total numeric(10, 2) not null default 0 check (valor_total >= 0),
  status status_lista not null default 'fechada',
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create table match_players (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  posicao_lista integer not null,
  tipo_vaga tipo_vaga not null,
  status status_confirmacao not null default 'confirmado',
  confirmado_em timestamptz not null default now(),
  -- Congelado apenas quando a lista é finalizada (rateio dinâmico até lá — ver recalcular_valores).
  valor_devido numeric(10, 2),
  pagou boolean not null default false,
  valor_pago numeric(10, 2),
  gols integer not null default 0 check (gols >= 0),
  assistencias integer not null default 0 check (assistencias >= 0),
  presenca boolean not null default true,
  promovido_em timestamptz,
  unique (match_id, player_id)
);

create index match_players_match_idx on match_players (match_id, status, tipo_vaga, posicao_lista);

create table rankings (
  id uuid primary key default gen_random_uuid(),
  periodo text not null unique, -- formato 'YYYY-MM'
  data_inicio date not null,
  data_fim date,
  finalizado boolean not null default false,
  created_at timestamptz not null default now()
);

create table ranking_results (
  id uuid primary key default gen_random_uuid(),
  ranking_id uuid not null references rankings(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  gols integer not null default 0,
  assistencias integer not null default 0,
  presencas integer not null default 0,
  pontuacao numeric(10, 2) not null default 0,
  posicao integer,
  unique (ranking_id, player_id)
);

create table prizes (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  ranking_id uuid not null references rankings(id) on delete cascade,
  posicao integer not null check (posicao between 1 and 3),
  beneficio beneficio_premiacao not null default 'racha_gratis',
  utilizado boolean not null default false,
  data_utilizacao timestamptz,
  created_at timestamptz not null default now(),
  unique (player_id, ranking_id)
);

create table cash_transactions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete set null,
  tipo tipo_transacao_caixa not null,
  valor numeric(10, 2) not null check (valor > 0),
  descricao text not null,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

-- Saldo do caixa como view (soma de entradas - saídas). security_invoker faz a
-- view respeitar a RLS da tabela base para quem consulta.
create view caixa_saldo with (security_invoker = true) as
  select coalesce(sum(case when tipo = 'entrada' then valor else -valor end), 0) as saldo
  from cash_transactions;
