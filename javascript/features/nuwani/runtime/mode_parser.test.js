// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Message } from 'features/nuwani/runtime/message.js';
import { ModeParser } from 'features/nuwani/runtime/mode_parser.js';

describe('ModeParser', it => {
    it('is able to understand both channel modes and prefixes', assert => {
        const parser = new ModeParser();

        assert.equal(parser.channelModes.size, 0);

        parser.setChannelPrefixes('(Yqaohv)!~&@%+');
        parser.setChannelModes('IXbe,k,FLfjl,ABKMQRSTcimnprstuz');

        assert.equal(parser.channelModes.size, 34);

        const counts = new Map();

        for (const type of parser.channelModes.values())
            counts.set(type, (counts.get(type) || 0) + 1);

        assert.equal(counts.get(ModeParser.kModeWithParameter), 11);
        assert.equal(counts.get(ModeParser.kModeWithParameterWhenSet), 5);
        assert.equal(counts.get(ModeParser.kModeWithoutParameter), 18);
    });

    it('should reject invalid MODE commands with an exception', assert => {
        const parser = new ModeParser();

        assert.throws(() => parser.parse(new Message(':server.name JOIN #echo')));
        assert.throws(() => parser.parse(new Message(':server.name MODE #echo')));
    });

    it('is able to parse channel mode changes as defined by the network', assert => {
        const parser = new ModeParser();

        assert.equal(parser.channelModes.size, 0);

        parser.setChannelPrefixes('(Yqaohv)!~&@%+');
        parser.setChannelModes('IXbe,k,FLfjl,ABKMQRSTcimnprstuz');

        assert.equal(parser.channelModes.size, 34);

        // Asserts that parsing |modeChanges| will result in the |expected| amendments, which will
        // be validated in a more structured way, yielding better error messages.
        const assertParseResult = (modeChanges, expectedChanges) => {
            const result = parser.parse(new Message(':server.name MODE #echo ' + modeChanges));
            
            for (const type of ['set', 'unset']) {
                const expected = expectedChanges[type];
                const actual = result[type];

                if (actual.length !== expected.length) {
                    throw new Error(`Expected ${expected.length} mode flags to be ${type}, but ` +
                                    `got ${actual.length} instead.`);
                }

                for (let i = 0; i < actual.length; ++i) {
                    const expectedMode = expected[i];
                    const actualMode = actual[i];

                    if (actualMode.flag !== expectedMode.flag) {
                        throw new Error(`Expected mode ${i} to ${type} to be ` +
                                        `${expectedMode.flag}, but got ${actualMode.flag} instead`);
                                            
                    }

                    if (actualMode.param != expectedMode.param) {
                        throw new Error(`Expected parameter ${i} to ${type} for flag ` +
                                        `${expectedMode.flag} to be ${expectedMode.param}, but ` +
                                        `got ${actualMode.param} instead.`);
                    }
                }
            }
        }
        
        assertParseResult('+c', {
            set: [{ flag: 'c' }],
            unset: []
        });

        assertParseResult('+mn', {
            set: [{ flag: 'm' }, { flag: 'n' }],
            unset: []
        });

        assertParseResult('-stu', {
            set: [],
            unset: [{ flag: 's' }, { flag: 't' }, { flag: 'u' }]
        });

        assertParseResult('+AB-st+Q', {
            set: [{ flag: 'A' }, { flag: 'B' }, { flag: 'Q' }],
            unset: [{ flag: 's' }, { flag: 't' }]
        });

        assertParseResult('+k password', {
            set: [{ flag: 'k', param: 'password' }],
            unset: []
        });

        assertParseResult('+mv-sta+k Joe Ted password', {
            set: [{ flag: 'm' }, { flag: 'v', param: 'Joe' }, { flag: 'k', param: 'password' }],
            unset: [{ flag: 's' }, { flag: 't' }, { flag: 'a', param: 'Ted' }]
        });

        assertParseResult('+c -m +Q', {
            set: [{ flag: 'c' }, { flag: 'Q' }],
            unset: [{ flag: 'm' }]
        });

        assertParseResult('+Ip-v Joe!user@host Ted +i-b banee', {
            set: [{ flag: 'I', param: 'Joe!user@host' }, { flag: 'p' }, { flag: 'i' }],
            unset: [{ flag: 'v', param: 'Ted' }, { flag: 'b', param: 'banee' }]
        });

        assertParseResult('+lL-j 10 5', {
            set: [{ flag: 'l', param: '10' }, { flag: 'L', param: '5' }],
            unset: [{ flag: 'j' }]
        });

        assertParseResult('+j-f+L-l 15 20', {
            set: [{ flag: 'j', param: '15' }, { flag: 'L', param: '20' }],
            unset: [{ flag: 'f' }, { flag: 'l' }]
        });
    });
});
