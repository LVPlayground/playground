// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Natives = require('natives.js');

describe('Natives', it => {
    it('should throw when providing an unknown native', assert => {
        assert.throws(() => provideNative('ThisNativeDoesNotExist', '', () => 42));
    });

    it('should be possible to listen to simple zero-argument natives', assert => {
        let counter = 0;

        provideNative('TestFunction', '', () => ++counter);

        assert.equal(pawnInvoke('TestFunction'), 1);
        assert.equal(counter, 1);
    });

    it('should be able to return a scalar number in a provided native', assert => {
        provideNative('TestFunction', '', () => 42);
        assert.equal(pawnInvoke('TestFunction'), 42);
    });
});
