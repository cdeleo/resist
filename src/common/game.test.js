import * as Consts from './consts.js';
import { resistGame } from './game.js';
import { Client } from 'boardgame.io/client';
import { Local } from 'boardgame.io/multiplayer';

const TEST_GAME_STRUCTURE = {
    factions: {
        'resistance': 1,
        'spy': 1,
    },
    missionProgression: [
        { size: 2, allowedFails: 0 },
        { size: 2, allowedFails: 0 },
        { size: 2, allowedFails: 0 },
    ],
}

const BASE_STATE = {
    missionProgression: TEST_GAME_STRUCTURE.missionProgression,
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
            ...resistGame({ 2: TEST_GAME_STRUCTURE }),
            setup: () => ({ ...BASE_STATE, ...extraState }),
        },
        multiplayer: Local(),
        playerID: '0',
        numPlayers: 2,
    });
    client.start();
    client.events.setActivePlayers({ value: initialPhases });
    return client;
}

function ignoreErrorPrefixes(prefixes) {
    const result = { ignored: false };
    console.error.mockImplementation((...args) => {
        if (args.some(arg => prefixes.some(prefix => arg.startsWith(prefix)))) {
            result.ignored = true;
        } else {
            console.log(args); console._error(...args);
        }
    });
    return result;
}

beforeEach(() => {
    ignoreErrorPrefixes([]);
});

describe('initial state', () => {

    it('starts in proposeTeam', () => {
        const client = Client({ game: resistGame(), numPlayers: 5 });
        const { G, ctx } = client.store.getState();
        expect(ctx.activePlayers).toEqual({ '0': 'proposeTeam' });
    });

    it('starts with minimal state', () => {
        const client = Client({ game: resistGame(), numPlayers: 5 });
        const { G, ctx } = client.store.getState();
        expect(G.missionProgression).toEqual(
            [
                { size: 2, allowedFails: 0 },
                { size: 3, allowedFails: 0 },
                { size: 2, allowedFails: 0 },
                { size: 3, allowedFails: 0 },
                { size: 3, allowedFails: 0 }
            ]);
        expect(Object.keys(G.roles)).toEqual(['0', '1', '2', '3', '4']);
        expect(Object.values(G.roles).map(role => role.faction).sort()).toEqual([
            Consts.RESISTANCE, Consts.RESISTANCE, Consts.RESISTANCE, Consts.SPY, Consts.SPY
        ]);
        expect(G.missionResults).toEqual([]);
        expect(G.voteNumber).toEqual(0);
    });
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
        const errors = ignoreErrorPrefixes(["invalid move: proposeTeam"]);
        client.moves.proposeTeam(['0']);
        const { G, ctx } = client.store.getState();
        expect(ctx.activePlayers).toEqual({ '0': 'proposeTeam' });
        expect(errors.ignored).toBeTruthy();
    });

    it('requires valid players', () => {
        const errors = ignoreErrorPrefixes(["invalid move: proposeTeam"]);
        client.moves.proposeTeam(['0', 'somethingElse']);
        const { G, ctx } = client.store.getState();
        expect(ctx.activePlayers).toEqual({ '0': 'proposeTeam' });
        expect(errors.ignored).toBeTruthy();
    });
});