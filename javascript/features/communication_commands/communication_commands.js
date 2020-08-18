// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CallCommands } from 'features/communication_commands/call_commands.js';
import { CommandBuilder } from 'components/commands/command_builder.js';
import { DirectCommunicationCommands } from 'features/communication_commands/direct_communication_commands.js';
import { Feature } from 'components/feature_manager/feature.js';
import { IgnoreCommands } from 'features/communication_commands/ignore_commands.js';
import { MuteCommands } from 'features/communication_commands/mute_commands.js'
import { NuwaniCommands } from 'features/communication_commands/nuwani_commands.js';

import { messages } from 'features/communication_commands/communication_commands.messages.js';
import { timeDifferenceToString } from 'base/time.js';
import { random } from 'base/random.js';

// Set of `/show` messages that Gunther will issue at a particular interval.
const kGuntherMessages = [
    'beg', 'derby', 'discord', 'dm', 'donate', 'forum', 'irc', 'minigames', 'reg', 'report',
    'rules', 'stunt', 'top', 'weapons'
];

// In which file are messages for the `/show` command stored?
const kShowCommandDataFile = 'data/show.json';

// In which file are the reasons for the `/slap` command stored?
const kSlapCommandDataFile = 'data/slap_reasons.json';

// Provides a series of commands associated with communication on Las Venturas Playground. These
// commands directly serve the Communication feature, but require a dependency on the `announce`
// feature which is prohibited given that Communication is a foundational feature.
export default class CommunicationCommands extends Feature {
    announce_ = null;
    communication_ = null;
    finance_ = null;
    nuwani_ = null;
    settings_ = null;

    commands_ = null;
    disposed_ = false;
    nuwaniCommands_ = null;

    showMessages_ = null;

    slapHistory_ = new Map();
    slapReasons_ = null;
    slapTiming_ = new Map();

    // Gets the MessageVisibilityManager from the Communication feature.
    get visibilityManager() { return this.communication_().visibilityManager_; }

    constructor() {
        super();

        // Used to send messages to in-game administrators.
        this.announce_ = this.defineDependency('announce');

        // This series of commands services the Communication feature.
        this.communication_ = this.defineDependency('communication');

        // Certain commands cost a little bit of money.
        this.finance_ = this.defineDependency('finance');

        // Used to send non-channel communication to people watching through Nuwani.
        this.nuwani_ = this.defineDependency('nuwani');
        this.nuwani_.addReloadObserver(this, () => this.initializeIrcCommands());

        // Used to make certain parts of communication configurable.
        this.settings_ = this.defineDependency('settings');

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
            .description('Used for making an announcement on the server.')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([{ name: 'message', type: CommandBuilder.kTypeText }])
            .build(CommunicationCommands.prototype.onAnnounceCommand.bind(this));

        // /clear
        server.commandManager.buildCommand('clear')
            .description(`Clear all contents from everyone's chat box.`)
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .build(CommunicationCommands.prototype.onClearCommand.bind(this));

        // /me [message]
        server.commandManager.buildCommand('me')
            .description('Sends a message styled after an IRC action.')
            .parameters([{ name: 'message', type: CommandBuilder.kTypeText }])
            .build(CommunicationCommands.prototype.onMeCommand.bind(this));

        // /psay [player] [message]
        server.commandManager.buildCommand('psay')
            .description('Impersonate another player in sending a message.')
            .restrict(Player.LEVEL_MANAGEMENT)
            .parameters([
                { name: 'player', type: CommandBuilder.kTypePlayer },
                { name: 'message', type: CommandBuilder.kTypeText }])
            .build(CommunicationCommands.prototype.onPSayCommand.bind(this));

        // /show [message] [player]?
        server.commandManager.buildCommand('show')
            .description('Used for informing everyone about a particular subject.')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([
                { name: 'message', type: CommandBuilder.kTypeText, optional: true },
                { name: 'player', type: CommandBuilder.kTypePlayer, optional: true }])
            .build(CommunicationCommands.prototype.onShowCommand.bind(this));

        // /slap [player]
        server.commandManager.buildCommand('slap')
            .description('Slap one of your fellow players across the face.')
            .parameters([{ name: 'player', type: CommandBuilder.kTypePlayer }])
            .build(CommunicationCommands.prototype.onSlapCommand.bind(this));

        // /slapb
        server.commandManager.buildCommand('slapb')
            .description('Slap back at the one who decided to just slap you.')
            .build(CommunicationCommands.prototype.onSlapBackCommand.bind(this));

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

        this.distributeMessageToPlayers({
            player,
            localMessage: formattedMessage,
            remoteMessage: formattedMessage,
        });

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
        this.distributeMessageToPlayers({
            player,
            category: 'communication/show',
            localMessage: [ header, localMessage, header ],
            remoteMessage: null,
        });

        this.announce_().announceToAdministrators(
            Message.ANNOUNCE_SHOW_ADMIN, player.name, player.id, message);
    }

