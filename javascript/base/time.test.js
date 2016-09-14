// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('Time', it => {
    it('should add code sugar for millisecond waits', async(assert) => {
        let invoked = false;

        (async() => {
            await milliseconds(1000);
            invoked = true;
        })();

        assert.isFalse(invoked);
        await server.clock.advance(900);
        assert.isFalse(invoked);
        await server.clock.advance(100);
        assert.isTrue(invoked);
    });

    it('should add code sugar for seconds waits', async(assert) => {
        let invoked = false;

        (async() => {
            await seconds(30);
            invoked = true;
        })();

        assert.isFalse(invoked);
        await server.clock.advance(28 * 1000);
        assert.isFalse(invoked);
        await server.clock.advance(2 * 1000);
        assert.isTrue(invoked);
    });

    it('should add code sugar for minutes waits', async(assert) => {
        let invoked = false;

        (async() => {
            await minutes(15);
            invoked = true;
        })();

        assert.isFalse(invoked);
        await server.clock.advance(13 * 60 * 1000);
        assert.isFalse(invoked);
        await server.clock.advance(2 * 60 * 1000);
        assert.isTrue(invoked);
    });

    it('should add code sugar for hours waits', async(assert) => {
        let invoked = false;

        (async() => {
            await hours(6);
            invoked = true;
        })();

        assert.isFalse(invoked);
        await server.clock.advance(4 * 60 * 60 * 1000);
        assert.isFalse(invoked);
        await server.clock.advance(2 * 60 * 60 * 1000);
        assert.isTrue(invoked);
    });
});

