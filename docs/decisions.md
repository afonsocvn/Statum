# Histórico de decisões — Statum

Este ficheiro regista decisões importantes tomadas ao longo do desenvolvimento, para não se perder o histórico (é um registo cronológico, por ordem de quando foi decidido).

Para o estado **atual** das regras do jogo, organizado por sistema (não por data), ver [`docs/game-design.md`](game-design.md).

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

## 2026-07-31 — Idioma do jogo

- O jogo (tudo o que o jogador vê: páginas, mensagens de erro, nomes de países/regiões/moedas) passa a ser todo em inglês a partir de agora.
- Este ficheiro (`docs/decisions.md`) e o `README.md` mantêm-se em português — são documentação interna nossa, não fazem parte do jogo.
- Os nomes de países e regiões guardados na base de dados foram traduzidos para inglês (ex: "Alemanha" → "Germany", "Região Norte" → "North Region").

## 2026-07-31 — Moeda

- Duas moedas: **Gold** (universal, ainda sem forma de obter) e uma **moeda nacional por país** (ex: "Portugal Solis", "Brazil Solis").
- Moeda nacional com nomes fictícios, esquema sistemático `{Nome do país} Solis` — não usa nomes de moedas reais.
- Saldo inicial no registo: 5 Gold, 100 na moeda nacional do país escolhido.
- Sem forma de ganhar Gold ainda — os 5 iniciais não chegam para criar uma empresa (custa 50 Gold), fica assim até existir uma forma de ganhar Gold (ex: Mercado ou outro sistema futuro).
- Ideia registada para o futuro: a moeda nacional de cada país poderá vir a ser ajustável pelo governo desse país (sistema político, ainda por desenhar).
- Saldos visíveis na barra de navegação.

## 2026-07-31 — Empresas/Produção

Decididas contigo:
- 4 matérias-primas: Grain, Iron, Oil, Timber.
- Q1-Q6 (não Q1-Q5): o nível de qualidade da fábrica define quantas unidades cada trabalhador produz por turno.
- Trabalho: uma ação de trabalho por dia (cooldown de 24h) por trabalhador.
- Dono cria a empresa e contrata trabalhadores; trabalhadores candidatam-se a vagas abertas.

Assumidas por mim (números concretos de balanceamento, a ajustar quando quiseres):
- Cada matéria-prima tem um produto de fábrica correspondente (1:1): Grain→Food, Iron→Weapons, Oil→Fuel, Timber→Furniture. Lista em `src/db/goods-data.js`.
- Fábricas ainda **não consomem** a matéria-prima como input — produzem diretamente do trabalho, sem depender de comprar a matéria-prima a outra empresa. Essa dependência real só faz sentido quando existir Mercado (para comprar/vender entre empresas); por agora é só uma distinção cosmética (raw vs factory).
- Produção por turno = nível de qualidade × 10 unidades (Q1 = 10, Q6 = 60).
- Custo para criar uma empresa: 50 Gold + 50 na moeda nacional do dono (atualizado depois de decisão explícita — inicialmente tinha implementado só moeda nacional).
- Custo de upgrade de qualidade: nível atual × 100 na moeda nacional do dono (Q1→Q2 = 100, Q2→Q3 = 200, etc.).
- Cada empresa tem exatamente 1 vaga de trabalho (não várias) — simplificação para esta primeira versão; pode expandir-se depois.
- Empresa só pode ser criada num país igual à cidadania do dono (mas em qualquer uma das 6 regiões desse país).
- Salário definido pelo dono na criação da empresa, fixo (sem opção de alterar depois, por agora).
- Um jogador só pode ter 1 emprego ativo ao mesmo tempo (em qualquer empresa).
- Sem limite ao número de empresas que um jogador pode possuir.

## 2026-07-31 — Mercado

Decididas contigo:
- Mercado por país (não global), negociado na moeda nacional desse país.
- Listagens simples: vendedor define preço/quantidade, comprador compra na hora ao preço listado (sem livro de ordens).
- Inclui câmbio de Gold ↔ moeda nacional — por agora é a única forma de obter Gold no jogo.
- Ideia registada para o futuro: possibilidade de países aliados partilharem um único mercado em vez de terem mercados separados — depende de um sistema de alianças/diplomacia que ainda não existe. Não implementado agora.

