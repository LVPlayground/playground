// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/commands/command_builder.js';

// After how many seconds does a `/call` expire, because they didn't pick up?
export const kCallExpirationTimeSec = 15;

// Encapsulates a series of commands to do with the ability to make phone calls.
export class CallCommands {
    communication_ = null;

    dialToken_ = new WeakMap();
    dialing_ = new WeakMap();

    // Gets the CallChannel from the Communication feature.
    get callChannel() { return this.communication_().manager_.getCallChannel(); }

    constructor(communication) {
        this.communication_ = communication;

        // /answer
        server.commandManager.buildCommand('answer')
            .description('Answers any incoming phone calls.')
            .build(CallCommands.prototype.onAnswerCommand.bind(this));

        // /call [player]
        server.commandManager.buildCommand('call')
            .description('Enables you to call another player.')
            .parameters([{ name: 'player', type: CommandBuilder.kTypePlayer }])
            .build(CallCommands.prototype.onCallCommand.bind(this));

        // /hangup
        server.commandManager.buildCommand('hangup')
            .description(`Ends the phone conversation you're involved in.`)
            .build(CallCommands.prototype.onHangupCommand.bind(this));

        // /reject
        server.commandManager.buildCommand('reject')
            .description('Rejects any incoming phone calls.')
            .build(CallCommands.prototype.onRejectCommand.bind(this));
    }

       // /answer
    //
    // Answers any in-progress dials to establish a phone call connection with the dialing player.
    onAnswerCommand(player) {
        const targetPlayer = this.dialing_.get(player);
        if (!targetPlayer) {
            player.sendMessage(Message.COMMUNICATION_DIAL_ANSWER_UNKNOWN);
            return;
        }

        this.callChannel.establish(player, targetPlayer);

        this.dialToken_.delete(targetPlayer);

        this.dialing_.delete(player);
        this.dialing_.delete(targetPlayer);
    }

    // /call [player]
    //
    // Begins calling the |targetPlayer| to establish a phone call. They have to acknowledge the
    // request, and it will automatically expire after |kCallExpirationTimeSec| seconds.
    onCallCommand(player, targetPlayer) {
        const currentRecipient =
            this.callChannel.getConversationPartner(player) || this.dialing_.get(player);

        // Bail out if the |player| is trying to call themselves.
        if (player === targetPlayer) {
            player.sendMessage(Message.COMMUNICATION_DIAL_SELF);
            return;
        }

         // Prevent them to call NPCs
         if (targetPlayer.isNonPlayerCharacter()) {
            player.sendMessage(Message.COMMUNICATION_DIAL_NPC);
            return;
        }

        // Bail out if the |player| is already on the phone.
        if (currentRecipient) {
            player.sendMessage(Message.COMMUNICATION_DIAL_BUSY_SELF, currentRecipient.name);
            return;
        }

        // Bail out if the |targetPlayer| is already on the phone.
        if (!!this.callChannel.getConversationPartner(targetPlayer) ||
                this.dialing_.has(targetPlayer)) {
            player.sendMessage(Message.COMMUNICATION_DIAL_BUSY_RECIPIENT, targetPlayer.name);
            return;
        }

        const dialToken = Symbol('unique dial token');

        // Store the |dialToken| to verify uniqueness of the call after the dial expires.
        this.dialToken_.set(player, dialToken);

        this.dialing_.set(player, targetPlayer);
        this.dialing_.set(targetPlayer, player);

        targetPlayer.sendMessage(Message.COMMUNICATION_DIAL_REQUEST, player.name);
        player.sendMessage(Message.COMMUNICATION_DIAL_WAITING, targetPlayer.name);

        // The call will automatically expire after a predefined amount of time.
        wait(kCallExpirationTimeSec * 1000).then(() => {
            if (this.dialToken_.get(player) !== dialToken)
                return;  // the call didn't expire

            this.dialToken_.delete(player);
            this.dialing_.delete(player);

            this.dialing_.delete(targetPlayer);

            if (!player.isConnected() || !targetPlayer.isConnected())
                return;  // either of the recipients has disconnected from the server

            player.sendMessage(Message.COMMUNICATION_DIAL_EXPIRED, targetPlayer.name);
            targetPlayer.sendMessage(Message.COMMUNICATION_DIAL_EXPIRED_RECIPIENT, player.name);
        });
    }

    // /hangup
    //
    // Ends any established phone conversations immediately.
    onHangupCommand(player) {
        const targetPlayer = this.callChannel.getConversationPartner(player);
        if (!targetPlayer) {
            player.sendMessage(Message.COMMUNICATION_DIAL_HANGUP_UNKNOWN);
            return;
        }

        this.callChannel.disconnect(player, targetPlayer);
    }

    // /reject
    //
    // Rejects any incoming phone conversation requests.
    onRejectCommand(player) {
        const targetPlayer = this.dialing_.get(player);
        if (!targetPlayer) {
            player.sendMessage(Message.COMMUNICATION_DIAL_REJECT_UNKNOWN);
            return;
        }

        player.sendMessage(Message.COMMUNICATION_DIAL_REJECTED, targetPlayer.name);
        targetPlayer.sendMessage(Message.COMMUNICATION_DIAL_REJECTED_RECIPIENT, player.name);

        this.dialToken_.delete(targetPlayer);

        this.dialing_.delete(player);
        this.dialing_.delete(targetPlayer);
    }

    dispose() {
        server.commandManager.removeCommand('reject');
        server.commandManager.removeCommand('hangup');
        server.commandManager.removeCommand('call');
        server.commandManager.removeCommand('answer');
    }
}
