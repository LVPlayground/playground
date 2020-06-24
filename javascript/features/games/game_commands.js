// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/command_manager/command_builder.js';
import { GameActivity } from 'features/games/game_activity.js';
import { GameRegistration } from 'features/games/game_registration.js';
import { GameRuntime } from 'features/games/game_runtime.js';
import { Menu } from 'components/menu/menu.js';
import { Question } from 'components/dialogs/question.js';
import { Setting } from 'entities/setting.js';

import { confirm } from 'components/dialogs/confirm.js';

// Returns whether the two given maps are equal to each other.
function mapEquals(left, right) {
    if (left.size !== right.size)
        return false;
    
    for (const [ key, value ] of left) {
        if (right.get(key) !== value)
            return false;
    }

    return true;
}

// This class is responsible for making sure that all the appropriate commands for games on the
// server are made available, as well as canonical functionality such as the `/challenge` command.
export class GameCommands {
    finance_ = null;
    limits_ = null;
    nuwani_ = null;
    settings_ = null;

    commands_ = null;
    disposed_ = false;
    manager_ = null;
    registry_ = null;

    // Gets the |commands_| map for testing purposes.
    get commandsForTesting() { return this.commands_; }

    constructor(finance, limits, nuwani, settings, manager, registry) {
        this.finance_ = finance;
        this.limits_ = limits;
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
                .build(GameCommands.prototype.onCommand.bind(this, description, /* custom */ true))
            .sub(CommandBuilder.NUMBER_PARAMETER)
                .build(GameCommands.prototype.onCommand.bind(this, description, /* custom */ false))
            .build(GameCommands.prototype.onCommand.bind(this, description, /* custom */ false));
        
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
    async onCommand(description, custom, player, registrationId) {
        const settings = await this.determineSettings(description, custom, player);
        if (!settings)
            return;  // the |player| aborted out of the flow

        const decision = this.limits_().canStartMinigame(player);
        if (!decision.isApproved()) {
            player.sendMessage(Message.GAME_REGISTRATION_REJECTED, decision);
            return;
        }

        // Check if the player has enough money to participate in the game.
        if (!description.isFree() && this.finance_().getPlayerCash(player) < description.price) {
            player.sendMessage(
                Message.GAME_REGISTRATION_NOT_ENOUGH_MONEY, description.price, description.name);
            return;
        }

        // Check if there are any existing games that the |player| might be able to join.
        const pendingRegistrations = this.manager_.getPendingGameRegistrations(description);

        let pendingPublicRegistrations = 0;
        for (const pendingRegistration of pendingRegistrations) {
            if (pendingRegistration.type !== GameRegistration.kTypePublic)
                continue;  // this is not a game to which everyone can sign up
            
            pendingPublicRegistrations++;

            // If the |settings| aren't equal to the pending registration, we allow the sign up if
            // either (a) no |registrationId| is given, and this isn't a custom game, or (b) the
            // |registrationId| is given, and it matches the |pendingRegistration|'s ID.
            if (!mapEquals(settings, pendingRegistration.settings) || registrationId) {
                if (!registrationId && custom)
                    continue;  // a new custom game has been created

                if (registrationId && pendingRegistration.id !== registrationId)
                    continue;  // a registration Id has been given
            }
            
            // Take the registration fee from the |player|.
            if (!description.isFree())
                this.finance_().takePlayerCash(player, description.price);

            player.sendMessage(
                Message.GAME_REGISTRATION_JOINED, pendingRegistration.getActivityName());

            this.nuwani_().echo(
                'notice-minigame', player.name, player.id, pendingRegistration.getActivityName());

            // Actually register the |player| to participate, and we're done here.
            pendingRegistration.registerPlayer(player, description.price);
            return;
        }

        // If the |description| accepts continuous participation, players can join and leave as they
        // please. We need to handle this case in the sign-up logic as well.
        const activeRuntimes = this.manager_.getActiveGameRuntimes(description);

        for (const activeRuntime of activeRuntimes) {
            if (activeRuntime.state != GameRuntime.kStateRunning)
                continue;
            
            // TODO: We might want to support settings and custom options for continuous games, in
            // which case joining the first one is not the right thing to do. This requires a
            // `mapEquals` and private/public check like the block above.

            // Take the registration fee from the |player|.
            if (!description.isFree())
                this.finance_().takePlayerCash(player, description.price);

            player.sendMessage(
                Message.GAME_REGISTRATION_JOINED, activeRuntime.getActivityName());
            
            this.nuwani_().echo(
                'notice-minigame', player.name, player.id, activeRuntime.getActivityName());
            
            // Actually have the |player| join the |activeRuntime|, and we're done here.
            await activeRuntime.addPlayer(player, description.price);
            return;
        }

        // If a |registrationId| was given, and we reach this point, then it was invalid. Tell 'em.
        if (registrationId) {
            player.sendMessage(Message.GAME_REGISTRATION_INVALID_ID);
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
            this.manager_.createGameRegistration(description, settings,
                                                 GameRegistration.kTypePublic);

        if (!registration) {
            player.sendMessage(
                Message.GAME_REGISTRATION_UNAVAILABLE, registration.getActivityName());
            return;
        }

        // Take the registration fee from the |player|.
        if (!description.isFree())
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

        // Append the registration's ID after the command that the player has to enter in case there
        // are multiple active sign-ups, so that interested people can join the right game.
        let command = description.command;

        if (pendingPublicRegistrations > 0)
            command += ` ${registration.id}`;
        
        // Send a message to all other unengaged people on the server to see if the want to
        // participate in the game as well. They're welcome to sign up.
        const formattedAnnouncement =
            Message.format(Message.GAME_REGISTRATION_ANNOUNCEMENT, registration.getActivityName(),
                           command, description.price);

        for (const recipient of server.playerManager) {
            if (recipient === player || recipient.isNonPlayerCharacter())
                continue;  // no need to send to either the |player| or to bots
            
            if (this.manager_.getPlayerActivity(recipient))
                continue;  // the |recipient| is already involved in another game
            
            recipient.sendMessage(formattedAnnouncement);
        }
    }

    // ---------------------------------------------------------------------------------------------
    // Game configuration flow
    // ---------------------------------------------------------------------------------------------

    // Determines the settings for the game described by |description|. This will use the default
    // settings, unless the |player| has indicated that they want to customize. (The |custom| flag.)
    async determineSettings(description, custom, player) {
        const settings = new Map();

        // Populate the |settings| with the default configuration for the game.
        for (const [ identifier, setting ] of description.settings)
            settings.set(identifier, setting.defaultValue);

        // If the |custom| flag has not been set, return the |settings| immediately as we're done.
        // Otherwise we begin the game customization flow.
        if (!custom)
            return settings;

        // If no settings have been defined for this game, then there's nothing to customize. Ask
        // the player what they're intending to happen in this scenario.
        if (!settings.size) {
            const startDefault = await confirm(player, {
                title: `Customize the ${description.name} game`,
                message: `The ${description.name} game does not have any customization options ` +
                         `available. Do you want to start the default game instead?`,
            });

            if (!startDefault)
                return null;
            
            return settings;
        }

        // Otherwise we display the configuration flow to the |player|.
        if (!await this.displaySettingsDialog(player, description, settings))
            return null;

        return settings;
    }

    // Displays the settings dialog for the game described by |description| to the |player|.
    async displaySettingsDialog(player, description, settings) {
        const dialog = new Menu(description.name, ['Setting', 'Value']);

        dialog.addItem('Start the game!', '-');
        dialog.addItem('----------', '----------');

        for (const [ identifier, setting ] of description.settings) {
            const label = setting.description;

            const defaultValue = setting.defaultValue;
            const currentValue = settings.get(identifier);
            const prefix = defaultValue !== currentValue ? '{FFFF00}' : '';

            let valueLabel = currentValue;
            if (setting.type === Setting.TYPE_BOOLEAN)
                valueLabel = !!currentValue ? 'enabled' : 'disabled';

            // Create a listener that internally switches based on the type of this setting. This
            // avoids a lot of code duplication, because most of the validation is consistent.
            const listener = async () => {
                let updatedValue = null;

                switch (setting.type) {
                    case Setting.TYPE_BOOLEAN:
                        updatedValue = await this.displayListSettingDialog(
                                           player, label, ['enabled', 'disabled'], valueLabel);

                        if (updatedValue !== null)
                            updatedValue = !!updatedValue;

                        break;
                    
                    case Setting.TYPE_ENUM:
                        updatedValue = await this.displayListSettingDialog(
                                           player, label, setting.options, currentValue);
                        break;
                    
                    case Setting.TYPE_NUMBER:
                        updatedValue = await this.displayInputSettingDialog(
                                           player, description, setting, currentValue);
                        break;
                    
                    case Setting.TYPE_STRING:
                        updatedValue = await this.displayInputSettingDialog(
                                           player, description, setting, currentValue);
                        break;
                }

                if (updatedValue === null)
                    return;  // bail out of the flow
                
                settings.set(identifier, updatedValue);

                // Display the same dialog again, as there may be more settings to change.
                await this.displaySettingsDialog(player, description, settings);
            };

            // Add the configuration setting to the |dialog| that's being built.
            dialog.addItem(label, prefix + valueLabel, listener);
        }

        return await dialog.displayForPlayer(player);
    }

    // Displays a dialog that allows the player to change to a particular list of settings. The
    // |options| must be an array with all available options, with |value| being the selected one.
    async displayListSettingDialog(player, label, options, value) {
        const dialog = new Menu(label);

        for (const option of options) {
            const label = option;
            const prefix = option === value ? '{FFFF00}' : '';

            dialog.addItem(prefix + label, () => value = option);
        }

        if (!await dialog.displayForPlayer(player))
            return null;
        
        return value;
    }

    // Displays a dialog that allows the player to input a value. This will still have to be
    // validated against the constraints, thus this returns either a string or a number.
    async displayInputSettingDialog(player, description, setting, currentValue) {
        let explanation = null;
        let validator = input => {
            let typedInput = input;  // to hold the |input| in its appropriate type

            // (1) If the |setting| is a number, verify that it parses as a number.
            if (setting.type === Setting.TYPE_NUMBER) {
                typedInput = parseFloat(input);
                if (Number.isNaN(typedInput) || !Number.isSafeInteger(typedInput)) {
                    explanation = `The input "${input}" is not a valid round number.`;
                    return false;
                }
            } else if (setting.type === Setting.TYPE_STRING && !input.length) {
                explanation = `The value for this setting cannot be empty.`;
                return false;
            }

            // (2) Run the |input| through the |description|'s validator, when available. These will
            // throw when the |input| cannot be validated, forming the exception.
            if (description.settingsValidator) {
                try {
                    if (description.settingsValidator(setting.identifier, typedInput))
                        return true;
                    
                    explanation = 'The given value has not been accepted by the game.';
                } catch (exception) {
                    explanation = exception.message;
                }

                return false;
            }

            // (3) If there wasn't a validator, then we'll just accept whatever garbage the player
            // happens to throw at us. They better handle it well!
            return true;
        };

        const answer = await Question.ask(player, {
            question: description.name,
            message: `${setting.description} (current value: ${currentValue})`,
            constraints: {
                validation: validator,
                explanation: () => explanation,
                abort: 'Sorry, but you must provide a valid value.',
            }
        });

        if (!answer)
            return null;
        
        if (setting.type === Setting.TYPE_NUMBER)
            return parseFloat(answer);

        return answer;
    }

    // ---------------------------------------------------------------------------------------------

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
