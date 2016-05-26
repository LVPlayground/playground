// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const CommandBuilder = require('components/command_manager/command_builder.js');
const Dialog = require('components/dialogs/dialog.js');

// Commands that enable administrators to trigger various identity features on the server.
class PlaygroundCommands {
    constructor(manager, announce) {
        this.manager_ = manager;
        this.announce_ = announce;

        // The /lvp command is an informational dialog for players, and a toggle mechanism for
        // administrators to enable or disable certain features.
        server.commandManager.buildCommand('lvp')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .sub('set')
                .parameters([
                    { name: 'option', type: CommandBuilder.WORD_PARAMETER, optional: true },
                    { name: 'value', type: CommandBuilder.WORD_PARAMETER, optional: true } ])
                .build(PlaygroundCommands.prototype.onPlaygroundCommand.bind(this))
            .build(PlaygroundCommands.prototype.onPlaygroundCommand.bind(this));

        // The /jetpack command enables players to get a jetpack when enabled by an administrator.
        server.commandManager.buildCommand('jetpack')
            .sub(CommandBuilder.PLAYER_PARAMETER)
                .restrict(Player.LEVEL_ADMINISTRATOR)
                .parameters([
                    { name: 'remove', type: CommandBuilder.WORD_PARAMETER, optional: true }])
                .build(PlaygroundCommands.prototype.onJetpackCommand.bind(this))
            .build(PlaygroundCommands.prototype.onJetpackCommand.bind(this));
    }

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

    // Command that gives the |player| a jetpack. Always available to administrators (also when
    // specifying a different |targetPlayer|), can be enabled for all by using the `jetpack` option.
    onJetpackCommand(player, targetPlayer, remove = null) {
        const subject = targetPlayer || player;

        // Do not allow the |player| to get a jetpack if the option has been disabled.
        if (!this.manager_.isOptionEnabled('jetpack') && !player.isAdministrator()) {
            player.sendMessage(Message.LVP_JETPACK_NOT_AVAILABLE);
            return;
        }

        // Do not allow jetpacks to be spawned in virtual worlds.
        if (!VirtualWorld.isMainWorld(subject.virtualWorld) && !player.isAdministrator()) {
            player.sendMessage(Message.LVP_JETPACK_NOT_AVAILABLE_VW);
            return;
        }

        // Is the administrator removing a jetpack from this player instead of granting one?
        if (player.isAdministrator() && ['remove', 'take'].includes(remove)) {
            subject.specialAction = Player.SPECIAL_ACTION_NONE;
            subject.clearAnimations();

            subject.sendMessage(Message.LVP_JETPACK_REMOVED, player.name, player.id);
            if (player !== subject)
                player.sendMessage(Message.LVP_JETPACK_REMOVED_OTHER, subject.name, subject.id);

            this.announce_.announceToAdministrators(
                Message.LVP_JETPACK_ANNOUNCE, player.name, player.id, 'removed', 'from',
                subject.name, subject.id);

            return;
        }

        // Grant a jetpack to the |subject|.
        subject.specialAction = Player.SPECIAL_ACTION_USEJETPACK;

        if (subject !== player) {
            player.sendMessage(Message.LVP_JETPACK_GRANTED_OTHER, subject.name, subject.id);
            subject.sendMessage(Message.LVP_JETPACK_GRANTED, player.name, player.id);

            this.announce_.announceToAdministrators(
                Message.LVP_JETPACK_ANNOUNCE, player.name, player.id, 'given', 'to', subject.name,
                subject.id);

            return;
        }

        player.sendMessage(Message.LVP_JETPACK_GRANTED_SELF);
    }

    dispose() {
        server.commandManager.removeCommand('jetpack');
        server.commandManager.removeCommand('lvp');
    }
}

exports = PlaygroundCommands;
