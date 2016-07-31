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

        // TODO: Fix up the /lvp command with new stuffs.

        server.commandManager.buildCommand('lvp')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .sub('set')
                .parameters([
                    { name: 'option', type: CommandBuilder.WORD_PARAMETER, optional: true },
                    { name: 'value', type: CommandBuilder.WORD_PARAMETER, optional: true } ])
                .build(PlaygroundCommands.prototype.onPlaygroundCommand.bind(this))
            .build(PlaygroundCommands.prototype.onPlaygroundCommand.bind(this));
    }

    // Gets the access tracker for the commands managed by this class.
    get access() { return this.access_; }

    // Command available to administrators for enabling or disabling an |option| as part of the
    // playground features. Both |option| and |value| are optional parameters, and may be NULL.
    onPlaygroundCommand(player, option, value) {
        const validOptions = this.manager_.options;

        // Display the available options if the administrator doesn't provide one.
        if ((!option && !value) || !validOptions.includes(option)) {
            player.sendMessage(Message.LVP_PLAYGROUND_OPTIONS, validOptions.join('/'));
            return;
        }

        const currentValue = this.manager_.isOptionEnabled(option);
        const currentValueText = currentValue ? 'enabled' : 'disabled';

        // Displays the current status of |option|, together with some information on how to toggle.
        if (!value || !['on', 'off'].includes(value)) {
            player.sendMessage(
                Message.LVP_PLAYGROUND_OPTION_STATUS, option, currentValueText, option);
            return;
        }

        const updatedValue = (value === 'on');
        if (currentValue === updatedValue) {
            player.sendMessage(
                Message.LVP_PLAYGROUND_OPTION_NO_CHANGE, option, currentValueText);
            return;
        }

        const updatedValueText = updatedValue ? 'enabled' : 'disabled';

        // Enable the option with the Playground Manager, so that side-effects get applied too.
        this.manager_.setOptionEnabled(option, updatedValue);

        let announcement = null;
        switch (option) {
            case 'jetpack':
                announcement = Message.LVP_ANNOUNCE_JETPACK;
                break;
            case 'party':
                announcement = Message.LVP_ANNOUNCE_PARTY;
                break;
        }

        if (announcement)
            this.announce_.announceToPlayers(announcement, player.name, updatedValueText);

        this.announce_.announceToAdministrators(
            Message.LVP_ANNOUNCE_ADMIN_NOTICE, player.name, player.id, updatedValueText, option);
    }

    dispose() {
        server.commandManager.removeCommand('lvp');

        this.commands_.forEach(command => command.dispose());
        this.commands_.clear();

        this.access_.dispose();
    }
}

exports = PlaygroundCommands;
