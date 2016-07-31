// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Command = require('features/playground/command.js');
const CommandBuilder = require('components/command_manager/command_builder.js');
const Menu = require('components/menu/menu.js');
const MessageDialog = require('components/dialogs/message.js');
const PlaygroundAccessTracker = require('features/playground/playground_access_tracker.js');

// Utility function to capitalize the first letter of a |string|.
function capitalizeFirstLetter(string) {
    return string[0].toUpperCase() + string.slice(1);
}

// A series of general commands that don't fit in any particular 
class PlaygroundCommands {
    constructor(manager, announce) {
        this.manager_ = manager;
        this.announce_ = announce;

        this.access_ = new PlaygroundAccessTracker();
        this.commands_ = new Map();

        // Utility function to import, create and initialize the command in |filename|. The command
        // will be stored in the |commands_| map, and be registered with the manager later.
        const requireCommand = filename => {
            const CommandImplementation = require(filename);
            if (!CommandImplementation instanceof Command)
                throw new Error(filename + ' does not contain a command.');

            const commandInstance = new CommandImplementation(announce);

            // Store the |commandInstance| in the |commands_| dictionary.
            this.commands_.set(commandInstance.name, commandInstance);
        };
        
        // -----------------------------------------------------------------------------------------

        requireCommand('features/playground/commands/boost.js');
        requireCommand('features/playground/commands/jetpack.js');

        // -----------------------------------------------------------------------------------------

        // Register each of the known commands with the access tracker and command manager. The
        // command will be restricted based on its default access level and exceptions.
        this.commands_.forEach((command, name) => {
            this.access_.registerCommand(name, command.defaultPlayerLevel);

            command.build(
                server.commandManager.buildCommand(name)
                    .restrict(PlaygroundAccessTracker.prototype.canAccessCommand.bind(this.access_,
                                                                                      name)));
        });

        // -----------------------------------------------------------------------------------------

        // The `/lvp` command offers administrators and higher a number of functions to manage the
        // server, the available commands and availability of a number of smaller features.
        server.commandManager.buildCommand('lvp')
            .sub('access')
                .restrict(Player.LEVEL_ADMINISTRATOR)
                .build(PlaygroundCommands.prototype.onPlaygroundAccessCommand.bind(this))
            .sub('party')
                .restrict(Player.LEVEL_MANAGEMENT)
                .parameters([
                    { name: 'enabled', type: CommandBuilder.WORD_PARAMETER, optional: true }
                ])
                .build(PlaygroundCommands.prototype.onPlaygroundOptionCommand.bind(this, 'party'))
            .build(PlaygroundCommands.prototype.onPlaygroundCommand.bind(this));
    }

    // Gets the access tracker for the commands managed by this class.
    get access() { return this.access_; }

    // Enables administrators and management to change access requirements to the commands that are
    // part of this module with a dialog-based interface.
    async onPlaygroundAccessCommand(player) {
        let commands = [];

        // Only add commands that are available to |player| by default to the |commands| array.
        this.commands_.forEach(command => {
            if (command.defaultPlayerLevel > player.level)
                return;

            commands.push(command);
        });

        const menu = new Menu('Command access settings', [
            'Command',
            'Level',
            'Exceptions'
        ]);

        commands.forEach(command => {
            const commandName = command.name;
            const commandLevel = this.access_.getCommandLevel(commandName);
            const commandExceptions = this.access_.getExceptionCount(commandName);

            const levelPrefix = commandLevel !== command.defaultPlayerLevel ? '{FFFF00}' : '';
            const level = playerLevelToString(commandLevel, true /* plural */);

            const exceptions = commandExceptions != 0
                ? '{FFFF00}' + commandExceptions + ' exception' + (commandExceptions == 1 ? '': 's')
                : '-';

            menu.addItem('/' + commandName, levelPrefix + capitalizeFirstLetter(level), exceptions,
                         PlaygroundCommands.prototype.displayCommandMenu.bind(this, command));
        });

        await menu.displayForPlayer(player);
    }

