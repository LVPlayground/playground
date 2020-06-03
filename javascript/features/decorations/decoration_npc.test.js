// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DecorationNpc, kReconnectionDelaySec } from 'features/decorations/decoration_npc.js';
import ScopedEntities from 'entities/scoped_entities.js';

describe('DecorationNpc', it => {
    it('establishes the NPC when enabled, and maintains its connection', async (assert) => {
        const entities = new ScopedEntities();
        const decoration = new DecorationNpc({
            name: 'GuntherBot',
            script: 'gunther',
            position: [ 0, 0, 0 ],
            rotation: 0,
        });

        assert.equal(server.npcManager.count, 0);
        assert.isNull(decoration.npc_);

        decoration.enable(entities);

        assert.equal(server.npcManager.count, 1);
        assert.isNotNull(decoration.npc_);

        const originalNpc = decoration.npc_;
        await originalNpc.ready;

        assert.isTrue(originalNpc.isConnected());

        // Disconnect the NPC. This wasn't done by the DecorationNpc implementation, but rather due
        // to external reasons, for example because the Npc timed out, or someone kicked it.
        originalNpc.disconnect();

        await originalNpc.disconnected;

        assert.equal(server.npcManager.count, 0);
        assert.isFalse(originalNpc.isConnected());

        // Now wait for |kReconnectionDelaySec| seconds, after which it should reconnect.
        await server.clock.advance(kReconnectionDelaySec * 1000);

        assert.equal(server.npcManager.count, 1);
        assert.isNotNull(decoration.npc_);
        assert.notStrictEqual(decoration.npc_, originalNpc);
        
        const replacedNpc = decoration.npc_;
        await replacedNpc.ready;

        // It worked! Now disconnect the replaced NPC, wait for it to go, and then disable the
        // feature. The DecorationNpc should recognise this and abort.
        replacedNpc.disconnect();

        await originalNpc.disconnected;

        assert.equal(server.npcManager.count, 0);

        decoration.disable();
        entities.dispose();

        // Now wait for |kReconnectionDelaySec| seconds, after which nothing should've happened.
        await server.clock.advance(kReconnectionDelaySec * 1000);

        assert.equal(server.npcManager.count, 0);
        assert.isNull(decoration.npc_);
    });

    it('is able to make vehicles for the NPCs', async (assert) => {
        const entities = new ScopedEntities();
        const decoration = new DecorationNpc({
            name: 'GuntherBot',
            script: 'gunther',
            position: [ 0, 0, 0 ],
            rotation: 0,
            appearance: {
                label: {
                    text: 'I am flying!!`1',
                },
                vehicle: {
                    modelId: 411,
                }
            }
        });

        assert.equal(server.textLabelManager.count, 0);

        decoration.enable(entities);

        const npc = decoration.npc_;
        await npc.ready;

        assert.isNull(npc.player.vehicle);

        dispatchEvent('playerspawn', {
            playerid: npc.player.id,
        })

        assert.isNotNull(npc.player.vehicle);
        assert.equal(npc.player.vehicle.modelId, 411);
        assert.equal(npc.player.skin, 211);

        assert.equal(server.textLabelManager.count, 1);
    });
});
