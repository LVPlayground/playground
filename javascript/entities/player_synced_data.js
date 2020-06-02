// Copyright 2017 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Bridges between Pawn and JavaScript for a number of player-related settings. Changes to any of
// these values will be reflected in the Pawn code, and vice versa.
class PlayerSyncedData {
    constructor(playerId) {
        this.playerId_ = playerId;

        this.collectables_ = 0;
        this.isolated_ = false;
        this.minigameName_ = '';
        this.preferredRadioChannel_ = '';
        this.vehicleKeys_ = 0;
    }

    // Gets or sets the number of collectables that have been collected by the player. This value
    // can only be updated from JavaScript, but is accessible by Pawn.
    get collectables() { return this.collectables_; }
    set collectables(value) {
        if (typeof value !== 'number')
            throw new Error('The collectables property must be a number.');

        this.collectables_ = value;
        this.sync(PlayerSyncedData.COLLECTABLES, value);
    }

    // Gets or sets whether this player is isolated. This means that they've been banished to a
    // Virtual World of their own, with (silently) no means of communicating with other players.
    isIsolated() { return this.isolated_; }
    setIsolated(value) {
        if (typeof value !== 'boolean')
            throw new Error('The isolated property must be a boolean.');

        this.isolated_ = value;
        this.sync(PlayerSyncedData.ISOLATED, value);
    }

    // Gets or sets the name of the game that the player is currently engaged with. This will tell
    // Pawn and/or JavaScript that the player should not be able to sign up for anything else.
    get minigameName() { return this.minigameName_; }
    set minigameName(value) {
        value = value ?? '';  // allow this to be set to null

        if (typeof value !== 'string')
            throw new Error('The minigameName property must be a string.');

        this.minigameName_ = value;
        this.sync(PlayerSyncedData.MINIGAME_NAME, value);
    }

    // Gets or sets the vehicle keys, which control which vehicle shortcuts are available to the
    // player. These are features that can be unlocked through collectables.
    get vehicleKeys() { return this.vehicleKeys_; }
    set vehicleKeys(value) {
        if (typeof value !== 'number')
            throw new Error('The vehicle keys must be set as a number.');

        this.vehicleKeys_ = value;
        this.sync(PlayerSyncedData.VEHICLE_KEYS, value);
    }

    // ---------------------------------------------------------------------------------------------

    // Gets or sets the preferred radio channel for this player. Must be a string.
    get preferredRadioChannel() { return this.preferredRadioChannel_; }
    set preferredRadioChannel(value) {
        if (typeof value !== 'string')
            throw new Error('The preferredRadioChannel property must be a string.');

        this.preferredRadioChannel_ = value;
        this.sync(PlayerSyncedData.PREFERRED_RADIO_CHANNEL, value);
    }

    // ---------------------------------------------------------------------------------------------

    // Synchronizes the value for |property| with Pawn.
    async sync(property, value) {
        if (server.isTest())
            return;  // nothing to sync when running a test

        await milliseconds(1);  // avoid call re-entrancy
        switch (property) {
            // Integral properties.
            case PlayerSyncedData.COLLECTABLES:
            case PlayerSyncedData.VEHICLE_KEYS:
                pawnInvoke('OnPlayerSyncedDataChange', 'iiifs', this.playerId_, property, value,
                           0.0 /* invalid float */, '' /* empty string */);
                break;

            case PlayerSyncedData.ISOLATED:
                pawnInvoke('OnPlayerSyncedDataChange', 'iiifs', this.playerId_, property,
                           value ? 1 : 0, 0.0 /* invalid float */, '' /* empty string */);
                break;

            // Textual properties.
            case PlayerSyncedData.MINIGAME_NAME:
            case PlayerSyncedData.PREFERRED_RADIO_CHANNEL:
                pawnInvoke('OnPlayerSyncedDataChange', 'iiifs', this.playerId_, property,
                           0 /* invalid int */, 0.0 /* invalid float */, value);
                break;

            default:
                throw new Error('Attempting to sync an invalid property: ' + property);
        }
    }

    // Called when a property update has been received from Pawn. No synchronization calls will be
    // issued as that would create a loop. |event| is {property, intValue, floatValue, stringValue}.
    apply(property, intValue, floatValue, stringValue) {
        switch (property) {
            case PlayerSyncedData.COLLECTABLES:
            case PlayerSyncedData.VEHICLE_KEYS:
                throw new Error('This value is not meant to be changed by Pawn.');

            case PlayerSyncedData.ISOLATED:
                this.isolated_ = !!intValue;
                break;
            case PlayerSyncedData.MINIGAME_NAME:
                this.minigameName_ = stringValue;
                break;
            case PlayerSyncedData.PREFERRED_RADIO_CHANNEL:
                this.preferredRadioChannel_ = stringValue;
                break;
        }
    }
}

// Setting keys for the individual properties.
// Next ID: 5
PlayerSyncedData.COLLECTABLES = 3;
PlayerSyncedData.ISOLATED = 1;
PlayerSyncedData.MINIGAME_NAME = 2;
PlayerSyncedData.PREFERRED_RADIO_CHANNEL = 0;
PlayerSyncedData.VEHICLE_KEYS = 4;


export default PlayerSyncedData;
