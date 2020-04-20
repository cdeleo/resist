const moves = require('./moves');

exports.ResistGame = {
    turn: {
        // activePlayers: {
        //     currentPlayer: 'proposeTeam',
        // },
        stages: {
            proposeTeam: {
                moves: { proposeTeam: moves.proposeTeam },
            },
            voteOnTeam: {
                moves: { teamVote: moves.teamVote },
            },
            reviewTeam: {
                moves: { continue: moves.continue },
            },
            mission: {
                moves: { missionVote: moves.missionVote },
            },
            reviewMission: {
                moves: { continue: moves.continue },
            },
        }
    }
};