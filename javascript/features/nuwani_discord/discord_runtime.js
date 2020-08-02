// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DiscordConnection } from 'features/nuwani_discord/discord_connection.js';
import { Guild } from 'features/nuwani_discord/structures/guild.js';
import { Message } from 'features/nuwani_discord/structures/message.js';

// The Discord runtime of Nuwani is an implementation that has the ability to establish a connection
// with the Discord API over WebSockets, connecting to their Gateway API.
export class DiscordRuntime {
    #configuration_ = null;
    #connection_ = null;
    #guilds_ = null;
    #manager_ = null;
    #userId_ = null;
    #userName_ = null;

    constructor(configuration, manager) {
        this.#configuration_ = configuration;
        this.#connection_ = new DiscordConnection(configuration, this);
        this.#guilds_ = new Map();
        this.#manager_ = manager;
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
        let guild = null;
        let member = null;
        let message = null;

        switch (intent) {
            case 'READY':
                this.#userId_ = data.user.id;
                this.#userName_ = data.user.username;
                break;

            // -------------------------------------------------------------------------------------
            // Category: GUILD_* messages
            // -------------------------------------------------------------------------------------

            case 'GUILD_CREATE':
                guild = new Guild(data, this.#userId_);

                console.log(`${guild.name} (Id: ${guild.id}):`);
                console.log(guild.members.size + ' members');
                console.log(guild.roles.size + ' roles');
                console.log(guild.channels.size + ' channels');
                console.log(guild.bot + ' is our bot');

                this.#guilds_.set(data.id, guild);
                break;

            case 'GUILD_MEMBER_UPDATE':
                guild = this.#guilds_.get(data.guild_id);
                member = guild.members.get(data.user.id);

                if (guild && member) {
                    member.nickname = data.nick || data.user.username;

                    member.roles.clear();
                    for (const roleId of data.roles) {
                        const role = guild.roles.get(roleId);
                        if (role)
                            member.roles.add(role);
                    }
                }

                break;

            // -------------------------------------------------------------------------------------
            // Category: MESSAGE_* messages
            // -------------------------------------------------------------------------------------

            case 'MESSAGE_CREATE':
                guild = this.#guilds_.get(data.guild_id);
                message = new Message(data, guild);

                this.#manager_.onMessage(message);
                break;

            // -------------------------------------------------------------------------------------
            // Category: Presence messages
            // -------------------------------------------------------------------------------------

            case 'PRESENCE_UPDATE':
                for (const guild of this.#guilds_.values()) {
                    const member = guild.members.get(data.user.id);
                    if (member)
                        member.status = data.status;
                }

                break;

            // -------------------------------------------------------------------------------------
            // Category: Ignored messages
            // -------------------------------------------------------------------------------------

            case 'MESSAGE_DELETE':
            case 'TYPING_START':
                break;

            // -------------------------------------------------------------------------------------

            default:
                console.log('Unhandled Discord message (' + intent + '):', data);
                break;
        }
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.#connection_.dispose();
    }
}
