// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { GameActivity } from 'features/games/game_activity.js';

// Encapsulates the state in a game where registrations are being accepted and tracked. Will let
// the manager know when the registration process has finished.
export class GameRegistration extends GameActivity {
    // Type of registration this instance encapsulates.
    static kTypePublic = 0;
    static kTypeRestricted = 1;

    // Returns the theoretical number of participants who can participate in a game right now. This
    // is based on the connected players, excluding bots and those who are already engaged.
    static getTheoreticalNumberOfParticipants(manager) {
        let theoreticalParticipants = 0;

        for (const player of server.playerManager) {
            if (player.isNonPlayerCharacter())
                continue;  // ignore bots
            
            const activity = manager.getPlayerActivity(player);
            if (activity && activity.getActivityState() != GameActivity.kStateRegistered)
                continue;  // they're already engaged in another game
            
            ++theoreticalParticipants;
        }

        return theoreticalParticipants;
    }

    manager_ = null;

    description_ = null;
    finished_ = false;
    settings_ = null;
    type_ = null;

    // Map from Player instance to the financial contribution they made to the game.
    players_ = null;

    // Gets the description of the game that this registration has been created for.
    get description() { return this.description_; }

    // Returns whether the registration has finished, and the game has started or been cancelled.
    hasFinished() { return this.finished_; }

    // Gets the map [player => contribution] of players who have signed up for this game.
    get players() { return this.players_; }

    // Gets the settings that should apply over this game.
    get settings() { return this.settings_; }

    // Gets the type of registration this instance deals with. One of the aforementioned statics.
    get type() { return this.type_; }

    constructor(description, settings, type, manager) {
        super();

        this.manager_ = manager;

        this.description_ = description;
        this.settings_ = settings;
        this.type_ = type;

        this.players_ = new Map();
    }

    // Registers the |player| to participate in the game this registration's for. Request for the
    // game to start if the maximum number of participants has been reached.
    registerPlayer(player, contribution) {
        if (this.players_.has(player))
            throw new Error(`${player.name} has already registered for ${this}.`);

        this.manager_.setPlayerActivity(player, /* activity= */ this);
        this.players_.set(player, contribution);

        // Start the game immediately if the maximum number of players has signed up.
        if (this.players_.size === this.description_.maximumPlayers) {
            this.start();
            return;
        }

        // Start the game immediately if the minimum number of players has been reached, and the
        // total number of registrations is equal to the number of available players.
        const availablePlayers = GameRegistration.getTheoreticalNumberOfParticipants(this.manager_);
        if (this.players_.size >= this.description_.minimumPlayers &&
                this.players_.size === availablePlayers) {
            this.start();
            return;
        }
    }
    
    // Returns the amount of money |player| has contributed to the game.
    getPlayerContribution(player) {
        if (!this.players_.has(player))
            throw new Error(`${player.name} has not yet registered for ${this}.`);
        
        return this.players_.get(player);
    }

    // Removes the |player| from the list of people registered to participate in this game. If there
    // are no more participants left, the game can be disposed of.
    removePlayer(player) {
        if (!this.players_.has(player))
            throw new Error(`${player.name} has not yet registered for ${this}.`);

        this.manager_.setPlayerActivity(player, /* activity= */ null);
        this.players_.delete(player);
        
        // Immediately cancel the registration if there are no players left in this game.
        if (!this.players_.size) {
            this.manager_.cancelGameRegistration(this);
            this.finished_ = true;
        }
    }

    // ---------------------------------------------------------------------------------------------
    // Internal functionality

    // Proceeds from accepting further registrations to actually starting the game, by requesting
    // the manager to do so. Verify once again that all requirements have been met.
    start() {
        this.finished_ = true;

        if (this.players_.size < this.description_.minimumPlayers)
            throw new Error(`Attempting to start ${this} with less than the required players.`);
        
        if (this.players_.size > this.description_.maximumPlayers)
            throw new Error(`Attempting to start ${this} with more than the allowed players.`);

        this.manager_.runGame(this.description_, this);
    }

    // ---------------------------------------------------------------------------------------------
    // GameActivity implementation

    getActivityState() { return GameActivity.kStateRegistered; }
    getActivityName() { return this.description_.nameFn(this.settings_); }
}
