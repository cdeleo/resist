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

function resetState(G) {
    return {
        missionProgression: G.missionProgression,
        roles: G.roles,
        missionResults: G.missionResults,
        voteNumber: G.voteNumber,
    };
}

function determineWinner(G) {
    const nPass = G.missionResults.filter(result => result == Consts.PASS).length;
    if (nPass == 3) {
        return { winner: Consts.RESISTANCE };
    }
    if ((G.missionResults.length - nPass) == 3) {
        return { winner: Consts.SPY };
    }
    if (G.voteNumber > 4) {
        return { winner: Consts.SPY };
    }
}

function sanitizeMap(map, predicate) {
    if (!map) {
        return map;
    }
    const sanitizedMap = {}
    for (let [targetID, data] of Object.entries(map)) {
        if (predicate(targetID)) {
            sanitizedMap[targetID] = data;
        }
    }
    return sanitizedMap;
}

function isPlayerASpy(playerID, G) {
    return G && G.roles && G.roles[playerID] && G.roles[playerID].faction == Consts.SPY;
}

function isRoleVisible(viewerID, targetID, G) {
    if (viewerID == targetID) {
        return true;
    }
    if (isPlayerASpy(viewerID, G) && isPlayerASpy(targetID, G)) {
        return true;
    }
    return false;
}

function isAnyPlayerInStage(stage, ctx) {
    if (!ctx.activePlayers) {
        return false;
    }
    return Object.values(ctx.activePlayers).some(playerStage => playerStage == stage);
}

function aggregateMissionVotes(missionVotes) {
    const missionVotesShuffled = {};
    for (let missionVote of Object.values(missionVotes)) {
        missionVotesShuffled[missionVote] = (missionVotesShuffled[missionVote] || 0) + 1;
    }
    return missionVotesShuffled;
}

export function sanitizeState(G, ctx, playerID) {
    const sanitizedG = {
        missionProgression: G.missionProgression,
        roles: sanitizeMap(G.roles, targetID => isRoleVisible(playerID, targetID, G)),
        missionResults: G.missionResults,
        voteNumber: G.voteNumber,
        team: G.team,
        teamVotes: isAnyPlayerInStage('teamVote', ctx) ?
            sanitizeMap(G.teamVotes, targetID => targetID == playerID) : G.teamVotes,
        missionVotes: sanitizeMap(G.missionVotes, targetID => targetID == playerID),
        missionVotesShuffled: G.missionVotesShuffled,
    };
    if (G.missionVotes && !G.missionVotesShuffled && !isAnyPlayerInStage('mission', ctx)) {
        sanitizedG.missionVotesShuffled = aggregateMissionVotes(G.missionVotes);
    }
    return sanitizedG;
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
        playerView: sanitizeState,
        turn: {
            onEnd: resetState,
            activePlayers: {
                currentPlayer: 'teamProposal',
            },
            stages: {
                teamProposal: {
                    moves: { proposeTeam: Moves.proposeTeam },
                },
                teamVote: {
                    moves: { voteOnTeam: { move: Moves.voteOnTeam, client: false } },
                },
                teamReview: {
                    moves: { endTeamReview: Moves.endTeamReview },
                },
                mission: {
                    moves: { voteOnMission: { move: Moves.voteOnMission, client: false } },
                },
                missionReview: {
                    moves: { endMissionReview: Moves.endMissionReview },
                },
            }
        },
        endIf: determineWinner,
    };
};
