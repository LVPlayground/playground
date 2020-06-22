// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/command_manager/command_builder.js';
import { ScopedCallbacks } from 'base/scoped_callbacks.js';

import { relativeTime } from 'base/time.js';

// Id of the sound to play when a player has received a message.
const kMessageReceivedSoundId = 1058;

// Encapsulates a series of commands that enable players to directly communicate 1:1, as opposed to
// most of the other communication channels which are public(ish).
export class DirectCommunicationCommands {
    // Types of recent communication to power the `/r` command.
    static kIrcPM = 0;
    static kPM = 1;
    static kSecretPM = 2;

    callbacks_ = null;
    communication_ = null;
    nuwani_ = null;
    playground_ = null;

    // WeakMap from |player| to a struct of {type, id, name} of last received message.
    previousMessage_ = new WeakMap();

    // Gets the MessageVisibilityManager from the Communication feature.
    get visibilityManager() { return this.communication_().visibilityManager_; }

    constructor(communication, nuwani, playground) {
        this.communication_ = communication;
        this.nuwani_ = nuwani;

        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'ircmessage', DirectCommunicationCommands.prototype.onIrcMessageReceived.bind(this));

        this.playground_ = playground;
        this.playground_.addReloadObserver(
            this, DirectCommunicationCommands.prototype.registerTrackedCommands);

        this.registerTrackedCommands();
        
        // /ircpm [username] [message]
        server.commandManager.buildCommand('ircpm')
            .parameters([ { name: 'username',  type: CommandBuilder.WORD_PARAMETER },
                          { name: 'message', type: CommandBuilder.SENTENCE_PARAMETER } ])
            .build(DirectCommunicationCommands.prototype.onIrcPrivateMessageCommand.bind(this));

        // /pm [player] [message]
        server.commandManager.buildCommand('pm')
            .parameters([ { name: 'player',  type: CommandBuilder.PLAYER_PARAMETER },
                          { name: 'message', type: CommandBuilder.SENTENCE_PARAMETER } ])
            .build(DirectCommunicationCommands.prototype.onPrivateMessageCommand.bind(this));

        // /r [message]
        server.commandManager.buildCommand('r')
            .parameters([{ name: 'message', type: CommandBuilder.SENTENCE_PARAMETER }])
            .build(DirectCommunicationCommands.prototype.onReplyCommand.bind(this));

