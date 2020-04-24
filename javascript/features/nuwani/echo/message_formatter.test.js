// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { MessageFormatter } from 'features/nuwani/echo/message_formatter.js';

const kEchoChannel = '#echo';

describe('MessageFormatter', it => {
    it('is able to format strings with the string formatter, throws on issues', assert => {
        const formatter = new MessageFormatter(kEchoChannel);
        
        assert.throws(() => formatter.format('invalidTag'));
        assert.equal(
            formatter.format('test', 'Joe', 12.945, 14),
            'PRIVMSG #echo :Hello Joe, I have $13 for 14 days!');
        
        assert.throws(() => formatter.format('test_color_invalid'));
        assert.equal(formatter.format('test_color'), 'PRIVMSG #echo :\x03031 \x0315yo \x03test');

        assert.equal(formatter.format('test_empty'), 'PRIVMSG #echo :Regular string');
    });

    it('is able to parse messages coming from Pawn', assert => {
        const formatter = new MessageFormatter(kEchoChannel);

        assert.throws(() => formatter.formatPawn('test', 'lol', 'invalid format'));

        // Test integer parsing.
        assert.throws(() => formatter.formatPawn('test_int', 'd', ''));
        assert.equal(formatter.formatPawn('test_int', 'd', '42 garbage'), 'PRIVMSG #echo :42');
        assert.equal(formatter.formatPawn('test_int', 'd', '-15'), 'PRIVMSG #echo :-15');
        assert.equal(formatter.formatPawn('test_int', 'd', '15,123'), 'PRIVMSG #echo :15');
        assert.equal(formatter.formatPawn('test_int', 'd', '25.25'), 'PRIVMSG #echo :25');
        assert.equal(formatter.formatPawn('test_int', 'd', '25px'), 'PRIVMSG #echo :25');

        // Test float parsing.
        assert.throws(() => formatter.formatPawn('test_int', 'f', ''));
        assert.equal(formatter.formatPawn('test_int', 'f', '42 garbage'), 'PRIVMSG #echo :42');
        assert.equal(formatter.formatPawn('test_int', 'f', '-15'), 'PRIVMSG #echo :-15');
        assert.equal(formatter.formatPawn('test_int', 'f', '314e-2'), 'PRIVMSG #echo :3.14');
        assert.equal(formatter.formatPawn('test_int', 'f', '25.25'), 'PRIVMSG #echo :25.25');
        assert.equal(formatter.formatPawn('test_int', 'f', '0.0314E+2'), 'PRIVMSG #echo :3.14');
        assert.equal(formatter.formatPawn('test_int', 'f', 'FF2'), 'PRIVMSG #echo :NaN');

        // Test word (string) parsing.
        assert.throws(() => formatter.formatPawn('test_int', 's', ''));
        assert.equal(formatter.formatPawn('test_int', 's', 'hello'), 'PRIVMSG #echo :hello');
        assert.equal(formatter.formatPawn('test_int', 's', 'world :o'), 'PRIVMSG #echo :world');

        // Test sentence (string) parsing.
        assert.throws(() => formatter.formatPawn('test_int', 'z', ''));
        assert.equal(formatter.formatPawn('test_int', 'z', 'hello'), 'PRIVMSG #echo :hello');
        assert.equal(formatter.formatPawn('test_int', 'z', 'world :o'), 'PRIVMSG #echo :world :o');

        // Combining multiple parameters in the same string
        assert.equal(
            formatter.formatPawn('test_dsz', 'dsz', '42 says hello world'),
            'PRIVMSG #echo :42 says hello world');
        assert.equal(
            formatter.formatPawn('test_ffd', 'ffd', '314e-2 15.15 25.25'),
            'PRIVMSG #echo :3.14 15.15 25');
    });

    it('is able to load the production messages', assert => {
        assert.doesNotThrow(() => {
            new MessageFormatter(kEchoChannel, /* forceProdForTesting= */ true);
        });
    });
});
