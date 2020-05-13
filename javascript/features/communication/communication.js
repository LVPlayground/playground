// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommunicationManager } from 'features/communication/communication_manager.js';
import { CommunicationNatives } from 'features/communication/communication_natives.js';
import Feature from 'components/feature_manager/feature.js';
import { MessageFilter } from 'features/communication/message_filter.js';
import { MuteManager } from 'features/communication/mute_manager.js';
import { SpamTracker } from 'features/communication/spam_tracker.js';

import { relativeTime } from 'base/time.js';

// Minimum length of any replacement to avoid affecting too many messages.
const kMinimumReplacementLength = 3;

// The communication feature manages the low-level communicative capabilities of players, for
// example the main chat, interactive commands and can defer to delegates for more specific chats,
// for example administrator, gang and VIP chats.
export default class Communication extends Feature {
    filter_ = null;
    manager_ = null;
    natives_ = null;
    spamTracker_ = null;

    constructor() {
        super();

        // This is a foundational feature. It's only allowed to depend on other foundational
        // features, as communication is a cricial part of the server.
        this.markFoundational();

        // Depend on Nuwani for being able to distribute communication to non-game destinations.
        const nuwani = this.defineDependency('nuwani');

        // The message filter, which every message on Las Venturas Playground will be subject to.
        this.filter_ = new MessageFilter();

        // The mute manager controls who's currently able to communicate on the server.
        this.muteManager_ = new MuteManager();

        // The spam tracker keeps track of potential spammers on the server.
        this.spamTracker_ = new SpamTracker();

        this.manager_ = new CommunicationManager(
            this.filter_, this.muteManager_, this.spamTracker_, nuwani);

        this.natives_ = new CommunicationNatives(this.muteManager_);
    }

    // ---------------------------------------------------------------------------------------------
    // Public API of the communication feature.
    // ---------------------------------------------------------------------------------------------

    // Adds |delegate| to the list of delegates that will be given the chance to handle a chat
    // message before normal processing continues. The `onPlayerChat` method must exist on the
    // prototype of the |delegate|, which will be invoked with player and message arguments.
    //
    // Returning TRUE from this function indicates that the message has been delegated, and will
    // prevent further processing from happening.
    addDelegate(delegate) {
        this.manager_.addDelegate(delegate);
    }

    // Removes |delegate| from the list of chat delegates. They will no longer be considered for
    // future incoming chat messages.
    removeDelegate(delegate) {
        this.manager_.removeDelegate(delegate);
    }

    // ---------------------------------------------------------------------------------------------

    // Gets an array of the replacement words applied by the Communication feature. Each entry is
    // in the format of { before, after, nickname }.
    getReplacements() {
        let replacements = [];

        for (const replacement of this.filter_.replacements) {
            if (replacement.after.length > 0) {
                replacements.push({
                    before: replacement.before,
                    after: replacement.after,
                    nickname: replacement.nickname,
                });
            }
        }

        return replacements;
    }

    // Creates a new replacement from |before| to |after|. Must be executed with a valid, identified
    // |player|, because replacements will be attributed in the database.
    async addReplacement(player, before, after) {
        if (!player.account.isIdentified())
            throw new Error('The |player| must be identified to their account.');
        
        if (typeof before !== 'string' || typeof after !== 'string')
            throw new Error('Both |before| and |after| must be strings.');

        if (before.length < kMinimumReplacementLength)
            throw new Error(`The |before| must be >=${kMinimumReplacementLength} characters.`);
        
        if (!after.length)
            throw new Error('The |after| must have at least one character.');

        return await this.filter_.addReplacement(player, before, after);
    }

    // Removes the replacement identified by |before|. The |player| is included for symmetry, and
    // because we might want to include attribution in the future.
    async removeReplacement(player, before) {
        for (const replacement of this.filter_.replacements) {
            if (replacement.before !== before)
                continue;
            
            if (!replacement.after.length)
                throw new Error('Unable to remove blocked words with removeReplacement().');
            
            await this.filter_.removeReplacement(before);
            return;
        }

        throw new Error(`The replacement identified by "${before}" does not exist.`);
    }

    // ---------------------------------------------------------------------------------------------

    // Gets an array of the blocked words on the server, which will refuse to let messages go
    // through regardless. An array where each entry is in the format of { word, nickname }.
    getBlockedWords() {
        let blockedWords = [];

        for (const replacement of this.filter_.replacements) {
            if (!replacement.after.length) {
                blockedWords.push({
                    word: replacement.before,
                    nickname: replacement.nickname,
                });
            }
        }

        return blockedWords;
    }

    // Creates a new blocked |word| on the server. Must be executed with a valid, identified
    // |player|, because blocked words will be attributed in the database.
    async addBlockedWord(player, word) {
        if (!player.account.isIdentified())
            throw new Error('The |player| must be identified to their account.');
        
        if (typeof word !== 'string')
            throw new Error('The |word| must be a string.');

        if (word.length < kMinimumReplacementLength)
            throw new Error(`The |word| must be >=${kMinimumReplacementLength} characters.`);
        
        return await this.filter_.addReplacement(player, word);
    }

    // Removes the blocked word identified by |word|. The |player| is included for symmetry, and
    // because we might want to include attribution in the future.
    async removeBlockedWord(player, word) {
        for (const replacement of this.filter_.replacements) {
            if (replacement.before !== word)
                continue;
            
            if (replacement.after.length)
                throw new Error('Unable to remove replacements with removeBlockedWord().');
            
            await this.filter_.removeReplacement(word);
            return;
        }

        throw new Error(`The blocked word identified by "${word}" does not exist.`);
    }

    // ---------------------------------------------------------------------------------------------

    // Processes the given |message|, as sent by |player|, preparing it for distribution. It will be
    // routed through the spam tracker, then through the message filter. Returns the |message|,
    // which may be modified, or NULL in case the message should not be distributed.
    processForDistribution(player, message) {
        if (this.muteManager_.isCommunicationMuted()) {
            player.sendMessage(Message.COMMUNICATION_SERVER_MUTE_BLOCKED);
            return null;
        }

        const remainingSeconds = this.muteManager_.getPlayerRemainingMuteTime(player);
        if (remainingSeconds > 0) {
            const expiration = new Date(Date.now() + remainingSeconds * 1000);
            const formattedExpiration = relativeTime({ date1: new Date(), date2: expiration });

            player.sendMessage(Message.COMMUNICATION_MUTE_BLOCKED, formattedExpiration.text);
            return null;
        }

        if (this.spamTracker_.isSpamming(player, message))
            return null;

        return this.filter_.filter(player, message);
    }

    // ---------------------------------------------------------------------------------------------

    // Returns whether all player-generated communication on the server should be muted, unless it
    // was issued by administrators or Management members.
    isCommunicationMuted() {
        return this.muteManager_.isCommunicationMuted();
    }

    // Toggles whether server communications are muted altogether.
    setCommunicationMuted(muted) {
        this.muteManager_.setCommunicationMuted(muted);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.natives_.dispose();
        this.manager_.dispose();
    }
}
