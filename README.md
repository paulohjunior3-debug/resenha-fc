# Resenha F.C

App de gestão de racha de futebol: presença, suplentes, gols/assistências, ranking mensal, pódio, pagamentos e caixa.

Stack: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Supabase (Postgres/Auth/RLS) + PWA. Deploy pensado para Vercel + Supabase (planos gratuitos).

## 1. Configurar o Supabase

1. Crie um projeto gratuito em [supabase.com](https://supabase.com).
2. Em **SQL Editor**, rode os arquivos de `supabase/migrations/` **em ordem numérica** (0001, 0002, 0003, 0004) — cada um pode ser colado e executado separadamente.
3. Em **Project Settings > API**, copie a `Project URL`, a `anon public key` e a `service_role key`.
4. Copie `.env.example` para `.env.local` e preencha as três variáveis (a `service_role key` fica só no servidor — nunca commitar nem expor no client).

## 2. Rodar localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000 — você será redirecionado para `/login`.

## 3. Criar o primeiro administrador

Não existe autocadastro (spec: só admin cadastra jogadores/usuários). Rode uma vez:

```bash
node --env-file=.env.local scripts/create-admin.mjs "Seu Nome" "seuapelido"
```

Login inicial: apelido informado + senha `1234`. A partir daí, use a tela **Usuários** (`/admin/usuarios`) para cadastrar jogadores e moderadores — todos entram com a mesma senha padrão `1234`.

## 4. Deploy

- **Vercel**: importe o repositório, configure as 4 variáveis de ambiente (as 3 do Supabase + `AUTH_INTERNAL_EMAIL_DOMAIN`) no dashboard do projeto.
- **PWA**: manifest (`public/manifest.json`), ícones (`public/icons/`) e service worker (`public/sw.js`) já registrados em `src/app/layout.tsx`. Em produção (HTTPS), "Adicionar à tela inicial" funciona em Android (Chrome) e iOS (Safari).

## Decisões de arquitetura (pontos que a spec deixava em aberto)

- **Login por apelido**: Supabase Auth exige e-mail, então cada perfil recebe um e-mail interno sintético (`apelido@resenhafc.internal`, ver `lib/auth/roles.ts`). O jogador nunca vê isso — só digita nome/apelido e senha.
- **Rateio do racha**: valor total dividido dinamicamente pelo nº de jogadores de linha confirmados, recalculado a cada confirmação/desistência (`recalcular_valores` no banco). O valor por jogador é **congelado** só quando a lista é finalizada.
- **Fila e suplentes**: confirmar/desistir são funções Postgres `SECURITY DEFINER` (`confirmar_presenca`, `desistir_presenca`) para evitar condição de corrida quando duas pessoas confirmam ao mesmo tempo. Goleiro suplente só promove vaga de goleiro.
- **Pontuação e classificação F-A**: fórmulas centralizadas em `src/lib/business/scoring.ts` e `classification.ts` (pesos fáceis de ajustar). A função `finalizar_ranking` no banco replica os mesmos pesos — se mudar um lado, mudar o outro.

## Pendências registradas (decisões de negócio não especificadas na spec original)

- **Desistência após a lista finalizada**: hoje só é permitida com a lista `aberta`. Para casos após o fechamento, o admin usa "Reabrir lista" (spec seção 21) e finaliza de novo depois de ajustar.
- **Tela "Configurações" do admin**: citada na navegação (seção 17) mas sem conteúdo definido na spec — não foi criada para não inventar uma funcionalidade vazia. A fórmula de pontuação é fixa no código para o MVP, como a própria spec pede.
- **"Administração operacional" (nav do moderador)**: as ações operacionais (abrir/fechar lista, gols, pagamentos, caixa) já aparecem contextualmente nas telas Racha e Caixa quando o usuário é staff — não foi criada uma tela separada com esse nome.

## Status do MVP (fases da spec)

Concluído: Fundação (1), Usuários/Auth (2), Jogadores + habilidades + classificação (3), Racha/fila/suplentes/rateio (4), Registro de gols/assistências/pagamentos (5), Ranking + pódio + histórico (6), Premiação dos 3 primeiros (7), Caixa (8), Interface mobile-first com loading/empty states básicos (9).

Pendente antes de produção: revisar/ajustar telas com dados reais do grupo, gerar tipos do Supabase (`npx supabase gen types typescript`), testar o fluxo completo em campo por uma semana, e o deploy final (10) — criar projeto no Vercel e apontar o domínio.
