// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import ScopedCallbacks from 'base/scoped_callbacks.js';

// This manager is responsible for creating non-player characters, controlled by a predefined
// script. For all intents and purposes, when connected, NPCs can be considered as Player
// instances as well, and be fully controlled as such.
class NpcManager {
    constructor(npcConstructor = Npc, playerManager) {
        this.npcConstructor_ = npcConstructor;
        this.npcs_ = new Map();

        this.playerManager_ = playerManager;
        this.playerManager_.addObserver(this);
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
        this.npcs_.set(nickname, npc);

        return npc;
    }

    // --------------------------------------------------------------------------------------------

    // Called when the |player| has connected with the server. If they're a non-human player and
    // we're waiting for an NPC with the given name to connect, mark that as being successful.
    onPlayerConnect(player) {
        const npc = this.npcs_.get(player.name);
        if (!npc || !player.isNonPlayerCharacter())
            return;
        
        npc.didConnect(player);
    }

    // Called when the |player| has disconnected from the server. This might be an NPC, in which
    // case we have to update their connectivity state.
    onPlayerDisconnect(player) {
        const npc = this.npcs_.get(player.name);
        if (!npc)
            return;
        
        npc.didDisconnect();
    }

    // --------------------------------------------------------------------------------------------

    // Removes the |npc| from the maintained set of NPCs. Should only be used by the NPC
    // implementation to inform the manager about their disposal.
    didDisposeNpc(npc) {
        const name = npc.nickname;

        if (!this.npcs_.has(name))
            throw new Error('Attempting to dispose an invalid NPC: ' + name);

        this.npcs_.delete(name);
    }

    async dispose() {
        for (const npc of this.npcs_.values())
            npc.dispose();

        // Stop observing the PlayerManager, as no further events are spected.
        this.playerManager_.removeObserver(this);

        if (this.npcs_.size != 0)
            throw new Error('There are remaining NPCs after disposing all of them.');
    }
}

export default NpcManager;