    // /slap [player]
    //
    // Called when the |player| wishes to slap the |target| across the... variety of reasons that
    // we've got defined in our JSON configuration file, which will be lazily loaded.
    onSlapCommand(player, target) {
        if (this.communication_().isCommunicationMuted()) {
            player.sendMessage(messages.communication_slap_muted);
            return;
        }

        if (player === target) {
            player.sendMessage(messages.communication_slap_self);
            return;
        }

        if (target.isNonPlayerCharacter()) {
            player.sendMessage(messages.communication_slap_npc);
            return;
        }

        this.slap(player, target);
    }

    // /slapb
    //
    // The |player| wishes to slap back whomever slapped them last, for an equally silly reason.
    // Requires the |player| to have been slapped just before this.
    onSlapBackCommand(player) {
        if (this.communication_().isCommunicationMuted()) {
            player.sendMessage(messages.communication_slap_muted);
            return;
        }

        if (!this.slapHistory_.has(player.name)) {
            player.sendMessage(messages.communication_slap_no_history);
            return;
        }

        const nickname = this.slapHistory_.get(player.name);
        const target = server.playerManager.getByName(nickname, /* fuzzy= */ false);

        if (!target) {
            player.sendMessage(messages.communication_slap_no_target, { target: nickname });
            return;
        }

        this.slap(player, target);
    }

    // Actually makes the |player| slap the |target|. Will lazily initialize the slap system on
    // first use, by preparing state and loading the necessary configuration files.
    slap(player, target) {
        // Frequency limit applied to the `/slap` command, in milliseconds.
        const kFrequencyLimitMs = 7000;

        // Price to `/slap` someone across their face.
        const kPrice = 5000;

        // Sound ID that should be used when someone gets slapped across the face.
        const kSoundID = 1190;

        // Lazily initialize the slapping system.
        if (!this.slapReasons_)
            this.slapReasons_ = JSON.parse(readFile(kSlapCommandDataFile))

        // Apply the rate limiting for the command, to not nag other players too often.
        const currentTime = server.clock.monotonicallyIncreasingTime();
        const previous = this.slapTiming_.get(player.name);

        if (previous && (currentTime - previous) < kFrequencyLimitMs) {
            player.sendMessage(messages.communication_slap_wait, {
                cooldown: timeDifferenceToString(kFrequencyLimitMs / 1000),
            });
            return;
        }

        // Take their moneys, as making a sound in a virtual environment definitely is worth $5,000.
        if (this.finance_().getPlayerCash(player) < kPrice) {
            player.sendMessage(messages.communication_slap_no_funds, { price: kPrice });
            return;
        }

        this.finance_().takePlayerCash(player, kPrice);

        // Impose the frequency limit for the |player|. This will persist across sessions.
        this.slapHistory_.set(target.name, player.name);
        this.slapTiming_.set(player.name, currentTime);

        // (1) Play the |kSoundID| for all connected human players.
        for (const otherPlayer of server.playerManager) {
            if (!otherPlayer.isNonPlayerCharacter())
                otherPlayer.playSound(kSoundID);
        }

        // (2) Send the |target| the slap message. First we determine the reason.
        const reason = this.slapReasons_[random(this.slapReasons_.length)];
        const message = messages.communication_slapped(null, { player, target, reason });

        // Note: it'd be great to only send this to local recipients, but given that we've played a
        // slap sound for all players already it would be a bit weird to mess with that.
        this.distributeMessageToPlayers({
            player,
            category: 'communication/slap',
            localMessage: message,
            remoteMessage: message,
        });
    }

    // Distributes the given |formattedMessage| to the players who are supposed to receive it per
    // the MessageVisibilityManager included in the Communication feature.
    distributeMessageToPlayers({ player, category = null, localMessage, remoteMessage } = {}) {
        const playerVirtualWorld = player.virtualWorld;

        const visibilityManager = this.visibilityManager;
        for (const recipient of server.playerManager) {
            if (category && !this.announce_().isCategoryEnabledForPlayer(recipient, category))
                continue;  // the |recipient| has disabled these messages

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

        server.commandManager.removeCommand('slapb');
        server.commandManager.removeCommand('slap');
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
