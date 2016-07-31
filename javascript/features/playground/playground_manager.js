// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const PirateShipParty = require('features/playground/pirate_ship_party.js');

// The playground manager provides back-end logic for the features provided as part of this module.
// It controls all settings, as well as the default values for the settings.
class PlaygroundManager {
    constructor() {
        this.pirateShipParty_ = null;

        // List of the options available as part of this feature. Must be alphabetically sorted.
        this.options_ = {
            // Enables Party Mode on the Pirate Ship, which adds lights at various locations. Best
            // enjoyed during night-time for additional shineyness.
            party: false
        };
    }

    // Gets a sorted array of all options available as part of this feature.
    get options() { return Object.keys(this.options_); }

    // Initializes the effects of the features that are enabled by default by means of this class'
    // constructor. For example, the party on the ship can be enabled immediately.
    initialize() {
        if (this.options_.party)
            this.enableParty();
    }

    // Returns whether |option| is enabled. Will throw an exception when the option is unknown.
    isOptionEnabled(option) {
        if (!this.options_.hasOwnProperty(option))
            throw new Error('Invalid option: ' + option);

        return this.options_[option];
    }

    // Changes the |option| to be |enabled|. Will throw an exception when the option is unknown.
    // When the option has associated behaviour in this class, it will be toggled here as well.
    setOptionEnabled(option, enabled) {
        if (!this.options_.hasOwnProperty(option))
            throw new Error('Invalid option: ' + option);

        if (this.options_[option] == enabled)
            return;  // the option's enabled state already matches |enabled|.

        this.options_[option] = !!enabled;

        // Toggle the special behaviour associated with |option|.
        switch (option) {
            case 'party':
                enabled ? this.enableParty()
                        : this.disableParty();
                break;
        }
    }

    // Enables party-mode on the pirate ship by loading the object group. It will immediately be
    // applied and visible to all players in interior 0, in world 0.
    enableParty() {
        if (this.pirateShipParty_)
            return;

        this.pirateShipParty_ = new PirateShipParty();
    }

    // Disables party-mode on the pirate ship. Immediately removes all objects from the server,
    // causing the effects to go away for the players near the ship.
    disableParty() {
        if (!this.pirateShipParty_)
            return;

        this.pirateShipParty_.dispose();
        this.pirateShipParty_ = null;
    }

    dispose() {
        if (this.options_.party)
            this.disableParty();
    }
}

exports = PlaygroundManager;
