// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import CommandBuilder from 'components/command_manager/command_builder.js';
import Menu from 'components/menu/menu.js';

import alert from 'components/dialogs/alert.js';

// Provides access to in-game commands related to account management. Access to the individual
// abilities is gated through the Playground feature, which manages command access.
export class AccountCommands {
    announce_ = null;
    playground_ = null;
    settings_ = null;

    // The AccountDatabase instance which will execute operations.
    database_ = null;

    constructor(announce, playground, settings, database) {
        this.announce_ = announce;
        this.playground_ = playground;
        this.settings_ = settings;

        this.database_ = database;

        // Register the command so that access is controlled by `/lvp access`.
        this.playground_().registerCommand('account', Player.LEVEL_PLAYER);

        // /account
        // /account [player]
        server.commandManager.buildCommand('account')
            .restrict(player => this.playground_().canAccessCommand(player, 'account'))
            .sub(CommandBuilder.PLAYER_PARAMETER)
                .restrict(Player.LEVEL_ADMINISTRATOR)
                .build(AccountCommands.prototype.onAccountCommand.bind(this))
            .build(AccountCommands.prototype.onAccountCommand.bind(this));
    }

    // /account
    // /account [player]
    //
    // Opens the account management flow for either the |player| or |targetPlayer|, when set. The
    // availability of options is dependent on server configuration, as well as the player's rights
    // on the server in general. Certain options are limited to VIPs.
    async onAccountCommand(currentPlayer, targetPlayer) {
        const player = targetPlayer || currentPlayer;

        if (!player.isRegistered()) {
            currentPlayer.sendMessage(Message.ACCOUNT_NOT_REGISTERED, player.name);
            return;
        }

        const features = {
            aliases: player.isVip() && this.getSettingValue('vip_alias_control'),
            changename: this.getSettingValue('nickname_control'),
            changepass: this.getSettingValue('password_control'),
            record: this.getSettingValue('record_visibility'),
            sessions: this.getSettingValue('session_visibility'),
        };

        const dialog = new Menu('Account management');

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
            dialog.addItem(
                'View your record',
                AccountCommands.prototype.displayRecord.bind(this, currentPlayer, targetPlayer));
        }

        // Enables the |player| to view their recent playing sessions, together with some basic
        // information that can be shown about the session.
        if (features.sessions) {
            dialog.addItem(
                'View your recent sessions',
                AccountCommands.prototype.displaySessions.bind(this, currentPlayer, targetPlayer));
        }

        if (!dialog.hasItems()) {
            currentPlayer.sendMessage(Message.ACCOUNT_NOT_AVAILABLE);
            return;
        }

        return dialog.displayForPlayer(currentPlayer);
    }

    // Displays a menu to the |currentPlayer| with the player record of their target. The Menu will
    // be paginated, and entries from the player's full history can be seen.
    async displayRecord(currentPlayer, targetPlayer) {
        const player = targetPlayer || currentPlayer;
        const record = await this.database_.getPlayerRecord(player.userId);

        if (!record.length) {
            return alert(currentPlayer, {
                title: 'Account management',
                message: `The record of ${player.name} is clean.`
            });
        }

        const display = new Menu('Player record of ' + player.name, [
            'Date',
            'Type',
            'Issued by',
            'Reason',
        ]);

        for (const entry of record) {
            const type = entry.type[0].toUpperCase() + entry.type.slice(1);

            display.addItem(this.formatDate(entry.date), type, entry.issuedBy, entry.reason);
        }

        await display.displayForPlayer(currentPlayer);
    }

    // Displays a menu to the |currentPlayer| with the most recent sessions of the target.
    async displaySessions(currentPlayer, targetPlayer) {
        const player = targetPlayer || currentPlayer;
        const sessions = await this.database_.getPlayerSessions({
            userId: player.userId,
            limit: this.getSettingValue('session_count'),
        });

        if (!sessions.length) {
            return alert(currentPlayer, {
                title: 'Account management',
                message: `There are no prior sessions of ${player.name}.`
            });
        }

        const display = new Menu('Recent sessions of ' + player.name, [
            'Date',
            'Nickname',
            'Duration',
            'IP Address',
        ]);

        for (const session of sessions) {
            const date = this.formatDate(session.date, true);
            const duration = this.formatDuration(session.duration);

            display.addItem(date, session.nickname, duration, session.ip);
        }

        await display.displayForPlayer(currentPlayer);
    }

    // Returns a formatted version of the given |date|. If |includeTime| is given, the time will be
    // included in the output as well.
    //
    //   January 9, 2020
    //   January 9, 2020 at 1:51 PM
    formatDate(date, includeTime = false) {
        const kMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
                         'September', 'October', 'November', 'December'];

        if (Number.isNaN(date.getTime()))
            return '[invalid date]';

        let formattedDate = `${kMonths[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
        if (includeTime) {
            let hour, suffix;
            if (date.getHours() === 0)
                [hour, suffix] = [12, 'AM'];
            else if (date.getHours() < 12)
                [hour, suffix] = [date.getHours(), 'AM'];
            else if (date.getHours() === 12)
                [hour, suffix] = [12, 'PM'];
            else
                [hour, suffix] = [date.getHours() - 12, 'PM'];

            formattedDate += ` at ${hour}:${('0' + date.getMinutes()).substr(-2)} ${suffix}`
        }

        return formattedDate;
    }

    // Returns a formatted version of the duration, which is assumed to be no longer than ~hours.
    formatDuration(duration) {
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor(duration / 60) % 60;
        const seconds = duration % 60;

        return `${hours}:${('0' + minutes).substr(-2)}:${('0' + seconds).substr(-2)}`;
    }

    // Convenience function for getting the value of the given |setting|.
    getSettingValue(setting) {
        return this.settings_().getValue('account/' + setting);
    }

    dispose() {
        this.playground_().unregisterCommand('account');

        this.announce_ = null;
        this.database_ = null;
        this.playground_ = null;

        server.commandManager.removeCommand('account');
    }
}
