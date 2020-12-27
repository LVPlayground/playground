// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Encapsulates information about a particular user who's part of our server.
export class Member {
    static kStatusOffline = '';
    static kStatusOnline = 'online';
    static kStatusIdle = 'idle';
    static kStatusDoNotDisturb = 'dnd';

    // ID assigned to this member.
    id = null;

    // Discriminator of the member, to ensure their username is globally unique.
    discriminator = null;

    // Username of the member, unique to their account.
    username = null;

    // Nickname of the member, as they've been assigned on the LVP server.
    nickname = null;

    // Boolean indicating whether this member is a bot.
    bot = null;

    // Set of Roles assigned to this member. Values are Role instances.
    roles = new Set();

    // Status of this member.
    status = Member.kStatusOffline;

    constructor(memberInfo, roles) {
        this.id = memberInfo.user.id;
        this.discriminator = memberInfo.user.discriminator;
        this.username = memberInfo.user.username;
        this.nickname = memberInfo.nick || this.username;
        this.bot = !!memberInfo.user.bot;

        for (const role of memberInfo.roles)
            this.roles.add(roles.get(role));
    }
}
