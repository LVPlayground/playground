// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import CommandBuilder from 'components/command_manager/command_builder.js';
import { GameActivity } from 'features/games/game_activity.js';
import { GameRegistration } from 'features/games/game_registration.js';

import confirm from 'components/dialogs/confirm.js';

// This class is responsible for making sure that all the appropriate commands for games on the
// server are made available, as well as canonical functionality such as the `/challenge` command.
export class GameCommands {
    finance_ = null;
    nuwani_ = null;
    settings_ = null;

    commands_ = null;
    disposed_ = false;
    manager_ = null;
    registry_ = null;

    // Gets the |commands_| map for testing purposes.
    get commandsForTesting() { return this.commands_; }

    constructor(finance, nuwani, settings, manager, registry) {
        this.finance_ = finance;
        this.nuwani_ = nuwani;
        this.settings_ = settings;

        this.manager_ = manager;

        this.registry_ = registry;
        this.registry_.setCommandDelegate(this);

        // Set of commands that have been registered on the server for individual games.
        this.commands_ = new Set();

        // /leave
        server.commandManager.buildCommand('leave')
            .sub(CommandBuilder.PLAYER_PARAMETER)
                .restrict(Player.LEVEL_ADMINISTRATOR)
                .build(GameCommands.prototype.onLeaveCommand.bind(this))
            .build(GameCommands.prototype.onLeaveCommand.bind(this));
    }

    // ---------------------------------------------------------------------------------------------

    // Creates and registers a command to start the game described in |description|.
    createCommandForGame(description) {
        const commandName = description.command;

        if (this.commands_.has(commandName))
            throw new Error(`A game with the /${commandName} command has already been registered.`);
        
        // Registers the |commandName| with the server, so that everyone can use it.
        server.commandManager.buildCommand(commandName)
            .sub('custom')
                .build(GameCommands.prototype.onCommand.bind(this, description, /* custom= */ true))
            .build(GameCommands.prototype.onCommand.bind(this, description, /* custom= */ false));
        
        this.commands_.add(commandName);
    }

    // Removes the command that had been created to start the game described in |description|.
    removeCommandForGame(description) {
        const commandName = description.command;

        if (!this.commands_.has(commandName))
            throw new Error(`No game with the /${commandName} command has been registered yet.`);
        
        // Removes the |commandName| from the server, so that people can't use it anymore.
        server.commandManager.removeCommand(commandName);

        this.commands_.delete(commandName);
    }

    // ---------------------------------------------------------------------------------------------

