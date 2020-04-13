// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Npc from 'entities/npc.js';

// Mock implementation of the non-playing character objects. Instead of connecting actual bots, it
// will mimic the behaviour and introduce some of the asynchronous semantics to be expected.
class MockNpc extends Npc {
    // Overridden from the parent class, to enable connections to be initialized without actually
    // initiating a new NPC through Pawn and the SA-MP server.
    async internalConnect() {
        await Promise.resolve();  // any asynchronousity is sufficient

        switch (this.pawnScript) {
            case 'timeout':
                // Do nothing, emulate timing out of the connection.
                break;
            
            default:
                // TODO: Route this through the NpcManager instead.
                this.didConnect();
                break;
        }
    }
}

export default MockNpc;
