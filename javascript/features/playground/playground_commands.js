// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Command from 'features/playground/command.js';
import CommandBuilder from 'components/command_manager/command_builder.js';
import Menu from 'components/menu/menu.js';
import MessageBox from 'components/dialogs/message_box.js';
import PlaygroundAccessTracker from 'features/playground/playground_access_tracker.js';
import Question from 'components/dialogs/question.js';
import Setting from 'features/settings/setting.js';

// Directory in which the CPU profiles will be stored.
const ProfileDirectory = 'profiles';

// Utility function to capitalize the first letter of a |string|.
function capitalizeFirstLetter(string) {
    return string[0].toUpperCase() + string.slice(1);
}

// A series of general commands that don't fit in any particular
class PlaygroundCommands {
    constructor(access, announce, settings) {
        this.announce_ = announce;
        this.settings_ = settings;

        this.access_ = access;
        this.commands_ = new Map();

        this.profiling_ = false;

        // Functor that will actually activate a CPU profile. Has to be overridden by tests in order
        // to avoid starting a CPU profile by accident.
        this.captureProfileFn_ = (milliseconds, filename) =>
            captureProfile(milliseconds, filename);

        // -----------------------------------------------------------------------------------------

        // The `/lvp` command offers administrators and higher a number of functions to manage the
        // server, the available commands and availability of a number of smaller features.
        server.commandManager.buildCommand('lvp')
            .sub('access')
                .restrict(Player.LEVEL_ADMINISTRATOR)
                .build(PlaygroundCommands.prototype.onPlaygroundAccessCommand.bind(this))
            .sub('profile')
                .restrict(Player.LEVEL_MANAGEMENT)
                .parameters([ { name: 'milliseconds', type: CommandBuilder.NUMBER_PARAMETER } ])
                .build(PlaygroundCommands.prototype.onPlaygroundProfileCommand.bind(this))
            .sub('reload')
                .restrict(Player.LEVEL_MANAGEMENT)
                .parameters([ { name: 'feature', type: CommandBuilder.WORD_PARAMETER } ])
                .build(PlaygroundCommands.prototype.onPlaygroundReloadCommand.bind(this))
            .sub('settings')
                .restrict(Player.LEVEL_MANAGEMENT)
                .build(PlaygroundCommands.prototype.onPlaygroundSettingsCommand.bind(this))
            .build(PlaygroundCommands.prototype.onPlaygroundCommand.bind(this));
    }

    // Asynchronously loads the misc commands provided by this feature. They are defined in their
    // own source files, which must be loaded asynchronously.
    async loadCommands() {
        const commandFiles = [
            'features/playground/commands/autohello.js',
            'features/playground/commands/boost.js',
            'features/playground/commands/fancy.js',
            'features/playground/commands/fly.js',
            'features/playground/commands/jetpack.js',
            'features/playground/commands/isolate.js',
            'features/playground/commands/rampcar.js',
            'features/playground/commands/slow.js',
            'features/playground/commands/spm.js'
        ];

        for (const commandFile of commandFiles) {
            const CommandImplementation = (await import(commandFile)).default;
            if (!CommandImplementation instanceof Command)
                throw new Error(filename + ' does not contain a command.');

            const command = new CommandImplementation(this.announce_);

            // Register the command with the access manager, and then pass on the server-global
            // command manager to its build() method so that it can be properly exposed.
            this.access_.registerCommand(command.name, command.defaultPlayerLevel);

            command.build(
                server.commandManager.buildCommand(command.name)
                    .restrict(PlaygroundAccessTracker.prototype.canAccessCommand.bind(this.access_,
                                                                                      command.name)));

            // Store the |command| in the |commands_| dictionary.
            this.commands_.set(command.name, command);
        }
    }

    // Gets the access tracker for the commands managed by this class.
    get access() { return this.access_; }

