// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Number of milliseconds to wait before considering an NPC's connection as having timed out.
const kNpcConnectionTimeoutMs = 8 /* seconds */ * 1000;

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
    // class will be returned immediately, but the associated Player object will only be associated
    // when the bot has connected to the server.
    //
    // The given |name| must be unique among connected players and pending bots. In case of
    // duplication, a random four-digit numeric suffix will be added to the nickname in order to
    // deduplicate, and allow the connection to proceed. Throwing an exception here would not be
    // appropriate as there are additional race conditions that can occur.
    //
    // The given |pawnScript| has to be the script's name in the server/npcmodes/ directory, without
    // the file extension (.amx). For example, given a script called "gunther.pwn", the compiled
    // version would be called "gunther.amx", and the `pawnScript` given should be "gunther".
    createNpc({ name, pawnScript, events = null } = {}) {
        const npcName = this.ensureUniqueNpcName(name);
        const npc = new this.npcConstructor_(this, npcName, pawnScript, events);

        this.npcs_.set(npcName, npc);

        wait(kNpcConnectionTimeoutMs).then(() => {
            if (!npc.isConnecting())
                return;
            
            npc.didConnectTimeout();
        });

        return npc;
    }

    // Ensures that a unique name will be given to the new NPC. This will verify among all connected
    // players, as well as NPCs, regardless whether they have connected or not.
    ensureUniqueNpcName(name) {
        if (!this.playerManager_.getByName(name) && !this.npcs_.has(name))
            return name;

        return name + (Math.floor(Math.random() * 8999) + 1000);
    }

    // --------------------------------------------------------------------------------------------

    // Called when the |player| has connected with the server. If they're a non-human player and
    // we're waiting for an NPC with the given name to connect, mark that as being successful.
    onPlayerConnect(player) {
        const npc = this.npcs_.get(player.name);
        if (!npc || !npc.isConnecting() || !player.isNonPlayerCharacter())
            return;
        
        npc.didConnect(player);
    }

    // Called when the |player| has changed their name. Because we key NPCs by their name, it's
    // important to synchronize in case the |player| is an NPC.
    onPlayerNameChange(player) {
        if (!player.isNonPlayerCharacter())
            return;  // the |player| is not an NPC

        for (const npc of this.npcs_.values()) {
            if (npc.player !== player)
                continue;  // this |npc| describes another player

            this.npcs_.delete(npc.name);
            npc.name = player.name;

            this.npcs_.set(npc.name, npc);
            break;
        }
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
        if (!this.npcs_.has(npc.name))
            throw new Error('Attempting to dispose an invalid NPC: ' + npc.name);

        this.npcs_.delete(npc.name);
    }

    // Disposes of all connected NPCs. This is an asynchronous process, as we need to make sure that
    // all connected bots have properly disconnected from the server, thus callers are expected to
    // wait for the completion of this method.
    async dispose() {
        let npcDisconnectionPromises = [];

        // Iterate over each of the NPCs and act according to the state they're in. The NpcManager
        // will only be considered disposed of after all connections have been closed.
        for (const npc of this.npcs_.values()) {
            npcDisconnectionPromises.push(npc.disconnected);

            if (!npc.isDisconnecting())
                npc.disconnect();
        }

        // Wait until all NPCs have disconnected from the server.
        await Promise.all(npcDisconnectionPromises);

        this.playerManager_.removeObserver(this);

        if (this.npcs_.size != 0)
            throw new Error('There are remaining NPCs after disposing all of them.');
    }
}

export default NpcManager;
