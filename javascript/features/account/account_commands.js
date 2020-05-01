// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import CommandBuilder from 'components/command_manager/command_builder.js';

// Provides access to in-game commands related to account management. Access to the individual
// abilities is gated through the Playground feature, which manages command access.
export class AccountCommands {
    announce_ = null;
    playground_ = null;

    // The AccountDatabase instance which will execute operations.
    database_ = null;

    constructor(announce, playground, database, settings) {
        this.announce_ = announce;
        this.playground_ = playground;
        this.settings_ = settings;

        this.database_ = database;

        // The `account` command is not yet ready to be launched to players.
        this.playground_().registerCommand('account', Player.LEVEL_ADMINISTRATOR);

        // !account
        // !account [player]
        server.commandManager.buildCommand('account')
            .restrict(player => this.playground_().canAccessCommand(player, 'account'))
            .sub(CommandBuilder.PLAYER_PARAMETER)
                .restrict(Player.LEVEL_ADMINISTRATOR)
                .build(AccountCommands.prototype.onAccountCommand.bind(this))
            .build(AccountCommands.prototype.onAccountCommand.bind(this));
    }

    // !account
    // !account [player]
    //
    // Opens the account management flow for either the |player| or |targetPlayer|, when set. The
    // availability of options is dependent on server configuration, as well as the player's rights
    // on the server in general. Certain options are limited to VIPs.
    onAccountCommand(currentPlayer, targetPlayer) {
        const player = targetPlayer || currentPlayer;
        const features = {
            aliases: player.isVip() && this.getSettingValue('vip_alias_control'),
            changename: this.getSettingValue('nickname_control'),
            changepass: this.getSettingValue('password_control'),
            record: this.getSettingValue('record_visibility'),
            sessions: this.getSettingValue('session_visibility'),
        };

        // Enables the |player| to change their nickname. This can only be done a limited number of
        // times in a specific time period. Changing their nickname will immediately apply.
        if (features.changename) {
            // Change your nickname
            // - setting: nickname_limit_days
        }

        // Enables the |player| to change their password. The new password needs to be reasonably
        // secure, and match the password guidelines on the website.
        if (features.changepass) {
            // Change your password
        }

        // Enables the |player| to manage their aliases. VIPs are allowed a certain number of custom
        // names on top of their username, which they are able to control themselves.
        if (features.aliases) {
            // Manage your aliases
            // - setting: vip_alias_limit_count
            // - setting: vip_alias_limit_days
        }

        // Enables the |player| to view their record, with the exception of notes as they are only
        // accessible to administrators and Management members.
        if (features.record) {
            // View your record
        }

        // Enables the |player| to view their recent playing sessions, together with some basic
        // information that can be shown about the session.
        if (features.sessions) {
            // View your recent sessions
        }
    }

    // Convenience function for getting the value of the given |setting|.
    getSettingValue(setting) {
        return this.settings_().getValue('account/' + setting);
    }

    dispose() {
        this.playground_().unregisterCommand('nuwani');

        this.announce_ = null;
        this.database_ = null;
        this.playground_ = null;

        server.commandManager.removeCommand('nuwani');
    }
}