    // /leave [player]?
    //
    // Makes a player leave any game that they have registered for, or are participating in. If the
    // JavaScript code is not aware of any activity, the command will be given to Pawn instead.
    onLeaveCommand(currentPlayer, targetPlayer) {
        const player = targetPlayer || currentPlayer;

        const activity = this.manager_.getPlayerActivity(player);
        if (activity) {
            // If the game hasn't started yet and the |player| paid a fee to take part in it, we
            // can refund that amount to them so that they can do something else instead.
            if (activity.getActivityState() === GameActivity.kStateRegistered) {
                const contribution = activity.getPlayerContribution(player);
                if (contribution > 0)
                    this.finance_().givePlayerCash(player, contribution);
            }

            // Remove the |player| from the activity.
            activity.removePlayer(player);

            player.sendMessage(Message.GAME_REGISTRATION_LEFT, activity.getActivityName());
            return;
        }

        // Otherwise, forward the command to Pawn. Do this after a delay, to avoid re-entrancy
        // issues. In practice this will be a delay of ~5 milliseconds.
        if (!server.isTest()) {
            wait(0).then(() => pawnInvoke(
                'OnPlayerLeaveCommand', 'ii', currentPlayer.id, targetPlayer ? targetPlayer.id
                                                                             : Player.kInvalidId));
        }
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |player| has executed the command necessary to start the game described in
    // the given |description|. This will first check that they're not occupied with another
    // activity just yet. If they aren't, it will either register them for an existing pending game,
    // or create a new game just for them.
    async onCommand(description, custom, player) {
        const gameSettings = await this.determineSettings(description, custom, player);
        if (!gameSettings)
            return;  // the |player| aborted out of the flow

        const activity = this.manager_.getPlayerActivity(player);
        if (activity) {
            let message = null;

            switch (activity.getActivityState()) {
                case GameActivity.kStateRegistered:
                    message = Message.GAME_REGISTRATION_ALREADY_REGISTERED;
                    break;
                case GameActivity.kStateEngaged:
                    message = Message.GAME_REGISTRATION_ALREADY_ENGAGED;
                    break;
                default:
                    throw new Error(`Unknown activity: ${activity}`)
            }

            player.sendMessage(message, activity.getActivityName());
            return;
        }

        // Check if the player has enough money to participate in the game.
        if (this.finance_().getPlayerCash(player) < description.price) {
            player.sendMessage(
                Message.GAME_REGISTRATION_NOT_ENOUGH_MONEY, description.price, description.name);
            return;
        }

        // Check if there are any existing games that the |player| might be able to join.
        const pendingRegistrations = this.manager_.getPendingGameRegistrations(description);
        for (const pendingRegistration of pendingRegistrations) {
            if (pendingRegistration.type !== GameRegistration.kTypePublic)
                continue;  // this is not a game to which everyone can sign up
            
            // Take the registration fee from the |player|.
            this.finance_().takePlayerCash(player, description.price);

            player.sendMessage(
                Message.GAME_REGISTRATION_JOINED, pendingRegistration.getActivityName());

            this.nuwani_().echo(
                'notice-minigame', player.name, player.id, pendingRegistration.getActivityName());

            // Actually register the |player| to participate, and we're done here.
            pendingRegistration.registerPlayer(player, description.price);
            return;
        }

        // If the |description| requires more players than currently are available, let's refuse to
        // start the game, to avoid disappointment down the line.
        const availablePlayers = GameRegistration.getTheoreticalNumberOfParticipants(this.manager_);
        if (description.minimumPlayers > availablePlayers) {
            player.sendMessage(
                Message.GAME_REGISTRATION_NOT_ENOUGH_PLAYERS, description.name,
                description.minimumPlayers, availablePlayers);

            return;
        }

        // Create a new registration flow for the |description|, to which all other players are
        // invited to participate. This enables future commands to join the game instead.
        const registration =
            this.manager_.createGameRegistration(description, gameSettings,
                                                 GameRegistration.kTypePublic);

        if (!registration) {
            player.sendMessage(
                Message.GAME_REGISTRATION_UNAVAILABLE, registration.getActivityName());
            return;
        }

        // Take the registration fee from the |player|.
        this.finance_().takePlayerCash(player, description.price);

        // Let people watching Nuwani see that the minigame has started.
        this.nuwani_().echo(
            'notice-minigame', player.name, player.id, registration.getActivityName());

        // Register the |player| to participate in the |registration|.
        registration.registerPlayer(player, description.price)

        // If the |player| is the only on available for the game, and the game allows single-player
        // participation, it's possible that it's immediately started.
        if (registration.hasFinished()) {
            player.sendMessage(Message.GAME_REGISTRATION_STARTED, registration.getActivityName());
            return;
        }

        // An asynchronous registration period will be started for the configured amount of time.
        // Communicate this to the player, and schedule a start attempt after that time.
        const expirationTimeSec = this.settings_().getValue('games/registration_expiration_sec');

        player.sendMessage(Message.GAME_REGISTRATION_JOINED, registration.getActivityName());
        player.sendMessage(Message.GAME_REGISTRATION_CREATED, expirationTimeSec);

        wait(expirationTimeSec * 1000).then(() =>
            this.onCommandRegistrationExpired(registration));

        // Send a message to all other unengaged people on the server to see if the want to
        // participate in the game as well. They're welcome to sign up.
        const formattedAnnouncement =
            Message.format(Message.GAME_REGISTRATION_ANNOUNCEMENT, registration.getActivityName(),
                           description.command, description.price);

        for (const recipient of server.playerManager) {
            if (recipient === player || recipient.isNonPlayerCharacter())
                continue;  // no need to send to either the |player| or to bots
            
            if (this.manager_.getPlayerActivity(recipient))
                continue;  // the |recipient| is already involved in another game
            
            recipient.sendMessage(formattedAnnouncement);
        }
    }

    // Determines the settings for the game described by |description|. This will use the default
    // settings, unless the |player| has indicated that they want to customize. (The |custom| flag.)
    async determineSettings(description, custom, player) {
        const settings = new Map();

        // Populate the |settings| with the default configuration for the game.
        for (const [ identifier, setting ] of description.settings)
            settings.set(identifier, setting.defaultValue);

        // If the |custom| flag has been set, start the customization flow. This allows the player
        // to change everything in |settings| within the defined boundaries.
        if (custom) {
            const startDefault = confirm(player, {
                title: `Customize the ${description.name} game`,
                message: `The ${description.name} game does not have any customization options ` +
                         `available. Do you want to start the default game instead?`,
            });

            if (!startDefault)
                return null;
        }

        settings.set('haystack/difficulty', 'extreme');
        settings.set('haystack/levels', 15);
        settings.set('haystack/nighttime', true);

        console.log([...settings.entries()])

        return settings;
    }

    // Called when the registration expiration for the given |registration| has expired. It's time
    // to start the game, or refund the participating players their contribution.
    onCommandRegistrationExpired(registration) {
        if (registration.hasFinished() || this.disposed_)
            return;  // the |registration| has already finished
        
        // If enough players have registered for the game, then we will be able to start it.
        if (registration.players.size >= registration.description.minimumPlayers) {
            registration.start();
            return;
        }

        // Otherwise, it will have to be cancelled. Remove all players and tell them what's up.
        for (const [ player, contribution ] of registration.players.entries()) {
            // (1) Tell the |player| what's going on.
            player.sendMessage(
                Message.GAME_REGISTRATION_NOT_ENOUGH_REGISTRATIONS, registration.description.name);

            // (2) Refund the |player| their |contribution|.
            this.finance_().givePlayerCash(player, contribution);

            // (3) Remove the |player| from the |registration|.
            registration.removePlayer(player);
        }
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.disposed_ = true;

        this.registry_.setCommandDelegate(null);
        this.registry_ = null;

        server.commandManager.removeCommand('leave');

        for (const commandName of this.commands_)
            server.commandManager.removeCommand(commandName);

        this.commands_ = null;
    }
}