    // Enables administrators and management to change access requirements to the commands that are
    // part of this module with a dialog-based interface.
    async onPlaygroundAccessCommand(player) {
        let commands = [];

        for (const [command, commandLevel] of this.access_.commands) {
            if (player.level < commandLevel)
                continue;

            commands.push(command);
        }

        // Sort the |commands| in alphabetical order, since there is no guarantee that the Access
        // Tracker maintains the commands in such order.
        commands.sort();

        const menu = new Menu('Command access settings', [
            'Command',
            'Level',
            'Exceptions'
        ]);

        commands.forEach(commandName => {
            const commandLevel = this.access_.getCommandLevel(commandName);
            const commandExceptions = this.access_.getExceptionCount(commandName);
            const defaultLevel = this.access_.getDefaultCommandLevel(commandName);

            const levelPrefix = commandLevel !== defaultLevel ? '{FFFF00}' : '';
            const level = playerLevelToString(commandLevel, true /* plural */);

            const exceptions = commandExceptions != 0
                ? '{FFFF00}' + commandExceptions + ' exception' + (commandExceptions == 1 ? '': 's')
                : '-';

            menu.addItem('/' + commandName, levelPrefix + capitalizeFirstLetter(level), exceptions,
                         PlaygroundCommands.prototype.displayCommandMenu.bind(this, commandName));
        });

        await menu.displayForPlayer(player);
    }

    // Displays a command menu for |commandName| to the |player|. It contains options to change the
    // required level, as well as options to grant and revoke exceptions for the command.
    async displayCommandMenu(commandName, player) {
        const menu = new Menu('/' + commandName + ' access settings');

        const exceptions = this.access_.getExceptions(commandName);
        exceptions.sort((lhs, rhs) =>
            lhs.name.localeCompare(rhs.name));

        menu.addItem('Change required level',
                     PlaygroundCommands.prototype.displayCommandLevelMenu.bind(this, commandName));

        menu.addItem('Grant exception',
                     PlaygroundCommands.prototype.grantCommandException.bind(this, commandName));

        if (exceptions.length) {
            menu.addItem('------------------------',
                         PlaygroundCommands.prototype.displayCommandMenu.bind(this, commandName));

            exceptions.forEach(subject => {
                menu.addItem(
                    'Revoke for ' + subject.name + ' (Id: ' + subject.id + ')',
                    PlaygroundCommands.prototype.revokeCommandException.bind(this, commandName,
                                                                             subject));
            });
        }

        await menu.displayForPlayer(player);
    }

    // Displays a menu that allows |player| to change the required level of |commandName| to any
    // level that's equal or below their own level, to avoid "losing" a command.
    async displayCommandLevelMenu(commandName, player) {
        const currentLevel = this.access_.getCommandLevel(commandName);
        const defaultLevel = this.access_.getDefaultCommandLevel(commandName);

        const menu = new Menu('/' + commandName + ' required level');

        [
            Player.LEVEL_PLAYER,
            Player.LEVEL_ADMINISTRATOR,
            Player.LEVEL_MANAGEMENT
        ].forEach(level => {
            if (level > player.level)
                return;

            const levelPrefix = currentLevel === level ? '{ADFF2F}' : '';
            const levelSuffix = defaultLevel === level ? ' (default)' : '';

            const levelName = playerLevelToString(level, true /* plural */);

            menu.addItem(levelPrefix + capitalizeFirstLetter(levelName) + levelSuffix, async() => {
                if (currentLevel === level) {
                    return await MessageBox.display(player, {
                        title: 'No need to update the level',
                        message: 'This command is already available to ' + levelName + '.'
                    });
                }

                this.access_.setCommandLevel(commandName, level);
                this.announce_().announceToAdministrators(
                    Message.LVP_ANNOUNCE_CMD_LEVEL, player.name, player.id, commandName, levelName)

                // Make an announcement to players if the command was either granted to them, or
                // taken away from them. We like to cause anarchy by upset mobs.
                if (level == Player.LEVEL_PLAYER) {
                    this.announce_().announceToPlayers(
                        Message.LVP_ANNOUNCE_CMD_AVAILABLE, player.name, commandName);
                } else if (currentLevel == Player.LEVEL_PLAYER) {
                    this.announce_().announceToPlayers(
                        Message.LVP_ANNOUNCE_CMD_REVOKED, player.name, commandName);
                }

                return await MessageBox.display(player, {
                    title: 'The level has been updated!',
                    message: '/' + commandName + ' is now available to ' + levelName + '.'
                });
            });
        });

        await menu.displayForPlayer(player);
    }

