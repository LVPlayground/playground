// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import MockPawnInvoke from 'base/test/mock_pawn_invoke.js';

describe('Natives', (it, beforeEach) => {
    // This suite tests the provideNative() functionality to expects the real pawnInvoke() function.
    beforeEach(() => MockPawnInvoke.getInstance().disable());

    try {
        provideNative();
    } catch (e) {
        if (e.message.includes('in the test runner'))
            return;  // the Natives functionality is not available in the test runner.
    }

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

    it('should be able to receive string arguments', assert => {
        let name = null;

        provideNative('TestFunction', 's', value => name = value);

        assert.equal(pawnInvoke('TestFunction', 's', 'Russell'), 1);
        assert.isNotNull(name);
        assert.equal(name, 'Russell');

        let sentence = null;

        provideNative('TestFunction', 'sisfs', (...args) => sentence = args.join(' '));

        assert.equal(pawnInvoke('TestFunction', 'sisfs', 'foo', 5, 'bar', 11.5, 'baz'), 1);
        assert.isNotNull(sentence);
        assert.equal(sentence, 'foo 5 bar 11.5 baz');
    });

    it('should be able to handle strings of up to 2047 characters', assert => {
        const longText = '1'.repeat(2047);

        let receivedText = '';

        provideNative('TestFunction', 's', value => receivedText = value);

        assert.equal(pawnInvoke('TestFunction', 's', longText), 1);
        assert.equal(receivedText, longText);
    });

    it('should fail when not enough values have been returned for the references', assert => {
        provideNative('TestFunction', 'I', _ => null);
        assert.equal(pawnInvoke('TestFunction', 'I'), -1);

        provideNative('TestFunction', 'I', _ => [ ]);
        assert.equal(pawnInvoke('TestFunction', 'I'), -1);

        provideNative('TestFunction', 'II', _ => [ 5 ]);
        assert.equal(pawnInvoke('TestFunction', 'II'), -1);
    });

    it('should be able to return scalar values by reference', assert => {
        provideNative('TestFunction', 'iII', value => [2 * value, 4 * value]);
        assert.deepEqual(pawnInvoke('TestFunction', 'iII', 2), [4, 8]);

        provideNative('TestFunction', 'isfFI', (i, s, f) => {
            return [f * i, parseInt(s, 16)];
        });

        assert.deepEqual(pawnInvoke('TestFunction', 'isfFI', 3, 'FF', 1.25), [3.75, 255]);
    });

    it('should be able to return strings by reference', assert => {
        provideNative('TestFunction', 'iiS', (value, maxLength) => {
            return [maxLength + '---' + value];
        });

        assert.equal(pawnInvoke('TestFunction', 'iiS', 42, 1337), '1337---42');

        provideNative('TestFunction', 'S', _ => ['Russell']);
        assert.equal(pawnInvoke('TestFunction', 'S'), 'Russell');

        provideNative('TestFunction', 'S', _ => ['']);
        assert.equal(pawnInvoke('TestFunction', 'S'), '');

        provideNative('TestFunction', 'S', _ => [null]);
        assert.equal(pawnInvoke('TestFunction', 'S'), '');
    });
});
