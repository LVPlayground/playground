// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Administrators can get announcements about pretty much everything that happens on the server.
// Unless such announcements are filtered, they would be subject to an incredible firehose of
// messages which is undesirable. Announcements are therefore separated into channels that can be
// toggled individually, or based on a verbosity preset.
class AdministratorChannels {
    constructor() {
        this.categories_ = new Map();
        this.channels_ = new Map();

        // The channels are defined in an external JavaScript file for readability reasons.
        const channels = require('features/communication/administrator_channels.list.js');

        // Function to alphabetically sort the channels defined in the |channels|.
        const alphabeticalSortFn = (lhs, rhs) => lhs.value.localeCompare(rhs.value);

        // Now import the administrator channels based on the static configuration.
        for (const [channelId, channelInfo] of channels.sort(alphabeticalSortFn).entries()) {
            this.channels_.set(channelInfo.value, {
                id: channelId,
                description: channelInfo.description,
                verbosity: channelInfo.verbosity
            });

            const [category, channel] = channelInfo.value.split('/');

            if (!this.categories_.has(category))
                this.categories_.set(category, new Set());

            this.categories_.get(category).add(channel);
        }
    }

    // Gets the number of channels that have been defined.
    get count() { return this.channels_.size; }

    // Gets an iterator for the available channel categories, sorted by name.
    get categories() { return this.categories_.entries(); }

    // Gets an iterator for the available channels within a category, sorted by name.
    getChannels(category) {
        if (!this.categories_.has(category))
            throw new Error('The given |category| does not contain any known channels.');

        return this.categories_.get(category).values();
    }

    // Gets the verbosity of a given |channelName|. Will always show messages for unknown channels.
    getVerbosity(channelName) {
        const channel = this.channels_.get(channelName);
        if (!channel) {
            if (!server.isTest())
                console.log('Warning: Requested verbosity for invalid channel: ' + channelName);

            return AdministratorChannels.VERBOSITY_ALL;
        }

        return channel.verbosity;
    }
}

// The give predefined verbosity levels, in order of message volume.
AdministratorChannels.VERBOSITY_NONE = 0;
AdministratorChannels.VERBOSITY_CRITICAL = 1;
AdministratorChannels.VERBOSITY_NORMAL = 2;
AdministratorChannels.VERBOSITY_HIGH = 3;
AdministratorChannels.VERBOSITY_ALL = 4;

// Custom verbosity level that indicates that the administrator will apply their own configuration.
// In this mode, channels are enabled by default, but can be disabled manually.
AdministratorChannels.VERBOSITY_CUSTOM = 5;

exports = AdministratorChannels;
