// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Command = require('features/playground/command.js');
const CommandBuilder = require('components/command_manager/command_builder.js');
const Dialog = require('components/dialogs/dialog.js');
const PlaygroundAccessTracker = require('features/playground/playground_access_tracker.js');

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
