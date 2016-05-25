// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Natives = require('natives.js');

describe('Natives', it => {
    it('should throw when providing an unknown native', assert => {
        assert.throws(() => provideNative('ThisNativeDoesNotExist', '', () => 42));
    });

    it('should throw when providing an invalid signature', assert => {
        assert.throws(() => provideNative('TestFunction', 'x'));
    });

    it('should ignore function calls with an invalid number of parameters', assert => {
        let counter = 0;

        provideNative('TestFunction', 'i', () => ++counter);

        assert.equal(pawnInvoke('TestFunction'), 0);
        assert.equal(counter, 0);
    });

    it('should be able to return a scalar number in a provided native', assert => {
        provideNative('TestFunction', '', () => 42);
        assert.equal(pawnInvoke('TestFunction'), 42);
    });

    it('should be able to receive scalar arguments', assert => {
        provideNative('TestFunction', 'i', value => 2 * value);

        assert.equal(pawnInvoke('TestFunction', 'i', 2), 4);
        assert.equal(pawnInvoke('TestFunction', 'i', -10), -20);

        provideNative('TestFunction', 'iiiii', (...params) => Math.max(...params));
        assert.equal(pawnInvoke('TestFunction', 'iiiii', 5, 4, 3, 10, 1), 10);

        provideNative('TestFunction', 'f', value => Math.round(value));

        assert.equal(pawnInvoke('TestFunction', 'f', 12.34), 12);
        assert.equal(pawnInvoke('TestFunction', 'f', -25.80), -26);

        provideNative('TestFunction', 'ffff', (...params) => Math.round(Math.min(...params)));
        assert.equal(pawnInvoke('TestFunction', 'ffff', 51.12, 15.551, 5.678, 951.51), 6);

        provideNative('TestFunction', 'iiff', (a, b, c, d) => {
            return a * c + b * d;
        });

        assert.equal(pawnInvoke('TestFunction', 'iiff', 5, 3, 10, 5), 5 * 10 + 3 * 5);
    });
});
