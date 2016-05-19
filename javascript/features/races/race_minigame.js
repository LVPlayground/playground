// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Countdown = require('features/races/ui/countdown.js');
const DestroyedVehicleMessage = require('features/races/ui/destroyed_vehicle_message.js');
const FinishedMessage = require('features/races/ui/finished_message.js');
const LeaveVehicleMessage = require('features/races/ui/leave_vehicle_message.js');
const Minigame = require('features/minigames/minigame.js');
const RaceExpiredMessage = require('features/races/ui/race_expired_message.js');
const RacePlayerData = require('features/races/race_player_data.js');
const Vector = require('base/vector.js');

// Frequency at which infinite nitro should be given to vehicles. In milliseconds.
const InfiniteNitroInterval = 20000;

// Frequency at which a race's update ticker will be updating. In milliseconds.
const UpdateTickerInterval = 147;

// This class represents an on-going race minigame. The race defines the maximum number of players,
// and the lifetime of the minigame will be controlled by the minigame manager.
class RaceMinigame extends Minigame {
    constructor(race, database) {
        console.log('[Race] Race "' + race.name + '" has been created.');

        super({
            name: race.name,
            command: '/race ' + race.id,
            timeout: race.timeLimit,
            maximumParticipants: race.maxPlayers
        });

        this.race_ = race;
        this.database_ = database;

        // Update counter for resetting vehicle damages if vehicles should have godmode.
        this.resetVehicleDamageCounter_ = 0;

        // Number of players who have successfully finished the race already.
        this.finishedPlayers_ = 0;

        // Map of the engaged players to their player data.
        this.playerData_ = new Map();

        // High-resolution timestamp at which the race actually started.
        this.startTime_ = null;
    }

    // Gets access to the race that this minigame represents.
    get race() { return this.race_; }

