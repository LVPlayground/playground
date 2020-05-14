// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import CommandBuilder from 'components/command_manager/command_builder.js';
import Feature from 'components/feature_manager/feature.js';

import { relativeTime } from 'base/time.js';

// In which file are messages for the `/show` command stored?
const kShowCommandDataFile = 'data/show.json';

// After how many seconds does a `/call` expire, because they didn't pick up?
export const kCallExpirationTimeSec = 15;

// Provides a series of commands associated with communication on Las Venturas Playground. These
// commands directly serve the Communication feature, but require a dependency on the `announce`
// feature which is prohibited given that Communication is a foundational feature.
export default class CommunicationCommands extends Feature {
    announce_ = null;
    communication_ = null;
    nuwani_ = null;

    dialToken_ = new WeakMap();
    dialing_ = new WeakMap();
    showMessages_ = null;

    // Gets the CallChannel from the Communication feature.
    get callChannel() { return this.communication_().manager_.getCallChannel(); }

    // Gets the MuteManager from the Communication feature, which we service.
    get muteManager() { return this.communication_().muteManager_; }

    // Gets the MessageVisibilityManager from the Communication feature.
    get visibilityManager() { return this.communication_().visibilityManager_; }

    constructor() {
        super();

        this.announce_ = this.defineDependency('announce');
        this.communication_ = this.defineDependency('communication');
        this.nuwani_ = this.defineDependency('nuwani');

        // TODO:
        // - /ircpm
        // - /pm
        // - /r
        // - /showmessage
        // - /slap
        // - /slapb(ack)

        // TODO:
        // - Gunther running /show in 5 minute intervals:
        //   {"beg", "donate", "irc", "report", "rules", "forum", "reg", "swear", "weapons"};

        // /announce [message]
        server.commandManager.buildCommand('announce')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([{ name: 'message', type: CommandBuilder.SENTENCE_PARAMETER }])
            .build(CommunicationCommands.prototype.onAnnounceCommand.bind(this));

        // /answer
        server.commandManager.buildCommand('answer')
            .build(CommunicationCommands.prototype.onAnswerCommand.bind(this));

        // /call [player]
        server.commandManager.buildCommand('call')
            .parameters([{ name: 'player', type: CommandBuilder.PLAYER_PARAMETER }])
            .build(CommunicationCommands.prototype.onCallCommand.bind(this));

        // /clear
        server.commandManager.buildCommand('clear')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .build(CommunicationCommands.prototype.onClearCommand.bind(this));

        // /hangup
        server.commandManager.buildCommand('hangup')
            .build(CommunicationCommands.prototype.onHangupCommand.bind(this));

        // /ignore [player]
        server.commandManager.buildCommand('ignore')
            .parameters([{ name: 'player', type: CommandBuilder.PLAYER_PARAMETER }])
            .build(CommunicationCommands.prototype.onIgnoreCommand.bind(this));

        // /ignored
        server.commandManager.buildCommand('ignored')
            .sub(CommandBuilder.PLAYER_PARAMETER)
                .restrict(Player.LEVEL_ADMINISTRATOR)
                .build(CommunicationCommands.prototype.onIgnoredCommand.bind(this))
            .build(CommunicationCommands.prototype.onIgnoredCommand.bind(this));

        // /me [message]
        server.commandManager.buildCommand('me')
            .parameters([{ name: 'message', type: CommandBuilder.SENTENCE_PARAMETER }])
            .build(CommunicationCommands.prototype.onMeCommand.bind(this));

        // /mute [player] [duration=3]
        server.commandManager.buildCommand('mute')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([
                { name: 'player', type: CommandBuilder.PLAYER_PARAMETER },
                { name: 'duration', type: CommandBuilder.NUMBER_PARAMETER, optional: true }])
            .build(CommunicationCommands.prototype.onMuteCommand.bind(this));

        // /muted
        server.commandManager.buildCommand('muted')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .build(CommunicationCommands.prototype.onMutedCommand.bind(this));

        // /reject
        server.commandManager.buildCommand('reject')
            .build(CommunicationCommands.prototype.onRejectCommand.bind(this));

        // /show [message] [player]?
        server.commandManager.buildCommand('show')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([
                { name: 'message', type: CommandBuilder.WORD_PARAMETER },
                { name: 'player', type: CommandBuilder.PLAYER_PARAMETER, optional: true }])
            .build(CommunicationCommands.prototype.onShowCommand.bind(this));

        // /showreport
        server.commandManager.buildCommand('showreport')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([{ name: 'player', type: CommandBuilder.PLAYER_PARAMETER }])
            .build(CommunicationCommands.prototype.onShowReportCommand.bind(this));

        // /unignore [player]
        server.commandManager.buildCommand('unignore')
            .parameters([{ name: 'player', type: CommandBuilder.PLAYER_PARAMETER }])
            .build(CommunicationCommands.prototype.onUnignoreCommand.bind(this));

        // /unmute [player]
        server.commandManager.buildCommand('unmute')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([{ name: 'player', type: CommandBuilder.PLAYER_PARAMETER }])
            .build(CommunicationCommands.prototype.onUnmuteCommand.bind(this));
    }

