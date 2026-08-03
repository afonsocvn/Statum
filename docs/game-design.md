# Statum — Regras do jogo (estado atual)

Este documento é a referência rápida do **estado atual** das regras do jogo, organizada por sistema. Ao contrário do `docs/decisions.md` (histórico cronológico de decisões, com datas e "porquês"), este ficheiro é atualizado sempre que uma regra muda, para refletir sempre o que está implementado agora. Em caso de dúvida ou contradição, o código é a fonte de verdade final; este documento é só um resumo para orientação rápida.

Inspiração de género: jogos tipo e-Sim/eRepublik/Politics & War. Só mecânicas de género são usadas como referência — todo o texto, nomes e números são originais.

## Stack

- Backend: Node.js + Express.
- Base de dados: SQLite (`src/db/schema.sql`).
- Frontend: server-rendered com EJS, HTML simples e semântico.
- **Idioma**: o jogo em si (tudo o que o jogador vê) está em inglês. A documentação interna (este ficheiro, `decisions.md`, `README.md`) está em português.

## Autenticação

- Registo com username + password (sem email, sem confirmação).
- Sessão em cookie (`express-session`).
- Passwords com hash `bcrypt`.

## Países

- 61 países jogáveis: Europa completa (exceto 5 microestados <100 mil habitantes) + top 10 por população na Ásia + top 10 por população nas Américas.
- Lista em `src/db/countries-data.js`.
- Cada país tem: nome, código (ISO-like), continente, população, tesouro do governo (`treasury`).

## Regiões

- Cada país tem 6 regiões: Capital + North/South/East/West/Central Region.
- Cada região tem um ou mais tipos de terreno: `naval`, `mountainous`, `terrestrial`, `desert` (separados por `;`). Dados em `src/db/region-terrain-data.js`, baseados em geografia real.
- Regiões podem mudar de país por conquista militar (ver secção Militar).
- **A semente de regiões só corre uma vez** (controlado por `schema_meta.regions_seeded`) — nunca reexecutar isto manualmente sem cuidado, ou corre o risco de repor conquistas.

## Cidadania

- Escolhida no registo (país obrigatório); região inicial é sempre a Capital, automática.
- Fixa — sem forma de mudar de país depois do registo.
- **A cidadania de um jogador nunca muda por conquista militar**, mesmo que a sua região "de origem" mude de país.

## Moeda

- **Gold**: moeda universal. Saldo inicial no registo: 5. Única forma de ganhar mais, por agora: câmbio no Mercado.
- **Moeda nacional**: uma por país, nome fictício `{País} Solis` (ex: "Portugal Solis"). Saldo inicial no registo: 100.
- Ideia futura (não implementada): moeda nacional ajustável pelo governo do país.

## Empresas / Produção

- 8 bens: 4 matérias-primas (Grain, Iron, Oil, Timber) + 4 bens de fábrica (Food, Weapons, Fuel, Furniture), mapeamento 1:1. Lista em `src/db/goods-data.js`.
- Fábricas **não consomem** a matéria-prima como input (ainda) — produzem diretamente do trabalho.
- Qualidade Q1-Q6 por empresa: produção por turno = Q × 10 unidades.
- Custo para criar empresa: **50 Gold + 50 moeda nacional** do dono.
- Custo de upgrade de qualidade: nível atual × 100 moeda nacional (Q1→Q2 = 100, etc.), até Q6.
- 1 vaga de trabalho por empresa. Trabalhador candidata-se; trabalha 1x/dia (cooldown 24h), recebe salário (fixo, definido pelo dono na criação), produção acumula no inventário da empresa.
- Empresa só pode ser criada no país de cidadania do dono, em qualquer uma das 6 regiões.
- Sem limite ao número de empresas por jogador. Um jogador só pode ter 1 emprego ativo.

## Mercado

- Um mercado por país, negociado na moeda nacional desse país.
- Listagens simples (preço fixo definido pelo vendedor, compra imediata — sem livro de ordens).
- **Só cidadãos do país podem comprar/vender** nesse mercado (limitação atual, até existirem carteiras multi-moeda).
- Vendas de bens: 5% de imposto, sai do vendedor, vai para `countries.treasury`. Câmbio de Gold não tem imposto.
- Câmbio de Gold ↔ moeda nacional: só numa direção (vender Gold por moeda nacional).
- Bens comprados vão para o inventário pessoal do comprador (`user_inventory`), que também guarda a qualidade (Q) do bem.
- Ideia futura (não implementada): países aliados partilharem 1 mercado único.

## Bots

- **Económicos** (implementados): 1 bot por país (`bot_{código}`), 1 empresa cada, trabalha 1x/dia via tarefa periódica no servidor, vende a produção no mercado do seu país a preço fixo (`BASE_PRICES` em `src/lib/bots.js`).
- **Militares e políticos**: só ideia, não implementados — dependem dos respetivos sistemas.

## Militar

- **Perícias**: Naval, Mountainous, Terrestrial, Desert. Ação "Treinar" 1x/dia (cooldown 24h) dá 5 pontos para distribuir livremente.
- **Vida**: 100 HP máximo. Cada hit custa 10 HP (até 10 hits com vida cheia). Comer Food restaura 20 HP.
- **Armas**: bónus de dano por qualidade, +25% por nível de Q (Q1=+25% … Q6=+150%).
- **Rank militar**: cresce com o dano total acumulado (`users.total_damage`); dá um bónus % ao dano (Recruit 0% → Major +12%, tabela em `src/lib/military.js`).
- **Fórmula de dano por hit**: `10 (base) + perícia_relevante × (1 + bónus_terreno)`, depois aplicado o multiplicador da arma e do rank. Bónus de terreno: naval/mountainous/desert = +30%, terrestrial = +10%. Se a região tiver vários terrenos, usa-se o que der mais dano.
- **Miss/crítico**: 10% de falha (0 dano), 15% de crítico (x2 dano).
- **Guerra**: por agora só o **Admin** pode declarar (regra temporária até existir Presidente/Congresso). Sem custo em Gold aplicado nesta fase.
- **Batalha**: por região. 8 rondas de 2h; ganha quem vencer 5 rondas primeiro. Ronda ganha-se por quem causar mais dano nela. Empate 4-4 ao fim de 8 rondas → prolongamento de 3 rondas de 1h, ganha quem vencer 2 dessas 3.
- **Conquista**: vencer a batalha transfere a região para o país vencedor (região é renomeada para `{Nome} ({País original})`); as empresas nessa região mudam de país. Cidadania dos jogadores nunca muda.
- Avanço de rondas corre numa tarefa periódica no servidor (a cada minuto).

## Político / Eleições

- Ainda não implementado. Vai substituir a regra temporária de "Admin declara guerra" por Presidente + Congresso, e introduzir os custos em Gold para guerra (50) e batalha sem guerra declarada (100).

## Infraestrutura de fundo

- Tarefas periódicas no processo do servidor (`src/server.js`): bots económicos (`BOT_TICK_INTERVAL_MS`, omissão 1h) e avanço de rondas de batalha (`BATTLE_TICK_INTERVAL_MS`, omissão 1min).
- Admin: definido por variável de ambiente `ADMIN_USERNAME` no arranque do servidor (atribui `is_admin=1` a esse username, se existir).
