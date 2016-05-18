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

        // Map of all engaged players to their assigned ehicle and checkpoint.
        this.playerVehicles_ = new Map();
        this.playerCheckpoints_ = new Map();

        // High-resolution timestamp at which the race actually started.
        this.startTime_ = null;
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
                player.putInVehicle(this.playerVehicles_.get(player));
                player.vehicleCollisionsEnabled = false;

                // Freeze the player so that they cannot begin racing yet.
                player.controllable = false;

                // TODO(Russell): Create and display the score-board for the player.
                
                // Create the first checkpoint for the player, so they know where to go.
                this.nextCheckpoint(player);
            }

            // TODO(Russell): Load the individual checkpoint times for the all players.
            // TODO(Russell): Start the race's count-down after a few second's wait.
        });
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

            this.playerVehicles_.set(player, vehicle);
        }
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the race is ready to start. This is where they will actually begin racing, so
    // all players will be unfrozen and we wish them the best of luck.
    onStart() {
        // TODO(Russell): Start the high-resolution race progress ticker.
        // TODO(Russell): Enable unlimited NOS for the vehicles.

        // Unfreeze all players and allow them to begin racing.
        for (const player of this.activePlayers)
            player.controllable = true;

        this.startTime_ = highResolutionTime();

        return Promise.resolve();
    }

    // Creates the next checkpoint for the |player|, optionally with a given |checkpointIndex|. The
    // entry-promise for the checkpoint will be directed to this function as well.
    nextCheckpoint(player, checkpointIndex = 0) {
        const checkpoints = this.race_.checkpoints;

        // Check whether the |player| has passed the final checkpoint.
        if (checkpointIndex >= checkpoints.length) {
            // TODO(Russell): Show the score board for the player before removing them from the
            // race, to congratulate them on their winning.

            // TODO(Russell): Finalize the player's time to make sure we store the correct value
            // in the database, not the time including the congratulation message.

            this.removePlayer(player, Minigame.REASON_FINISHED);
            return;
        }

        // Record the time at which the |player| passed the checkpoint. Does not apply to the first
        // checkpoint, because that will be shown to them in the loading phase.
        if (checkpointIndex > 0)
            ; // TODO(Russell): Record the time at which the player passed this checkpoint.

        // Trigger a scoreboard update because the positions between the players may have changed.
        // Does not apply to the first checkpoint.
        if (checkpointIndex > 0)
            ; // TODO(Russell): Update the score point for the players.

        const checkpoint = checkpoints[checkpointIndex];

        // Display the checkpoint to the |player|. The next checkpoint will automatically be shown
        // when they enter it, until they pass the final checkpoint of the race.
        checkpoint.displayForPlayer(player).then(() =>
            this.nextCheckpoint(player, checkpointIndex + 1));

        // Associate the |checkpoint| with the |player|.
        this.playerCheckpoints_.set(player, checkpoint);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the race has finished because of |reason|.
    onFinish(reason) {
        if (reason != Minigame.REASON_TIMED_OUT)
            return Promise.resolve();  // no special behaviour has to be applied.

        // TODO(Russell): Display out-of-time textdraws to the participants.

        return Promise.resolve();
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |vehicle| has been destroyed. The vehicle will belong to once of the race's
    // participants, in which case they will be forcefully dropped out.
    onVehicleDeath(vehicle) {
        for (const player of this.activePlayers) {
            const playerVehicle = this.playerVehicles_.get(player);
            if (playerVehicle !== vehicle)
                continue;  // it's not their vehicle

            this.removePlayer(player, Minigame.REASON_DROPPED_OUT);
            return;
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

        if (this.playerCheckpoints_.has(player))
            this.playerCheckpoints_.get(player).hideForPlayer(player);

        if (reason == Minigame.REASON_DISCONNECT)
            return;  // don't update the activity of |player| when they're disconnecting.

        if (reason == Minigame.REASON_FINISHED) {
            // TODO(Russell): Make sure that the time of the |player| gets stored in the database.
        }

        // Make sure that vehicles will collide for the player again.
        player.vehicleCollisionsEnabled = true;

        // Mark the player as being controllable again, so that they're not frozen for no reason.
        player.controllable = true;
    }
}

exports = RaceMinigame;
