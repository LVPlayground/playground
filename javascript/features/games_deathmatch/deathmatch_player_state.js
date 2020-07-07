// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Describes the state of a particular player in a deathmatch game. Will be automatically
// initialized when the player is added to the game.
export class DeathmatchPlayerState {
    originalColor = null;
    originalSkin = null;
    originalTeam = null;

    color = null;
    invisible = new WeakSet();
    statistics = null;
    team = null;

    constructor(player) {
        this.originalColor = player.color;
        this.originalSkin = player.skin;
        this.originalTeam = player.team;

        // Make a mutable copy of the |player|'s colour, which can be adjusted.
        this.color = this.originalColor;

        // Make a snapshot of the |player|'s statistics, to compare after the game ends.
        this.statistics = player.stats.snapshot();
    }
}