    // Grants an exception for a not yet determined player to use the |commandName|.
    async grantCommandException(commandName, player) {
        const answer = await Question.ask(player, {
            question: 'Select a player',
            message: 'Which player should be allowed to use /' + commandName + '?',
            leftButton: 'Grant'
        });

        if (!answer)
            return;  // the |player| cancelled the dialog.

        const subject = server.playerManager.find({ nameOrId: answer, returnPlayer: true });
        if (!subject) {
            const retry = await MessageBox.display(player, {
                title: 'Unable to identify the target player',
                message: 'Either no or too many players were found for "' + answer + '".',
                leftButton: 'Cancel',
                rightButton: 'Retry'
            });

            if (!retry)
                return;

            return await grantCommandException(commandName, player);
        }

        if (!subject.isRegistered()) {
            return await MessageBox.display(player, {
                title: 'Unable to grant an exception',
                message: 'Exceptions can only be granted to registered players. Consider asking ' +
                         subject.name + ' to register?'
            });
        }

        if (subject === player) {
            return await MessageBox.display(player, {
                title: 'Unable to grant an exception',
                message: 'There is no point in granting exceptions to yourself, sorry.'
            });
        }

        this.access_.addException(commandName, subject, player /* sourcePlayer */);
        if (this.access_.getCommandLevel(commandName) != Player.LEVEL_MANAGEMENT) {
            this.announce_().announceToAdministrators(
                Message.LVP_ANNOUNCE_CMD_EXCEPTION, player.name, player.id, subject.name,
                commandName);
        }

        return await MessageBox.display(player, {
            title: 'The exception has been granted!',
            message: '/' + commandName + ' is now available to ' + subject.name + '.'
        });
    }

    // Revokes the exception for |subject| to use the |commandName|.
    async revokeCommandException(commandName, subject, player) {
        this.access_.removeException(commandName, subject, player /* sourcePlayer */);

        if (this.access_.getCommandLevel(commandName) != Player.LEVEL_MANAGEMENT) {
            this.announce_().announceToAdministrators(
                Message.LVP_ANNOUNCE_CMD_REMOVED_EXCEPTION, player.name, player.id, subject.name,
                commandName);
        }

        return await MessageBox.display(player, {
            title: 'The exception has been revoked!',
            message: '/' + commandName + ' is no longer available to ' + subject.name + '.'
        });
    }

    // Enables Management members to capture a CPU profile of the gamemode for a given number of
    // |profileDurationMs|. The filename of the profile will be automatically decided.
    onPlaygroundProfileCommand(player, profileDurationMs) {
        const MinimumDurationMs = 100;
        const MaximumDurationMs = 180000;

        if (profileDurationMs < MinimumDurationMs || profileDurationMs > MaximumDurationMs) {
            player.sendMessage(
                Message.LVP_PROFILE_INVALID_RANGE, MinimumDurationMs, MaximumDurationMs);
            return;
        }

        if (this.profiling_) {
            player.sendMessage(Message.LVP_PROFILE_ONGOING);
            return;
        }

        function zeroPad(value) {
            return ('0' + value).substr(-2);
        }

        const date = new Date();

        // Compile the filename for the trace based on the current time on the server.
        const filename =
            'profile_' + date.getFullYear() + '-' + zeroPad(date.getMonth() + 1) + '-' +
            zeroPad(date.getDate()) + '_' + zeroPad(date.getHours()) + '-' +
            zeroPad(date.getMinutes()) + '-' + zeroPad(date.getSeconds()) + '.log';

        // Start an asynchronous function that will report the profile as having finished.
        (async() => {
            await milliseconds(profileDurationMs);

            this.announce_().announceToAdministrators(
                Message.LVP_ANNOUNCE_PROFILE_FINISHED, player.name, filename);

            if (player.isConnected())
                player.sendMessage(Message.LVP_PROFILE_FINISHED, filename);

            this.profiling_ = false;
        })();

        // Capture the profile through a functor that can be overridden for testing purposes.
        this.captureProfileFn_(profileDurationMs, ProfileDirectory + '/' + filename);
        this.profiling_ = true;

        this.announce_().announceToAdministrators(
            Message.LVP_ANNOUNCE_PROFILE_START, player.name, player.id, profileDurationMs);

        player.sendMessage(Message.LVP_PROFILE_STARTED, profileDurationMs);
    }

