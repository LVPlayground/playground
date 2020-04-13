// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Mock implementation of the non-playing character objects. Instead of connecting actual bots, it
// will mimic the behaviour and introduce some of the asynchronous semantics to be expected.
class MockNpc {
    // Creates a new NPC. Do NOT use this constructor directly, instead get the NpcManager from the
    // global Server object and create your non-playing characters through there.
    constructor(manager, nickname, pawnScript) {
        this.manager_ = manager;

        this.nickname_ = nickname;
        this.pawnScript_ = pawnScript;

        this.player_ = null;

        // TODO: Connect the NPC
    }

    // Gets the nickname assigned to this NPC.
    get nickname() { return this.nickname_; }

    // Gets the Pawn script that this NPC is due to run.
    get pawnScript() { return this.pawnScript_; }

    // Gets the Player instance associated with this NPC, if any.
    get player() { return this.player_; }

    dispose() {
        if (this.player_) {
            this.player_.kick();
            this.player_ = null;
        }

        this.manager_.didDisposeNpc(this);
    }
}

export default MockNpc;
