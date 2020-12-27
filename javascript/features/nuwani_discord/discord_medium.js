// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DiscordAPI } from 'features/nuwani_discord/discord_api.js';

import { encode } from 'components/networking/html_encoding.js';

// Endpoint to which the Discord REST API requests should be made.
const kDiscordEndpoint = 'https://discordapp.com/api';

// The Discord medium is a communication channel through which interactions can be sent to Discord.
// It abstracts the low-level API calls in more convenient, high-level JavaScript APIs. Most of
// the APIs are documented in the following three articles on their Developer Portal:
//
// https://discord.com/developers/docs/resources/channel
// https://discord.com/developers/docs/resources/guild
// https://discord.com/developers/docs/resources/user
export class DiscordMedium {
    #api_ = null;

    constructor(configuration) {
        this.#api_ = new DiscordAPI(configuration);
    }

    // ---------------------------------------------------------------------------------------------
    // Actual Discord API methods
    // ---------------------------------------------------------------------------------------------

    // Creates the given |reaction| to the |message|, which must be one of the default emoji on the
    // server. This requires the |message| to have been sent to a channel.
    async createReaction(message, reaction) {
        const channelId = message.channel?.id;
        const messageId = message.id;
        const emoji = encode(reaction);

        if (!channelId || !messageId)
            return false;

        const path = `/channels/${channelId}/messages/${messageId}/reactions/${emoji}/@me`;
console.log('issuing request to: ' + kDiscordEndpoint + path);
        return this.#api_.call('PUT', kDiscordEndpoint + path);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.#api_ = null;
    }
}