// Copyright 2017 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Bridges between Pawn and JavaScript for a number of player-related settings. Changes to any of
// these values will be reflected in the Pawn code, and vice versa.
class PlayerSyncedData {
    constructor(playerId) {
        this.playerId_ = playerId;

        this.preferredRadioChannel_ = '';
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
        await milliseconds(1);  // avoid call re-entrancy
        switch (property) {
            // Textual properties.
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
            case PlayerSyncedData.PREFERRED_RADIO_CHANNEL:
                this.preferredRadioChannel_ = stringValue;
                break;
        }
    }
}

// Setting keys for the individual properties.
PlayerSyncedData.PREFERRED_RADIO_CHANNEL = 0;

exports = PlayerSyncedData;
