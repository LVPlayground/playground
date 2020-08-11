// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Countdown } from 'features/games_vehicles/interface/countdown.js';

describe('Countdown', it => {
    it('should be able to safely run a countdown for a player', async (assert) => {
        const gunther = server.playerManager.getById(/* Gunther= */ 0);
        const originalTextDrawCount = server.textDrawManager.size;

        let shouldContinue = true;
        const promise = Countdown.displayForPlayer(gunther, 4, () => {
            return shouldContinue;
        });

        // TODO: Update this once Rectangle uses the new TextDraw system.
        assert.equal(server.textDrawManager.size, originalTextDrawCount + 2);

        // (1) Find the text draw that's the countdown's foreground element.
        const candidateTextDraws = [ ...server.textDrawManager ].filter(x => x.text === '4');
        assert.equal(candidateTextDraws.length, 1);

        const textDraw = candidateTextDraws[0];

        // (2) Make sure that it counts down once per second.
        await server.clock.advance(1000);
        assert.equal(textDraw.text, '3');

        await server.clock.advance(1000);
        assert.equal(textDraw.text, '2');

        // (3) When the validity function bails, it should stop immediately.
        shouldContinue = false;

        await server.clock.advance(1000);
        assert.equal(textDraw.text, '2');

        // (4) Now wait for the |promise| to resolve, for the system to clean itself up.
        await promise;

        assert.equal(server.textDrawManager.size, originalTextDrawCount);
    });
});
