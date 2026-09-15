import { Avatar } from "@/components/ui/avatar";

export interface PodiumEntry {
  apelido: string;
  avatarUrl: string | null;
  pontuacao: number;
}

const CONFIG = {
  1: { altura: "h-24", cor: "bg-gold", ordem: "order-2", tamanhoAvatar: 72 },
  2: { altura: "h-16", cor: "bg-silver", ordem: "order-1", tamanhoAvatar: 60 },
  3: { altura: "h-11", cor: "bg-bronze", ordem: "order-3", tamanhoAvatar: 60 },
} as const;

// Recebe até 3 posições (índice 0 = 1º lugar). Posições sem jogador ainda
// aparecem como "Vago" — o pódio existe visualmente antes de haver ranking
// fechado, e ganha as fotos reais assim que `finalizar_ranking` popular os dados.
export function Podium({ entradas }: { entradas: (PodiumEntry | null)[] }) {
  return (
    <div className="flex items-end justify-center gap-3 px-2 pt-6">
      {([1, 2, 3] as const).map((posicao) => {
        const entrada = entradas[posicao - 1] ?? null;
        const cfg = CONFIG[posicao];
        return (
          <div key={posicao} className={`flex flex-1 max-w-[110px] flex-col items-center ${cfg.ordem}`}>
            <div className="mb-2 rounded-full border-4 border-surface shadow-sm">
              <Avatar src={entrada?.avatarUrl} alt={entrada?.apelido ?? "Vago"} size={cfg.tamanhoAvatar} />
            </div>
            <p className="mb-0.5 max-w-full truncate text-center text-xs font-semibold">
              {entrada?.apelido ?? "Vago"}
            </p>
            <p className="mb-2 text-[11px] font-bold text-muted">
              {entrada ? `${entrada.pontuacao} pts` : "—"}
            </p>
            <div className={`flex w-full items-start justify-center rounded-t-lg pt-1.5 ${cfg.altura} ${cfg.cor}`}>
              <span className="text-lg font-extrabold text-white/90">{posicao}º</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
