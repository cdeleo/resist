exports.proposeTeam = (G, ctx, team) => {
    G.team = team;
};

exports.teamVote = (G, ctx, vote) => {
    G.teamVotes[ctx.currentPlayer] = vote;
};

exports.missionVote = (G, ctx, vote) => {
    G.missionVotes[ctx.currentPlayer] = vote;
};

exports.continue = (G, ctx) => {
    ctx.endStage();
}