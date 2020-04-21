export function proposeTeam(G, ctx, team) {
    G.team = team;
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