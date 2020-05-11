// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Defines a communication channel that exists on the server. Each channel defines to whom messages
// are sent, how they are formatted, and how replies will be handled. Channels can be prefix-based,
// or occupancy-based depending on what the player is doing.
export class Channel {
    // Returns the prefix by which this channel will be identified, if any. May not be longer than
    // a single character in length because of the way matching is done.
    getPrefix() { return null; }

    // Confirm whether the |player| is allowed to send messages to the channel. If they're not, the
    // implementation of this function should send them an error message.
    confirmChannelAccessForPlayer(player) { return true; }

    // Distributes the |message| as sent by |player| to the recipients of this channel.
    distribute(player, message, nuwani) {
        throw new Error('Channels are expected to define how messages distribute.');
    }
}
