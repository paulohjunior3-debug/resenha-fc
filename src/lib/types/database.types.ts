// Tipos manuais alinhados ao schema em supabase/migrations.
// Quando o projeto Supabase existir, substituir/gerar via:
//   npx supabase gen types typescript --project-id <id> > src/lib/types/database.types.ts

export type Role = "admin" | "moderator" | "player";
export type Posicao = "goleiro" | "zagueiro" | "meia" | "atacante";
export type Classificacao = "F" | "E" | "D" | "C" | "B" | "A";
export type StatusLista = "fechada" | "aberta" | "finalizada";
export type TipoVaga = "titular" | "suplente";
export type StatusConfirmacao = "confirmado" | "cancelado";
export type TipoTransacao = "entrada" | "saida";
export type Beneficio = "racha_gratis";

export interface Profile {
  id: string; // = auth.users.id
  nome: string;
  apelido: string;
  email_interno: string;
  role: Role;
  player_id: string | null;
  ativo: boolean;
  created_at: string;
}

export interface Player {
  id: string;
  nome: string;
  apelido: string;
  posicao: Posicao;
  eh_goleiro: boolean;
  ativo: boolean;
  classificacao: Classificacao;
  avatar_url: string | null;
  created_at: string;
}

export interface PlayerAttributes {
  player_id: string;
  drible: number;
  pe_direito: number;
  pe_esquerdo: number;
  zagueiro: number;
  meia: number;
  agilidade: number;
  velocidade: number;
  updated_at: string;
}

export interface Match {
  id: string;
  data: string;
  valor_total: number;
  status: StatusLista;
  created_by: string;
  created_at: string;
}

export interface MatchPlayer {
  id: string;
  match_id: string;
  player_id: string;
  posicao_lista: number;
  tipo_vaga: TipoVaga;
  status: StatusConfirmacao;
  confirmado_em: string;
  valor_devido: number | null;
  pagou: boolean;
  valor_pago: number | null;
  gols: number;
  assistencias: number;
  presenca: boolean;
  promovido_em: string | null;
}

export interface Ranking {
  id: string;
  periodo: string; // "YYYY-MM"
  data_inicio: string;
  data_fim: string | null;
  finalizado: boolean;
  created_at: string;
}

export interface RankingResult {
  id: string;
  ranking_id: string;
  player_id: string;
  gols: number;
  assistencias: number;
  presencas: number;
  pontuacao: number;
  posicao: number;
}

export interface Prize {
  id: string;
  player_id: string;
  ranking_id: string;
  posicao: number;
  beneficio: Beneficio;
  utilizado: boolean;
  data_utilizacao: string | null;
  created_at: string;
}

export interface CashTransaction {
  id: string;
  match_id: string | null;
  tipo: TipoTransacao;
  valor: number;
  descricao: string;
  created_by: string;
  created_at: string;
}

// Placeholder mínimo para o cliente supabase-js tipado.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