        // /spm [player] [message]
        server.commandManager.buildCommand('spm')
            .restrict(player => this.playground_().canAccessCommand(player, 'spm'))
            .parameters([ { name: 'player',  type: CommandBuilder.PLAYER_PARAMETER },
                          { name: 'message', type: CommandBuilder.SENTENCE_PARAMETER } ])
            .build(DirectCommunicationCommands.prototype.onSecretPrivateMessageCommand.bind(this));
    }

    // Registers the commands with configurable access with the Playground feature.
    registerTrackedCommands() {
        this.playground_().registerCommand('spm', Player.LEVEL_MANAGEMENT);
    }

    // /ircpm [username] [message]
    //
    // Enables VIPs to send messages directly to people on IRC through Nuwani. They will be sent as
    // NOTICE commands. Command is not available to non-VIPs.
    onIrcPrivateMessageCommand(player, username, unprocessedMessage) {
        if (!player.isVip()) {
            player.sendMessage(Message.COMMUNICATION_IRCPM_NO_VIP);
            return;
        }

        const message = this.communication_().processForDistribution(player, unprocessedMessage);
        if (!message)
            return;  // the message was blocked

        this.nuwani_().echo('chat-irc-notice', username, player.name, player.id, message);
        this.nuwani_().echo('chat-private-to-irc', player.name, player.id, username, message);

        const adminMessage = Message.format(
            Message.COMMUNICATION_IRCPM_ADMIN, player.name, player.id, username, message);

        // Share the message with administrators in-game as well.
        for (const otherPlayer of server.playerManager) {
            if (!otherPlayer.isAdministrator() || otherPlayer === player)
                continue;
            
            otherPlayer.sendMessage(adminMessage);
        }

        // Let the |player| themselves know that the message was sent.
        player.sendMessage(Message.COMMUNICATION_PM_IRC_SENDER, username, message);
    }

    // Called when an IRC message has been received. This allows us to store that fact, enabling the
    // `/r` command to work with IRC PMs as well.
    onIrcMessageReceived(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player || !event.username)
            return;  // the |player| does not exist.

        player.playSound(kMessageReceivedSoundId);

        // Store the interaction to enable |player| to use the `/r` command.
        this.previousMessage_.set(player, {
            type: DirectCommunicationCommands.kIrcPM,
            username: event.username,
            id: player.id,
        });
    }

    // /pm [player] [message]
    //
    // Enables players to send private messages to each other. They're not really private because
    // administrators are able to see them, but other players are not. It's something.
    onPrivateMessageCommand(player, target, unprocessedMessage) {
        if (player === target) {
            player.sendMessage(Message.COMMUNICATION_PM_SELF);
            return;
        }

        if (this.visibilityManager.isPlayerOnIgnoreList(player, target)) {
            player.sendMessage(Message.COMMUNICATION_PM_IGNORED);
            return;
        }

        const message = this.communication_().processForDistribution(player, unprocessedMessage);
        if (!message)
            return;  // the message was blocked
        
        // Check if the recieving |target| is muted and not allowed to recieved PMs.
        // And that the sending |player| is NOT an administrator.
        let muteTime = this.communication_().muteManager_.getPlayerRemainingMuteTime(target);
        if (muteTime !== null && !player.isAdministrator()) {
            const durationText = relativeTime({
                date1: new Date(),
                date2: new Date(Date.now() + muteTime * 1000)
            }).text;
            player.sendMessage(Message.COMMUNICATION_PM_TARGET_MUTED, target.name, target.id,
                               durationText);
            return;
        }
        
        player.sendMessage(Message.COMMUNICATION_PM_SENDER, target.name, target.id, message);

        if (!this.visibilityManager.isPlayerOnIgnoreList(target, player)) {
            target.sendMessage(Message.COMMUNICATION_PM_RECEIVER, player.name, player.id, message);
            target.playSound(kMessageReceivedSoundId);
        }

        this.nuwani_().echo(
            'chat-private', player.name, player.id, target.name, target.id, message);
        
        const adminMessage =
            Message.format(Message.COMMUNICATION_PM_ADMIN, player.name, player.id, target.name,
                           target.id, message);

        // Inform in-game administrators about the message as well.
        for (const otherPlayer of server.playerManager) {
            if (otherPlayer.isAdministrator() && otherPlayer !== player && otherPlayer !== target)
                otherPlayer.sendMessage(adminMessage);
        }

        // Store the interaction to enable |target| to use the `/r` command. This could enable the
        // |target| to use `/spm` without an exception, but hey, that's probably ok.
        this.previousMessage_.set(target, {
            type: DirectCommunicationCommands.kPM,
            userId: player.account.userId,
            id: player.id,
            name: player.name,
        });
    }

    // /r [message]
    //
    // Enables players to quickly respond to the last message they received. This encapsulates all
    // the forms of direct communication implemented in this class.
    onReplyCommand(player, message) {
        if (!this.previousMessage_.has(player)) {
            player.sendMessage(Message.COMMUNICATION_REPLY_NONE);
            return;
        }

        let previousMessage = this.previousMessage_.get(player);
        let target = null;

        // If the |target| has disconnected from the server, we'll do a best effort scan of other
        // players on the server to see if one matches their previous user ID.
        if (previousMessage.type != DirectCommunicationCommands.kIrcPM) {
            target = server.playerManager.getById(previousMessage.id);

            if (!target || target.name !== previousMessage.name) {
                for (const otherPlayer of server.playerManager) {
                    if (otherPlayer.account.userId !== previousMessage.userId)
                        continue;
                    
                    previousMessage.id = otherPlayer.id;
                    previousMessage.name = otherPlayer.name;
                    target = otherPlayer;

                    // Store the |previousMessage| so that we don't have to repeat this again.
                    this.previousMessage_.set(player, previousMessage);
                    break;
                }

                if (!target || target.name !== previousMessage.name) {
                    player.sendMessage(
                        Message.COMMUNICATION_REPLY_DISCONNECTED, previousMessage.name);
                    return;
                }
            }
        }

        // Now call the right method depending on the communication mechanism used.
        switch (previousMessage.type) {
            case DirectCommunicationCommands.kIrcPM:
                this.onIrcPrivateMessageCommand(player, previousMessage.username, message);
                return;
            case DirectCommunicationCommands.kPM:
                this.onPrivateMessageCommand(player, target, message);
                return;
            case DirectCommunicationCommands.kSecretPM:
                this.onSecretPrivateMessageCommand(player, target, message);
                return;
        }

        throw new Error('Unrecognized communication type: ' + previousMessage.type);
    }

    // /spm [player] [message]
    //
    // Sends a secret private message from the |player| to the |target|, that will not be available
    // to anyone else, nor end up on IRC. Useful for cases where discretion is required.
    onSecretPrivateMessageCommand(player, target, message) {
        if (target === player) {
            player.sendMessage(Message.COMMUNICATION_SPM_SELF);
            return;
        }

        target.sendMessage(Message.COMMUNICATION_SPM_RECEIVER, player.name, player.id, message);
        target.playSound(kMessageReceivedSoundId);

        player.sendMessage(Message.COMMUNICATION_SPM_SENDER, target.name, target.id, message);
        
        // Store the interaction to enable |target| to use the `/r` command. This could enable the
        // |target| to use `/spm` without an exception, but hey, that's probably ok.
        this.previousMessage_.set(target, {
            type: DirectCommunicationCommands.kSecretPM,
            userId: player.account.userId,
            id: player.id,
            name: player.name,
        });
    }

    dispose() {
        server.commandManager.removeCommand('ircpm');
        server.commandManager.removeCommand('pm');
        server.commandManager.removeCommand('spm');
        server.commandManager.removeCommand('r');

        this.callbacks_.dispose();
        this.callbacks_ = null;

        this.playground_().unregisterCommand('spm');
        this.playground_.removeReloadObserver(this);
    }
}
