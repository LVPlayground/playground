// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/commands/command_builder.js';
import { GameActivity } from 'features/games/game_activity.js';
import { GameCommandParams } from 'features/games/game_command_params.js';
import { GameRegistration } from 'features/games/game_registration.js';
import { GameRuntime } from 'features/games/game_runtime.js';
import { Menu } from 'components/menu/menu.js';
import { Question } from 'components/dialogs/question.js';
import { Setting } from 'entities/setting.js';

import { clone } from 'base/clone.js';
import { confirm } from 'components/dialogs/confirm.js';
import { equals } from 'base/equals.js';
import { format } from 'base/format.js';

// Prefix given to internal settings, that are not modifiable by the player.
const kInternalPrefix = 'internal/';

// This class is responsible for making sure that all the appropriate commands for games on the
// server are made available, as well as canonical functionality such as the `/challenge` command.
export class GameCommands {
    announce_ = null;
    finance_ = null;
    limits_ = null;
    settings_ = null;
    spectate_ = null;

    commands_ = null;
    disposed_ = false;
    manager_ = null;
    registry_ = null;

    // Gets the |commands_| map for testing purposes.
    get commandsForTesting() { return this.commands_; }

    constructor(announce, finance, limits, settings, spectate, manager, registry) {
        this.announce_ = announce;
        this.finance_ = finance;
        this.limits_ = limits;
        this.settings_ = settings;
        this.spectate_ = spectate;

        this.manager_ = manager;

        this.registry_ = registry;
        this.registry_.setCommandDelegate(this);

        // Set of commands that have been registered on the server for individual games.
        this.commands_ = new Set();

        // /leave
        server.commandManager.buildCommand('leave')
            .description('Leave the game that you are participating in.')
            .sub(CommandBuilder.kTypePlayer, 'target')
                .description('Make another player leave the game they are playing.')
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
            .description(`Sign up for the ${description.name}.`)
            .sub('custom')
                .description('Customise the game to your liking.')
                .build(GameCommands.prototype.onCommand.bind(this, description, 'customise'))
            .sub('watch')
                .description('Watch people currently playing this game.')
                .build(GameCommands.prototype.onCommand.bind(this, description, 'watch'))
            .sub(CommandBuilder.kTypeNumber, 'registration')
                .description(`Sign up for the ${description.name}.`)
                .build(GameCommands.prototype.onCommand.bind(this, description, /* option= */ null))
            .build(GameCommands.prototype.onCommand.bind(this, description, /* option= */ null));

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

            // Remove the |player| from the activity. This may fail if they're already in the
            // process of leaving, in which case we silently let the game run its course.
            if (activity.removePlayer(player) !== false)
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
    // the given |description|. Triggers the same code path as games initialized by other features.
    async onCommand(description, option, player, registrationId) {
        const params = new GameCommandParams();

        switch (option) {
            case 'customise':
                params.type = GameCommandParams.kTypeCustomise;
                break;

            case 'watch':
                params.type = GameCommandParams.kTypeWatch;
                break;
        }

        params.registrationId = registrationId;

        return this.startGame(description, player, params);
    }

    // Actually attempts to start the game described by |description|. Runs all the necessary checks
    // to verify that the player is able to do this right now. Will either sign them up to an
    // existing game, or create a new game for them specifically.
    async startGame(description, player, params) {
        if (params.type === GameCommandParams.kTypeWatch)
            return await this.watchGame(description, player);

        const settings = await this.determineSettings(description, player, params);
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
            if (!equals(settings, pendingRegistration.settings) || params.registrationId) {
                if (!params.registrationId && params.type === GameCommandParams.kTypeCustomise)
                    continue;  // a new custom game has been created

                if (params.registrationId && pendingRegistration.id !== params.registrationId)
                    continue;  // a registration Id has been given
            }

            // Take the registration fee from the |player|.
            if (!description.isFree())
                this.finance_().takePlayerCash(player, description.price);

            player.sendMessage(
                Message.GAME_REGISTRATION_JOINED, pendingRegistration.getActivityName());

            // Announce the |player|'s participation in this game to all other players.
            this.announce_().announceGameParticipation(
                player, pendingRegistration.getActivityName(), description.command);

            // Actually register the |player| to participate, and we're done here.
            pendingRegistration.registerPlayer(player, description.price);
            return;
        }

        // If the |description| accepts continuous participation, players can join and leave as they
        // please. We need to handle this case in the sign-up logic as well.
        const activeRuntimes = this.manager_.getActiveGameRuntimes(description);

        for (const activeRuntime of activeRuntimes) {
            if (!activeRuntime.description.continuous)
                continue;  // only continuous games can be joined this way

            if (activeRuntime.state != GameRuntime.kStateRunning)
                continue;  // the game isn't running yet, or is already shutting down

            // TODO: We might want to support settings and custom options for continuous games, in
            // which case joining the first one is not the right thing to do. This requires a
            // `mapEquals` and private/public check like the block above.

            // Take the registration fee from the |player|.
            if (!description.isFree())
                this.finance_().takePlayerCash(player, description.price);

            player.sendMessage(
                Message.GAME_REGISTRATION_JOINED_CONTINUOUS, activeRuntime.getActivityName());

            // Announce the |player|'s participation in this game to all other players.
            this.announce_().announceGameParticipation(
                player, activeRuntime.getActivityName(), description.command);

            // Actually have the |player| join the |activeRuntime|, and we're done here.
            await activeRuntime.addPlayer(player, description.price);
            return;
        }

        // If a |registrationId| was given, and we reach this point, then it was invalid. Tell 'em.
        if (params.registrationId) {
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

        // Register the |player| to participate in the |registration|.
        registration.registerPlayer(player, description.price)

        // Append the registration's ID after the command that the player has to enter in case there
        // are multiple active sign-ups, so that interested people can join the right game.
        let command = description.commandFn(settings);

        if (pendingPublicRegistrations > 0)
            command += ` ${registration.id}`;

        // Announce the |player|'s participation in this game to all other players.
        this.announce_().announceGameParticipation(player, registration.getActivityName(), command);

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

        // Announce to all players that the game has started. This is something that happens less
        // often, so should be broadcasted more visiblity for players to participate.
        this.announce_().announceGame(
            player, registration.getActivityName(), command, description.price);
    }

    // ---------------------------------------------------------------------------------------------
    // Game configuration flow
    // ---------------------------------------------------------------------------------------------

    // Determines the settings for the game described by |description|. This will use the default
    // settings, influenced by the configuration defined in the given |params|.
    async determineSettings(description, player, params) {
        const settings = new Map();

        let hasCustomisableSettings = false;

        // Populate the |settings| with the default configuration for the game.
        for (const [ identifier, setting ] of description.settings) {
            if (params.settings.has(identifier))
                settings.set(identifier, params.settings.get(identifier));
            else
                settings.set(identifier, clone(setting.defaultValue));

            if (!identifier.startsWith(kInternalPrefix) && !description.isSettingFrozen(identifier))
                hasCustomisableSettings = true;
        }

        // If the customise flag has not been set, return the |settings| immediately as we're done
        // unless the game prefers customisable versions.
        if (params.type !== GameCommandParams.kTypeCustomise) {
            if (params.type === GameCommandParams.kTypeStart)
                return settings;  // force-start when the params tell us to

            const registrations = this.manager_.getPendingGameRegistrations(description);
            const publicRegistrations = registrations.filter(registration =>
                registration.type === GameRegistration.kTypePublic);

            // If the game either doesn't prefer custom games, or has public sign-ups, bail out.
            if ((!params.preferCustom && !description.preferCustom) || publicRegistrations.length)
                return settings;
        }

        // If no settings have been defined for this game, then there's nothing to customize. Ask
        // the player what they're intending to happen in this scenario.
        if (!hasCustomisableSettings) {
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
    async displaySettingsDialog(player, description, settings, state) {
        const dialog = new Menu(description.name, ['Setting', 'Value']);
        const options = [];

        state = state ?? { start: false };

        dialog.addItem('Start the game!', '-', () => state.start = true);
        dialog.addItem('----------', '----------');

        for (const [ identifier, setting ] of description.settings) {
            if (identifier.startsWith(kInternalPrefix) || description.isSettingFrozen(identifier))
                continue;  // do not allow internal settings to be modified

            const label = setting.description;

            const defaultValue = setting.defaultValue;
            const currentValue = settings.get(identifier);
            const prefix = !equals(defaultValue, currentValue) ? '{FFFF00}' : '';

            let valueLabel = currentValue;
            if (setting.type === Setting.TYPE_BOOLEAN)
                valueLabel = !!currentValue ? 'Enabled' : 'Disabled';
            else if (setting.type === Setting.TYPE_CUSTOM)
                valueLabel = setting.handler.getCustomizationDialogValue(currentValue);

            // Create a listener that internally switches based on the type of this setting. This
            // avoids a lot of code duplication, because most of the validation is consistent.
            const listener = async () => {
                let updatedValue = null;

                switch (setting.type) {
                    case Setting.TYPE_BOOLEAN:
                        updatedValue = await this.displayListSettingDialog(
                                           player, label, ['Enabled', 'Disabled'], valueLabel);

                        if (updatedValue !== null)
                            updatedValue = updatedValue !== 'Disabled';

                        break;

                    case Setting.TYPE_CUSTOM:
                        updatedValue = await setting.handler.handleCustomization(
                                           player, settings, currentValue);
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

                if (updatedValue !== null && setting.type !== Setting.TYPE_CUSTOM)
                    settings.set(identifier, updatedValue);

                // Display the same dialog again, as there may be more settings to change. This
                // also captures the case where a sub-dialog was cancelled: that brings the player
                // back to the main customization dialog instead.
                await this.displaySettingsDialog(player, description, settings, state);
            };

            // Add the configuration setting to the |dialog| that's being built.
            options.push({ label, value: prefix + valueLabel, listener });
        }

        // Sort the |options| in ascending order based on the text of their label.
        options.sort((lhs, rhs) => lhs.label.localeCompare(rhs.label));

        // And add all the |options|, now in alphabetized order, to the |dialog|.
        for (const { label, value, listener } of options)
            dialog.addItem(label, value, listener);

        return await dialog.displayForPlayer(player) && state.start;
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
    // Game watching flow
    // ---------------------------------------------------------------------------------------------

    // Called when the |player| wants to watch a game with the given |description|. When the
    // specific game is known, and they aren't preoccupied yet, they will start to spectate the
    // game's SpectateGroup as an outsider (and thus have access to all participants).
    async watchGame(description, player) {
        // (1) Collect all the active games for the given |description|, and then filter out the
        // ones that aren't running. In practice all games will be candidates, but it's possible to
        // hit weird race conditions that make everything go weird.
        const activeRuntimes = this.manager_.getActiveGameRuntimes(description);
        const candidates = [];

        for (const activeRuntime of activeRuntimes) {
            if (activeRuntime.state !== GameRuntime.kStateRunning)
                continue;  // the game hasn't started yet, we can't watch it

            candidates.push(activeRuntime);
        }

        // (a) If there are no active games, there's nothing to spectate. Boo.
        if (!candidates.length) {
            player.sendMessage(Message.GAME_WATCH_NO_CANDIDATES);
            return;
        }

        // (b) If there's only a single candidate, assume that the |player| wants to watch that.
        if (candidates.length === 1)
            return this.watchRuntime(candidates[0], player);

        // (c) Display a disambiguation dialog where the |player| can pick what they want to watch.
        const dialog = new Menu('Which game do you want to watch?', [
            'Name',
            'Participants',
        ]);

        // Formats the given |participant| for display in the disambiguation dialog. We colour their
        // nickname because for many folks it's a point of recognition.
        function formatParticipant(participant) {
            return format(
                `{%s}%s{FFFFFF}`, participant.colors.currentColor.toHexRGB(), participant.name);
        }

        for (const runtime of candidates) {
            let name = runtime.getActivityName();
            let participants = '';

            const allParticipants = [ ...runtime.players ];
            if (allParticipants.length < 4) {
                participants = allParticipants.map(formatParticipant).join(', ');
            } else {
                participants  = allParticipants.splice(0, 2).map(formatParticipant).join(', ');
                participants += `, and ${allParticipants.length} others`;
            }

            // Add this particular |runtime| to the dialog.
            dialog.addItem(
                name, participants,
                GameCommands.prototype.watchRuntime.bind(this, runtime));
        }

        // 2) Display the |dialog| to the player so that they can make a decision.
        await dialog.displayForPlayer(player);
    }

    // Called when the |player| wants to watch the |runtime|. We need to make sure that the runtime
    // is able to take on watchers, and that the |player| is allowed to watch right now.
    async watchRuntime(runtime, player) {
        if (runtime.state !== GameRuntime.kStateRunning) {
            player.sendMessage(Message.GAME_WATCH_NO_RUNTIME);
            return;
        }

        const decision = this.limits_().canSpectate(player);
        if (!decision.isApproved()) {
            player.sendMessage(Message.GAME_WATCH_REJECTED, decision);
            return;
        }

        // Make the |player| spectate the |runtime|'s spectate group. They have the ability to see
        // all of the game's participants, and cycle through them as they please.
        this.spectate_().spectate(player, runtime.spectateGroup);
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
            if (contribution > 0)
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
