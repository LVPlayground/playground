// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandDelegate } from 'features/nuwani/commands/command_delegate.js';

describe('CommandDelegate', it => {
    it('is able to determine the level of a message sender from channel modes', assert => {
        const delegate = new CommandDelegate(/* commandPrefix= */ '!', [
            { mode: 'a', level: Player.LEVEL_MANAGEMENT },
            { mode: 'o', level: Player.LEVEL_ADMINISTRATOR },
        ]);

        assert.equal(Player.LEVEL_MANAGEMENT, delegate.getSourceLevel({
            getSenderModesInEchoChannel: () => 'a'
        }));

        assert.equal(Player.LEVEL_MANAGEMENT, delegate.getSourceLevel({
            getSenderModesInEchoChannel: () => 'oa'
        }));

        assert.equal(Player.LEVEL_ADMINISTRATOR, delegate.getSourceLevel({
            getSenderModesInEchoChannel: () => 'o'
        }));

        assert.equal(Player.LEVEL_PLAYER, delegate.getSourceLevel({
            getSenderModesInEchoChannel: () => 'h'
        }));

        assert.equal(Player.LEVEL_PLAYER, delegate.getSourceLevel({
            getSenderModesInEchoChannel: () => ''
        }));
    });
});
