// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// High-level manager that's responsible for our interaction with Discord. Builds upon many layers
// of Discord intelligence and behaviour, to end up with a convenient, easy to use API.
export class DiscordManager {
    #medium_ = null;

    constructor(medium) {
        this.#medium_ = medium;
    }

    // ---------------------------------------------------------------------------------------------
    // Events received from Discord
    // ---------------------------------------------------------------------------------------------

    // Called when the given |message| has been received in one of the Discord channels, as an
    // instance of the Message class populated with all the relevant (and available) data. Private
    // messages will be ignored, as we want all interaction with Nuwani to be attributable.
    onMessage(message) {
        if (!message.guild)
            return;  // ignore private messages

        const nuwani = message.guild.bot;
        if (message.membersMentioned.has(nuwani) || message.content.includes('likeme'))
            this.#medium_.createReaction(message, '🤖');

        console.log(`Message from ${message.author?.nickname} (Id: ${message.id})`);
        console.log(`-- channel: ${message.channel?.name}`);
        console.log(`-- content: ${message.content}`);
        console.log(`-- mentions: ${[...message.membersMentioned].map(x=>x.nickname).join(', ')}`);
        console.log(`-- time: ${message.timestamp}`);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.#medium_ = null;
    }
}