Assumidas por mim:
- **Só cidadãos do país podem comprar/vender nesse mercado** (por agora). Isto evita ter de construir carteiras multi-moeda (cada jogador só tem 1 saldo de moeda nacional, o do seu próprio país). Jogadores de outros países podem ver a lista mas não negociar. Vai ser preciso revisitar isto para permitir comércio entre países.
- Vendedor lista bens a partir do inventário de uma das suas próprias empresas nesse país; a quantidade é retirada do inventário da empresa no momento da criação do anúncio (não só quando vende).
- Câmbio de Gold: só existe uma direção por agora — vender Gold por moeda nacional. Quem quer comprar Gold compra a um destes anúncios; ainda não há anúncios do tipo "quero comprar Gold oferecendo moeda nacional".
- Bens comprados vão para um novo "inventário pessoal" do comprador (`user_inventory`), separado do inventário das empresas.

## 2026-07-31 — Imposto sobre vendas

- 5% de imposto sobre vendas de bens no mercado, vai diretamente para o tesouro do governo do país (`countries.treasury`, na moeda nacional desse país).
- Aplica-se só a bens, não ao câmbio de Gold.
- Sai do vendedor: comprador paga o preço listado; vendedor recebe 95%; o governo recebe os 5% restantes. Preço que o comprador vê/paga não muda.
- Tesouro visível na página do país e na página do mercado desse país.
- Sem forma de gastar o tesouro ainda — isso deverá vir com o sistema político (governo poder ajustar taxas, gastar o tesouro, etc.).

## 2026-07-31 — Bots

Decidido contigo: implementar só os bots económicos agora (sistemas militar e político ainda não existem). Discutimos os 3 tipos, os outros dois ficam só como ideia registada para quando os respetivos sistemas existirem:

- **Bots militares (futuro, não implementado)**: ideia — países/facções controladas por bots que dão aos jogadores algo para combater mesmo sem inimigos reais suficientes, e/ou garantem que países inativos não ficam totalmente indefesos numa guerra.
- **Bots políticos (futuro, não implementado)**: ideia — candidatos NPC que se candidatam a eleições quando não há candidatos reais suficientes, para nenhum país ficar sem governo.

Bots económicos (implementados):
- 1 bot por país (61 no total), nome `bot_{código}` (ex: `bot_PT`), assinalado com `users.is_bot`.
- Cada bot tem exatamente 1 empresa (bem atribuído por rotação simples entre os 8 bens), Q1, salário 0 (dono e trabalhador são o mesmo).
- Bots começam com 1000 Gold + 1000 moeda nacional (dados diretamente na criação, não passam pelo registo normal) — só para poderem ter a sua empresa.
- Mecanismo: tarefa periódica no processo do servidor (`setInterval`, a cada 1h por omissão, configurável via `BOT_TICK_INTERVAL_MS`), mais uma execução imediata no arranque. Cada bot só trabalha de facto 1x/dia, tal como jogadores reais (mesma regra de cooldown).
- Depois de trabalhar, o bot lista toda a produção no mercado do seu país a um preço fixo por bem (`BASE_PRICES` em `src/lib/bots.js`) — números assumidos por mim, ajustáveis.
- Bots aparecem nas listagens de Empresas e Mercado como qualquer jogador, com a etiqueta "(bot)" a seguir ao nome.
- Não conseguem fazer login (password_hash não é uma password válida).

## 2026-07-31 — Sistema militar: treino e perícias

- **Treino e perícias**: tabela `user_skills` (naval, mountainous, terrestrial, desert, unspent_points, last_trained_at).
- Ação "Treinar" (`/training/train`) 1x/dia (cooldown 24h, igual ao trabalho), dá 5 pontos não distribuídos por treino.
- Alocação livre dos pontos pelas 4 perícias (`/training/allocate`), validada para não exceder os pontos disponíveis.

## 2026-07-31 — Terreno das regiões

