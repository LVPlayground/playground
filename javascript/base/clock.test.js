// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Clock from 'base/clock.js';

describe('Clock', it => {
    it('should share the current (monotonically increasing) time', assert => {
        const clock = new Clock();

        assert.closeTo(clock.currentTime(), Date.now(), 1000);
        assert.closeTo(clock.monotonicallyIncreasingTime(), highResolutionTime(), 1000);

        // Also test the mocked version installed for tests.
        assert.closeTo(server.clock.currentTime(), Date.now(), 1000);
        assert.closeTo(server.clock.monotonicallyIncreasingTime(), highResolutionTime(), 1000);
    });

    it('should enable advancing the current time for tests', assert => {
        assert.closeTo(server.clock.currentTime(), Date.now(), 1000);
        assert.closeTo(server.clock.monotonicallyIncreasingTime(), highResolutionTime(), 1000);

        const offset = 86400000;  // one day

        server.clock.advance(offset);

        assert.closeTo(server.clock.currentTime(), Date.now() + offset, 1000);
        assert.closeTo(
            server.clock.monotonicallyIncreasingTime(), highResolutionTime() + offset, 1000);
    });

    it('should throw when trying to decrease the current time', assert => {
        assert.throws(() => server.clock.advance());
        assert.throws(() => server.clock.advance(-42));
        assert.throws(() => server.clock.advance('yesterday'));
    });

    it('should allow mocking the wait() function in the code', async(assert) => {
        let resolved = false;

        const offset = 86400000;  // one day
        const waiter = wait(offset).then(() => resolved = true);

        assert.isFalse(resolved);

        server.clock.advance(offset);

        // Resolving promises is asynchronous, so it shouldn't have resolved yet.
        assert.isFalse(resolved);

        // Wait until the |waiter| is done. If this test takes more than a day to run, something
        // has gone wrong with the MockClock. Otherwise we're good.
        await waiter;
    });
});
