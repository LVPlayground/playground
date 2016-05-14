// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ScopedCallbacks = require('base/scoped_callbacks.js');

// Implementation of the actual gang chat feature. Will work with the gangs feature to get its data.
class GangChatManager {
    constructor(gangs, announce, communication) {
        this.gangs_ = gangs;
        this.announce_ = announce;
        this.communication_ = communication;

        this.spyingPlayer_ = null;

        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'setiownershipchange', GangChatManager.prototype.onSetiOwnershipChange.bind(this));

        this.communication_.addDelegate(this);
    }

    // Called when a player sends a message to the chat box. If it starts 
    onPlayerText(player, text) {
        if (!text.startsWith('!'))
            return false;  // this is not a gang-bound message

        if (!player.isAdministrator() && text.startsWith('!!'))
            return false;  // the player uses exclamation marks in a regular context

        if (player.isAdministrator() && text.startsWith('!!!'))
            return false;  // the administrator uses exclamation marks in a regular context

        const recipients = new Set();

        let gang = null;

        let messageRaw = null;
        let message = null;

        // Administrators have the ability to send messages to other gangs by prefixing their
        // message with two exclamation marks, followed by the tag of the target gang.
        if (text.startsWith('!!') && player.isAdministrator()) {
            const firstSpaceIndex = text.indexOf(' ');
            if (firstSpaceIndex === -1) {
                player.sendMessage(Message.GANG_CHAT_REMOTE_USAGE);
                return true;
            }

            const firstWord = text.substring(2, firstSpaceIndex);

            gang = this.findGangByTag(firstWord);
            if (!gang) {
                player.sendMessage(Message.GANG_CHAT_NO_GANG_FOUND, firstWord);
                return true;
            }

            messageRaw = text.substr(firstSpaceIndex).trim();
            message = Message.format(Message.GANG_CHAT_REMOTE, gang.tag, player.id, player.name,
                                     messageRaw);

            player.sendMessage(message);
            recipients.add(player);

        // Players and administrators who do not use the prefix will by default just target their
        // own gang, if they are in one.
        } else {
            gang = this.gangs_.getGangForPlayer(player);
            if (!gang) {
                player.sendMessage(Message.GANG_CHAT_NO_GANG);
                return true;
            }

            messageRaw = text.substr(1).trim();
            message =
                Message.format(Message.GANG_CHAT, gang.tag, player.id, player.name, messageRaw);
        }
        
        // Announce the message to people watching on IRC.
        if (this.announce_) {
            this.announce_.announceToIRC('gang', player.id, player.name, gang.id, gang.name.length,
                                         gang.name, messageRaw);
        }

        for (let member of gang.members) {
            if (recipients.has(member))
                continue;

            member.sendMessage(message);
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

            onlinePlayer.sendMessage(message);
            recipients.add(onlinePlayer);
        });

        // Distribute the message to the player who is spying on the gang chat.
        if (this.spyingPlayer_ !== null) {
            if (!this.spyingPlayer_.isConnected()) {
                this.spyingPlayer_ = null;
                return true;
            }

            if (recipients.has(this.spyingPlayer_))
                return true;  // they have already received the message

            this.spyingPlayer_.sendMessage(message);
            recipients.add(this.spyingPlayer_);
        }

        return true;
    }

    // Finds the gang carrying |tag|, which must be a complete identifier of the (unique) gang tag.
    // A case insensitive match will be done on all in-game represented gangs.
    findGangByTag(tag) {
        const lowerCaseTag = tag.toLowerCase();

        for (const gang of this.gangs_.getGangs()) {
            if (gang.tag.toLowerCase() === lowerCaseTag)
                return gang;
        }

        return null;
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
        this.communication_.removeDelegate(this);
        this.callbacks_.dispose();
    }
}

exports = GangChatManager;
