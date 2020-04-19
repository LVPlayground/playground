// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The necessary context for executing an IRC command. Includes the basic information that can be
// used to determine the command's source, their level, and the ability to respond to it.
export class CommandContext {
    bot_ = null;
    message_ = null;

    // Gets the source of the message, as a MessageSource instance. May be NULL.
    get source() { return this.message_.source; }

    // Gets the target where the command was issued, which could either be an IRC channel, or a
    // private chat dialogue with a particular user.
    get target() {
        return this.message_.params[0].startsWith('#') ? this.message_.params[0]
                                                       : this.message_.source.nickname;
    }

    constructor(bot, message) {
        this.bot_ = bot;
        this.message_ = message;
    }

    // Gets the level the source of this |message_| has in the Echo channel.
    getLevel() {
        // TODO: Implement this.
        return Player.LEVEL_PLAYER;
    }

    // Responds to this command with the given |message|. Will bypass echo distribution.
    respond(message) {
        this.bot_.write(`PRIVMSG ${this.target} :${message}`);
    }

    // Writes the raw |message| to the network. Will bypass echo distribution.
    write(message) {
        this.bot_.write(message);
    }
}
