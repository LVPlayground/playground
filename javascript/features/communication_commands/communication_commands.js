// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CallCommands } from 'features/communication_commands/call_commands.js';
import { CommandBuilder } from 'components/command_manager/command_builder.js';
import { DirectCommunicationCommands } from 'features/communication_commands/direct_communication_commands.js';
import { Feature } from 'components/feature_manager/feature.js';
import { IgnoreCommands } from 'features/communication_commands/ignore_commands.js';
import { MuteCommands } from 'features/communication_commands/mute_commands.js'
import { NuwaniCommands } from 'features/communication_commands/nuwani_commands.js';

// Set of `/show` messages that Gunther will issue at a particular interval.
const kGuntherMessages = [
    'beg', 'derby', 'discord', 'dm', 'donate', 'forum', 'irc', 'minigames', 'reg', 'report', 
    'rules', 'stunt', 'top', 'weapons'
];

// In which file are messages for the `/show` command stored?
const kShowCommandDataFile = 'data/show.json';

// Provides a series of commands associated with communication on Las Venturas Playground. These
// commands directly serve the Communication feature, but require a dependency on the `announce`
// feature which is prohibited given that Communication is a foundational feature.
export default class CommunicationCommands extends Feature {
    announce_ = null;
    communication_ = null;
    nuwani_ = null;
    settings_ = null;

    commands_ = null;
    disposed_ = false;
    nuwaniCommands_ = null;

    showMessages_ = null;

    // Gets the MessageVisibilityManager from the Communication feature.
    get visibilityManager() { return this.communication_().visibilityManager_; }

    constructor() {
        super();

        // Used to send messages to in-game administrators.
        this.announce_ = this.defineDependency('announce');

        // This series of commands services the Communication feature.
        this.communication_ = this.defineDependency('communication');

        // Used to send non-channel communication to people watching through Nuwani.
        this.nuwani_ = this.defineDependency('nuwani');
        this.nuwani_.addReloadObserver(this, () => this.initializeIrcCommands());

        // Used to make certain parts of communication configurable.
        this.settings_ = this.defineDependency('settings');

        // TODO:
        // - /slap
        // - /slapb(ack)

        // Implementation of various commands have been grouped together to keep things organised,
        // which is reflected in the following array of command groups.
        this.commands_ = [
            new CallCommands(this.communication_),
            new DirectCommunicationCommands(this.communication_, this.nuwani_),
            new IgnoreCommands(this.communication_),
            new MuteCommands(this.announce_, this.communication_, this.nuwani_),
        ];

        this.initializeIrcCommands();

        // /announce [message]
        server.commandManager.buildCommand('announce')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([{ name: 'message', type: CommandBuilder.SENTENCE_PARAMETER }])
            .build(CommunicationCommands.prototype.onAnnounceCommand.bind(this));
        
        // /clear
        server.commandManager.buildCommand('clear')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .build(CommunicationCommands.prototype.onClearCommand.bind(this));

        // /me [message]
        server.commandManager.buildCommand('me')
            .parameters([{ name: 'message', type: CommandBuilder.SENTENCE_PARAMETER }])
            .build(CommunicationCommands.prototype.onMeCommand.bind(this));

        // /psay [player] [message]
        server.commandManager.buildCommand('psay')
            .restrict(Player.LEVEL_MANAGEMENT)
            .parameters([
                { name: 'player', type: CommandBuilder.PLAYER_PARAMETER },
                { name: 'message', type: CommandBuilder.SENTENCE_PARAMETER }])
            .build(CommunicationCommands.prototype.onPSayCommand.bind(this));

        // /show [message] [player]?
        server.commandManager.buildCommand('show')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([
                { name: 'message', type: CommandBuilder.WORD_PARAMETER, optional: true },
                { name: 'player', type: CommandBuilder.PLAYER_PARAMETER, optional: true }])
            .build(CommunicationCommands.prototype.onShowCommand.bind(this));

        // Unless we're in a test, start the GuntherCycle which will automatically use the /show
        // command with his credentials with a number of predefined commands.
        if (!server.isTest())
            this.runTheGuntherCycle();
    }

    // Initializes the IRC commands that are related to communication.
    initializeIrcCommands() {
        const commandManager = this.nuwani_().commandManager;
        this.nuwaniCommands_ =
            new NuwaniCommands(commandManager, this.announce_, this.communication_, this.nuwani_);
    }

    // The Gunther cycle will spin for the lifetime of this object, displaying a `/show` message at
    // a configured interval.
    async runTheGuntherCycle() {
        do {
            await wait(this.settings_().getValue('playground/gunther_help_interval_sec') * 1000);
            if (this.disposed_)
                return;

            let hasOnlinePlayers = 0;
            for (const player of server.playerManager) {
                if (player.isNonPlayerCharacter())
                    continue;
                
                hasOnlinePlayers = true;
                break;
            }

            const message = kGuntherMessages[Math.floor(Math.random() * kGuntherMessages.length)];
            const gunther = server.playerManager.getByName('Gunther', false);

            if (gunther && hasOnlinePlayers)
                this.onShowCommand(gunther, message, null);

        } while (true);
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

    // /me [message]
    //
    // Shows an IRC-styled status update, which is a convenient way for players to relay how they're
    // doing. An example could be "/me is eating a banana", but consider that they might be lying.
    onMeCommand(player, unprocessedMessage) {
        const message = this.communication_().processForDistribution(player, unprocessedMessage);
        if (!message)
            return;  // the message has been blocked

        const formattedMessage = Message.format(
            Message.COMMUNICATION_ME, player.colors.currentColor.toHexRGB(), player.name, message);

        // Bail out quickly if the |player| has been isolated.
        if (player.syncedData.isIsolated()) {
            player.sendMessage(formattedMessage);
            return;
        }

        this.distributeMessageToPlayers(player, formattedMessage, formattedMessage);
        this.nuwani_().echo('status', player.id, player.name, message);
    }

    // /psay [player] [message]
    //
    // Fakes as if the |targetPlayer| has said the given |message|. No information will be shared
    // with administrators, although it will be logged in the server's console.
    onPSayCommand(player, targetPlayer, message) {
        dispatchEvent('playertext', {
            playerid: targetPlayer.id,
            text: message,
        });

        console.log(`[psay] ${player.name} impersonated ${targetPlayer.name}: ${message}`);

        player.sendMessage(Message.COMMUNICATION_PSAY_SENT);
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
            const allMessages = Array.from(this.showMessages_.keys()).sort();
            while (allMessages.length > 0) {
                player.sendMessage(
                    Message.ANNOUNCE_SHOW_UNKNOWN, allMessages.splice(0, 10).join('/'));
            }
            
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
        const localMessage = Message.format(Message.ANNOUNCE_MESSAGE, messageText);

        // Assume that the |player| is sending the message in context, so the recipients should be
        // in the same world as they are -- this automatically excludes minigames.
        this.distributeMessageToPlayers(player, [ header, localMessage, header ], null);

        this.announce_().announceToAdministrators(
            Message.ANNOUNCE_SHOW_ADMIN, player.name, player.id, message);
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

    dispose() {
        this.disposed_ = true;

        for (const commands of this.commands_)
            commands.dispose();

        server.commandManager.removeCommand('show');
        server.commandManager.removeCommand('psay');
        server.commandManager.removeCommand('me');
        server.commandManager.removeCommand('clear');
        server.commandManager.removeCommand('announce');

        this.nuwaniCommands_.dispose();
        this.nuwaniCommands_ = null;

        this.nuwani_.removeReloadObserver(this);
        this.nuwani_ = null;
    }
}
