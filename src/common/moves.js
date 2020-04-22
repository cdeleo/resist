import * as Consts from './consts.js';

function currentMission(G) {
    return G.missionProgression[G.missionResults.length];
}

export function proposeTeam(G, ctx, team) {
    if (team.length != currentMission(G).size) {
        return INVALID_MOVE;
    }
    if (!team.every(playerID => playerID in ctx.playOrder)) {
        return INVALID_MOVE;
    }
    G.team = team;
    G.teamVotes = {};
    ctx.events.setActivePlayers({ all: 'voteOnTeam', next: { currentPlayer: 'teamReview' } });
}

export function teamVote(G, ctx, vote) {
    if (vote != Consts.YES && vote != Consts.NO) {
        return INVALID_MOVE;
    }
    G.teamVotes[ctx.playerID] = vote;
    ctx.events.endStage();
}

export function endTeamReview(G, ctx) {
    const nYes = Object.values(G.teamVotes).filter(vote => vote == Consts.YES).length;
    if (nYes > (ctx.playOrder.length - nYes)) {
        // Team vote passes
        G.missionVotes = {};
        const activePlayers = {};
        for (let playerID of G.team) {
            activePlayers[playerID] = 'mission';
        }
        ctx.events.setActivePlayers({ value: activePlayers, next: { currentPlayer: 'missionReview' } });
    } else {
        G.voteNumber++;
        ctx.events.endTurn();
    }
};

export function missionVote(G, ctx, vote) {
    if (vote != Consts.PASS && vote != Consts.FAIL) {
        return INVALID_MOVE;
    }
    if (G.roles[ctx.playerID].faction == Consts.RESISTANCE && vote == Consts.FAIL) {
        return INVALID_MOVE;
    }
    G.missionVotes[ctx.playerID] = vote;
    ctx.events.endStage();
}

export function endMissionReview(G, ctx) {
    const nFail = Object.values(G.missionVotes).filter(vote => vote == Consts.FAIL).length;
    G.missionResults.push(nFail > currentMission(G).allowedFails ? Consts.FAIL : Consts.PASS);
    G.voteNumber = 0;
    ctx.events.endTurn();
};
