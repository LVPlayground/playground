// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { MessageFormatter } from 'features/nuwani/echo/message_formatter.js';

describe('MessageFormatter', it => {
    it('is able to format strings with the string formatter, throws on issues', assert => {
        const formatter = new MessageFormatter();
        
        assert.throws(() => formatter.format('invalidTag'));
        assert.equal(
            formatter.format('test', 'Joe', 12.945, 14), 'Hello Joe, I have $13 for 14 days!');
        
        assert.throws(() => formatter.format('test_color_invalid'));
        assert.equal(formatter.format('test_color'), '\x03031 \x0315yo \x03test');
    });

    it('is able to parse messages coming from Pawn', assert => {
        const formatter = new MessageFormatter();

        assert.throws(() => formatter.formatPawn('test', 'lol', 'invalid format'));

        // Test integer parsing.
        assert.throws(() => formatter.formatPawn('test_int', 'd', ''));
        assert.equal(formatter.formatPawn('test_int', 'd', '42 garbage'), '42');
        assert.equal(formatter.formatPawn('test_int', 'd', '-15'), '-15');
        assert.equal(formatter.formatPawn('test_int', 'd', '15,123'), '15');
        assert.equal(formatter.formatPawn('test_int', 'd', '25.25'), '25');
        assert.equal(formatter.formatPawn('test_int', 'd', '25px'), '25');

        // Test float parsing.
        assert.throws(() => formatter.formatPawn('test_int', 'f', ''));
        assert.equal(formatter.formatPawn('test_int', 'f', '42 garbage'), '42');
        assert.equal(formatter.formatPawn('test_int', 'f', '-15'), '-15');
        assert.equal(formatter.formatPawn('test_int', 'f', '314e-2'), '3.14');
        assert.equal(formatter.formatPawn('test_int', 'f', '25.25'), '25.25');
        assert.equal(formatter.formatPawn('test_int', 'f', '0.0314E+2'), '3.14');
        assert.equal(formatter.formatPawn('test_int', 'f', 'FF2'), 'NaN');

        // Test word (string) parsing.
        assert.throws(() => formatter.formatPawn('test_int', 's', ''));
        assert.equal(formatter.formatPawn('test_int', 's', 'hello'), 'hello');
        assert.equal(formatter.formatPawn('test_int', 's', 'world :o'), 'world');

        // Test sentence (string) parsing.
        assert.throws(() => formatter.formatPawn('test_int', 'z', ''));
        assert.equal(formatter.formatPawn('test_int', 'z', 'hello'), 'hello');
        assert.equal(formatter.formatPawn('test_int', 'z', 'world :o'), 'world :o');

        // Combining multiple parameters in the same string
        assert.equal(
            formatter.formatPawn('test_dsz', 'dsz', '42 says hello world'), '42 says hello world');
        assert.equal(
            formatter.formatPawn('test_ffd', 'ffd', '314e-2 15.15 25.25'), '3.14 15.15 25');
    });

    it('is able to load the production messages', assert => {
        assert.doesNotThrow(() => new MessageFormatter(/* forceProdForTesting= */ true));
    });
});
