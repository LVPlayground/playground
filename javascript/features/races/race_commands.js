// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Provides the "/race" command for players to interact with, which allows them to start a race or
// spectate one of the in-progress races. Builds on top of the Games API.
export class RaceCommands {
    #database_ = null;
    #games_ = null;
    #registry_ = null;

    constructor(database, games, registry) {
        this.#database_ = database;
        this.#games_ = games;
        this.#registry_ = registry;
    }

    dispose() {
        this.#registry_ = null;
        this.#games_ = null;
        this.#database_ = null;
    }
}