    // Facilitates the developer's ability to reload features without having to restart the server.
    // There are strict requirements a feature has to meet in regards to dependencies in order for
    // it to be live reloadable.
    async onPlaygroundReloadCommand(player, feature) {
        if (!server.featureManager.isEligibleForLiveReload(feature)) {
            player.sendMessage(Message.LVP_RELOAD_NOT_ELIGIBLE, feature);
            return;
        }

        await server.featureManager.liveReload(feature);

        this.announce_().announceToAdministrators(
            Message.LVP_ANNOUNCE_FEATURE_RELOADED, player.name, player.id, feature);

        player.sendMessage(Message.LVP_RELOAD_RELOADED, feature);

    }

    // Displays a series of menus to Management members that want to inspect or make changes to how
    // certain features on the server work, for example, the abuse and housing systems.
    async onPlaygroundSettingsCommand(player) {
        const categories = new Map();
        const menu = new Menu('Choose a category of settings', ['Category', 'Settings']);

        // Identify the categories of settings that exist on the server.
        for (const setting of this.settings_().getSettings()) {
            if (!categories.has(setting.category))
                categories.set(setting.category, new Set());

            categories.get(setting.category).add(setting);
        }

        const sortedCategories = Array.from(categories.keys()).sort();
        for (const category of sortedCategories) {
            const settings = categories.get(category);
            const settingsLabel = settings.size == 1 ? '1 setting'
                                                     : settings.size + ' settings';

            // Adds a menu item to display the entries in the |category|.
            menu.addItem(category, settingsLabel, async(player) => {
                const sortedSettings =
                    Array.from(settings).sort((lhs, rhs) => lhs.name.localeCompare(rhs.name));

                const innerMenu = new Menu('Choose a setting', ['Setting', 'Value']);
                for (const setting of sortedSettings) {
                    let valueLabel = 'null';

                    switch (setting.type) {
                        case Setting.TYPE_BOOLEAN:
                            valueLabel = setting.value ? 'enabled' : 'disabled';
                            if (setting.value != setting.defaultValue) {
                                valueLabel = '{FFFF00}' + valueLabel + '{FFFFFF} (default: ' +
                                             (setting.defaultValue ? 'enabled' : 'disabled') + ')';
                            }

                            break;

                        case Setting.TYPE_NUMBER:
                            valueLabel = '' + setting.value;
                            if (setting.value != setting.defaultValue) {
                                valueLabel = '{FFFF00}' + valueLabel + '{FFFFFF} (default: ' +
                                             setting.defaultValue + ')';
                            }

                            break;

                        case Setting.TYPE_STRING:
                            valueLabel = setting.value;
                            if (setting.value != setting.defaultValue) {
                                valueLabel = '{FFFF00}' + valueLabel + '{FFFFFF} (default: ' +
                                             setting.defaultValue + ')';
                            }

                            break;

                        default:
                            throw new Error('Invalid setting type for ' + setting.name);
                    }

                    // Add a menu item for the particular setting, that will in turn defer to a
                    // function that allows the particular setting to be changed.
                    innerMenu.addItem(setting.name, valueLabel, async(player) => {
                        switch (setting.type) {
                            case Setting.TYPE_BOOLEAN:
                                await this.handleBooleanSettingModification(player, setting);
                                break;

                            case Setting.TYPE_NUMBER:
                                await this.handleNumberSettingModification(player, setting);
                                break;

                            case Setting.TYPE_STRING:
                                await this.handleStringSettingModification(player, setting);
                                break;
                        }
                    });
                }

                await innerMenu.displayForPlayer(player);
            });
        }

        await menu.displayForPlayer(player);
    }

    // Handles the |player| modifying the |setting|, which represents a boolean value.
    async handleBooleanSettingModification(player, setting) {
        const menu = new Menu(setting.description);

        // Create creative labels that describe both the current value, the new value and the
        // default value that was configured for the setting in its entirety.
        const enableLabel = (setting.value ? '{FFFF00}' : '') + 'Enable' +
                            (setting.defaultValue ? ' {FFFFFF}(default)' : '');
        const disableLabel = (!setting.value ? '{FFFF00}' : '') + 'Disable' +
                             (!setting.defaultValue ? ' {FFFFFF}(default)' : '');

        menu.addItem(enableLabel, async(player) => {
            this.settings_().setValue(setting.identifier, true);
            this.announceSettingChangeToAdministrators(player, setting);

            return await MessageBox.display(player, {
                title: 'The setting has been enabled!',
                message: Message.format(Message.LVP_SETTING_TOGGLED, setting.identifier, 'enabled')
            });
        });

        menu.addItem(disableLabel, async(player) => {
            this.settings_().setValue(setting.identifier, false);
            this.announceSettingChangeToAdministrators(player, setting);

            return await MessageBox.display(player, {
                title: 'The setting has been disabled!',
                message: Message.format(Message.LVP_SETTING_TOGGLED, setting.identifier, 'disabled')
            });
        });

        await menu.displayForPlayer(player);
    }

