// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Minigame = require('features/minigames/minigame.js');

// A mocked implementation of something that could be a minigame.
class MockMinigame extends Minigame {
    constructor(settings = {}) {
        super({
            name: settings.name || 'My Minigame',
            command: settings.command || '/minigame',
            timeout: 60 /* seconds */,

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
        this.spawnVehicles = [];
        this.deathVehicles = [];
        this.removedPlayers = [];

        // These public promises exist for testing purposes.
        this.loadResolve_ = null;
        this.loadPromise = new Promise(resolve => this.loadResolve_ = resolve);

        this.startResolve_ = null;
        this.startPromise = new Promise(resolve => this.startResolve_ = resolve);

        this.finishResolve_ = null;
        this.finishPromise = new Promise(resolve => this.finishResolve_ = resolve);
    }

    // Called when |player| has been added to the minigame.
    onPlayerAdded(player) {
        this.addedPlayers.push(player);
    }

    // Called when the minigame has advanced to loading state.
    onLoad() { this.loadResolve_(); return this.loadPromise; }

    // Called when the minigame has advanced to running state.
    onStart() { this.startResolve_(); return this.startPromise; }

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

    // Called when the |vehicle| has respawned.
    onVehicleSpawn(vehicle) {
        this.spawnVehicles.push(vehicle);
    }

    // Called when the |vehicle| has been destroyed.
    onVehicleDeath(vehicle) {
        this.deathVehicles.push(vehicle);
    }

    // Called when |player| has been removed from the minigame because of |reason|.
    onPlayerRemoved(player, reason) {
        this.removedPlayers.push({ player, reason });
    }

    // Called when the minigame has finished because of |reason|.
    onFinish(reason) { this.finishResolve_(reason); return this.finishPromise; }
}

exports = MockMinigame;
