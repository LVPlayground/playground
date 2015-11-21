// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let Countdown = require('features/races/ui/countdown.js'),
    RaceExpired = require('features/races/ui/race_expired.js'),
    RaceParticipant = require('features/races/race_participant.js'),
    RaceParticipants = require('features/races/race_participants.js'),
    RaceSettings = require('features/races/race_settings.js'),
    ScopedCallbacks = require('base/scoped_callbacks.js'),
    ScopedEntities = require('entities/scoped_entities.js');

// This class defines the behavior of a race that is currently active, whereas active is defined by
// being at least in the sign-up state.
class RunningRace {
  constructor(race, player, skipSignup, manager) {
    this.participants_ = new RaceParticipants();
    this.finishedCount_ = 0;
    this.race_ = race;
    this.state_ = RunningRace.STATE_SIGNUP;
    this.manager_ = manager;

    // Acquire a unique virtual world for this race to take place in.
    this.virtualWorld_ = VirtualWorld.acquire('RunningRace (' + race.id + ')');

    // Mapping of a player id to the vehicle they will be driving in.
    this.vehicles_ = {};

    // Scope all entities created by this race to the lifetime of the race.
    this.entities_ = new ScopedEntities();

    // Create a promise that is to be resolved when the race has finished.
    this.finishedPromise_ = new Promise(resolve =>
        this.resolveFinishedPromise_ = resolve);

    // Sign the first player up for the race.
    this.addPlayer(player);

    // Advance the state to loading if the sign-up state for the race should be skipped. Mind that
    // the race may already be in loading state if it has a maximum of one player. If the sign-up
    // state should not be skipped, advance the state after a certain number of seconds.
    if (skipSignup)
      this.advanceState(RunningRace.STATE_LOADING);
    else
      wait(RaceSettings.RACE_SIGNUP_WAIT_DURATION).then(() => this.advanceState(RunningRace.STATE_LOADING));

    // Listen to the required callbacks. Use a scoped callbacks object because this object is
    // ephemeral, and the listeners won't be necessary after the race has finished.
    this.callbacks_ = new ScopedCallbacks();
    this.callbacks_.addEventListener('playerdeath', this.__proto__.onPlayerDeathOrDisconnect.bind(this));
    this.callbacks_.addEventListener('playerdisconnect', this.__proto__.onPlayerDeathOrDisconnect.bind(this));
  }

  // Returns a promise that will be resolved when the race has finished.
  get finished() { return this.finishedPromise_; }

  // Returns the Race instance which this running race will host.
  get race() { return this.race_; }

  // Removes |participant| from the group of players participating in this race. If there are no
  // players left anymore, the race will advance to the FINISHED state.
  removeParticipant(participant) {
    participant.advance(RaceParticipant.STATE_DROP_OUT);

    let player = participant.player;

    // Destroy the created state for the player when they leave the race.
    if (this.state_ >= RunningRace.STATE_LOADING) {
      this.manager_.deathFeed.enableForPlayer(player);
      participant.scoreBoard.hideForPlayer();
    }

    // Mark the player as being controllable again, so that they're not frozen for no reason.
    player.controllable = true;

    // TODO: Restore the |player|'s state if |this.stage_| >= RunningRace.STATE_COUNTDOWN.
    
    // Hide the next checkpoint if it's still being displayed for |participant|.
    let lastCheckpoint = participant.checkpointIndex;
    if (lastCheckpoint !== null && lastCheckpoint < this.race_.checkpoints.length - 1)
      this.race_.checkpoints[lastCheckpoint + 1].hideForPlayer(player);

    // Finish the race if there are no more racing participants left.
    if (!this.participants_.racingPlayerCount())
      this.advanceState(RunningRace.STATE_FINISHED);
  }

  // -----------------------------------------------------------------------------------------------

  // Called when a player either dies or disconnects from the server. In both cases, they will be
  // removed from the race if they were a participant of it.
  onPlayerDeathOrDisconnect(event) {
    let player = Player.get(event.playerid);
    if (player === null)
      return;

    let participant = this.participants_.participantForPlayer(player);
    if (participant === null)
      return;

    this.removeParticipant(participant);
  }

  // -----------------------------------------------------------------------------------------------

