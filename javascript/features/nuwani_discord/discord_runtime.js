// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DiscordConnection } from 'features/nuwani_discord/discord_connection.js';

// The Discord runtime of Nuwani is an implementation that has the ability to establish a connection
// with the Discord API over WebSockets, connecting to their Gateway API.
export class DiscordRuntime {
    #configuration_ = null;
    #connection_ = null;

    constructor(configuration) {
        this.#configuration_ = configuration;
        this.#connection_ = new DiscordConnection(configuration, this);
    }

    // ---------------------------------------------------------------------------------------------
    // Section: connection management
    // ---------------------------------------------------------------------------------------------

    // Returns whether the Discord connection is available for use at this time.
    isAvailable() { return this.#connection_.isConnected() && this.#connection_.isAuthenticated(); }

    // Initializes the connection to Discord when the necessary configuration has been given. This
    // call will be silently ignored when it's not, as it's entirely optional.
    connect() {
        if (this.#configuration_ === null || typeof this.#configuration_.token !== 'string')
            return;  // the necessary configuration is missing, cannot continue

        this.#connection_.connect();
    }

    // ---------------------------------------------------------------------------------------------

    // Called when a message of the given |intent| has been received from Discord. Not all messages
    // have to be handled. Messages will only be received when the connection is authenticated.
    onMessage(intent, data) {
        // TODO: https://discord.com/developers/docs/topics/gateway#list-of-intents

        switch (intent) {
            case 'MESSAGE_CREATE':
                if (!data.content.includes('Nuwani'))
                    break;

                break;

                // TODO: Enable something like the following....?
                this.#connection_.sendIntent('MESSAGE_REACTION_ADD', {
                    user_id: '739284801001095330',
                    message_id: data.id,
                    emoji: {
                        id: null,
                        name: '🔥',
                        animated: false,
                    },
                    channel_id: data.channel_id,
                    guild_id: data.guild_id,
                });

                break;
        }

        console.log(intent, data);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.#connection_.dispose();
    }
}
