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

        // These properties exist for testing purposes.
        this.addedPlayers_ = [];
        this.deathPlayers_ = [];
        this.spawnPlayers_ = [];
        this.removedPlayers_ = [];
        this.finishedReason_ = null;
    }

    // Gets an array with the players that have been added to the mock minigame.
    get addedPlayers() { return this.addedPlayers_; }

    // Gets an array with the players who have died within this mock minigame.
    get deathPlayers() { return this.deathPlayers_; }

    // Gets an array with the players who have spawned within this mock minigame.
    get spawnPlayers() { return this.spawnPlayers_; }

    // Gets an array with the players that have been removed from the mock minigame.
    get removedPlayers() { return this.removedPlayers_; }

    // Gets an array with the reason as to why the minigame has finished.
    get finishedReason() { return this.finishedReason_; }

    // Called when |player| has been added to the minigame.
    onPlayerAdded(player) {
        this.addedPlayers_.push(player);
    }

    // Called when |player| has died because of |reason|.
    onPlayerDeath(player, reason) {
        this.deathPlayers_.push({ player, reason });
    }

    // Called when |player| has spawned within the minigame.
    onPlayerSpawn(player) {
        this.spawnPlayers_.push(player);
    }

    // Called when |player| has been removed from the minigame because of |reason|.
    onPlayerRemoved(player, reason) {
        this.removedPlayers_.push({ player, reason });
    }

    // Called when the minigame has finished because of |reason|.
    onFinished(reason) {
        this.finishedReason_ = reason;
    }
}

exports = MockMinigame;
