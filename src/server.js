require('dotenv').config();
const app = require('./app');
const db = require('./db');
const { runBotTick } = require('./lib/bots');
const { runBattleTick } = require('./lib/battle-tick');

const PORT = process.env.PORT || 3000;
const BOT_TICK_INTERVAL_MS = Number(process.env.BOT_TICK_INTERVAL_MS) || 60 * 60 * 1000;
const BATTLE_TICK_INTERVAL_MS = Number(process.env.BATTLE_TICK_INTERVAL_MS) || 60 * 1000;

app.listen(PORT, () => {
  console.log(`Statum a correr em http://localhost:${PORT}`);
});

runBotTick(db);
setInterval(() => runBotTick(db), BOT_TICK_INTERVAL_MS);

setInterval(() => runBattleTick(db), BATTLE_TICK_INTERVAL_MS);
