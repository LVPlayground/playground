// Copyright 2017 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Channel from 'features/radio/channel.js';

// JSON configuration file containing the radio channel selection.
const ConfigurationFile = 'data/radio.json';

// Represents the selection of channels that's available for players to chose from. Also keeps track
// of the default radio channel.
class ChannelSelection {
    constructor(announce, settings) {
        this.announce_ = announce;
        this.settings_ = settings;

        this.channels_ = [];
        this.defaultChannel_ = null;

        this.settings_().addSettingObserver(
            'radio/default_channel', this, ChannelSelection.prototype.onDefaultChannelUpdated);
    }

    // Gets an array of Channel objects representing the available radio channels.
    get channels() { return this.channels_; }

    // Gets the Channel object representing the default radio channel.
    get defaultChannel() { return this.defaultChannel_; }

    // ---------------------------------------------------------------------------------------------

    // Loads the channel selection from the `radio.json` configuration file.
    loadConfiguration() {
        this.loadConfigurationFromArray(JSON.parse(readFile(ConfigurationFile)));
    }

    // Loads the channel selection from the |configuration| array.
    loadConfigurationFromArray(configuration) {
        if (!Array.isArray(configuration) || !configuration.length)
            throw new Error('Invalid radio channel configuration supplied.');

        configuration.forEach(channelConfiguration =>
            this.channels_.push(new Channel(channelConfiguration)));

        // Trigger an update of the default channel to initialize |this.defaultChannel_|.
        this.onDefaultChannelUpdated(
            'radio/default_channel', this.settings_().getValue('radio/default_channel'));
    }

    // Called when the default channel has been updated to |value|. Validates the value and issues
    // a warning when the value is invalid.
    onDefaultChannelUpdated(setting, value) {
        for (const channel of this.channels_) {
            if (channel.name != value)
                continue;

            this.defaultChannel_ = channel;
            return;
        }

        // |value| does not represent a valid channel name when this code path is hit. Issue a
        // warning to all in-game administrators and ensure |this.defaultChannel_| is valid anyway.
        this.announce_().announceToAdministrators(
            Message.RADIO_ANNOUNCE_INVALID_DEFAULT_RADIO, value);

        this.defaultChannel_ = this.channels_[0];
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.settings_().removeSettingObserver('radio/default_channel', this);
    }
}

export default ChannelSelection;
