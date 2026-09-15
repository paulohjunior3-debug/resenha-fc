// Fórmula de pontuação do ranking mensal — centralizada aqui para poder
// ajustar os pesos sem tocar no restante do sistema (server actions, RPCs, UI
// leem sempre por meio de calcularPontuacao).
//
// pontuacao = gols * PESO_GOL + assistencias * PESO_ASSISTENCIA + presencas * PESO_PRESENCA

export const SCORING_WEIGHTS = {
  gol: 3,
  assistencia: 2,
  presenca: 1,
} as const;

export interface EstatisticasJogador {
  gols: number;
  assistencias: number;
  presencas: number;
}

export function calcularPontuacao(stats: EstatisticasJogador): number {
  return (
    stats.gols * SCORING_WEIGHTS.gol +
    stats.assistencias * SCORING_WEIGHTS.assistencia +
    stats.presencas * SCORING_WEIGHTS.presenca
  );
}
