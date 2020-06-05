// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import MockPawnInvoke from 'base/test/mock_pawn_invoke.js';
import { PlayerCommandsCommands } from 'features/player_commands/player_commands_commands.js'

describe('PlaygroundCommands', (it, beforeEach, afterEach) => {
    let commands = null;
    let gunther = null;

    beforeEach(async () => {
        commands = new PlayerCommandsCommands();
        await commands.buildCommands();

        gunther = server.playerManager.getById(0 /* Gunther */);
        await gunther.identify();
    });

    afterEach(() => {
        commands?.dispose();
    });

    it('should not leave any stray commands on the server', assert => {
        assert.isAbove(server.commandManager.size, 0);

        commands.dispose();
        commands = null;

        assert.equal(server.commandManager.size, 0);
    });

    it('should register spawnweapons command', async assert => {
        assert.isTrue(await gunther.issueCommand('/my spawnweapons 1337 1'));
    });

    it('should pawninvoke unknown my command', async assert => {
        const mockInvoke = MockPawnInvoke.getInstance();
        const currentCalls = mockInvoke.calls.length;

        assert.isTrue(await gunther.issueCommand('/my somerandom test command'));
    });

});
