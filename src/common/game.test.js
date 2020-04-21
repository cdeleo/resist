import { ResistGame } from './game.js';
import { Client } from 'boardgame.io/client';

test('starts in proposeTeam', () => {
    const client = Client({ game: ResistGame });
    const { G, ctx } = client.store.getState();
    expect(ctx.activePlayers).toEqual({ '0': 'proposeTeam' });
});