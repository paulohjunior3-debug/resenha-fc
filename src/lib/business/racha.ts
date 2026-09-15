// Regras de vagas e rateio do racha — mantidas em sincronia com as
// constraints e funções em supabase/migrations. Usadas no client apenas para
// exibição otimista; a fonte da verdade é sempre o banco.

export const VAGAS_GOLEIRO = 2;
export const VAGAS_LINHA = 15;
export const VAGAS_TITULARES = VAGAS_GOLEIRO + VAGAS_LINHA;

/**
 * Valor que cada jogador de linha paga: valor total da quadra dividido pelo
 * número de jogadores de linha confirmados (titulares) no momento. Goleiros
 * nunca pagam. Recalculado a cada confirmação/desistência até a lista ser
 * finalizada, quando o valor é congelado por jogador.
 */
export function calcularValorPorJogadorDeLinha(
  valorTotal: number,
  jogadoresDeLinhaConfirmados: number
): number {
  if (jogadoresDeLinhaConfirmados <= 0) return 0;
  return valorTotal / jogadoresDeLinhaConfirmados;
}
