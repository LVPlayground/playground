// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { AdministratorChannel } from 'features/communication/channels/administrator_channel.js';
import ScopedCallbacks from 'base/scoped_callbacks.js';
import { SpamTracker } from 'features/communication/spam_tracker.js';
import { VipChannel } from 'features/communication/channels/vip_channel.js';

// The communication manager is responsible for making sure that the different capabilities play
// well together, and is the main entry point for the OnPlayerText callback contents as well.
export class CommunicationManager {
    callbacks_ = null;
    delegates_ = null;
    messageFilter_ = null;
    muteManager_ = null;
    nuwani_ = null;

    genericChannels_ = null;
    prefixChannels_ = null;
    spamTracker_ = null;
    
    constructor(messageFilter, muteManager, nuwani) {
        this.delegates_ = new Set();
        this.messageFilter_ = messageFilter;
        this.muteManager_ = muteManager;
        this.nuwani_ = nuwani;

        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'playertext', CommunicationManager.prototype.onPlayerText.bind(this));
        
        this.genericChannels_ = new Set();
        this.prefixChannels_ = new Map();

        // The list of predefined channels. Other channels exists, for example gang chat, but they
        // have to be added to this feature as a Delegate instead.
        const kChannels = [
            new AdministratorChannel(),
            new VipChannel(),
        ];

        // Split the |kChannels| based on whether they're a prefix channel or a generic channel.
        for (const channel of kChannels) {
            const prefix = channel.getPrefix();
            if (!prefix)
                this.genericChannels_.add(channel);
            else if (prefix.length == 1)
                this.prefixChannels_.set(prefix, channel);
            else
                throw new Error('Channel prefixes must be exactly one character long.')
        }

        // Create the spam tracker, which verifies that players aren't being naughty.
        this.spamTracker_ = new SpamTracker();
    }

    // ---------------------------------------------------------------------------------------------

    // Adds |delegate| to the list of delegates that will be given the chance to handle a chat
    // message before normal processing continues.
    addDelegate(delegate) {
        if (!delegate.__proto__.hasOwnProperty('onPlayerText'))
            throw new Error('The |delegate| must implement the onPlayerText method.');

        this.delegates_.add(delegate);
    }

    // Removes |delegate| from the list of chat delegates. They will no longer be considered for
    // future incoming chat messages.
    removeDelegate(delegate) {
        this.delegates_.delete(delegate);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when a player sends a textual message to the server. This could be one of many things:
    // a chat message to either a specific group of people or everyone, answering a chat message,
    // communicating with another player in a phone call, or one of several other options.
    //
    // The |event| is answered as soon as possible. Actual processing of the message will be done
    // asynchronously, to free up the server for further processing in between server frames.
    onPlayerText(event) {
        const player = server.playerManager.getById(event.playerid);
        const unprocessedMessage = event.text?.trim();

        if (!player || !unprocessedMessage || !unprocessedMessage.length)
            return;  // the player is not connected to the server, or they sent an invalid message

        if (this.muteManager_.isCommunicationMuted() && !player.isAdministrator()) {
            event.preventDefault();
            return;
        }

        if (this.spamTracker_.isSpamming(player, unprocessedMessage)) {
            event.preventDefault();
            return;
        }

        // Process the |message| through the message filter, which may block it as well.
        const message = this.messageFilter_.filter(player, unprocessedMessage);
        if (!message) {
            event.preventDefault();
            return;
        }

        // TODO: Once most communication is handled by JavaScript, do all further processing on a
        // deferred task instead.

        // TODO: Handle functionality such as muting players (and/or everyone) before actually
        // sending the message anywhere.

        for (const delegate of this.delegates_) {
            if (!!delegate.onPlayerText(player, message)) {
                event.preventDefault();
                return;
            }
        }

        // First check prefix-based channels, as we can check them off quite easily.
        const prefixChannel = this.prefixChannels_.get(message[0]);
        if (prefixChannel !== undefined) {
            event.preventDefault();

            if (!prefixChannel.confirmChannelAccessForPlayer(player))
                return;  // they have no access, an error message has been sent
            
            const unprefixedMessage = message.substring(1).trimLeft();
            if (!unprefixedMessage.length)
                return;  // their message literally was just the prefix, ignore it

            prefixChannel.distribute(player, unprefixedMessage, this.nuwani_());
            return;
        }

        // TODO(Russell): Add further processing here.
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.callbacks_.dispose();
        this.callbacks_ = null;

        this.delegates_.clear();
        this.delegates_ = null;
    }
}