- Pedi-te uma folha Excel com as 366 regiões para preencheres o terreno (naval, mountainous, terrestrial, desert; uma região pode ter vários, separados por `;`) com base em geografia real.
- **Encontrei um problema nos dados devolvidos**: 38 países ficaram sem nenhuma região naval, incluindo arquipélagos e países com costa enorme (Japão, Indonésia, Filipinas, China, Índia, EUA, Brasil, Canadá, Chile, Malta, Chipre, Rússia, Ucrânia, Estónia, Letónia, Lituânia, entre outros) — a ferramenta usada só tratou bem alguns casos europeus óbvios.
- Corrigi eu próprio 26 desses países (adicionei `naval` às regiões plausíveis, com base em conhecimento geográfico geral, sem inventar geografia). Ficam só sem naval os 12 países genuinamente sem litoral (Áustria, Bielorrússia, Bósnia, Chéquia, Hungria, Kosovo, Luxemburgo, Moldávia, Macedónia do Norte, Sérvia, Eslováquia, Suíça) — correto.
- Dados finais em `src/db/region-terrain-data.js`, importados para `regions.terrain` no arranque da base de dados.

## 2026-07-31 — Guerras e batalhas

Decidido contigo:
- Guerras conquistam território de verdade: a região passa a pertencer ao país vencedor. Cidadania dos jogadores nunca muda; as empresas nessa região mudam de país (passam a usar a moeda/impostos do novo país automaticamente, porque são calculados a partir do país atual da empresa).
- Guerra só pode ser declarada pelo Admin por agora (regra temporária até existir Presidente/Congresso — sem custo em Gold aplicado nesta fase temporária, já que não há um "presidente" a pagar).
- Vida: 100 HP máximo, cada hit custa 10 HP (10 hits possíveis com vida cheia). Comer Food restaura 20 HP (até ao máximo).
- Armas: bónus de dano por qualidade — +25% por nível de Q (Q1=+25%, Q2=+50%, Q3=+75%, ..., Q6=+150%), consistente com a escala Q1-Q6 já usada nas empresas. Passei a guardar a qualidade dos bens no inventário/anúncios do mercado (antes só a quantidade era guardada).
- Opções de ataque: 1, 5 ou 10 hits de cada vez (consumindo a vida correspondente).
- Perícias por terreno: dano = 10 (base) + perícia relevante × (1 + bónus do terreno). Bónus assumidos por mim: naval/mountainous/desert = +30%, terrestrial = +10% (terreno "genérico", por isso bónus menor). Se a região tiver vários tipos de terreno, usa-se o que der mais dano.
- Miss/crítico: 10% de hipótese de falhar (0 dano), 15% de hipótese de crítico (x2 dano) — números assumidos por mim.
- Rank militar: cresce com o dano total acumulado ao longo do tempo (`users.total_damage`), dá um pequeno bónus % ao dano (Recruit 0% → Major +12%, tabela em `src/lib/military.js`) — thresholds assumidos por mim.
- Rondas: 8 rondas de 2h cada; quem ganhar 5 rondas primeiro ganha a batalha. Ganha a ronda quem causar mais dano nela. Se chegar a 4-4 ao fim das 8 rondas, entra-se em prolongamento: 3 rondas de 1h, ganha quem vencer 2 dessas 3.
- Avanço de rondas e resolução de batalhas corre numa tarefa periódica no servidor (a cada minuto, verifica se alguma ronda já demorou o tempo suficiente).
- **Bug encontrado e corrigido durante os testes**: a rotina que garante que cada país tem as suas 6 regiões corria em todos os arranques do servidor, o que "repunha" uma região conquistada ao dono original (porque deixava de encontrar uma região com o nome/país originais). Corrigido para só semear as regiões uma única vez (controlado por uma flag em `schema_meta`). Testado com reinício do servidor a confirmar que a conquista persiste.
- Testado: guerra, abertura de batalha, ataque (com e sem arma), gasto/recuperação de vida, validações de erro, avanço de rondas, vitória, conquista de região (incluindo mudança de país de uma empresa lá localizada).

## Próximas decisões pendentes

- Substituir a regra temporária de guerra (Admin) por Presidente + Congresso, e aplicar os custos em Gold (50 para declarar guerra, 100 para abrir batalha sem guerra declarada) a essa altura.
- Sistema político/eleições.
