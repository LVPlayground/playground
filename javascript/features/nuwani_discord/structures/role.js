// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Encapsulates an individual role within a Discord Guild. Users can have any number of roles.
// https://discord.com/developers/docs/resources/guild#get-guild
export class Role {
    // ID of the role, through which it will be identified.
    id = null;

    // Name of the role, as a human readable string.
    name = null;

    // Boolean indicating whether this role can be mentioned in chat.
    mentionable = null;

    // Permissions available to this role. See `discord_permissions.js` for the values.
    permissions = null;

    constructor(roleInfo) {
        this.id = roleInfo.id;
        this.name = roleInfo.name;
        this.mentionable = !!roleInfo.mentionable;
        this.permissions = parseInt(roleInfo.permissions_new, 10);
    }
}