    // Handles the |player| modifying the |setting|, which represents a numeric value.
    async handleNumberSettingModification(player, setting) {
        const answer = await Question.ask(player, {
            question: setting.identifier,
            message: setting.description + '\nThe default value is {FFA500}' +
                     setting.defaultValue + '{A9C4E4}',
            leftButton: 'Update'
        });

        if (!answer)
            return;  // the |player| cancelled the dialog.

        if (!answer.isSafeInteger()) {
            return await MessageBox.display(player, {
                title: 'Invalid value for the ' + setting.identifier + ' setting!',
                message: Message.format(Message.LVP_SETTING_INVALID_NUMBER, answer)
            });
        }

        this.settings_().setValue(setting.identifier, answer.toSafeInteger());
        this.announceSettingChangeToAdministrators(player, setting);

        return await MessageBox.display(player, {
            title: 'The setting has been disabled!',
            message: Message.format(Message.LVP_SETTING_UPDATED, setting.identifier, answer)
        });
    }

    // Handles the |player| modifying the |setting|, which represents a textual value.
    async handleStringSettingModification(player, setting) {
        const answer = await Question.ask(player, {
            question: setting.identifier,
            message: setting.description + '\nThe default value is {FFA500}' +
                     setting.defaultValue + '{A9C4E4}',
            leftButton: 'Update'
        });

        if (!answer)
            return;  // the |player| cancelled the dialog.

        if (!answer.length || answer.length > 255) {
            return await MessageBox.display(player, {
                title: 'Invalid value for the ' + setting.identifier + ' setting!',
                message: Message.LVP_SETTING_INVALID_STRING
            });
        }

        this.settings_().setValue(setting.identifier, answer);
        this.announceSettingChangeToAdministrators(player, setting);

        return await MessageBox.display(player, {
            title: 'The setting has been disabled!',
            message: Message.format(Message.LVP_SETTING_UPDATED, setting.identifier, answer)
        });
    }

    // Announces the updated value for the |setting|, as made by |player|, to administrators.
    announceSettingChangeToAdministrators(player, setting) {
        switch (setting.type) {
            case Setting.TYPE_BOOLEAN:
                this.announce_().announceToAdministrators(
                    Message.LVP_ANNOUNCE_SETTING_TOGGLED, player.name, player.id,
                    (setting.value ? 'enabled' : 'disabled'), setting.identifier);

                break;

            case Setting.TYPE_NUMBER:
                this.announce_().announceToAdministrators(
                    Message.LVP_ANNOUNCE_SETTING_UPDATED_NUM, player.name, player.id,
                    setting.identifier, setting.value);

                break;

            case Setting.TYPE_STRING:
                this.announce_().announceToAdministrators(
                    Message.LVP_ANNOUNCE_SETTING_UPDATED_STRING, player.name, player.id,
                    setting.identifier, setting.value);

                break;
        }
    }

    // Displays some generic information for those typing `/lvp`. Administrators and higher will see
    // a list of sub-commands that they're allowed to execute.
    onPlaygroundCommand(player) {
        let options = [];

        if (player.isAdministrator())
            options.push('access');

        if (player.isManagement())
            options.push('profile', 'reload', 'settings');

        player.sendMessage(Message.LVP_PLAYGROUND_HEADER);
        if (!options.length)
            return;

        player.sendMessage(Message.COMMAND_USAGE, '/lvp [' + options.sort().join('/') + ']');
    }

    dispose() {
        server.commandManager.removeCommand('lvp');

        this.commands_.forEach((command, name) => {
            server.commandManager.removeCommand(name);
            command.dispose();
        });

        this.commands_.clear();
    }
}

export default PlaygroundCommands;
