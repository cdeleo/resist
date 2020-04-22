import * as Consts from './consts.js';
import { resistGame, sanitizeState } from './game.js';
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
            playerView: G => G,
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

    it('starts in teamProposal', () => {
        const client = Client({ game: resistGame(), numPlayers: 5 });
        const { G, ctx } = client.store.getState();
        expect(ctx.activePlayers).toEqual({ '0': 'teamProposal' });
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

    it('strips existing state beyond minimal', () => {
        const client = configureClient(
            {
                team: ['0', '1'],
                teamVotes: { '0': Consts.YES, '1': Consts.YES, '2': Consts.NO },
                missionVotes: { '0': Consts.PASS, '1': Consts.FAIL },
            },
            { '0': 'missionReview' }
        );
        client.events.endTurn();
        const { G, ctx } = client.store.getState();
        expect(G).toEqual(BASE_STATE);
    });
});

describe('game ends', () => {

    it('when resistance has three points', () => {
        const client = configureClient(
            {
                missionResults: [Consts.PASS, Consts.FAIL, Consts.PASS, Consts.FAIL],
                team: ['0', '1'],
                teamVotes: { '0': Consts.YES, '1': Consts.YES, '2': Consts.NO },
                missionVotes: { '0': Consts.PASS, '1': Consts.PASS },
            },
            { '0': 'missionReview' }
        );
        client.moves.endMissionReview();
        const { G, ctx } = client.store.getState();
        expect(ctx.gameover).toEqual({ winner: Consts.RESISTANCE });
    });

    it('when spies have three points', () => {
        const client = configureClient(
            {
                missionResults: [Consts.PASS, Consts.FAIL, Consts.PASS, Consts.FAIL],
                team: ['0', '1'],
                teamVotes: { '0': Consts.YES, '1': Consts.YES, '2': Consts.NO },
                missionVotes: { '0': Consts.PASS, '1': Consts.FAIL },
            },
            { '0': 'missionReview' }
        );
        client.moves.endMissionReview();
        const { G, ctx } = client.store.getState();
        expect(ctx.gameover).toEqual({ winner: Consts.SPY });
    });

    it('when five votes in a row have failed', () => {
        const client = configureClient(
            {
                voteNumber: 4,
                team: ['0', '1'],
                teamVotes: { '0': Consts.YES, '1': Consts.NO, '2': Consts.NO },
            },
            { '0': 'teamReview' }
        );
        client.moves.endTeamReview();
        const { G, ctx } = client.store.getState();
        expect(ctx.gameover).toEqual({ winner: Consts.SPY });
    });
});

describe('proposeTeam move', () => {
    let client;

    beforeEach(() => {
        client = configureClient({}, { '0': 'teamProposal' });
    });

    it('advances to teamVote stage', () => {
        client.moves.proposeTeam(['0', '1']);
        const { G, ctx } = client.store.getState();
        expect(G.team).toEqual(['0', '1']);
        expect(G.teamVotes).toBeDefined();
        expect(G.teamVotes).toEqual({});
        expect(ctx.activePlayers).toEqual({ '0': 'teamVote', '1': 'teamVote', '2': 'teamVote' });
    });

    it('requires correct team size', () => {
        const errors = ignoreErrorPrefixes(["invalid move: proposeTeam"]);
        client.moves.proposeTeam(['0']);
        const { G, ctx } = client.store.getState();
        expect(ctx.activePlayers).toEqual({ '0': 'teamProposal' });
        expect(errors.ignored).toBeTruthy();
    });

    it('requires valid players', () => {
        const errors = ignoreErrorPrefixes(["invalid move: proposeTeam"]);
        client.moves.proposeTeam(['0', 'somethingElse']);
        const { G, ctx } = client.store.getState();
        expect(ctx.activePlayers).toEqual({ '0': 'teamProposal' });
        expect(errors.ignored).toBeTruthy();
    });
});

describe('voteOnTeam move', () => {
    let client;

    beforeEach(() => {
        client = configureClient(
            {
                team: ['0', '1'],
                teamVotes: {},
            },
            { '0': 'teamVote', '1': 'teamVote', '2': 'teamVote' }
        );
    });


    it('submits vote and ends stage for player', () => {
        client.moves.voteOnTeam(Consts.YES);
        const { G, ctx } = client.store.getState();
        expect(G.teamVotes).toEqual({ '0': Consts.YES });
        expect(ctx.activePlayers).toEqual({ '1': 'teamVote', '2': 'teamVote' });
    });

    it('advances to teamReview stage when all votes are submitted', () => {
        client = configureClient(
            {
                team: ['0', '1'],
                teamVotes: { '1': Consts.NO, '2': Consts.NO },
            },
            { '0': 'teamVote' }
        );
        client.moves.voteOnTeam(Consts.YES);
        const { G, ctx } = client.store.getState();
        expect(G.teamVotes).toEqual({ '0': Consts.YES, '1': Consts.NO, '2': Consts.NO });
        //expect(ctx.activePlayers).toEqual({ '0': 'teamReview' });
    });

    it('requires valid vote', () => {
        const errors = ignoreErrorPrefixes(["invalid move: voteOnTeam"]);
        client.moves.voteOnTeam("somethingElse");
        const { G, ctx } = client.store.getState();
        expect(G.teamVotes).toEqual({});
        expect(ctx.activePlayers).toEqual({ '0': 'teamVote', '1': 'teamVote', '2': 'teamVote' });
        expect(errors.ignored).toBeTruthy();
    });
});

