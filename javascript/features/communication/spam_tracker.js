// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// At what interval should spam warnings be sent to the player, at most?
export const kPlayerWarningIntervalSec = 4;

// After how many seconds will the spam tracker stop caring about a particular message?
export const kMessageExpirationTimeSec = 10;

// How often may the same message be repeated until they expire?
export const kMessageRepeatLimit = 2;

// How many unexpired messages may a player have in their history?
export const kMessageLimit = 5;

// Maximum length of a message before we'll consider it as spam.
export const kMessageLengthCutOff = 255;

// The spam tracker is responsible for keeping track of whether a particular player might be
// spamming the server, as the name implies. We consider certain categories of messages spam:
//
//   1) Messages longer than |kMessageLengthCutOff| characters are considered spam.
//   2) Sending more than five messages in ten seconds.
//   3) Repeating the same message more than twice in ten seconds.
//
// Because we trust the spam tracker implementation, offenses of these rules will not be reported
// to administrators, and will be silently ignored instead.
export class SpamTracker {
    playerMessages_ = new WeakMap();
    playerWarned_ = new WeakMap();

    // Returns whether the |player| is spamming by sending the |message|. Different from the Pawn
    // implementation many will remember, administrators are not excempt from these policies.
    isSpamming(player, message) {
        const currentTime = server.clock.monotonicallyIncreasingTime();
        const expirationTime = currentTime - kMessageExpirationTimeSec * 1000;

        // (1) Messages longer than |kMessageLengthCutOff| characters are considered spam.
        if (message.length > kMessageLengthCutOff)
            return this.detectedSpamFromPlayer(player, currentTime);
        
        // Remove all the messages from the player's message log that have expired.
        let messages = this.playerMessages_.get(player);
        if (!messages) {
            messages = new Array();

            this.playerMessages_.set(player, messages);
        }

        messages = messages.filter(({ time }) => time >= expirationTime);
        messages.push({ time: currentTime, message });

        this.playerMessages_.set(player, messages);

        // (2) Sending more than five messages in ten seconds.
        if (messages.length > kMessageLimit)
            return this.detectedSpamFromPlayer(player, currentTime);

        // (3) Repeating the same message more than twice in ten seconds.
        if (messages.filter(entry => entry.message === message).length > kMessageRepeatLimit)
            return this.detectedSpamFromPlayer(player, currentTime);
        
        // Everything passed - they're clean, this is not spam.
        return false;
    }

    // Called when spam has been detected from the |player|, and their message has to be blocked.
    // We don't respond to every message in order to avoid spamming back DoS flooders.
    detectedSpamFromPlayer(player, currentTime) {
        const lastWarning = this.playerWarned_.get(player);
        if (lastWarning && (currentTime - lastWarning) < kPlayerWarningIntervalSec * 1000)
            return true;  // silently ignore

        this.playerWarned_.set(player, currentTime);

        player.sendMessage(Message.COMMUNICATION_SPAM_BLOCKED);
        return true;
    }
}
