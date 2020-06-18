// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { ScopedCallbacks } from 'base/scoped_callbacks.js';

// Implementation of the actual gang chat feature. Will work with the gangs feature to get its data.
class GangChatManager {
    constructor(gangs, communication, nuwani) {
        this.gangs_ = gangs;
        this.communication_ = communication;
        this.nuwani_ = nuwani;

        this.spyingPlayer_ = null;

        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'setiownershipchange', GangChatManager.prototype.onSetiOwnershipChange.bind(this));

        this.communication_().addDelegate(this);

        this.communication_.addReloadObserver(
            this, GangChatManager.prototype.onCommunicationReload.bind(this));
    }

    // Called when a player sends a message to the chat box. If it starts
    onPlayerText(player, text) {
        if (!text.startsWith('!') || text.length === 1)
            return false;  // this is not a gang-bound message

        if (!player.isAdministrator() && text.startsWith('!!'))
            return false;  // the player uses exclamation marks in a regular context

        if (player.isAdministrator() && text.startsWith('!!!'))
            return false;  // the administrator uses exclamation marks in a regular context

        if (this.communication_().isCommunicationMuted() && !player.isAdministrator()) {
            player.sendMessage(Message.GANG_CHAT_SERVER_MUTED);
            return true;
        }

        const recipients = new Set();

        let isEncrypted = false;
        let isIsolated = player.syncedData.isIsolated();

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

            // Determine whether the gang's chat should be encrypted. This doesn't matter for the
            // admin's message formatting, but does for the Seti@Home owner.
            isEncrypted = gang.chatEncryptionExpiry > Math.floor(server.clock.currentTime() / 1000);

            messageRaw = text.substr(firstSpaceIndex).trim();
            message = Message.format(Message.GANG_CHAT_REMOTE, gang.tag, player.id, player.name,
                                     messageRaw);

            player.sendMessage(message);
            recipients.add(player);

        // Players and administrators who do not use the prefix will by default just target their
        // own gang, if they are in one.
        } else {
            gang = this.gangs_().getGangForPlayer(player);
            if (!gang) {
                player.sendMessage(Message.GANG_CHAT_NO_GANG);
                return true;
            }

            // Determine whether the gang's chat should be encrypted.
            isEncrypted = gang.chatEncryptionExpiry > Math.floor(server.clock.currentTime() / 1000);

            messageRaw = text.substr(1).trim();
            message =
                Message.format((isEncrypted ? Message.GANG_CHAT_ENCRYPTED
                                            : Message.GANG_CHAT),
                               gang.tag, player.id, player.name, messageRaw);
        }

        // Announce the message to people watching on IRC.
        this.nuwani_().echo('chat-gang', gang.name, gang.id, player.id, player.name, messageRaw);

        for (let member of gang.members) {
            if (isIsolated && member != player)
                continue;

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
        if (this.spyingPlayer_ !== null && !isEncrypted && !isIsolated) {
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

        for (const gang of this.gangs_().getGangs()) {
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

        const currentTimeSec = Math.floor(server.clock.currentTime() / 1000);
        const message = Message.format(Message.GANG_CHAT_SPY, this.spyingPlayer_.name,
                                       this.spyingPlayer_.id);

        const encryptedGangs = [];

        this.gangs_().getGangs().forEach(gang => {
            if (gang.chatEncryptionExpiry > currentTimeSec) {
                encryptedGangs.push(gang);
                return;  // the |gang| has encrypted their communications
            }

            for (let member of gang.members) {
                if (member === this.spyingPlayer_)
                    continue;

                member.sendMessage(message);
            }
        });

        if (!encryptedGangs.length)
            return;

        const sortedEncryptedGangs = encryptedGangs.sort((lhs, rhs) =>
            lhs.tag.localeCompare(rhs.tag));

        // Inform the spying player of gangs that have encrypted their chat.
        this.spyingPlayer_.sendMessage(
            Message.GANG_CHAT_SPY_ENC, sortedEncryptedGangs.map(g => g.tag).join(', '));
    }

    // Called when the `communication` feature has been reloaded.
    onCommunicationReload() {
        this.communication_().addDelegate(this);
    }

    dispose() {
        this.communication_().removeDelegate(this);

        this.communication_.removeReloadObserver(this);
        this.communication_ = null;

        this.callbacks_.dispose();
    }
}

export default GangChatManager;
