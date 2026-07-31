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

## Próximas decisões pendentes

- Lista de países a incluir na fase inicial (todos, ou um/alguns continentes primeiro).
- Estrutura do sistema de empresas/produção.
- Regras do mercado.
- Comportamento dos bots (económicos, militares, políticos).
- Sistema militar/guerra.
- Sistema político/eleições.
