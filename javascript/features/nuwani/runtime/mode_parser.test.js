// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { ModeParser } from 'features/nuwani/runtime/mode_parser.js';

describe('ModeParser', it => {
    it('is able to understand both channel modes and prefixes', assert => {
        const parser = new ModeParser();

        assert.equal(parser.modes.size, 0);

        parser.setChannelPrefixes('(Yqaohv)!~&@%+');
        parser.setChannelModes('IXbe,k,FLfjl,ABKMQRSTcimnprstuz');

        assert.equal(parser.modes.size, 34);

        const counts = new Map();

        for (const type of parser.modes.values())
            counts.set(type, (counts.get(type) || 0) + 1);

        assert.equal(counts.get(ModeParser.kModeWithParameter), 11);
        assert.equal(counts.get(ModeParser.kModeWithParameterWhenSet), 5);
        assert.equal(counts.get(ModeParser.kModeWithoutParameter), 18);
    });
});