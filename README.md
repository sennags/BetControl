# BetControl

BetControl é um app web simples para acompanhar banca, surebets, freebets e gastos ligados às apostas.

## Conceito

O objetivo do app é centralizar o controle financeiro das operações de aposta em uma interface leve, baseada em HTML, CSS e JavaScript, com persistência local no navegador.

## Funcionalidades principais

- cadastro e acompanhamento de **surebets**
- cadastro e acompanhamento de **freebets**
- cálculo automático de **stake** e **profit** por casa
- marcação de casas ganhadoras para finalizar bets
- edição de apostas abertas
- descrição para surebets e freebets
- checkbox de foco para freebets
- histórico de apostas concluídas
- visão resumida de ganhos, perdas e movimentações
- cadastro de **gastos** e **lucrinho**
- análise mensal dos resultados
- backup manual (.json) e backup automático diário
- persistência dos dados via **localStorage**

## Estrutura atual

- `index.html` — interface principal
- `style.css` — estilos da aplicação
- `app.js` — lógica principal de renderização e persistência
- `src/` — módulos organizados:
  - `config/storage.js` — persistência e backup
  - `domain/` — lógica de negócio (bets, bankroll, calculations, history)
  - `ui/` — componentes de interface (bet-cards, bet-forms, bootstrap, expenses)
  - `utils/` — funções utilitárias

## Como usar

1. Abra o `index.html` no navegador.
2. Cadastre surebets, freebets e lançamentos.
3. Finalize as bets para enviar os resultados ao histórico.

## Observação

O projeto está em evolução e vem recebendo ajustes contínuos na lógica de surebet, freebet, histórico e resumo financeiro.
