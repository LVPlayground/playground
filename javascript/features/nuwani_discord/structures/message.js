// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Encapsulates a message received from Discord. Will build its own state in the constructor based
// on the Guild that the message was sent towards.
export class Message {
    // ID of the message, in case we want to reply to it.
    id = null;

    // Author of the message, as a Discord Member object.
    author = null;

    // Author of the message, just their name. The Member can't always be retrieved.
    authorName = null;

    // Channel the message was sent to. Will be NULL if this was a private message.
    channel = null;

    // Content of the message, as was written by the author.
    content = null;

    // The guild to which the message was sent, if any.
    guild = null;

    // Set of Member instances of members who were mentioned in the message.
    membersMentioned = new Set();

    // Set of Rule instances of rules who were mentioned in the message.
    rolesMentioned = new Set();

    // Time at which this message was sent, as a JavaScript Date object.
    timestamp = null;

    constructor(messageInfo, guild) {
        this.id = messageInfo.id;
        this.content = messageInfo.content;
        this.guild = guild;
        this.timestamp = new Date(messageInfo.timestamp);

        this.author = guild?.members.get(messageInfo.author.id);
        this.authorName = messageInfo.author.username;
        this.channel = guild?.channels.get(messageInfo.channel_id);

        for (const mentionInfo of messageInfo.mentions) {
            const member = guild?.members.get(mentionInfo.id);
            if (member)
                this.membersMentioned.add(member);
        }

        for (const roleId of messageInfo.mention_roles) {
            const role = guild?.roles.get(roleId);
            if (role)
                this.rolesMentioned.add(role);
        }
    }
}
