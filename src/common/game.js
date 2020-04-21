import * as Moves from './moves.js';

export const ResistGame = {
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
                moves: { endReview: Moves.endReview },
            },
            mission: {
                moves: { missionVote: Moves.missionVote },
            },
            reviewMission: {
                moves: { endReview: Moves.endReview },
            },
        }
    }
};