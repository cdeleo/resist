import { INVALID_MOVE } from 'boardgame.io/core';

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
    ctx.events.setActivePlayers({ all: 'voteOnTeam' });
}

export function teamVote(G, ctx, vote) {
    G.teamVotes[ctx.currentPlayer] = vote;
}

export function missionVote(G, ctx, vote) {
    G.missionVotes[ctx.currentPlayer] = vote;
}

export function endReview(G, ctx) {
    ctx.endStage();
};