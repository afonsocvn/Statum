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
- Sem taxas/impostos nas transações por agora.

## Próximas decisões pendentes

- Comportamento dos bots (económicos, militares, políticos).
- Sistema militar/guerra.
- Sistema político/eleições.
