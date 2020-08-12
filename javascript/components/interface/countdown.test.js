// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Countdown } from 'components/interface/countdown.js';

describe('Countdown', it => {
    it('should be able to progress canonical countdown elements', async (assert) => {
        const gunther = server.playerManager.getById(/* Gunther= */ 0);

        const countdown = new Countdown({ seconds: 60 });
        const promise = countdown.finished;

        countdown.displayForPlayer(gunther);

        // (1) Start a countdown and expect the text draw to be created.
        const candidates = [ ...server.textDrawManager ].filter(x => x.text === '1:00');
        assert.equal(candidates.length, 1);

        const textDraw = candidates[0];

        // (2) Expect the remaining time to have updated after waiting for a second.
        await server.clock.advance(1000);

        assert.equal(textDraw.text, '59');
        assert.equal(textDraw.backgroundColor.r, 0);  // no urgency

        // (3) Fast-forward to having 31 seconds left.
        for (let second = 59; second > 31; --second)
            await server.clock.advance(1000);

        assert.equal(textDraw.text, '31');
        assert.equal(textDraw.backgroundColor.r, 0);  // no urgency
        assert.isNull(gunther.soundIdForTesting);

        // (4) Move to 30 seconds. The background should change and a tick should be heard.
        await server.clock.advance(1000);

        assert.equal(textDraw.text, '30');
        assert.equal(textDraw.backgroundColor.r, 48);  // highlighted
        assert.equal(gunther.soundIdForTesting, 1056);

        gunther.soundIdForTesting = null;

        // (5) Fast-forward to having 11 seconds left.
        for (let second = 30; second > 11; --second)
            await server.clock.advance(1000);

        assert.equal(textDraw.text, '11');
        assert.equal(textDraw.backgroundColor.r, 48);  // highlighted
        assert.isNull(gunther.soundIdForTesting);

        // (6) Fast-forward to having 10 seconds left. The background should change again to flag
        // the increasing urgency, together with a tick sound being played.
        await server.clock.advance(1000);

        assert.equal(textDraw.text, '10');
        assert.equal(textDraw.backgroundColor.r, 128);  // urgent
        assert.equal(gunther.soundIdForTesting, 1056);

        gunther.soundIdForTesting = null;

        // (7) Fast-forward to having one second left.
        for (let second = 10; second > 1; --second)
            await server.clock.advance(1000);

        assert.equal(textDraw.text, '1');
        assert.equal(textDraw.backgroundColor.r, 128);  // urgent
        assert.equal(gunther.soundIdForTesting, 1056);

        // (8) One more second. The text should now change to "FINISHED", and wait one more second.
        await server.clock.advance(1000);

        assert.equal(textDraw.text, 'FINISHED');
        assert.equal(textDraw.backgroundColor.r, 128);  // urgent
        assert.equal(gunther.soundIdForTesting, 1057);  // finished beep

        gunther.soundIdForTesting = null;

        // (9) After FINISHED has displayed, the countdown should finish, settle the promise and
        // destroy itself & all visual elements.
        await server.clock.advance(1000);
        await promise;

        assert.isFalse(textDraw.isConnected());
    });
});