  // Advances the running race to |state|. The state of the race can only advance, it can never be
  // returned to a previous state.
  advanceState(state) {
    if (this.state_ >= state)
      return;  // ignore 'updates' to the current or previous states.

    this.state_ = state;
    switch (this.state_) {
      // Load the race's state - create the required vehicles and objects, move players to the
      // virtual world, and apply environmental settings of the race.
      case RunningRace.STATE_LOADING:
        if (!this.createVehicles() ||
            !this.createObjects() ||
            !this.preparePlayers())
          break;

        // Automatically advance the race's state to countdown after a short period of time.
        Promise.all([
          this.participants_.loadParticipantData(this.race.id, this.manager_.database),
          wait(RaceSettings.RACE_LOADING_WAIT_DURATION)

        ]).then(() => this.advanceState(RunningRace.STATE_COUNTDOWN));
        break;

      // Waits for a certain number of seconds before allowing the players to start racing. The
      // countdown will be visible on the screens of all participants of the race.
      case RunningRace.STATE_COUNTDOWN:
        Countdown.startForParticipants(RaceSettings.RACE_COUNTDOWN_SECONDS, this.participants_).then(() =>
            this.advanceState(RunningRace.STATE_RUNNING));
        break;

      // State in which the players are actually racing against each other. Provide timely score
      // board updates and keep track of the player's positions.
      case RunningRace.STATE_RUNNING:
        this.updateScoreBoard();
        this.startRace();

        // If the race has a time limit set, advance to the out-of-time state after it passes.
        if (this.race_.timeLimit != 0)
          wait(this.race_.timeLimit * 1000).then(() => this.advanceState(RunningRace.STATE_OUT_OF_TIME));

        break;

      // State that occurs when one or more players are still racing, but the maximum time of the
      // race has expired. They'll be shown a message, after which they'll forcefully drop out.
      case RunningRace.STATE_OUT_OF_TIME:
        RaceExpired.displayForParticipants(RaceSettings.RACE_OUT_OF_TIME_WAIT_DURATION, this.participants_).then(() =>
            this.advanceState(RunningRace.STATE_FINISHED));
        break;

      // The race is finished. Finalize, then remove the race's state and announce accordingly.
      case RunningRace.STATE_FINISHED:
        this.finish();
        break;
    }
  }

  // -----------------------------------------------------------------------------------------------
  // State: RunningRace.STATE_SIGNUP
  // -----------------------------------------------------------------------------------------------

  addPlayer(player) {
    let participant = this.participants_.participantForPlayer(player);
    if (this.state_ != RunningRace.STATE_SIGNUP || participant !== null)
      return;  // this should never happen.

    this.participants_.addPlayer(player);

    // Advance to the loading state if the race is full.
    if (this.race_.maxPlayers == this.participants_.racingPlayerCount())
      this.advanceState(RunningRace.STATE_LOADING);
  }

  // -----------------------------------------------------------------------------------------------
  // State: RunningRace.STATE_LOADING
  // -----------------------------------------------------------------------------------------------

