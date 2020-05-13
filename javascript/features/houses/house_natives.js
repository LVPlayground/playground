// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// This class is responsible for exposing an API for houses to Pawn in the form of natives.
class HouseNatives {
    constructor(manager) {
        this.manager_ = manager;

        // native bool: SpawnPlayerInHouse(playerId);
        provideNative(
            'SpawnPlayerInHouse', 'i', HouseNatives.prototype.spawnPlayerInHouse.bind(this));
    }

    // Spawns the player at the entrance of their house if they have decided to do so. Returns
    // whether they own a house that has the spawn position set up to accomodate for this.
    // This method must return a number.
    spawnPlayerInHouse(playerId) {
        const player = server.playerManager.getById(playerId);
        if (!player || !player.account.isRegistered())
            return 0;

        for (const location of this.manager_.getHousesForPlayer(player)) {
            if (!location.settings.isSpawn())
                continue;

            // Force the player to teleport to the exit of their owned |location|.
            this.manager_.forceExitHouse(player, location);
            return 1;
        }

        return 0;
    }

    dispose() {
        provideNative('SpawnPlayerInHouse', 'i', playerId => 0 /* no houses */);
    }
}

export default HouseNatives;
