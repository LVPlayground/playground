// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Dialog = require('components/dialogs/dialog.js');

// Implements the commands available as part of the persistent gang feature. The primary ones are
// /gang and /gangs, each of which has a number of sub-options available to them.
class GangCommands {
    constructor(manager) {
        this.manager_ = manager;

        // /pgang [create]
        server.commandManager.buildCommand('pgang')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .sub('create')
                .build(GangCommands.prototype.onGangCreateCommand.bind(this))

            .build(GangCommands.prototype.onGangCommand.bind(this));

        // /pgangs [top]
        server.commandManager.buildCommand('pgangs')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .sub('top')
                .build(GangCommands.prototype.onGangsTopCommand.bind(this))

            .build(GangCommands.prototype.onGangsCommand.bind(this));
    }

    // Called when the player uses the `/gang create` command to create a new gang. If the player is
    // eligible, it will start a wizard of dialog boxes requesting the necessary information from
    // the player. All values must be unique among other gangs in the database.
    onGangCreateCommand(player) {
        if (!player.isRegistered()) {
            player.sendMessage(Message.GANGS_NOT_REGISTERED);
            return;
        }

        if (this.manager_.gangForPlayer(player) !== null) {
            player.sendMessage(Message.GANGS_ALREADY_SET);
            return;
        }

        // Constraints to apply during the gang creation wizard.
        const nameConstraints = { min: 4, max: 32 };
        const tagConstraints = { min: 1, max: 5 };
        const goalConstraints = { min: 4, max: 64 };

        // Options for asking the player what the gang's full name should be.
        const nameDialogOptions = {
            caption: 'Choose your gang\'s name',
            message: 'What is the full name your gang will be known as? ' +
                         '(' + nameConstraints.min + ' - ' + nameConstraints.max + ' characters)',
            leftButton: 'Next',
            rightButton: 'Cancel'
        };

        // Options for asking the player what the gang's tag should be.
        const tagDialogOptions = {
            caption: 'Choose your gang\'s tag',
            message: 'What is the acronym to use as your gangs tag? ' +
                         '(' + tagConstraints.min + ' - ' + tagConstraints.max + ' characters)',
            leftButton: 'Next',
            rightButton: 'Cancel'
        };

        // Options for asking the player what the gang's goal should be.
        const goalDialogOptions = {
            caption: 'Choose your gang\'s goal',
            message: 'In one sentence, what is the purpose of your gang? ' +
                         '(' + goalConstraints.min + ' - ' + goalConstraints.max + ' characters)',
            leftButton: 'Next',
            rightButton: 'Cancel'
        };

        // Gathered input from the user based on this flow.
        let input = { name: null, tag: null, goal: null };

        // (1) Ask the player to enter the name of their gang.
        Dialog.displayInput(player, nameDialogOptions).then(result => {
            if (!player.isConnected())
                throw null;  // the player is not connected anymore

            if (!result.response)
                throw null;  // the player canceled the creation

            if (result.text.length < nameConstraints.min ||
                result.text.length > nameConstraints.max) {
                player.sendMessage(Message.GANG_CREATE_INVALID_NAME);
                throw null;
            }

            input.name = result.text;

            return Dialog.displayInput(player, tagDialogOptions);

        // (2) Ask the player to enter the tag of their gang. (With or without [].)
        }).then(result => {
            if (!player.isConnected())
                throw null;  // the player is not connected anymore

            if (!result.response)
                throw null;  // the player canceled the creation

            // Remove all non-alpha-numeric characters from the gang's tag.
            result.text = result.text.replace(/[^a-z0-9]/gi, '');

            if (result.text.length < tagConstraints.min ||
                result.text.length > tagConstraints.max) {
                player.sendMessage(Message.GANG_CREATE_INVALID_TAG);
                throw null;
            }

            input.tag = result.text;

            return Dialog.displayInput(player, goalDialogOptions);

        }).then(result => {
            if (!player.isConnected())
                throw null;  // the player is not connected anymore

            if (!result.response)
                throw null;  // the player canceled the creation

            if (result.text.length < goalDialogOptions.min ||
                result.text.length > goalDialogOptions.max) {
                player.sendMessage(Message.GANG_CREATE_INVALID_GOAL);
                throw null;
            }

            input.goal = result.text;

            return this.manager_.createGangForPlayer(player, input.tag, input.name, input.goal);

        }).then(result => {
            // TODO(Russell): Announce the gang's creation to administrators.
            // TODO(Russell): Announce the gang's creation to other players.

            player.sendMessage(Message.GANG_CREATED, result.name);

        }).catch(error => {
            if (!error)
                return;  // used as a bail-out until I figure out something better

            player.sendMessage(Message.COMMAND_ERROR, error.message);
        })
    }

    // Called when the player uses the `/gang` command without parameters. It will show information
    // on the available sub commands, as well as the feature itself.
    onGangCommand(player) {
        player.sendMessage(Message.GANGS_HEADER);
        player.sendMessage(Message.GANG_INFO_1);
        player.sendMessage(Message.GANG_INFO_2);
        player.sendMessage(Message.COMMAND_USAGE, '/gang [create]');
    }

    // Called when the player uses the `/gangs` command. It will, by default, list the gangs that
    // are currently represented on Las Venturas Playground, but the "top" sub-command is available
    // to list the top 5 all-round gangs on the server.
    onGangsCommand(player) {
        let gangs = this.manager_.gangs;

        // Sort the |gangs| by number of in-game players in descending order, then by the name of
        // the gang, which is the order they will be presented in.
        gangs.sort((lhs, rhs) => {
            if (lhs.memberCount > rhs.memberCount)
                return 1;

            return lhs.name.localeCompare(rhs.name);
        });

        // Display a line for each of the entries in |gangs|, that has now been sorted.
        gangs.forEach(gang => {
            const color = gang.color ? gang.color.toHexRGB() : 'FFFFFF';
            const tag = gang.tag;
            const name = gang.name;
            const memberCount = gang.memberCount;
            const memberSuffix = gang.memberCount == 1 ? '' : 's';

            player.sendMessage(Message.GANGS_ONLINE, color, tag, name, memberCount, memberSuffix);
        });

        if (!gangs.length)
            player.sendMessage(Message.GANGS_NONE_ONLINE);

        player.sendMessage(Message.GANGS_BEST_ADV);
    }

    // Called when a player uses the `/gangs top` command. Displays the top 5 gangs on the server
    // regardless of whether they currently have players in-game.
    onGangsTopCommand(player) {
        // TODO(Russell): List the top 5 gangs from the database once we figure out rankings.
    }

    // Cleans up the state created by this class, i.e. unregisters the commands.
    dispose() {
        server.commandManager.removeCommand('pgangs');
    }
}

exports = GangCommands;
