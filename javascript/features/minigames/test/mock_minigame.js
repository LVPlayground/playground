// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Minigame = require('features/minigames/minigame.js');

// A mocked implementation of something that could be a minigame.
class MockMinigame extends Minigame {
    constructor(settings = {}) {
        super({
            name: settings.name || 'My Minigame',

            minimumParticipants: settings.minimumParticipants || 1,
            maximumParticipants: settings.maximumParticipants || 4,

            enableRespawn: settings.enableRespawn || false
        });

        // These public properties exist for testing purposes.
        this.addedPlayers = [];
        this.deathPlayers = [];
        this.spawnPlayers = [];
        this.enterVehicles = [];
        this.leaveVehicles = [];
        this.removedPlayers = [];
        this.finishedReason = null;
    }

    // Called when |player| has been added to the minigame.
    onPlayerAdded(player) {
        this.addedPlayers.push(player);
    }

    // Called when |player| has died because of |reason|.
    onPlayerDeath(player, reason) {
        this.deathPlayers.push({ player, reason });
    }

    // Called when |player| has spawned within the minigame.
    onPlayerSpawn(player) {
        this.spawnPlayers.push(player);
    }

    // Called when the |player| has entered |vehicle| as a driver.
    onPlayerEnterVehicle(player, vehicle) {
        this.enterVehicles.push({ player, vehicle });
    }

    // Called when the |player| has left their vehicle.
    onPlayerLeaveVehicle(player) {
        this.leaveVehicles.push(player);
    }

    // Called when |player| has been removed from the minigame because of |reason|.
    onPlayerRemoved(player, reason) {
        this.removedPlayers.push({ player, reason });
    }

    // Called when the minigame has finished because of |reason|.
    onFinished(reason) {
        this.finishedReason = reason;
    }
}

exports = MockMinigame;