    // /announce
    //
    // Announces the given |message| to the world. Subject to communication filtering.
    onAnnounceCommand(player, unprocessedMessage) {
        const message = this.communication_().processForDistribution(player, unprocessedMessage);
        if (!message)
            return;  // the message was blocked
        
        for (const player of server.playerManager) {
            player.sendMessage(Message.ANNOUNCE_HEADER);
            player.sendMessage(Message.ANNOUNCE_MESSAGE, message);
            player.sendMessage(Message.ANNOUNCE_HEADER);
        }

        this.announce_().announceToAdministrators(
            Message.format(Message.ANNOUNCE_ADMIN_NOTICE, player.name, player.id, message));
        
        this.nuwani_().echo('notice-announce', message);
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

    // /clear
    //
    // Clears the chat box for all in-game players. This is generally useful when someone has said
    // something truly awful that shouldn't be seen by anyone.
    onClearCommand(player) {
        const kEmptyMessages = 120;

        // Use SendClientMessageToAll() to reduce the number of individual Pawn calls.
        for (let message = 0; message < kEmptyMessages; ++message)
            pawnInvoke('SendClientMessageToAll', 'is', 0, ' ');
        
        this.announce_().announceToAdministrators(
            Message.COMMUNICATION_CLEAR_ADMIN, player.name, player.id);
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

    // /ignore [player]
    //
    // Makes the given |player| ignore the selected |subject|. No further communication will be
    // received from them, although they may still see other evidence of them existing.
    onIgnoreCommand(player, subject) {
        const ignored = this.visibilityManager.getIgnoredPlayers(player);
        if (ignored.includes(subject)) {
            player.sendMessage(Message.IGNORE_ADDED_REDUNDANT, subject.name);
            return;
        }

        this.visibilityManager.addPlayerToIgnoreList(player, subject);

        player.sendMessage(Message.IGNORE_ADDED_PLAYER, subject.name);
    }

    // /ignored [player]?
    //
    // Gives an overview of who the |player| has ignored. Administrators are able to use the command
    // on other players as well, as it helps them to debug what's going on.
    onIgnoredCommand(currentPlayer, targetPlayer) {
        const player = targetPlayer || currentPlayer;

        const ignored = this.visibilityManager.getIgnoredPlayers(player);
        if (!ignored.length) {
            currentPlayer.sendMessage(Message.IGNORE_IGNORED_NOBODY);
            return;
        }

        const ignoredPlayers = [];
        for (const ignoredPlayer of ignored) {
            if (!ignoredPlayer.isConnected()) {
                this.visibilityManager.removePlayerFromIgnoreList(player, ignoredPlayer);
                continue;
            }
            
            ignoredPlayers.push(`${ignoredPlayer.name} (Id:${ignoredPlayer.id})`);
        }

        // It's possible that there were left-over players who have disconnected since.
        if (!ignoredPlayers.length) {
            currentPlayer.sendMessage(Message.IGNORE_IGNORED_NOBODY);
            return;
        }

        // Send the list of |ignoredPlayers| in batches of five to keep the messages short.
        while (ignoredPlayers.length) {
            currentPlayer.sendMessage(
                Message.IGNORE_IGNORED, ignoredPlayers.splice(0, 5).join(', '));
        }
    }

    // /me [message]
    //
    // Shows an IRC-styled status update, which is a convenient way for players to relay how they're
    // doing. An example could be "/me is eating a banana", but consider that they might be lying.
    onMeCommand(player, unprocessedMessage) {
        const message = this.communication_().processForDistribution(player, unprocessedMessage);
        if (!message)
            return;  // the message has been blocked

        const formattedMessage = Message.format(Message.COMMUNICATION_ME, player.name, message);

        // Bail out quickly if the |player| has been isolated.
        if (player.syncedData.isIsolated()) {
            player.sendMessage(formattedMessage);
            return;
        }

        this.distributeMessageToPlayers(player, formattedMessage, formattedMessage);
        this.nuwani_().echo('status', player.id, player.name, message);
    }

    // Distributes the given |formattedMessage| to the players who are supposed to receive it per
    // the MessageVisibilityManager included in the Communication feature.
    distributeMessageToPlayers(player, localMessage, remoteMessage) {
        const playerVirtualWorld = player.virtualWorld;

        const visibilityManager = this.visibilityManager;
        for (const recipient of server.playerManager) {
            const recipientMessage =
                visibilityManager.selectMessageForPlayer(player, playerVirtualWorld, recipient,
                                                         { localMessage, remoteMessage });

            if (!recipientMessage)
                continue;  // the |recipient| should not receive the message

            if (!Array.isArray(recipientMessage)) {
                recipient.sendMessage(recipientMessage);
                continue;
            }

            for (const message of recipientMessage)
                recipient.sendMessage(message);
        }
    }

    // /mute [player] [duration=3]
    //
    // Mutes the given player for the indicated amount of time, in minutes. This will cut off all
    // ways of communication for them, except for administrator chat.
    onMuteCommand(player, targetPlayer, duration = 3) {
        const timeRemaining = this.muteManager.getPlayerRemainingMuteTime(targetPlayer);

        const proposedTime = duration * 60;
        const proposedText = relativeTime({
            date1: new Date(),
            date2: new Date(Date.now() + proposedTime * 1000 )
        }).text;

        this.muteManager.mutePlayer(targetPlayer, proposedTime);

        if (!timeRemaining) {
            targetPlayer.sendMessage(
                Message.MUTE_MUTED_TARGET, player.name, player.id, proposedText);
        } else {
            const change = timeRemaining >= proposedTime ? 'decreased' : 'extended';

            // Inform the |targetPlayer| about their punishment having changed.
            targetPlayer.sendMessage(
                Message.MUTE_MUTED_TARGET_UPDATE, player.name, player.id, change, proposedText);
        }

        this.announce_().announceToAdministrators(
            Message.MUTE_ADMIN_MUTED, player.name, player.id, targetPlayer.name, targetPlayer.id,
            proposedText);

        player.sendMessage(Message.MUTE_MUTED, targetPlayer.name, targetPlayer.id, proposedText);
    }

    // /muted
    //
    // Displays an overview of the currently muted players to |player|, and how much time they have
    // left before they automatically get unmuted.
    onMutedCommand(player) {
        let hasMutedPlayers = false;

        for (const otherPlayer of server.playerManager) {
            const remainingTime = this.muteManager.getPlayerRemainingMuteTime(otherPlayer);
            if (!remainingTime)
                continue;

            hasMutedPlayers = true;

            const duration = relativeTime({
                date1: new Date(),
                date2: new Date(Date.now() + remainingTime * 1000 )
            }).text;

            player.sendMessage(Message.MUTE_MUTED_LIST, otherPlayer.name, otherPlayer.id, duration);
        }

        if (!hasMutedPlayers)
            player.sendMessage(Message.MUTE_MUTED_NOBODY);
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

    // /show [message] [player]?
    //
    // Shows a particular |message| to the user. The individual messages will be loaded from a JSON
    // file, lazily, on first usage of the actual command.
    onShowCommand(player, message, targetPlayer) {
        if (!this.showMessages_) {
            const messages = JSON.parse(readFile(kShowCommandDataFile));

            this.showMessages_ = new Map();
            for (const [identifier, text] of Object.entries(messages))
                this.showMessages_.set(identifier, text);
        }

        const messageText = this.showMessages_.get(message);
        if (!messageText) {
            player.sendMessage(Message.ANNOUNCE_SHOW_UNKNOWN,
                               Array.from(this.showMessages_.keys()).sort().join('/'));
            return;
        }

        // Fast-path if there is a |targetPlayer|, just send the message to them.
        if (targetPlayer) {
            targetPlayer.sendMessage(Message.ANNOUNCE_HEADER);
            targetPlayer.sendMessage(Message.ANNOUNCE_MESSAGE, messageText);
            targetPlayer.sendMessage(Message.ANNOUNCE_HEADER);
            return;
        }

        const header = Message.ANNOUNCE_HEADER;
        const localMessage = Message.format(Message.ANNOUNCE_ALL, messageText);

        // Assume that the |player| is sending the message in context, so the recipients should be
        // in the same world as they are -- this automatically excludes minigames.
        this.distributeMessageToPlayers(player, [ header, localMessage, header ], null);

        this.announce_().announceToAdministrators(
            Message.ANNOUNCE_SHOW_ADMIN, player.name, player.id, message);
    }

    // /showreport [player]
    //
    // Shows a message to the given player on how to report players in the future, and mutes them
    // automatically for two minutes to make sure that they get the point.
    onShowReportCommand(player, targetPlayer) {
        const timeRemaining = this.muteManager.getPlayerRemainingMuteTime(targetPlayer);
        if (timeRemaining > 0) {
            player.sendMessage(
                Message.MUTE_SHOW_REPORT_ALREADY_MUTED, targetPlayer.name, targetPlayer.id);
            return;
        }

        const kDurationSeconds = 120;
        const kDuration = '2 minutes';

        this.muteManager.mutePlayer(targetPlayer, kDurationSeconds);

        // Inform the |targetPlayer| about how to report, as well as their punishment.
        targetPlayer.sendMessage(Message.MUTE_SHOW_REPORT_BORDER);
        targetPlayer.sendMessage(
            Message.MUTE_SHOW_REPORT_MESSAGE_1, player.name, player.id, kDuration);
        targetPlayer.sendMessage(Message.MUTE_SHOW_REPORT_MESSAGE_2);
        targetPlayer.sendMessage(Message.MUTE_SHOW_REPORT_BORDER);

        // Inform in-game administrators and the |player| themselves of the mute.
        this.announce_().announceToAdministrators(
            Message.MUTE_ADMIN_MUTED, player.name, player.id, targetPlayer.name, targetPlayer.id,
            kDuration);

        player.sendMessage(Message.MUTE_MUTED, targetPlayer.name, targetPlayer.id, kDuration);
    }

    // /unignore [player]
    //
    // Removes the given |subject| from the ignore list specific to |player|. They'll start to
    // receive all communication sent by them again.
    onUnignoreCommand(player, subject) {
        const ignored = this.visibilityManager.getIgnoredPlayers(player);
        if (!ignored.includes(subject)) {
            player.sendMessage(Message.IGNORE_REMOVED_REDUNDANT, subject.name);
            return;
        }

        this.visibilityManager.removePlayerFromIgnoreList(player, subject);

        player.sendMessage(Message.IGNORE_REMOVED_PLAYER, subject.name);
    }

    // /unmute [player]
    //
    // Immediately unmutes the given player for an unspecified reason. They'll be able to use all
    // forms of communication on the server again.
    onUnmuteCommand(player, targetPlayer) {
        const timeRemaining = this.muteManager.getPlayerRemainingMuteTime(targetPlayer);
        if (!timeRemaining) {
            player.sendMessage(Message.MUTE_UNMUTE_NOT_MUTED, targetPlayer.name, targetPlayer.id);
            return;
        }

        this.muteManager.unmutePlayer(targetPlayer);

        this.announce_().announceToAdministrators(
            Message.MUTE_ADMIN_UNMUTED, player.name, player.id, targetPlayer.name, targetPlayer.id);

        targetPlayer.sendMessage(Message.MUTE_UNMUTED_TARGET, player.name, player.id);
        player.sendMessage(Message.MUTE_UNMUTED, targetPlayer.name, targetPlayer.id);
    }

    dispose() {
        server.commandManager.removeCommand('unmute');
        server.commandManager.removeCommand('unignore');
        server.commandManager.removeCommand('showreport');
        server.commandManager.removeCommand('show');
        server.commandManager.removeCommand('reject');
        server.commandManager.removeCommand('muted');
        server.commandManager.removeCommand('mute');
        server.commandManager.removeCommand('ignored');
        server.commandManager.removeCommand('ignore');
        server.commandManager.removeCommand('hangup');
        server.commandManager.removeCommand('clear');
        server.commandManager.removeCommand('call');
        server.commandManager.removeCommand('answer');
        server.commandManager.removeCommand('announce');
    }
}
