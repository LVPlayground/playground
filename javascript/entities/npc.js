// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Represents a non-playing character, controlled by a particular script. By mindful of the status
// of an Npc instance, as their lifetime semantics are asynchronous.
class Npc {
    // Statuses that can be assigned to an NPC.
    static kStateConnecting = 0;
    static kStateConnected = 1;
    static kStateDisconnecting = 2;
    static kStateDisposed = 3;

    // Creates a new NPC. Do NOT use this constructor directly, instead get the NpcManager from the
    // global Server object and create your non-playing characters through there.
    constructor(manager, name, pawnScript) {
        this.manager_ = manager;

        this.name_ = name;
        this.pawnScript_ = pawnScript;

        this.player_ = null;

        this.state_ = Npc.kStateConnecting;
        this.readyPromise_ = new Promise(resolve => {
            this.readyPromiseResolver_ = resolve;
        });

        this.disconnectedPromise_ = new Promise(resolve => {
            this.disconnectedPromiseResolver_ = resolve;
        });

        // Flag that will request the bot to disconnect when connection has been established.
        this.disconnectOnConnection_ = false;

        this.internalConnect();
    }

    // Closes the connection with the NPC, if any. The state will be updated to be disposed. This
    // method takes care of the one edge-case where the NPC might still be in progress of being
    // connected to the server, in which case we need to destroy it once it connects.
    disconnect() {
        if (this.state_ === Npc.kStateConnecting) {
            this.disconnectOnConnection_ = true;
            return;
        }

        if (this.state_ === Npc.kStateDisconnecting ||
            this.state_ === Npc.kStateDisposed) {
            return;
        }

        this.state_ = Npc.kStateDisconnecting;
        this.internalDisconnect();
    }

    // Gets the nickname assigned to this NPC.
    get name() { return this.name_; }

    // Gets the Pawn script that this NPC is due to run.
    get pawnScript() { return this.pawnScript_; }

    // Returns whether the NPC is still in progress of being connected.
    isConnecting() { return this.state_ === Npc.kStateConnecting; }

    // Returns whether the NPC is currently connected to the server.
    isConnected() {
        return this.state_ === Npc.kStateConnected ||
               this.state_ === Npc.kStateDisconnecting;
    }

    // Returns whether the NPC is currently being disconnected.
    isDisconnecting() {
        return this.state_ === Npc.kStateDisconnecting ||
               this.disconnectOnConnection_;
    }

    // Gets the ready promise that can be used to wait for this NPC's connection. Will only be
    // resolved when the connection is successful
    get ready() { return this.readyPromise_; }

    // Gets the Player instance associated with this NPC, if any.
    get player() { return this.player_; }

    // Gets the disconnection promise that can be used to wait for the NPC to fully disconnect.
    get disconnected() { return this.disconnectedPromise_; }

    // Initiates the NPC's connection on the SA-MP server. May be overridden by a mock Npc
    // implementation to avoid introducing actual behaviour.
    async internalConnect() {
        pawnInvoke('ConnectNPC', 'ss', this.name_, this.pawnScript_);
    }

    // Actually disconnects the NPC from the SA-MP server. May be overridden by a mock Npc
    // implementation to allow customization of timing of the events.
    async internalDisconnect() {
        if (this.player_)
            this.player_.kick();
    }

    // To be called by the NpcManager when this NPC has connected to the server. The `player`
    // will be associated, and the state will progress to connected.
    didConnect(player) {
        this.player_ = player;
        this.state_ = Npc.kStateConnected;

        if (this.disconnectOnConnection_) {
            this.disconnect();
            return;
        }
        
        this.readyPromiseResolver_(this);
        this.readyPromiseResolver_ = null;
    }

    // To be called by the NpcManager when the connection for this NPC has timed out. The
    // disconnection promise will be called immediately. Then the NPC will dispose of itself.
    didConnectTimeout() {
        this.didDisconnect();
    }

    // To be called by the NpcManager when the NPC has disconnected from the server for reasons not
    // tracked in this class, e.g. being kicked by an administrator manually.
    didDisconnect() {
        this.player_ = null;
        this.state_ = Npc.kStateDisposed;

        this.disconnectOnConnection_ = false;

        this.disconnectedPromiseResolver_();
        this.disconnectedPromiseResolver_ = null;

        this.dispose();
    }

    dispose() {
        if (this.state_ != Npc.kStateDisposed)
            throw new Error('Only fully disconnected NPCs may be disposed of.');

        this.manager_.didDisposeNpc(this);
    }
}

// Expose the Npc object globally since it is an entity.
global.Npc = Npc;

// Export the Npc object as well, enabling MockNpc to inherit from this.
export default Npc;