    // Returns the RacePlayerData object associated with |player|.
    dataForPlayer(player) {
        return this.playerData_.get(player);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |player| has signed up to participate in this race.
    onPlayerAdded(player) {
        player.activity = Player.PLAYER_ACTIVITY_JS_RACE;

        this.playerData_.set(player, new RacePlayerData(player));
    }

    // Called when the race advances to loading state. This created the required entities, makes
    // sure that all players are in the appropriate world and displays the count-down for them. 
    onLoad() {
        return Promise.resolve().then(() => {
            this.createObjects();

            let currentSpawnIndex = 0;

            // Position each of the players, in frozen state, where their vehicle will spawn. This
            // might mitigate some of the object loading difficulties we've been seeing.
            for (const player of this.activePlayers) {
                const spawnPosition = this.race_.spawnPositions[currentSpawnIndex++];
                const position = spawnPosition.position;

                // Position the player slightly above their vehicle, facing the right way.
                player.position = new Vector(position.x, position.y, position.z + 0.75);
                player.rotation = spawnPosition.rotation;

                // Move the player to the right virtual world and interior for the race.
                player.virtualWorld = this.virtualWorld;
                player.interior = this.race_.interior;

                // Apply the environmental effects of the race (weather, time) to the player.
                player.weather = this.race_.weather;
                player.time = this.race_.time;

                // Freeze the player so that they cannot begin racing yet.
                player.controllable = false;

                // Force a streamer update for the player, to make sure everything is in place.
                player.updateStreamer(position, this.virtualWorld, this.race_.interior,
                                      0 /* STREAMER_TYPE_OBJECT */);
            }

            return wait(1500);

        }).then(() => {
            this.createVehicles();

            const participantCount = this.activePlayers.size;

            // Prepare each of the players that will be participating in the race.
            for (const player of this.activePlayers) {
                const playerData = this.dataForPlayer(player);

                // Put the player in their designated vehicle, and disable collisions for them.
                player.putInVehicle(playerData.vehicle);
                player.vehicleCollisionsEnabled = false;

                // Display the score board for the |player|.
                playerData.scoreBoard.displayForPlayer(participantCount);
                
                // Create the first checkpoint for the player, so they know where to go.
                this.nextCheckpoint(player);
            }

            return Promise.all([
                Countdown.displayForPlayers(this.activePlayers),
                this.loadCheckpointDataForPlayers()
            ]);
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

            this.dataForPlayer(player).vehicle = vehicle;
        }
    }

    // Loads the checkpoint times for the best run in this race for each of the participants. As
    // the data is coming from the database, this is a synchronous operation.
    loadCheckpointDataForPlayers() {
        let registeredPlayers = {};

        for (const player of this.activePlayers) {
            if (player.isRegistered())
                registeredPlayers[player.userId] = player;
        }

        const userIds = Object.keys(registeredPlayers);
        if (!userIds.length)
            return;  // skip the database completely if there are no registered players.

        const raceId = this.race_.id;

        return this.database_.loadBestResultsForParticipants(raceId, userIds).then(results => {
            Object.keys(results).forEach(userId => {
                const player = registeredPlayers[userId];
                const playerData = this.dataForPlayer(player);

                playerData.importResults(results[userId]);
            });
        });
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the race is ready to start. This is where they will actually begin racing, so
    // all players will be unfrozen and we wish them the best of luck.
    onStart() {
        console.log('[Race] Race "' + this.race_.name + '" has started.');

        this.updateInfiniteNitro();
        this.updateTicker();

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
        const playerData = this.dataForPlayer(player);

        // Record the time at which the |player| passed the checkpoint. Does not apply to the first
        // checkpoint, because that will be shown to them in the loading phase.
        if (checkpointIndex > 0)
            playerData.recordTime(checkpointIndex - 1, highResolutionTime() - this.startTime_);

        // Check whether the |player| has passed the final checkpoint.
        if (checkpointIndex >= checkpoints.length) {
            playerData.finished = true;

            FinishedMessage.displayForPlayer(player).then(() =>
                this.removePlayer(player, Minigame.REASON_FINISHED));

            return;
        }

        const checkpoint = checkpoints[checkpointIndex];

        // Trigger a scoreboard update because the positions between the players may have changed.
        // Does not apply to the first checkpoint.
        if (checkpointIndex > 0)
            this.updateScoreboardPositions();

        // Display the checkpoint to the |player|. The next checkpoint will automatically be shown
        // when they enter it, until they pass the final checkpoint of the race.
        checkpoint.displayForPlayer(player).then(() =>
            this.nextCheckpoint(player, checkpointIndex + 1));

        // Associate the |checkpoint| with the |player|.
        playerData.checkpoint = checkpoint;
    }

    // Grants and ensures infinite nitro for all active vehicles in the race while the race is
    // running. Only enabled when the race's settings allow for this.
    updateInfiniteNitro() {
        if (this.state != Minigame.STATE_RUNNING)
            return;  // the race has finished, no need to give infinite nitro.

        if (!this.race_.unlimitedNos)
            return;  // the race does not have unlimited nitro for its vehicles.

        for (const player of this.activePlayers)
            this.dataForPlayer(player).vehicle.addComponent(Vehicle.COMPONENT_NOS_SINGLE_SHOT);

        // Schedule another round of NOS component updates after a given amount of milliseconds.
        wait(InfiniteNitroInterval).then(() => this.updateInfiniteNitro());
    }

    // High-resolution update ticker that will be updated as long as the race is in progress. It
    // increases the timers on the participant's score boards, and implements vehicle god mode.
    updateTicker() {
        if (this.state != Minigame.STATE_RUNNING)
            return;  // the race has finished, no need to run the update ticker.

        // Repair a vehicle once every seven score board updates if so desired by the race's
        // settings. This makes the vehicle they're driving in pretty much invincible.
        const repairVehicles = this.race_.disableVehicleDamage &&
                               this.resetVehicleDamageCounter_++ % 7 == 0;

        // The runtime of the current race, in milliseconds.
        const runtime = highResolutionTime() - this.startTime_;

        for (const player of this.activePlayers) {
            const playerData = this.dataForPlayer(player);
            if (playerData.finished)
                continue;  // the player has finished the race already.

            // Update the score board belonging to the player with the latest run-timer.
            playerData.scoreBoard.update(runtime);

            if (repairVehicles)
                playerData.vehicle.repair();
        }

        wait(UpdateTickerInterval).then(() => this.updateTicker());
    }

    // Will update the scoreboards with the new positions between the participating players.
    updateScoreboardPositions() {
        let activeParticipantData = [];
        for (const player of this.activePlayers)
            activeParticipantData.push(this.dataForPlayer(player));

        activeParticipantData.sort((lhs, rhs) => {
            if (lhs.checkpointIndex != rhs.checkpointIndex)
                return lhs.checkpointIndex > rhs.checkpointIndex ? -1 : 1;

            return lhs.checkpointTime > rhs.checkpointTime ? 1 : -1;
        });

        let position = 1;
        activeParticipantData.forEach(data =>
            data.scoreBoard.updatePositionIfNeeded(position++, activeParticipantData.length));
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the race has finished because of |reason|.
    onFinish(reason) {
        console.log('[Race] Race "' + this.race_.name + '" has finished.');

        if (reason != Minigame.REASON_TIMED_OUT)
            return Promise.resolve();  // no special behaviour has to be applied.

        return RaceExpiredMessage.displayForPlayers(this.activePlayers);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when |player| has left their vehicle. If the race does not allow for this, they will
    // be forcefully dropped out as a consequence of this.
    onPlayerLeaveVehicle(player) {
        if (this.race_.allowLeaveVehicle)
            return;

        this.dataForPlayer(player).finished = true;

        LeaveVehicleMessage.displayForPlayer(player).then(() =>
            this.removePlayer(player, Minigame.REASON_DROPPED_OUT));
    }

    // Called when the |vehicle| has been destroyed. The vehicle will belong to once of the race's
    // participants, in which case they will be forcefully dropped out.
    onVehicleDeath(vehicle) {
        for (const player of this.activePlayers) {
            const playerVehicle = this.dataForPlayer(player).vehicle;
            if (playerVehicle !== vehicle)
                continue;  // it's not their vehicle

            this.dataForPlayer(player).finished = true;

            DestroyedVehicleMessage.displayForPlayer(player).then(() =>
                this.removePlayer(player, Minigame.REASON_DROPPED_OUT));
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

        const playerData = this.dataForPlayer(player);

        const rank = ++this.finishedPlayers_;
        const totalTime = playerData.checkpointTime;
        const checkpointTimes = playerData.checkpointTimes;

        playerData.dispose();

        if (reason == Minigame.REASON_DISCONNECT)
            return;  // don't update the activity of |player| when they're disconnecting.

        // Make sure that vehicles will collide for the player again.
        player.vehicleCollisionsEnabled = true;

        // Mark the player as being controllable again, so that they're not frozen for no reason.
        player.controllable = true;

        if (reason != Minigame.REASON_FINISHED || !player.isRegistered())
            return;  // the race's result does not have to be stored

        // Store the player's result in the database.
        this.database_.storeRaceResult(
            this.race_.id, player.userId, rank, totalTime, checkpointTimes);
    }

    dispose() {
        console.log('[Race] Race "' + this.race_.name + '" has been been disposed.');
    }
}

exports = RaceMinigame;
