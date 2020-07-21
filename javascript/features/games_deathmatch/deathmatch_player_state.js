// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Describes the state of a particular player in a deathmatch game. Will be automatically
// initialized when the player is added to the game.
export class DeathmatchPlayerState {
    originalSkin = null;
    originalTeam = null;

    invisible = new WeakSet();
    statistics = null;
    team = null;

    constructor(player) {
        this.originalSkin = player.skin;
        this.originalTeam = player.team;

        // Make a snapshot of the |player|'s statistics, to compare after the game ends.
        this.statistics = player.stats.snapshot();
    }
}
