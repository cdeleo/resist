import * as Consts from './consts.js';
import * as Moves from './moves.js';

export const GAME_STRUCTURE_MAP = {
    5: {
        factions: {
            [Consts.RESISTANCE]: 3,
            [Consts.SPY]: 2,
        },
        missionProgression: [
            { size: 2, allowedFails: 0 },
            { size: 3, allowedFails: 0 },
            { size: 2, allowedFails: 0 },
            { size: 3, allowedFails: 0 },
            { size: 3, allowedFails: 0 },
        ],
    },
    6: {
        factions: {
            [Consts.RESISTANCE]: 4,
            [Consts.SPY]: 2,
        },
        missionProgression: [
            { size: 2, allowedFails: 0 },
            { size: 3, allowedFails: 0 },
            { size: 4, allowedFails: 0 },
            { size: 3, allowedFails: 0 },
            { size: 4, allowedFails: 0 },
        ],
    },
    7: {
        factions: {
            [Consts.RESISTANCE]: 4,
            [Consts.SPY]: 3,
        },
        missionProgression: [
            { size: 2, allowedFails: 0 },
            { size: 3, allowedFails: 0 },
            { size: 3, allowedFails: 0 },
            { size: 4, allowedFails: 1 },
            { size: 4, allowedFails: 0 },
        ],
    },
    8: {
        factions: {
            [Consts.RESISTANCE]: 5,
            [Consts.SPY]: 3,
        },
        missionProgression: [
            { size: 3, allowedFails: 0 },
            { size: 4, allowedFails: 0 },
            { size: 4, allowedFails: 0 },
            { size: 5, allowedFails: 1 },
            { size: 5, allowedFails: 0 },
        ],
    },
    9: {
        factions: {
            [Consts.RESISTANCE]: 6,
            [Consts.SPY]: 3,
        },
        missionProgression: [
            { size: 3, allowedFails: 0 },
            { size: 4, allowedFails: 0 },
            { size: 4, allowedFails: 0 },
            { size: 5, allowedFails: 1 },
            { size: 5, allowedFails: 0 },
        ],
    },
    10: {
        factions: {
            [Consts.RESISTANCE]: 6,
            [Consts.SPY]: 4,
        },
        missionProgression: [
            { size: 3, allowedFails: 0 },
            { size: 4, allowedFails: 0 },
            { size: 4, allowedFails: 0 },
            { size: 5, allowedFails: 1 },
            { size: 5, allowedFails: 0 },
        ],
    },
};

function fillFactionList(factions) {
    return [
        ...Array(factions[Consts.RESISTANCE]).fill(Consts.RESISTANCE),
        ...Array(factions[Consts.SPY]).fill(Consts.SPY),
    ];
}

export function resistGame(gameStructureMap = GAME_STRUCTURE_MAP) {
    return {
        setup(ctx) {
            const gameStructure = gameStructureMap[ctx.playOrder.length];
            const factions = ctx.random.Shuffle(fillFactionList(gameStructure.factions));
            const roles = {};
            for (let i = 0; i < factions.length; i++) {
                roles[ctx.playOrder[i]] = { faction: factions[i] };
            }
            return {
                missionProgression: gameStructure.missionProgression,
                roles,
                missionResults: [],
                voteNumber: 0,
            };
        },
        turn: {
            activePlayers: {
                currentPlayer: 'proposeTeam',
            },
            stages: {
                proposeTeam: {
                    moves: { proposeTeam: Moves.proposeTeam },
                },
                voteOnTeam: {
                    moves: { teamVote: Moves.teamVote },
                },
                reviewTeam: {
                    moves: { endTeamReview: Moves.endTeamReview },
                },
                mission: {
                    moves: { missionVote: Moves.missionVote },
                },
                reviewMission: {
                    moves: { endMissionReview: Moves.endMissionReview },
                },
            }
        }
    };
};
