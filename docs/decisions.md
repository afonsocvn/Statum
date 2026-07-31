# Histórico de decisões — Statum

Este ficheiro regista decisões importantes tomadas ao longo do desenvolvimento, para não se perder o histórico.

## 2026-07-31 — Decisões iniciais de stack e modo de trabalho

- Backend: Node.js + Express.
- Base de dados: SQLite para desenvolvimento (possível migração futura para Postgres).
- Frontend: server-rendered com EJS, HTML simples e semântico, sem estilos complexos (design visual final será feito à parte). Sem framework de frontend pesado (React, etc.) por agora.
- Inspiração de género: jogos tipo e-Sim/eRepublik/Politics & War — apenas mecânicas de género (economia entre países, empresas, mercado, política, guerra), reimplementadas do zero. Sem cópia de código, texto, imagens ou base de dados de jogos existentes.
- Modo de trabalho: desenvolvimento incremental e conversacional — um sistema de cada vez, com confirmação antes de avançar. Nenhuma decisão de design de jogo é assumida sem perguntar primeiro ao dono do projeto.

## 2026-07-31 — Sistema de autenticação

- Login com username + password (sem email).
- Sem confirmação de email por agora — conta fica ativa logo após o registo.
- Sessão guardada no servidor com cookie (`express-session`), não JWT.
- Registo pede apenas username e password, sem campos adicionais por agora.
- Passwords guardadas com hash `bcrypt`.

## 2026-07-31 — Países

- Europa: todos os países, exceto os 5 microestados com população abaixo de ~100 mil (Vaticano, Mónaco, San Marino, Liechtenstein, Andorra).
- Ásia: top 10 países por população (China, Índia, Indonésia, Paquistão, Bangladesh, Japão, Filipinas, Vietname, Irão, Turquia).
- Américas: top 10 países por população (EUA, Brasil, México, Colômbia, Argentina, Canadá, Peru, Venezuela, Chile, Equador).
- Total: 61 países jogáveis. Lista completa em `src/db/countries-data.js`.
- Ainda sem ligação a utilizadores (cidadania) nem a nenhuma mecânica de jogo — só a lista de referência por agora.

## 2026-07-31 — Regiões

- Cada país tem 6 regiões: Capital + Região Norte/Sul/Este/Oeste/Central.
- Nomes num esquema genérico, igual para todos os países (não são divisões administrativas reais), para evitar erros de geografia real e trabalho de pesquisa por país.
- Por agora só têm nome e se são capital — sem recursos naturais nem outros dados de jogo associados.
- Pré-requisito identificado para: cidadania (próximo passo), depois moeda, depois empresas/produção (nível "completo" estilo e-Sim, com Q1-Q5 e múltiplos recursos — a desenhar em detalhe nesse passo).

## 2026-07-31 — Cidadania

- País de cidadania escolhido no próprio formulário de registo (obrigatório).
- Região inicial é sempre a Capital do país escolhido, atribuída automaticamente (sem escolha manual).
- Cidadania fixa por agora — sem funcionalidade para mudar de país depois do registo.

## Próximas decisões pendentes

- Moeda simples do jogo.
- Estrutura do sistema de empresas/produção (Q1-Q5, múltiplos recursos).
- Regras do mercado.
- Comportamento dos bots (económicos, militares, políticos).
- Sistema militar/guerra.
- Sistema político/eleições.
