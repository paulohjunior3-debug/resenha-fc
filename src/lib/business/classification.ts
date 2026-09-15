import type { Classificacao, PlayerAttributes } from "@/lib/types/database.types";

// Classificação geral F -> A com base na média dos atributos (0-100).
// Faixas centralizadas aqui; futuramente podem incorporar estatísticas reais
// de desempenho sem mudar a assinatura da função.
const FAIXAS: { minimo: number; classificacao: Classificacao }[] = [
  { minimo: 85, classificacao: "A" },
  { minimo: 70, classificacao: "B" },
  { minimo: 55, classificacao: "C" },
  { minimo: 40, classificacao: "D" },
  { minimo: 25, classificacao: "E" },
  { minimo: 0, classificacao: "F" },
];

export function calcularMediaAtributos(
  attrs: Pick<
    PlayerAttributes,
    "drible" | "pe_direito" | "pe_esquerdo" | "zagueiro" | "meia" | "agilidade" | "velocidade"
  >
): number {
  const valores = [
    attrs.drible,
    attrs.pe_direito,
    attrs.pe_esquerdo,
    attrs.zagueiro,
    attrs.meia,
    attrs.agilidade,
    attrs.velocidade,
  ];
  return valores.reduce((soma, v) => soma + v, 0) / valores.length;
}

export function calcularClassificacao(mediaAtributos: number): Classificacao {
  const faixa = FAIXAS.find((f) => mediaAtributos >= f.minimo);
  return faixa?.classificacao ?? "F";
}
