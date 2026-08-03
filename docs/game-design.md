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
- **Guerra**: só o **General** de um país pode declarar guerra e abrir batalhas em nome desse país (ver secção Político). O Admin mantém-se como capacidade extra de recurso (`/admin/wars`), sem custo em Gold aplicado.
- **Batalha**: por região. 8 rondas de 2h; ganha quem vencer 5 rondas primeiro. Ronda ganha-se por quem causar mais dano nela. Empate 4-4 ao fim de 8 rondas → prolongamento de 3 rondas de 1h, ganha quem vencer 2 dessas 3.
- **Conquista**: vencer a batalha transfere a região para o país vencedor (região é renomeada para `{Nome} ({País original})`); as empresas nessa região mudam de país. Cidadania dos jogadores nunca muda.
- Avanço de rondas corre numa tarefa periódica no servidor (a cada minuto).

## Político / Eleições

- **Cargos**: Presidente (1 por país) + Congresso. Assentos do Congresso = máximo(5, nº de regiões que o país possui atualmente) — nunca menos de 5, mesmo com 0 territórios ("governo em exílio").
- **Eleições**: voto de todos os cidadãos do país (sem distinção de região/território — os territórios só contam para o nº de assentos). Ganham os mais votados; empates resolvidos por `total_damage` (XP), maior ganha.
- **Ciclo do Presidente**: mandato de 1 mês (mês de calendário real). Candidatura nos últimos 3 dias do mês. Eleição no último dia do mês. Mandato novo começa no dia 1.
- **Ciclo do Congresso**: mesmo formato, a meio do mês — candidatura dias 12-14, eleição dia 15, mandato começa dia 16.
- **Candidatura**: qualquer cidadão pode candidatar-se (Presidente ou Congresso), custa 20 Gold.
- **Presidente eleito**: ganha acesso ao tesouro do governo (`countries.treasury`, `countries.president_user_id`).
- **Cargos especiais** (General, Finance Minister, Secretary of State): o Presidente propõe **qualquer cidadão** (não precisa de já ser congressista) para um destes cargos; precisa de aprovação por maioria simples do Congresso atual (mais de metade dos assentos ativos). Se o nomeado já for congressista, o lugar dele é só atualizado com o título; se não for, ganha um lugar extra "a atuar como congressista" (conta para votos futuros de nomeação, por exemplo).
  - **General**: único que pode declarar guerra e abrir batalhas em nome do país.
  - **Finance Minister**: único que pode "imprimir" moeda nacional (adiciona diretamente ao tesouro do governo).
  - **Secretary of State**: torna-se "diplomata", ficaria responsável por propor alianças internacionais — só o título está implementado, o sistema de alianças em si não existe ainda.
- Avanço das eleições corre numa tarefa periódica no servidor (verifica a data real do calendário).

## Infraestrutura de fundo

- Tarefas periódicas no processo do servidor (`src/server.js`): bots económicos (`BOT_TICK_INTERVAL_MS`, omissão 1h), avanço de rondas de batalha (`BATTLE_TICK_INTERVAL_MS`, omissão 1min), e apuramento de eleições (`ELECTION_TICK_INTERVAL_MS`, omissão 1h).
- Admin: definido por variável de ambiente `ADMIN_USERNAME` no arranque do servidor (atribui `is_admin=1` a esse username, se existir).
