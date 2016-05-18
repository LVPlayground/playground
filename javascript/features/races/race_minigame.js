// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Minigame = require('features/minigames/minigame.js');

// This class represents an on-going race minigame. The race defines the maximum number of players,
// and the lifetime of the minigame will be controlled by the minigame manager.
class RaceMinigame extends Minigame {
    constructor(race) {
        super({
            name: race.name,
            command: '/race ' + race.id,
            timeout: race.timeLimit,
            maximumParticipants: race.maxPlayers
        });

        this.race_ = race;

        // Map of all engaged players with the vehicle that they are meant to be driving.
        this.vehicles_ = new Map();
    }

    // Gets access to the race that this minigame represents.
    get race() { return this.race_; }

    // ---------------------------------------------------------------------------------------------

    // Called when the |player| has signed up to participate in this race.
    onPlayerAdded(player) {
        player.activity = Player.PLAYER_ACTIVITY_JS_RACE;
    }

    // Called when the race advances to loading state. This created the required entities, makes
    // sure that all players are in the appropriate world and displays the count-down for them. 
    onLoad() {
        return Promise.resolve().then(() => {
            this.createObjects();

            // TODO(Russell): Create the vehicles after a small delay where the player's camera is
            // targetted to their intended vehicle spawn, triggering the game to preload resources.
            this.createVehicles();

            // Prepare each of the players that will be participating in the race.
            for (const player of this.activePlayers) {
                // TODO(Russell): Disable the death feed for the |player|.

                // Move the player to the right virtual world and interior for the race.
                player.virtualWorld = this.virtualWorld;
                player.interior = this.race_.interior;

                // Apply the environmental effects of the race (weather, time) to the player.
                player.weather = this.race_.weather;
                player.time = this.race_.time;

                // TODO(Russell): It would be so awesome if we could control gravity per-player.
                // TODO(Russell): Force a streamer update if the race features objects.

                // Put the player in their designated vehicle, and disable collisions for them.
                player.putInVehicle(this.vehicles_.get(player));
                player.vehicleCollisionsEnabled = false;

                // Freeze the player so that they cannot begin racing yet.
                player.controllable = false;

                // TODO(Russell): Create and display the score-board for the player.
                // TODO(Russell): Create the first checkpoint for the player.
            }

            // TODO(Russell): Load the individual checkpoint times for the all players.
            // TODO(Russell): Start the race's count-down after a few second's wait.
        });
    }

    // Called when the race is ready to start. This is where they will actually begin racing, so
    // all players will be unfrozen and we wish them the best of luck.
    onStart() {
        // TODO(Russell): Enable unlimited NOS for the vehicles.
        // TODO(Russell): Actually start the race.

        console.log('onStart()');

        return Promise.resolve();
    }

    // Creates the objects associated with this race. They will be created in for the dynamic object
    // streamer and will be scoped to the virtual world the race will be hosted in.
    createObjects() {
        for (const object of this.race_.objects) {
            this.entities.createObject({
                modelId: object.model,
                position: object.position,
                rotation: object.rotation,
                worldId: this.virtualWorld
            });
        }
    }

    // Creates the vehicles associated with this race. Each will be keyed to one of the
    // participating players. All are scoped to the lifetime of this minigame.
    createVehicles() {
        const spawnPositions = this.race_.spawnPositions;
        let currentSpawnIndex = 0;

        for (const player of this.activePlayers) {
            const spawnPosition = spawnPositions[currentSpawnIndex++];
            const vehicle = this.entities.createVehicle({
                modelId: spawnPosition.vehicle.model,
                position: spawnPosition.position,
                rotation: spawnPosition.rotation,
                primaryColor: spawnPosition.vehicle.colors[0],
                secondaryColor: spawnPosition.vehicle.colors[1],
                interiorId: this.race_.interior,
                virtualWorld: this.virtualWorld
            });

            // Associate a nitrous oxide system with the vehicle when desired.
            switch (spawnPosition.vehicle.nos) {
                case 1:
                    vehicle.addComponent(Vehicle.COMPONENT_NOS_SINGLE_SHOT);
                    break;
                case 5:
                    vehicle.addComponent(Vehicle.COMPONENT_NOS_FIVE_SHOTS);
                    break;
                case 10:
                    vehicle.addComponent(Vehicle.COMPONENT_NOS_TEN_SHOTS);
                    break;
            }

            this.vehicles_.set(player, vehicle);
        }
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |player| has left the race, either by choice, because they disconnected or
    // because they have finished the race.
    onPlayerRemoved(player, reason) {
        player.activity = Player.PLAYER_ACTIVITY_NONE;

        if (this.state == Minigame.STATE_SIGN_UP)
            return;  // bail out if the actual race hasn't started yet.

        // TODO(Russell): Remove the vehicle created for |player| from the race.

        if (reason == Minigame.REASON_DISCONNECT)
            return;  // don't update the activity of |player| when they're disconnecting.

        if (reason == Minigame.REASON_FINISHED) {
            // TODO(Russell): Make sure that the time of the |player| gets stored in the database.
        }

        // TODO(Russell): Hide the |checkpoint| for the |player| if one is still showing.

        // Make sure that vehicles will collide for the player again.
        player.vehicleCollisionsEnabled = true;

        // Mark the player as being controllable again, so that they're not frozen for no reason.
        player.controllable = true;
    }
}

exports = RaceMinigame;
