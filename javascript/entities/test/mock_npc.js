// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Npc } from 'entities/npc.js';

// Mock implementation of the non-playing character objects. Instead of connecting actual bots, it
// will mimic the behaviour and introduce some of the asynchronous semantics to be expected.
export class MockNpc extends Npc {
    // Overridden from the parent class, to enable connections to be initialized without actually
    // initiating a new NPC through Pawn and the SA-MP server.
    async internalConnect() {
        await Promise.resolve();  // any asynchronousity is sufficient

        switch (this.pawnScript) {
            case 'timeout':
                // Do nothing, emulate timing out of the connection.
                break;
            
            default:
                let playerManager = this.manager_.playerManager_;
                let playerId = 0;

                while (playerManager.getById(playerId) !== null)
                    ++playerId;

                playerManager.onPlayerConnect({
                    playerid: playerId,
                    name: this.name,
                    npc: true,
                });

                break;
        }
    }

    // Overridden from the parent class, to allow asynchronous disconnections to happen without
    // affecting the synchronousity of MockPlayer.kick().
    async internalDisconnect() {
        await Promise.resolve();  // any asynchronousity is sufficient

        let playerManager = this.manager_.playerManager_;
        let playerId = this.player_.id;

        playerManager.onPlayerDisconnect({
            playerid: playerId,
            reason: 2 /* kicked */
        });
    }
}
