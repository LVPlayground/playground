// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import NpcManager from 'entities/npc_manager.js';
import MockNpc from 'entities/test/mock_npc.js';
import MockPlayer from 'entities/test/mock_player.js';
import PlayerManager from 'entities/player_manager.js';

describe('NpcManager', (it, beforeEach, afterEach) => {
    let playerManager = null;
    let npcManager = null;

    beforeEach(() => {
        playerManager = new PlayerManager(MockPlayer /* playerConstructor */);
        npcManager = new NpcManager(MockNpc /* npcConstructor */, playerManager);
    });

    afterEach(async () => {
        if (npcManager)
            await npcManager.dispose();

        if (playerManager)
            playerManager.dispose();
    });

    it('should suffix NPC names when given an in-use nickname', assert => {
        // TODO: Implement this functionality.
    });

    it('should suffix NPC names when given a reserved nickname', assert => {
        // TODO: Implement this functionality.
    });

    it('should maintain a count of the number of created objects', assert => {
        assert.equal(npcManager.count, 0);

        // TODO: Rename `nickname` to `name` for consistency with `Player`.
        for (let i = 0; i < 10; ++i)
            npcManager.createNpc({ nickname: 'Bot' + i, pawnScript: 'bot' });

        assert.equal(npcManager.count, 10);
        npcManager.dispose();

        assert.equal(npcManager.count, 0);
        npcManager = null;
    });

    it('should asynchronously connect NPCs to the server', async (assert) => {
        const npc = npcManager.createNpc({ nickname: 'Joe', pawnScript: 'joe' });

        assert.equal(npcManager.count, 1);

        assert.isTrue(npc.isConnecting());
        assert.isFalse(npc.isConnected());
        assert.isFalse(npc.isDisconnecting());
        assert.isNull(npc.player);

        await npc.ready;

        assert.isFalse(npc.isConnecting());
        assert.isTrue(npc.isConnected());
        assert.isFalse(npc.isDisconnecting());
        assert.isNotNull(npc.player);

        npc.disconnect();

        assert.isFalse(npc.isConnecting());
        assert.isTrue(npc.isConnected());
        assert.isTrue(npc.isDisconnecting());
        assert.isNotNull(npc.player);

        await Promise.resolve();  // mimicks asynchronous disconnection

        assert.isFalse(npc.isConnecting());
        assert.isFalse(npc.isConnected());
        assert.isFalse(npc.isDisconnecting());
        assert.isNull(npc.player);

        assert.equal(npcManager.count, 0);
    });

    it('should make sure that NPCs reflect the given information', assert => {
        const npc = npcManager.createNpc({ nickname: 'Joe', pawnScript: 'joe' });

        assert.equal(npc.nickname, 'Joe');
        assert.equal(npc.pawnScript, 'joe');
    });

    it('should time out connecting NPCs after a short period of time', assert => {
        // TODO: Implement this functionality.
    });

    return; //

    it('should fail', assert => {
        assert.isFalse(true);
    });
});
