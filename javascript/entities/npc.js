// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Represents a non-playing character, controlled by a particular script. By mindful of the status
// of an Npc instance, as their lifetime semantics are asynchronous.
class Npc {
    // Statuses that can be assigned to an NPC.
    static kStateConnecting = 0;
    static kStateConnected = 1;
    static kStateDisposed = 2;

    // Creates a new NPC. Do NOT use this constructor directly, instead get the NpcManager from the
    // global Server object and create your non-playing characters through there.
    constructor(manager, nickname, pawnScript) {
        this.manager_ = manager;

        this.nickname_ = nickname;
        this.pawnScript_ = pawnScript;

        this.player_ = null;

        this.state_ = Npc.kStateConnecting;
        this.readyPromise_ = new Promise(resolve => {
            this.readyPromiseResolver_ = resolve;
        });

        this.internalConnect();
    }

    // Closes the connection with the NPC, if any. The state will be updated to be disposed. This
    // method takes care of the one edge-case where the NPC might still be in progress of being
    // connected to the server, in which case we need to destroy it once it connects.
    disconnect() {
        // TODO: Handle the case where the NPC is still connecting.
        this.state_ = Npc.kStateDisposed;
    }

    // Gets the nickname assigned to this NPC.
    get nickname() { return this.nickname_; }

    // Gets the Pawn script that this NPC is due to run.
    get pawnScript() { return this.pawnScript_; }

    // Returns whether the NPC is still in progress of being connected.
    isConnecting() { return this.state_ === Npc.kStateConnecting; }

    // Returns whether the NPC is currently connected to the server.
    isConnected() { return this.state_ === Npc.kStateConnected; }

    // Gets the ready promise that can be used to wait for this NPC's connection. Will be resolved
    // when the connection is successful, but also when it fails, so be sure to check isConnected().
    get ready() { return this.readyPromise_; }

    // Gets the Player instance associated with this NPC, if any.
    get player() { return this.player_; }

    // Initiates the NPC's connection on the SA-MP server. May be overridden by a mock Npc
    // implementation to avoid introducing actual behaviour.
    async internalConnect() {
        // TODO: Connect the NPC
    }

    // To be called by the NpcManager when this NPC has connected to the server. The `player`
    // will be associated, and the state will progress to connected.
    didConnect(player) {
        this.player_ = player;
        this.state_ = Npc.kStateConnected;

        this.readyPromiseResolver_(this);
    }

    // To be called by the NpcManager when the connection for this NPC has timed out.
    didConnectTimeout() {
        this.player_ = null;
        this.state_ = Npc.kStateDisposed;

        this.readyPromiseResolver_(this);
    }

    dispose() {
        if (this.state_ === Npc.kStateConnected)
            this.disconnect();

        this.manager_.didDisposeNpc(this);
    }
}

// Expose the Npc object globally since it is an entity.
global.Npc = Npc;

// Export the Npc object as well, enabling MockNpc to inherit from this.
export default Npc;
