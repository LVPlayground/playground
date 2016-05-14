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

        // The anniversary message, will be lazily loaded from //data/anniversary.txt.
        this.anniversaryMessage_ = null;

        // The /lvp10 command is an informational dialog for players, and a toggle mechanism for
        // administrators to enable or disable certain features.
        server.commandManager.buildCommand('lvp10')
            .sub('set')
                .restrict(Player.LEVEL_ADMINISTRATOR)
                .parameters([
                    { name: 'option', type: CommandBuilder.WORD_PARAMETER, optional: true },
                    { name: 'value', type: CommandBuilder.WORD_PARAMETER, optional: true } ])
                .build(PlaygroundCommands.prototype.onAnniversaryOptionsCommand.bind(this))
            .build(PlaygroundCommands.prototype.onAnniversaryCommand.bind(this));

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
    // anniversary features. Both |option| and |value| are optional parameters, and may be NULL.
    onAnniversaryOptionsCommand(player, option, value) {
        const validOptions = this.manager_.options;

        // Display the available options if the administrator doesn't provide one.
        if ((!option && !value) || !validOptions.includes(option)) {
            player.sendMessage(Message.LVP_ANNIVERSARY_OPTIONS, validOptions.join('/'));
            return;
        }

        const currentValue = this.manager_.isOptionEnabled(option);
        const currentValueText = currentValue ? 'enabled' : 'disabled';

        // Displays the current status of |option|, together with some information on how to toggle.
        if (!value || !['on', 'off'].includes(value)) {
            player.sendMessage(
                Message.LVP_ANNIVERSARY_OPTION_STATUS, option, currentValueText, option);
            return;
        }

        const updatedValue = (value === 'on');
        if (currentValue === updatedValue) {
            player.sendMessage(
                Message.LVP_ANNIVERSARY_OPTION_NO_CHANGE, option, currentValueText);
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
        }

        if (announcement)
            this.announce_.announceToPlayers(announcement, player.name, updatedValueText);

        this.announce_.announceToAdministrators(
            Message.LVP_ANNOUNCE_ADMIN_NOTICE, player.name, player.id, updatedValueText, option);
    }

    // Command that gives details about Las Venturas Playground's anniversary and the commands that
    // are available as part of it. Displays a dialog.
    onAnniversaryCommand(player) {
        if (!this.anniversaryMessage_)
            this.anniversaryMessage_ = readFile('data/anniversary.txt').trim();

        Dialog.displayMessage(
            player, '10 Years of Las Venturas Playground', this.anniversaryMessage_, 'Alright', '');
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
        server.commandManager.removeCommand('lvp10');
    }
}

exports = PlaygroundCommands;
