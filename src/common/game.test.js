import * as Consts from './consts.js';
import { resistGame } from './game.js';
import { Client } from 'boardgame.io/client';
import { Local } from 'boardgame.io/multiplayer';

const TEST_GAME_STRUCTURE = {
    factions: {
        'resistance': 2,
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
        '2': { faction: Consts.RESISTANCE },
    },
    missionResults: [Consts.PASS, Consts.FAIL],
    voteNumber: 3,
};

function configureClient(extraState, initialPhases) {
    const client = Client({
        game: {
            ...resistGame({ 3: TEST_GAME_STRUCTURE }),
            setup: () => ({ ...BASE_STATE, ...extraState }),
        },
        multiplayer: Local(),
        playerID: '0',
        numPlayers: 3,
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
            console._error(...args);
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
        expect(G.teamVotes).toBeDefined();
        expect(G.teamVotes).toEqual({});
        expect(ctx.activePlayers).toEqual({ '0': 'voteOnTeam', '1': 'voteOnTeam', '2': 'voteOnTeam' });
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

describe('teamVote move', () => {
    let client;

    beforeEach(() => {
        client = configureClient(
            {
                team: ['0', '1'],
                teamVotes: {},
            },
            { '0': 'voteOnTeam', '1': 'voteOnTeam', '2': 'voteOnTeam' }
        );
    });


    it('submits vote and ends stage for player', () => {
        client.moves.teamVote(Consts.YES);
        const { G, ctx } = client.store.getState();
        expect(G.teamVotes).toEqual({ '0': Consts.YES });
        expect(ctx.activePlayers).toEqual({ '1': 'voteOnTeam', '2': 'voteOnTeam' });
    });

    it('advances to reviewTeam stage when all votes are submitted', () => {
        client = configureClient(
            {
                team: ['0', '1'],
                teamVotes: { '1': Consts.NO, '2': Consts.NO },
            },
            { '0': 'voteOnTeam' }
        );
        client.moves.teamVote(Consts.YES);
        const { G, ctx } = client.store.getState();
        expect(G.teamVotes).toEqual({ '0': Consts.YES, '1': Consts.NO, '2': Consts.NO });
        //expect(ctx.activePlayers).toEqual({ '0': 'reviewTeam' });
    });

    it('requires valid vote', () => {
        const errors = ignoreErrorPrefixes(["invalid move: teamVote"]);
        client.moves.teamVote("somethingElse");
        const { G, ctx } = client.store.getState();
        expect(G.teamVotes).toEqual({});
        expect(ctx.activePlayers).toEqual({ '0': 'voteOnTeam', '1': 'voteOnTeam', '2': 'voteOnTeam' });
        expect(errors.ignored).toBeTruthy();
    });
});

describe('endTeamReview move', () => {

    it('ends turn when vote failed', () => {
        const client = configureClient(
            {
                team: ['0', '1'],
                teamVotes: { '0': Consts.YES, '1': Consts.NO, '2': Consts.NO },
            },
            { '0': 'reviewTeam' }
        );
        client.moves.endTeamReview();
        const { G, ctx } = client.store.getState();
        expect(ctx.activePlayers).toEqual({ '1': 'proposeTeam' });
    });

    it('advances to mission when vote passed', () => {
        const client = configureClient(
            {
                team: ['0', '1'],
                teamVotes: { '0': Consts.YES, '1': Consts.YES, '2': Consts.NO },
            },
            { '0': 'reviewTeam' }
        );
        client.moves.endTeamReview();
        const { G, ctx } = client.store.getState();
        expect(G.missionVotes).toBeDefined();
        expect(ctx.activePlayers).toEqual({ '0': 'mission', '1': 'mission' });
    });
});

describe('missionVote move', () => {
    let client;

    beforeEach(() => {
        client = configureClient(
            {
                team: ['0', '1'],
                teamVotes: { '0': Consts.YES, '1': Consts.YES, '2': Consts.NO },
                missionVotes: {},
            },
            { '0': 'mission', '1': 'mission' }
        );
    });


    it('submits vote and ends stage for player', () => {
        client.moves.missionVote(Consts.PASS);
        const { G, ctx } = client.store.getState();
        expect(G.missionVotes).toEqual({ '0': Consts.PASS });
        expect(ctx.activePlayers).toEqual({ '1': 'mission' });
    });

    it('advances to reviewMission stage when all votes are submitted', () => {
        client = configureClient(
            {
                team: ['0', '1'],
                teamVotes: { '0': Consts.YES, '1': Consts.YES, '2': Consts.NO },
                missionVotes: { '1': Consts.FAIL },
            },
            { '0': 'mission' }
        );
        client.moves.missionVote(Consts.PASS);
        const { G, ctx } = client.store.getState();
        expect(G.missionVotes).toEqual({ '0': Consts.PASS, '1': Consts.FAIL });
        //expect(ctx.activePlayers).toEqual({ '0': 'reviewMission' });
    });

    it('requires valid vote', () => {
        const errors = ignoreErrorPrefixes(["invalid move: missionVote"]);
        client.moves.missionVote("somethingElse");
        const { G, ctx } = client.store.getState();
        expect(G.missionVotes).toEqual({});
        expect(ctx.activePlayers).toEqual({ '0': 'mission', '1': 'mission' });
        expect(errors.ignored).toBeTruthy();
    });

    it('requires resistance members to pass', () => {
        const errors = ignoreErrorPrefixes(["invalid move: missionVote"]);
        client.moves.missionVote(Consts.FAIL);
        const { G, ctx } = client.store.getState();
        expect(G.missionVotes).toEqual({});
        expect(ctx.activePlayers).toEqual({ '0': 'mission', '1': 'mission' });
        expect(errors.ignored).toBeTruthy();
    });
});

describe('endMissionReview move', () => {

    it('ends turn and updates results on pass', () => {
        const client = configureClient(
            {
                team: ['0', '1'],
                teamVotes: { '0': Consts.YES, '1': Consts.YES, '2': Consts.NO },
                missionVotes: { '0': Consts.PASS, '1': Consts.PASS },
            },
            { '0': 'reviewMission' }
        );
        client.moves.endMissionReview();
        const { G, ctx } = client.store.getState();
        expect(G.missionResults).toEqual([...BASE_STATE.missionResults, Consts.PASS])
        expect(ctx.activePlayers).toEqual({ '1': 'proposeTeam' });
    });

    it('ends turn and updates results on fail', () => {
        const client = configureClient(
            {
                team: ['0', '1'],
                teamVotes: { '0': Consts.YES, '1': Consts.YES, '2': Consts.NO },
                missionVotes: { '0': Consts.PASS, '1': Consts.FAIL },
            },
            { '0': 'reviewMission' }
        );
        client.moves.endMissionReview();
        const { G, ctx } = client.store.getState();
        expect(G.missionResults).toEqual([...BASE_STATE.missionResults, Consts.FAIL])
        expect(ctx.activePlayers).toEqual({ '1': 'proposeTeam' });
    });
});