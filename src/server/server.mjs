import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import { resistGame } from '../common/game.js';
const Server = require('boardgame.io/server').Server;

const server = Server({
    games: [resistGame()],
});

const PORT = process.env.PORT || 8080
server.run(process.env.PORT, () => console.log("bgio server running..."));