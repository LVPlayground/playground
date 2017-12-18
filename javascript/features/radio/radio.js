// Copyright 2017 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Feature from 'components/feature_manager/feature.js';

import ChannelSelection from 'features/radio/channel_selection.js';
import RadioCommands from 'features/radio/radio_commands.js';
import RadioManager from 'features/radio/radio_manager.js';

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
        this.commands_ = new RadioCommands(this.manager_, this.selection_);
    }

    dispose() {
        this.commands_.dispose();
        this.manager_.dispose();
        this.selection_.dispose();
    }
}

export default Radio;
