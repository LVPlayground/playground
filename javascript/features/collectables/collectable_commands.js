// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Implements the commands related to collectables, both for the local player, as well as for the
// ability to see the achievements owned by other players online on the server.
export class CollectableCommands {
    manager_ = null;

    constructor(manager) {
        this.manager_ = manager;
    }

    dispose() {}
}
