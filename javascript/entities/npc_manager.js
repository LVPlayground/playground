// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import ScopedCallbacks from 'base/scoped_callbacks.js';

// This manager is responsible for creating non-player characters, controlled by a predefined
// script. For all intents and purposes, when connected, NPCs can be considered as Player
// instances as well, and be fully controlled as such.
class NpcManager {
    constructor(npcConstructor = Npc) {
        this.npcConstructor_ = npcConstructor;
        this.npcs_ = new Set();
    }

    // Gets the number of NPCs currently created on the server.
    get count() { return this.npcs_.size; }

    // Creates an NPC with the given name, powered by the given script. An instance of the Npc
    // class will be returned immediately, which doesn't mean that the player is connected.
    //
    // The Pawn script has to be the script's name in the server/npcmodes/ directory, without
    // the file extension (.amx). For example, given a script called "gunther.pwn", the compiled
    // version would be called "gunther.amx", and the `pawnScript` given should be "gunther".
    createNpc({ nickname, pawnScript } = {}) {
        const npc = new this.npcConstructor_(this, nickname, pawnScript);
        this.npcs_.add(npc);

        return npc;
    }

    // Removes the |npc| from the maintained set of NPCs. Should only be used by the NPC
    // implementation to inform the manager about their disposal.
    didDisposeNpc(npc) {
        if (!this.npcs_.has(npc))
            throw new Error('Attempting to dispose an invalid NPC: ' + npc);

        this.npcs_.delete(npc);
    }

    dispose() {
        this.npcs_.forEach(npc => npc.dispose());

        if (this.npcs_.size != 0)
            throw new Error('There are remaining NPCs after disposing all of them.');
    }
}

export default NpcManager;
