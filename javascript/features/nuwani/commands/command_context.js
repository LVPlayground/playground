// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { format } from 'base/format.js';

// Private symbol to make sure that the CommandContext constructor can only be used by the static
// `createForMessage` function.
const kPrivateSymbol = Symbol('CommandContext constructor');

// The necessary context for executing an IRC command. Includes the basic information that can be
// used to determine the command's source, their level, and the ability to respond to it.
export class CommandContext {
    // Creates a new instance of the CommandContext instance for the given |message| received by the
    // given |bot|. Various contextual information will be determined, centrally.
    static createForMessage(bot, message, configuration) {
        const inChannel = bot.isChannelName(message.params[0]);

        // Target to which responses should be sent, either a channel or a user.
        const target = inChannel ? message.params[0]
                                 : message.source?.nickname;

        // Whether the message was sent to the echo channel, rather than an arbitrary one.
        const inEchoChannel = target.toLowerCase() === configuration.echoChannel.toLowerCase();

        // Determine the user's channel modes in the echo channel, and from that, derive what their
        // level is and whether they should have VIP rights.
        const userChannelModesInEchoChannel =
            bot.getUserModesInEchoChannel(message.source?.nickname);

        let level = Player.LEVEL_PLAYER;
        let vip = false;

        if (typeof userChannelModesInEchoChannel === 'string') {
            for (const mapping of configuration.levels) {
                if (!userChannelModesInEchoChannel.includes(mapping.mode))
                    continue;
                
                level = mapping.level;
                break;
            }

            // Determine VIP rights by them either being part of the crew, or being voiced in the
            // echo channels. It's unfortuante that this is hardcoded.
            vip = userChannelModesInEchoChannel.includes('v') || level > Player.LEVEL_PLAYER;
        }

        // Determine whether the sender of this message is a bot owner, which gives them executive
        // decisions over pretty much everything the bot is able to do.
        let owner = false;

        if (message.source && message.source.isUser()) {
            for (const info of configuration.owners) {
                owner |= (info.nickname === message.source.nickname || info.nickname === '*') &&
                         (info.username === message.source.username || info.username === '*') &&
                         (info.hostname === message.source.hostname || info.hostname === '*');
            }
        }

        // Now all that remains is to construct and return the new CommandContext instance.
        return new CommandContext(kPrivateSymbol, bot, message, {
            target, level, vip, owner,
            inEchoChannel
        });
    }

    bot_ = null;
    message_ = null;
    context_ = null;

    // Gets the bot which received this command.
    get bot() { return this.bot_; }

    // Gets the nickname of the person who sent this command. May be undefined.
    get nickname() { return this.message_.source?.nickname; }

    // Gets the level associated with the sender, based on their status in the echo channel.
    get level() { return this.context_.level; }

    // Gets the source of the message, as a MessageSource instance. May be NULL.
    get source() { return this.message_.source; }

    // Gets the target where the command was issued, either a user or a channel.
    get target() { return this.context_.target; }

    // Returns whether the message was sent to the echo channel.
    inEchoChannel() { return this.context_.inEchoChannel; }

    // Returns whether the sender of this message is an owner of NuwaniJS.
    isOwner() { return this.context_.owner; }

    // Returns whether the sender of this message has VIP rights.
    isVip() { return this.context_.vip; }

    constructor(symbol, bot, message, context) {
        if (symbol !== kPrivateSymbol)
            throw new Error('Use `createForMessage` instead of instantiating this class directly.');

        this.bot_ = bot;
        this.message_ = message;
        this.context_ = context;
    }

    // Responds to this command with the given |message|. Will bypass echo distribution.
    respond(message, ...params) {
        if (params.length)
            message = format(message, ...params);

        this.bot_.write(`PRIVMSG ${this.target} :${message}`);
    }

    // Responds to this command with information regarding its |usage|.
    respondWithUsage(usage, ...params) {
        if (params.length)
            usage = format(usage, ...params);

        this.bot_.write(`PRIVMSG ${this.target} :10Usage: ${usage}`);
    }

    // Writes the raw |message| to the network. Will bypass echo distribution.
    write(message) {
        this.bot_.write(message);
    }
}
