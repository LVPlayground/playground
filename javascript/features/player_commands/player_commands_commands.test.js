// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { MockPawnInvoke } from 'base/test/mock_pawn_invoke.js';

describe('PlaygroundCommands', (it, beforeEach) => {
    let commands = null;
    let gunther = null;
    let finance = null;

    beforeEach(async () => {
        const feature = server.featureManager.loadFeature('player_commands');
        finance = server.featureManager.loadFeature('finance');

        commands = feature.commands_;

        gunther = server.playerManager.getById(0 /* Gunther */);
        await gunther.identify();
    });

    it('should register spawnweapons command', async assert => {
        const mockInvoke = MockPawnInvoke.getInstance();
        finance.givePlayerCash(gunther, 1000000);

        assert.isTrue(await gunther.issueCommand('/my spawnweapons 1337 1'));
        
        // 3 extra as we set financial data 3 times. 
        // (Spawn, givePlayerCash^, takePlayerCash in command)
        assert.equal(mockInvoke.calls.length, 4);
        assert.equal(mockInvoke.calls[0].fn, 'OnGiveSpawnArmour');
        assert.equal(mockInvoke.calls[0].args[0], gunther.id);
    });

    it('should register p spawnweapons command', async assert => {
        const mockInvoke = MockPawnInvoke.getInstance();
        finance.givePlayerCash(gunther, 1000000);
        gunther.level = Player.LEVEL_ADMINISTRATOR;
        
        assert.isTrue(await gunther.issueCommand('/p 0 spawnweapons 1337 1'));

        // 3 extra as we set financial data 3 times. 
        // (Spawn, givePlayerCash^, takePlayerCash in command)
        assert.equal(mockInvoke.calls.length, 4);
        assert.equal(mockInvoke.calls[0].fn, 'OnGiveSpawnArmour');
        assert.equal(mockInvoke.calls[0].args[0], 0);
    });
});