  createVehicles() {
    let spawnPositions = this.race_.spawnPositions,
        playerSpawnPositionIndex = 0;

    for (let participant of this.participants_.racingParticipants()) {
      let spawn = spawnPositions[playerSpawnPositionIndex++];
      let vehicle = this.entities_.createVehicle({
        modelId: spawn.vehicle.model,
        position: spawn.position,
        rotation: spawn.rotation,
        colors: spawn.vehicle.colors
      });

      // Link the vehicle to the race's virtual world and interior (unless it's in the main world).
      vehicle.virtualWorld = this.virtualWorld_;
      if (this.race_.interior != 0)
        vehicle.interior = this.race_.interior;

      // If the vehicle should have nitrous oxide systems, make sure to create them.
      switch (spawn.vehicle.nos) {
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

      this.vehicles_[participant.playerId] = vehicle;
    }

    return true;
  }

  createObjects() {
    // TODO: Create the objects required for the race.
    return true;
  }

  preparePlayers() {
    let playerVehicleIndex = 0;

    for (let participant of this.participants_.racingParticipants()) {
      let player = participant.player;

      // TODO: Store the player's state so that it can be restored later.

      // Disable the death feed for the player, we'll use that space for a scoreboard.
      this.manager_.deathFeed.disableForPlayer(player);

      // Move the player to the right virtual world and interior for the race.
      player.virtualWorld = this.virtualWorld_;
      player.interior = this.race_.interior;

      // Put the player in their designated 
      player.putInVehicle(this.vehicles_[player.id]);

      // Freeze the player so that they can't begin racing yet.
      player.controllable = false;

      // Apply the environmental settings for the race, i.e. the time and weather.
      player.weather = this.race_.weather;
      player.time = this.race_.time;

      // Create the score board for the player. This will visually render the current status of the
      // race on their screen, like the current time and contestants.
      participant.scoreBoard.displayForPlayer();

      // Create the first checkpoint for the player. They won't be able to drive yet.
      this.nextCheckpoint(participant, 0 /* first checkpoint */);
    }

    return true;
  }

  // -----------------------------------------------------------------------------------------------
  // State: RunningRace.STATE_RUNNING
  // -----------------------------------------------------------------------------------------------

  startRace() {
    let startTime = highResolutionTime();

    for (let participant of this.participants_.racingParticipants()) {
      participant.advance(RaceParticipant.STATE_RACING, startTime);
      participant.player.controllable = true;
    }
  }

  updateScoreBoard() {
    if (this.state_ != RunningRace.STATE_RUNNING)
      return;  // no need to update the score board when the race has finished.

    let currentTime = highResolutionTime();
    for (let participant of this.participants_.racingParticipants()) {
      if (participant.state != RaceParticipant.STATE_RACING)
        continue;

      participant.scoreBoard.update(currentTime);
    }

    // Schedule another update of the score board after a given amount of milliseconds.
    wait(RaceSettings.RACE_SCORE_BOARD_UPDATE_TIME).then(() => this.updateScoreBoard());
  }

  nextCheckpoint(participant, index) {
    if (this.state_ != RunningRace.STATE_RUNNING && index !== 0)
      return;  // they must've unfreezed themselves.

    // If the participant just passed the final checkpoint, mark them as having finished the game.
    // Their state will be advanced by the didFinish method, no need to record the time.
    if (index >= this.race_.checkpoints.length) {
      this.didFinish(participant);
      return;
    }

    // Record the time at which they passed a checkpoint. This does not apply to the very first
    // checkpoint that's being shown, given that they actually have to pass one.
    if (index > 0)
      participant.recordCheckpointTime(index - 1, highResolutionTime());

    // Trigger a score board update for calculating the positions between the players, unless the
    // race has not started yet (i.e. this is the first checkpoint).
    if (index > 0)
      this.participants_.updateParticipantPositions();

    // Display the next check point for the participant - they can continue.
    this.race_.checkpoints[index].displayForPlayer(participant.player).then(() => {
      this.nextCheckpoint(participant, index + 1);

    }, error => {
      // They either disconnected from the server, or dropped out of the race for another reason.
      // Nothing to worry about, so we discard the promise rejection.
    });
  }

  didFinish(participant) {
    participant.advance(RaceParticipant.STATE_FINISHED, highResolutionTime());
    participant.rank = ++this.finishedCount_;

    // Trigger a score board update for calculating the positions between the players.
    this.participants_.updateParticipantPositions();

    let raceTimeSeconds = Math.round(participant.totalTime / 1000);

    // If this participant beat the current high-score of the race, update the cached performance.
    if (this.race.bestRace === null || this.race.bestRace.time > raceTimeSeconds) {
      this.race.bestRace = {
        time: raceTimeSeconds,
        name: participant.playerName
      };
    }

    // TODO: Display some visual banner to congratulate them with their win.
    console.log(participant.playerName + ' has finished the race!');

    // Make the player uncontrollable - let them roll out for a few seconds.
    participant.player.controllable = false;

    // Remove the player from the race after a few seconds have passed, let their result sink in.
    wait(RaceSettings.RACE_FINISHED_WAIT_DURATION).then(() =>
        this.removeParticipant(participant));
  }

  // -----------------------------------------------------------------------------------------------
  // State: RunningRace.STATE_FINISHED
  // -----------------------------------------------------------------------------------------------

  finish() {
    for (let participant of this.participants_.racingParticipants()) {
      participant.advance(RaceParticipant.STATE_DROP_OUT);

      // Forcefully remove them from the race.
      this.removeParticipant(participant);
    }

    this.callbacks_.dispose();
    this.entities_.dispose();

    VirtualWorld.release(this.virtualWorld_);

    this.resolveFinishedPromise_(this.participants_.finishedParticipants());
  }
};

// The states a running race can be in. The names should be self-explanatory.
RunningRace.STATE_SIGNUP = 0;
RunningRace.STATE_LOADING = 1;
RunningRace.STATE_COUNTDOWN = 2;
RunningRace.STATE_RUNNING = 3;
RunningRace.STATE_OUT_OF_TIME = 4;
RunningRace.STATE_FINISHED = 5;

exports = RunningRace;
