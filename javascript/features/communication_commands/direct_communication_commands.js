// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import CommandBuilder from 'components/command_manager/command_builder.js';

// Encapsulates a series of commands that enable players to directly communicate 1:1, as opposed to
// most of the other communication channels which are public(ish).
export class DirectCommunicationCommands {
    // Types of recent communication to power the `/r` command.
    static kSecretPM = 0;

    communication_ = null;
    playground_ = null;

    // WeakMap from |player| to a struct of {type, id, name} of last received message.
    previousMessage_ = new WeakMap();

    // Gets the MessageVisibilityManager from the Communication feature.
    get visibilityManager() { return this.communication_().visibilityManager_; }

    constructor(communication, playground) {
        this.communication_ = communication;
        this.playground_ = playground;
        this.playground_.addReloadObserver(
            this, DirectCommunicationCommands.prototype.registerTrackedCommands);

        this.registerTrackedCommands();

        // TODO:
        // - /ircpm
        // - /pm
        
        // /r [message]
        server.commandManager.buildCommand('r')
            .parameters([{ name: 'message', type: CommandBuilder.SENTENCE_PARAMETER }])
            .build(DirectCommunicationCommands.prototype.onReplyCommand.bind(this));

        // /spm [player] [message]
        server.commandManager.buildCommand('spm')
            .restrict(player => this.playground_().canAccessCommand(player, 'spm'))
            .parameters([ { name: 'target',  type: CommandBuilder.PLAYER_PARAMETER },
                          { name: 'message', type: CommandBuilder.SENTENCE_PARAMETER } ])
            .build(DirectCommunicationCommands.prototype.onSecretPrivateMessageCommand.bind(this));
    }

    // Registers the commands with configurable access with the Playground feature.
    registerTrackedCommands() {
        this.playground_().registerCommand('spm', Player.LEVEL_MANAGEMENT);
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
        let target = server.playerManager.getById(previousMessage.id);

        // If the |target| has disconnected from the server, we'll do a best effort scan of other
        // players on the server to see if one matches their previous user ID.
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
                player.sendMessage(Message.COMMUNICATION_REPLY_DISCONNECTED, previousMessage.name);
                return;
            }
        }

        // Now call the right method depending on the communication mechanism used.
        switch (previousMessage.type) {
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
        player.sendMessage(Message.COMMUNICATION_SPM_SENDER, target.name, target.id, message);
        
        // Store the interaction to enable |target| to use the `/r` command. This could enable the
        // |target| to use `/spm` without an exception, but hey, that's probably ok.
        this.previousMessage_.set(target, {
            type: DirectCommunicationCommands.kSecretPM,
            userId: player.account.userId,
            id: player.id,
            name: player.id,
        });
    }

    dispose() {
        server.commandManager.removeCommand('spm');
        server.commandManager.removeCommand('r');

        this.playground_().unregisterCommand('spm');
        this.playground_.removeReloadObserver(this);
    }
}
