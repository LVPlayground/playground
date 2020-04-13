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
        playerManager.onPlayerConnect({ playerid: 42, name: 'Joe' });

        const npc = npcManager.createNpc({ name: 'Joe', pawnScript: 'joe' });
        assert.notEqual(npc.name, 'Joe');
    });

    it('should suffix NPC names when given a reserved nickname', assert => {
        const nicknames = new Set();

        for (let i = 0; i < 100; ++i) {
            const npc = npcManager.createNpc({ name: 'Joe', pawnScript: 'bot' });
            nicknames.add(npc.name);
        }

        // Allow for ~5 misses because random numbers are being used, so there is a non-zero
        // probability (1.12%) of having duplicates. We don't want this to be flaky.
        assert.isAboveOrEqual(nicknames.size, 95);
    });

    it('should maintain a count of the number of created objects', async (assert) => {
        assert.equal(npcManager.count, 0);

        for (let i = 0; i < 10; ++i)
            npcManager.createNpc({ name: 'Bot' + i, pawnScript: 'bot' });

        assert.equal(npcManager.count, 10);
        await npcManager.dispose();

        assert.equal(npcManager.count, 0);
        npcManager = null;
    });

    it('should asynchronously connect NPCs to the server', async (assert) => {
        const npc = npcManager.createNpc({ name: 'Joe', pawnScript: 'joe' });

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

        await npc.disconnected;

        assert.isFalse(npc.isConnecting());
        assert.isFalse(npc.isConnected());
        assert.isFalse(npc.isDisconnecting());
        assert.isNull(npc.player);

        assert.equal(npcManager.count, 0);
    });

    it('should make sure that NPCs reflect the given information', assert => {
        const npc = npcManager.createNpc({ name: 'Joe', pawnScript: 'joe' });

        assert.equal(npc.name, 'Joe');
        assert.equal(npc.pawnScript, 'joe');
    });

    it('should time out connecting NPCs after a short period of time', async (assert) => {
        const npc = npcManager.createNpc({ name: 'Joe', pawnScript: 'timeout' });

        assert.equal(npcManager.count, 1);

        assert.isTrue(npc.isConnecting());
        assert.isFalse(npc.isConnected());

        await Promise.all([
            server.clock.advance(10000),  // timeout = 8000ms
            npc.ready,
            npc.disconnected,
        ]);

        assert.isFalse(npc.isConnecting());
        assert.isFalse(npc.isConnected());

        assert.equal(npcManager.count, 0);
    });

    return; //

    it('should fail', assert => {
        assert.isFalse(true);
    });
});
