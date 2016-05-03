// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ScopedCallbacks = require('base/scoped_callbacks.js');

// Implementation of the actual gang chat feature. Will work with the gangs feature to get its data.
class GangChatManager {
    constructor(gangs, announce) {
        this.gangs_ = gangs;
        this.announce_ = announce;

        this.spyingPlayer_ = null;

        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'playertext', GangChatManager.prototype.onPlayerText.bind(this));
        this.callbacks_.addEventListener(
            'setiownershipchange', GangChatManager.prototype.onSetiOwnershipChange.bind(this));
    }

    // Called when a player sends a message to the chat box. If it starts 
    onPlayerText(event) {
        const player = server.playerManager.getById(event.playerid);
        const text = event.text;

        if (!player || !text || !text.length)
            return;  // basic sanity checks to make sure that the message is valid

        if (!text.startsWith('!') || text.startsWith('!!'))
            return;  // this message is not meant for gang chat

        event.preventDefault();

        const gang = this.gangs_.getGangForPlayer(player);
        if (!gang) {
            player.sendMessage(Message.GANG_CHAT_NO_GANG);
            return;
        }

        const recipients = new Set();
        const message = text.substr(1).trim();
        
        // Announce the message to people watching on IRC.
        if (this.announce_) {
            this.announce_.announceToIRC('gang', player.id, player.name, gang.id, gang.name,length,
                                         gang.name, message);
        }

        for (let member of gang.members) {
            member.sendMessage(Message.GANG_CHAT, gang.tag, player.id, player.name, message);
            recipients.add(member);
        }

        // Distribute the message to administrators who have not received the message yet.
        server.playerManager.forEach(onlinePlayer => {
            if (!onlinePlayer.isAdministrator())
                return;  // they are not a member of the crew

            if (recipients.has(onlinePlayer))
                return;  // they have already received the message

            if (onlinePlayer.messageLevel < 2)
                return;  // they do not wish to see gang chat

            onlinePlayer.sendMessage(Message.GANG_CHAT, gang.tag, player.id, player.name, message);
            recipients.add(onlinePlayer);
        });

        // Distribute the message to the player who is spying on the gang chat.
        if (this.spyingPlayer_ !== null) {
            if (!this.spyingPlayer_.isConnected()) {
                this.spyingPlayer_ = null;
                return;
            }

            if (recipients.has(this.spyingPlayer_))
                return;  // they have already received the message

            this.spyingPlayer_.sendMessage(
                Message.GANG_CHAT, gang.tag, player.id, player.name, message);
            recipients.add(this.spyingPlayer_);
        }
    }

    // Called when a player buys or sells the Seti @ Home property, which gives them the ability to
    // listen in on all gang conversations happening on the server.
    onSetiOwnershipChange(event) {
        this.spyingPlayer_ = server.playerManager.getById(event.playerid);
        if (!this.spyingPlayer_)
            return;

        const message = Message.format(Message.GANG_CHAT_SPY, this.spyingPlayer_.name,
                                       this.spyingPlayer_.id);

        this.gangs_.getGangs().forEach(gang => {
            for (let member of gang.members) {
                if (member === this.spyingPlayer_)
                    continue;

                member.sendMessage(message);
            }
        });
    }

    dispose() {
        this.callbacks_.dispose();
    }
}

exports = GangChatManager;
