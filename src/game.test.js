const Client = require('boardgame.io/client');
const Consts = require('./consts');
const Multiplayer = require('boardgame.io/multiplayer');
const ResistGame = require('./game');

const BASE_STATE = {
    roles: {
        'Player0': { faction: Consts.RESISTANCE },
        'Player1': { faction: Consts.Spy },
    },
    mission_results: [Consts.PASS, Consts.FAIL],
    vote_number: 3,
};

test('propose team', () => {
    const game = {
        ...ResistGame,
        //setup: () => BASE_STATE,
    };
    const client = Client.Client({
        game: game,
    });
    client.start();
    //client.events.setStage('proposeTeam');
    const { G, ctx } = client.store.getState();
    console.log(G);
    console.log(ctx);
    console.log(client);
    // client.moves.proposeTeam(['Player0', 'Player1']);
    // expect(G.value).toEqual('hello there');
});