// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import NpcManager from 'entities/npc_manager.js';
import MockNpc from 'entities/test/mock_npc.js';

describe('NpcManager', (it, beforeEach, afterEach) => {
    let manager = null;

    beforeEach(() => manager = new NpcManager(MockNpc /* npcConstructor */));
    afterEach(() => {
        if (manager)
            manager.dispose();
    });

    it('should maintain a count of the number of created objects', assert => {
        assert.equal(manager.count, 0);

        for (let i = 0; i < 10; ++i)
            manager.createNpc({ nickname: 'foo', pawnScript: 'foo.pwn' });

        assert.equal(manager.count, 10);
        manager.dispose();

        assert.equal(manager.count, 0);
        manager = null;
    });
});
