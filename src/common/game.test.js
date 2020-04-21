import * as Consts from './consts.js';
import { ResistGame } from './game.js';
import { Client } from 'boardgame.io/client';
import { Local } from 'boardgame.io/multiplayer';

const BASE_STATE = {
    missionProgression: [
        { size: 2, allowedFails: 0 },
        { size: 2, allowedFails: 0 },
        { size: 2, allowedFails: 0 },
    ],
    roles: {
        '0': { faction: Consts.RESISTANCE },
        '1': { faction: Consts.SPY },
    },
    missionResults: [Consts.PASS, Consts.FAIL],
    voteNumber: 3,
};

function configureClient(extraState, initialPhases) {
    const client = Client({
        game: {
            ...ResistGame,
            setup: ctx => ({ ...BASE_STATE, ...extraState }),
        },
        multiplayer: Local(),
        playerID: '0',
    });
    client.start();
    client.events.setActivePlayers({ value: initialPhases });
    return client;
}

test('turn starts in proposeTeam', () => {
    const client = Client({ game: ResistGame });
    const { G, ctx } = client.store.getState();
    expect(ctx.activePlayers).toEqual({ '0': 'proposeTeam' });
});

describe('proposeTeam move', () => {
    let client;

    beforeEach(() => {
        client = configureClient({}, { '0': 'proposeTeam' });
    });

    it('advances to voteOnTeam stage', () => {
        client.moves.proposeTeam(['0', '1']);
        const { G, ctx } = client.store.getState();
        expect(G.team).toEqual(['0', '1']);
        expect(ctx.activePlayers).toEqual({ '0': 'voteOnTeam', '1': 'voteOnTeam' });
    });

    it('requires correct team size', () => {
        client.moves.proposeTeam(['0']);
        const { G, ctx } = client.store.getState();
        expect(ctx.activePlayers).toEqual({ '0': 'proposeTeam' });
    });

    it('requires valid players', () => {
        client.moves.proposeTeam(['0', 'somethingElse']);
        const { G, ctx } = client.store.getState();
        expect(ctx.activePlayers).toEqual({ '0': 'proposeTeam' });
    });
});