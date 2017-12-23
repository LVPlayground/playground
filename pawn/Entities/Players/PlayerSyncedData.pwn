// Copyright 2006-2017 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

// Provided by PlaygroundJS for updating JavaScript data.
native UpdatePlayerSyncedData(playerId, property, intValue, Float: floatValue, stringValue[]);

enum PlayerSyncedDataProperty {
    PREFERRED_RADIO_CHANNEL = 0,
    ISOLATED = 1
};

#define INVALID_INT 0
#define INVALID_FLOAT 0.0
#define INVALID_STRING ""

// Bridges between Pawn and JavaScript for a number of player-related settings. Changes to any of
// these values will be reflected in the JavaScript code, and vice versa.
class PlayerSyncedData <playerId (MAX_PLAYERS)> {
    new bool: m_isolated;
    new m_preferredRadioChannel[64];

    public reset() {
        m_isolated = false;
        m_preferredRadioChannel[0] = 0;
    }

    // ---------------------------------------------------------------------------------------------

    public bool: isolated() {
        return m_isolated;
    }

    public setIsolated(bool: isolated) {
        m_isolated = isolated;
        this->sync(ISOLATED);
    }

    // ---------------------------------------------------------------------------------------------

    public inline preferredRadioChannel() {
        return m_preferredRadioChannel;
    }

    public setPreferredRadioChannel(preferredRadioChannel[]) {
        format(m_preferredRadioChannel, sizeof(m_preferredRadioChannel), "%s", preferredRadioChannel);
        this->sync(PREFERRED_RADIO_CHANNEL);
    }

    // ---------------------------------------------------------------------------------------------

    public sync(PlayerSyncedDataProperty: property) {
        switch (property) {
            // Integral properties.
            case ISOLATED:
                UpdatePlayerSyncedData(playerId, _: property, m_isolated ? 1 : 0, INVALID_FLOAT, INVALID_STRING);

            // Textual properties.
            case PREFERRED_RADIO_CHANNEL:
                UpdatePlayerSyncedData(playerId, _: property, INVALID_INT, INVALID_FLOAT, m_preferredRadioChannel);
        }
    }

    public apply(PlayerSyncedDataProperty: property, intValue, Float: floatValue, stringValue[]) {
        switch (property) {
            case ISOLATED:
                m_isolated = !!intValue;

            case PREFERRED_RADIO_CHANNEL:
                format(m_preferredRadioChannel, sizeof(m_preferredRadioChannel), "%s", stringValue);
        }

        #pragma unused floatValue
    }
};

forward OnPlayerSyncedDataChange(playerId, property, intValue, Float: floatValue, stringValue[]);
public OnPlayerSyncedDataChange(playerId, property, intValue, Float: floatValue, stringValue[]) {
    if (!Player(playerId)->isConnected())
        return;

    PlayerSyncedData(playerId)->apply(PlayerSyncedDataProperty: property, intValue, floatValue, stringValue);
}

#undef INVALID_INT
#undef INVALID_FLOAT
#undef INVALID_STRING