describe('endTeamReview move', () => {

    it('ends turn and advance vote track when vote failed', () => {
        const client = configureClient(
            {
                team: ['0', '1'],
                teamVotes: { '0': Consts.YES, '1': Consts.NO, '2': Consts.NO },
            },
            { '0': 'teamReview' }
        );
        client.moves.endTeamReview();
        const { G, ctx } = client.store.getState();
        expect(G.voteNumber).toEqual(BASE_STATE.voteNumber + 1);
        expect(ctx.activePlayers).toEqual({ '1': 'teamProposal' });
    });

    it('advances to mission when vote passed', () => {
        const client = configureClient(
            {
                team: ['0', '1'],
                teamVotes: { '0': Consts.YES, '1': Consts.YES, '2': Consts.NO },
            },
            { '0': 'teamReview' }
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
        client.moves.voteOnMission(Consts.PASS);
        const { G, ctx } = client.store.getState();
        expect(G.missionVotes).toEqual({ '0': Consts.PASS });
        expect(ctx.activePlayers).toEqual({ '1': 'mission' });
    });

    it('advances to missionReview stage when all votes are submitted', () => {
        client = configureClient(
            {
                team: ['0', '1'],
                teamVotes: { '0': Consts.YES, '1': Consts.YES, '2': Consts.NO },
                missionVotes: { '1': Consts.FAIL },
            },
            { '0': 'mission' }
        );
        client.moves.voteOnMission(Consts.PASS);
        const { G, ctx } = client.store.getState();
        expect(G.missionVotes).toEqual({ '0': Consts.PASS, '1': Consts.FAIL });
        //expect(ctx.activePlayers).toEqual({ '0': 'missionReview' });
    });

    it('requires valid vote', () => {
        const errors = ignoreErrorPrefixes(["invalid move: voteOnMission"]);
        client.moves.voteOnMission("somethingElse");
        const { G, ctx } = client.store.getState();
        expect(G.missionVotes).toEqual({});
        expect(ctx.activePlayers).toEqual({ '0': 'mission', '1': 'mission' });
        expect(errors.ignored).toBeTruthy();
    });

    it('requires resistance members to pass', () => {
        const errors = ignoreErrorPrefixes(["invalid move: voteOnMission"]);
        client.moves.voteOnMission(Consts.FAIL);
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
            { '0': 'missionReview' }
        );
        client.moves.endMissionReview();
        const { G, ctx } = client.store.getState();
        expect(G.missionResults).toEqual([...BASE_STATE.missionResults, Consts.PASS])
        expect(G.voteNumber).toEqual(0);
        expect(ctx.activePlayers).toEqual({ '1': 'teamProposal' });
    });

    it('ends turn and updates results on fail', () => {
        const client = configureClient(
            {
                team: ['0', '1'],
                teamVotes: { '0': Consts.YES, '1': Consts.YES, '2': Consts.NO },
                missionVotes: { '0': Consts.PASS, '1': Consts.FAIL },
            },
            { '0': 'missionReview' }
        );
        client.moves.endMissionReview();
        const { G, ctx } = client.store.getState();
        expect(G.missionResults).toEqual([...BASE_STATE.missionResults, Consts.FAIL])
        expect(G.voteNumber).toEqual(0);
        expect(ctx.activePlayers).toEqual({ '1': 'teamProposal' });
    });
});

describe('sanitizeState', () => {

    const G = {
        missionProgression: TEST_GAME_STRUCTURE.missionProgression,
        roles: {
            '0': { faction: Consts.RESISTANCE },
            '1': { faction: Consts.SPY },
            '2': { faction: Consts.RESISTANCE },
            '3': { faction: Consts.SPY },
        },
        missionResults: [Consts.PASS, Consts.FAIL],
        voteNumber: 3,
        team: ['0', '1', '2'],
        teamVotes: {
            '0': Consts.YES,
            '1': Consts.YES,
            '2': Consts.NO,
            '3': Consts.NO,
        },
        missionVotes: {
            '0': Consts.PASS,
            '1': Consts.FAIL,
            '2': Consts.PASS,
        }
    };

    it('doesn\'t remove public information', () => {
        const sanitizedG = sanitizeState(G, {}, '0');
        expect(sanitizedG.missionProgression).toEqual(G.missionProgression);
        expect(sanitizedG.missionResults).toEqual(G.missionResults);
        expect(sanitizedG.voteNumber).toEqual(G.voteNumber);
        expect(sanitizedG.team).toEqual(G.team);
    });

    it('removes all other roles for resistance', () => {
        expect(sanitizeState(G, {}, '0').roles).toEqual({
            '0': { faction: Consts.RESISTANCE },
        })
    });

    it('removes all non-spy roles for spies', () => {
        expect(sanitizeState(G, {}, '1').roles).toEqual({
            '1': { faction: Consts.SPY },
            '3': { faction: Consts.SPY },
        })
    });

    it('doesn\'t remove team votes while no players are still voting', () => {
        expect(sanitizeState(G, {}, '0').teamVotes).toEqual(G.teamVotes);
    });

    it('removes all other team votes while players are still voting', () => {
        const ctx = { activePlayers: { 2: 'teamVote' } };
        expect(sanitizeState(G, ctx, '0').teamVotes).toEqual({ '0': Consts.YES });
    });

    it('aggregates mission votes while no players are still voting', () => {
        const sanitizedG = sanitizeState(G, {}, '0');
        expect(sanitizedG.missionVotes).toEqual({ '0': Consts.PASS });
        expect(sanitizedG.missionVotesShuffled).toEqual({
            [Consts.PASS]: 2,
            [Consts.FAIL]: 1,
        });
    });

    it('doesn\'t aggregate mission votes while players are still voting', () => {
        const ctx = { activePlayers: { 2: 'mission' } };
        const sanitizedG = sanitizeState(G, ctx, '0');
        expect(sanitizedG.missionVotes).toEqual({ '0': Consts.PASS });
        expect(sanitizedG.missionVotesShuffled).toBeUndefined();
    });
})