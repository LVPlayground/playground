// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Channel } from 'features/nuwani_discord/structures/channel.js';
import { Member } from 'features/nuwani_discord/structures/member.js';
import { Role } from 'features/nuwani_discord/structures/role.js';

// Encapsulates a Discord Guild, more commonly known as a server.
// https://discord.com/developers/docs/resources/guild
export class Guild {
    // ID of the guild, unique across Discord.
    id = null;

    // Name of the Guild, as a human readable string.
    name = null;

    // Map containing the Guild's channels, keyed by its ID, valued by Channel instance.
    channels = new Map();

    // Map containing the Guild's members, keyed by their ID, valued by Member instance.
    members = new Map();

    // Map containing the Guild's roles, keyed by its ID, valued by Role instance.
    roles = new Map();

    // Member instance representing the Member detailing the bot.
    bot = null;

    constructor(guildCreateMessage, userId) {
        this.id = guildCreateMessage.id;
        this.name = guildCreateMessage.name;

        for (const channelInfo of guildCreateMessage.channels)
            this.channels.set(channelInfo.id, new Channel(channelInfo));

        for (const roleInfo of guildCreateMessage.roles)
            this.roles.set(roleInfo.id, new Role(roleInfo));

        for (const memberInfo of guildCreateMessage.members)
            this.members.set(memberInfo.user.id, new Member(memberInfo, this.roles));

        for (const presenceInfo of guildCreateMessage.presences) {
            const member = this.members.get(presenceInfo.user.id);
            if (member)
                member.status = presenceInfo.status;
        }

        this.bot = this.members.get(userId);
    }
}
