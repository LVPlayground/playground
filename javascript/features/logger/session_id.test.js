// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const SessionId = require('features/logger/session_id.js');

describe('SessionId', it => {
    // Returns the current timestamp in seconds since the Unix epoch.
    const currentTime = () => Math.round(server.clock.currentTime() / 1000);

    it('increments when handing out duplicated ids', assert => {
        const sessionId = new SessionId();

        const time = currentTime();

        const firstSession = sessionId.generate();
        const secondSession = sessionId.generate();
        const thirdSession = sessionId.generate();

        assert.notEqual(firstSession, secondSession);
        assert.notEqual(firstSession, thirdSession);
        assert.notEqual(secondSession, thirdSession);

        assert.closeTo(firstSession, time, 1 /* delta */);
        assert.closeTo(secondSession, time + 1, 1 /* delta */);
        assert.closeTo(thirdSession, time + 2, 1 /* delta */);
    });

    it('maintains accuracy when duplication is no longer necessary', async(assert) => {
        const sessionId = new SessionId();

        const time = currentTime();

        for (let i = 0; i < 120 /* 2 minutes */; ++i)
            assert.closeTo(sessionId.generate(), time + i, 1 /* delta */);

        await server.clock.advance(180000 /* 3 minutes */);

        assert.closeTo(sessionId.generate(), currentTime(), 1 /* delta */);
    });
});
