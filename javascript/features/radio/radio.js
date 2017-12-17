// Copyright 2017 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Feature = require('components/feature_manager/feature.js');

const ChannelSelection = require('features/radio/channel_selection.js');
const RadioManager = require('features/radio/radio_manager.js');

// Implementation of the Radio feature that allows players to listen to a variety of radio channels
// while playing on Las Venturas Playground.
class Radio extends Feature {
    constructor() {
        super();

        // Used for announcing changes in the default radio channel.
        const announce = this.defineDependency('announce');

        // There are various runtime configuration options available for the radio feature.
        const settings = this.defineDependency('settings');

        this.selection_ = new ChannelSelection(announce, settings);
        this.selection_.loadConfiguration();

        this.manager_ = new RadioManager(this.selection_, settings);
    }

    dispose() {
        this.manager_.dispose();
        this.selection_.dispose();
    }
}

exports = Radio;
