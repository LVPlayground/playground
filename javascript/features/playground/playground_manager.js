// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The playground manager provides back-end logic for the features provided as part of this module.
// It controls all settings, as well as the default values for the settings.
class PlaygroundManager {
    constructor() {
        // List of the options available as part of this feature. Must be alphabetically sorted.
        this.options_ = {
            // Enables players to give themselves a jetpack using the `/jetpack` command.
            jetpack: false
        };
    }

    // Gets a sorted array of all options available as part of this feature.
    get options() { return Object.keys(this.options_); }

    // Returns whether |option| is enabled. Will throw an exception when the option is unknown.
    isOptionEnabled(feature) {
        if (!this.options_.hasOwnProperty(feature))
            throw new Error('Invalid feature: ' + feature);

        return this.options_[feature];
    }

    // Changes the |option| to be |enabled|. Will throw an exception when the option is unknown.
    setOptionEnabled(feature, enabled) {
        if (!this.options_.hasOwnProperty(feature))
            throw new Error('Invalid feature: ' + feature);

        this.options_[feature] = !!enabled;
    }

    dispose() {

    }
}

exports = PlaygroundManager;
