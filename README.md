# Statum

Jogo web multiplayer de simulação geopolítica e económica, inspirado nas *mecânicas* de género de jogos como e-Sim, eRepublik ou Politics & War (economia entre países, empresas, mercado, política, guerra). Não copia código, texto, imagens ou base de dados de nenhum jogo existente — apenas o conceito de género, reimplementado do zero com regras próprias.

## Stack

- Backend: Node.js + Express
- Base de dados: SQLite (desenvolvimento)
- Frontend: server-rendered com EJS, HTML simples e semântico

## Desenvolvimento

```bash
npm install
npm run dev
```

O servidor arranca em `http://localhost:3000`.

## Estado do projeto

Ver [docs/decisions.md](docs/decisions.md) para o histórico de decisões tomadas ao longo do desenvolvimento.

Este projeto é desenvolvido de forma incremental: um sistema de cada vez, com confirmação do dono do projeto antes de avançar para o próximo.