    // Displays a command menu for |command| to the |player|. It contains options to change the
    // required level, as well as options to grant and revoke exceptions for the command.
    async displayCommandMenu(command, player) {
        const menu = new Menu('/' + command.name + ' access settings');

        const exceptions = this.access_.getExceptions(command.name);
        exceptions.sort((lhs, rhs) =>
            lhs.name.localeCompare(rhs.name));

        menu.addItem('Change required level',
                     PlaygroundCommands.prototype.displayCommandLevelMenu.bind(this, command));

        menu.addItem('Grant exception',
                     PlaygroundCommands.prototype.grantCommandException.bind(this, command));

        if (exceptions.length) {
            menu.addItem('------------------------',
                         PlaygroundCommands.prototype.displayCommandMenu.bind(this, command));

            exceptions.forEach(subject => {
                menu.addItem('Revoke for ' + subject.name + ' (Id: ' + subject.id + ')',
                             PlaygroundCommands.prototype.revokeCommandException.bind(this, command,
                                                                                      subject));
            });
        }

        await menu.displayForPlayer(player);
    }

    // Displays a menu that allows |player| to change the required level of |command| to any level
    // that's equal or below their own level, to avoid "losing" a command.
    async displayCommandLevelMenu(command, player) {
        const currentLevel = this.access_.getCommandLevel(command.name);
        const defaultLevel = command.defaultPlayerLevel;

        const menu = new Menu('/' + command.name + ' required level');

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
                    return await MessageDialog.display(player, {
                        title: 'No need to update the level',
                        message: 'This command is already available to ' + levelName + '.'
                    });
                }

                this.access_.setCommandLevel(command.name, level);

                return await MessageDialog.display(player, {
                    title: 'The level has been updated!',
                    message: '/' + command.name + ' is now available to ' + levelName + '.'
                });
            });
        });

        await menu.displayForPlayer(player);
    }

    // Grants an exception for a not yet determined player to use the |command|.
    async grantCommandException(command, player) {
        // TODO: Implement this function.
        // NOTE: The |player| must be registered.
    }

    // Revokes the exception for |subject| to use the |command|.
    async revokeCommandException(command, subject, player) {
        // TODO: Implement this function.
    }

    // Enables or disables one of the available options. The actual options are dictated by both the
    // command builder above and by the PlaygroundManager that tracks them.
    onPlaygroundOptionCommand(option, player, enabled = null) {
        const status = this.manager_.isOptionEnabled(option);
        const statusText = status ? 'enabled' : 'disabled';

        if (!enabled || !['on', 'off'].includes(enabled)) {
            player.sendMessage(Message.LVP_PLAYGROUND_OPTION_STATUS, option, statusText, option);
            return;
        }

        const updatedStatus = (enabled === 'on');
        const updatedStatusText = updatedStatus ? 'enabled' : 'disabled';

        if (status === updatedStatus) {
            player.sendMessage(Message.LVP_PLAYGROUND_OPTION_NO_CHANGE, option, statusText);
            return;
        }

        this.manager_.setOptionEnabled(option, updatedStatus);

        let announcement = null;
        switch (option) {
            case 'party':
                announcement = Message.LVP_ANNOUNCE_PARTY;
                break;
        }

        if (announcement)
            this.announce_.announceToPlayers(announcement, player.name, updatedStatusText);

        this.announce_.announceToAdministrators(
            Message.LVP_ANNOUNCE_ADMIN_NOTICE, player.name, player.id, updatedStatusText, option);
    }

    // Displays some generic information for those typing `/lvp`. Administrators and higher will see
    // a list of sub-commands that they're allowed to execute.
    onPlaygroundCommand(player) {
        let options = [];

        if (player.isAdministrator())
            options.push('access');

        if (player.isManagement())
            options.push('party');

        player.sendMessage(Message.LVP_PLAYGROUND_HEADER);
        if (!options.length)
            return;

        player.sendMessage(Message.COMMAND_USAGE, '/lvp [' + options.sort().join('/') + ']');
    }

    dispose() {
        server.commandManager.removeCommand('lvp');

        this.commands_.forEach(command => command.dispose());
        this.commands_.clear();

        this.access_.dispose();
    }
}

exports = PlaygroundCommands;
