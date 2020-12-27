// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Channel } from 'features/communication/channel.js';

// Private communication channel where all of a player's messages will be sent to another player
// instead of the public and/or Virtual World chat. The channel has to be established first.
export class CallChannel extends Channel {
    // WeakMap of |player| to |recipient|s for active, on-going conversations.
    activeConversations_ = new WeakMap();

    constructor() {
        super();

        server.playerManager.addObserver(this);
    }

    // Returns the conversation partner of |player|, if any.
    getConversationPartner(player) { return this.activeConversations_.get(player); }

    // Establishes a phone conversation between the |player| and the |recipient|.
    establish(player, recipient) {
        if (this.activeConversations_.has(player) || this.activeConversations_.has(recipient))
            throw new Error('Either (or both) of the participants is already engaged in a call.');
        
        this.activeConversations_.set(player, recipient);
        this.activeConversations_.set(recipient, player);

        player.sendMessage(Message.COMMUNICATION_CALL_CONNECTED, recipient.name);
        recipient.sendMessage(Message.COMMUNICATION_CALL_CONNECTED, player.name);
    }

    // Disconnects the phone conversation between the |player|, who hung up the phone, and the
    // |recipient|, who will be informed of this fact.
    disconnect(player, recipient) {
        if (!this.activeConversations_.has(player) || !this.activeConversations_.has(recipient))
            throw new Error('Either (or both) of the participants are not engaged in a call.');
        
        if (this.activeConversations_.get(player) !== recipient)
            throw new Error('The given participants are not engaged in a call with eachother.');
        
        this.activeConversations_.delete(player, recipient);
        this.activeConversations_.delete(recipient, player);

        player.sendMessage(Message.COMMUNICATION_CALL_DISCONNECTED, recipient.name, 'you');
        recipient.sendMessage(Message.COMMUNICATION_CALL_DISCONNECTED, player.name, 'they');
    }

    // This channel can only be used by players who are in an established phone conversation.
    confirmChannelAccessForPlayer(player) {
        return this.activeConversations_.has(player);
    }

    // Disconnect on-going phone conversations when one of the involved parties disconnects from
    // the server. They can call each other again when they've reconnected.
    onPlayerDisconnect(player) {
        if (!this.activeConversations_.has(player))
            return;
        
        const recipient = this.activeConversations_.get(player);

        // Inform the |recipient| that the conversation has been forcefully ended.
        recipient.sendMessage(Message.COMMUNICATION_CALL_DISCONNECTED_LEFT, player.name);

        this.activeConversations_.delete(recipient);
        this.activeConversations_.delete(player);
    }

    // Distributes the |message| as sent by |player| to the recipients of this channel.
    distribute(player, message, nuwani) {
        const recipient = this.activeConversations_.get(player);
        const formattedMessage =
            Message.format(Message.COMMUNICATION_CALL_MESSAGE,
                           player.colors.currentColor.toHexRGB(), player.id, player.name, message);

        if (!recipient)
            throw new Error('Cannot distribute a message without an on-going phone call.');
        
        player.sendMessage(formattedMessage);

        // Bail out here in case the |player| is isolated.
        if (player.syncedData.isIsolated())
            return;

        recipient.sendMessage(formattedMessage);

        nuwani.echo('chat-call', player.name, player.id, recipient.name, recipient.id, message);
    }

    dispose() {
        server.playerManager.removeObserver(this);

        for (const player of server.playerManager) {
            if (!this.activeConversations_.has(player))
                continue;
            
            const recipient = this.activeConversations_.get(player);

            // Send both the |player| and |recipient| a message about the conversation having ended,
            // as the Communication feature is being unloaded from the server.
            player.sendMessage(Message.COMMUNICATION_CALL_DISCONNECTED_UNLOAD, recipient.name);
            recipient.sendMessage(Message.COMMUNICATION_CALL_DISCONNECTED_UNLOAD, player.name);

            this.activeConversations_.delete(recipient);
            this.activeConversations_.delete(player);
        }
    }
}
