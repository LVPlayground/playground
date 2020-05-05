// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { AccountDatabase } from 'features/account/account_database.js';
import CommandBuilder from 'components/command_manager/command_builder.js';
import Menu from 'components/menu/menu.js';
import Question from 'components/dialogs/question.js';

import alert from 'components/dialogs/alert.js';
import confirm from 'components/dialogs/confirm.js';

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
            changepass: this.database_.canUpdatePasswords() &&
                        this.getSettingValue('password_control'),
            record: this.getSettingValue('record_visibility'),
            sessions: this.getSettingValue('session_visibility'),
        };

        const dialog = new Menu('Account management');

        // Enables the |player| to change their nickname. This can only be done a limited number of
        // times in a specific time period. Changing their nickname will immediately apply. This
        // option may only be used when the |player| is the current player.
        if (features.changename && player === currentPlayer) {
            dialog.addItem(
                'Change your nickname',
                AccountCommands.prototype.changeNickname.bind(this, currentPlayer));
        }

        // Enables the |player| to change their password. The new password needs to be reasonably
        // secure, and match the password guidelines on the website. This option may only be used
        // when the |player| is the current player.
        if (features.changepass && player === currentPlayer) {
            dialog.addItem(
                'Change your password',
                AccountCommands.prototype.changePassword.bind(this, currentPlayer));
        }

        // Enables the |player| to manage their aliases. VIPs are allowed a certain number of custom
        // names on top of their username, which they are able to control themselves.
        if (features.aliases) {
            dialog.addItem(
                'Manage nickname aliases',
                AccountCommands.prototype.manageAliases.bind(this, currentPlayer, targetPlayer));
        }

        // Enables the |player| to view their record, with the exception of notes as they are only
        // accessible to administrators and Management members.
        if (features.record) {
            dialog.addItem(
                'View player record',
                AccountCommands.prototype.displayRecord.bind(this, currentPlayer, targetPlayer));
        }

        // Enables the |player| to view their recent playing sessions, together with some basic
        // information that can be shown about the session.
        if (features.sessions) {
            dialog.addItem(
                'View recent sessions',
                AccountCommands.prototype.displaySessions.bind(this, currentPlayer, targetPlayer));
        }

        if (!dialog.hasItems()) {
            currentPlayer.sendMessage(Message.ACCOUNT_NOT_AVAILABLE);
            return;
        }

        return dialog.displayForPlayer(currentPlayer);
    }

    // Runs the change nickname flow for the given |player|. They will first have to verify their
    // current password, after which they can pick a new nickname.
    async changeNickname(player) {
        const history = await this.database_.getNicknameHistory(player.name);
        if (history && history.length > 0) {
            const minimumDays = this.getSettingValue('nickname_limit_days');

            // Verify that none of the items in the |player|'s nickname history were made less than
            // |minimumDays| ago. If that's the case, an admin will have to override.
            for (const item of history) {
                const days = Math.floor(Math.abs(Date.now() - item.date.getTime()) / (86400 * 1000));
                if (days >= minimumDays)
                    break;
                
                return alert(player, {
                    title: 'Account management',
                    message: `You may change your nickname once per ${minimumDays} days. It's ` +
                             `only been ${days} days since you changed away from ${item.nickname}.`,
                });
            }
        }

        const verifyCurrentPassword = await Question.ask(player, {
            question: 'Changing your nickname',
            message: 'Enter your current password to verify your identity',
            constraints: {
                validation: AccountDatabase.prototype.validatePassword.bind(
                                this.database_, player.name),
                explanation: 'That password is incorrect. We need to validate this to make sure ' +
                             'that you\'re really changing your own nickname.',
                abort: 'Sorry, we need to validate your identity!',
            }
        });

        if (!verifyCurrentPassword)
            return;  // the user couldn't verify their current password

        // The user can have multiple tries at selecting a nickname that's not in-use yet on the
        // server. We check this swiftly by seeing if the account exists, while validating the
        // nickname and making sure it adheres to SA-MP restrictions.
        const newNickname = await Question.ask(player, {
            question: 'Changing your nickname',
            message: 'Enter the new nickname that you would like to have',
            constraints: {
                validation: AccountCommands.prototype.isValidAvailableNickname.bind(this),
                explanation: 'Your nickname needs to be a valid SA-MP nickname, and be available ' +
                             'on Las Venturas Playground',
                abort: 'Sorry, you need to pick a valid and available nickname!'
            }
        });

        if (!newNickname)
            return;  // the user aborted out of the flow

        // Now execute the command to actually change the nickname in the database.
        await this.database_.changeName(player.name, newNickname, /* allowAlias= */ true);

        // Announce the change to administrators, so that the change is known by at least a few more
        // people in case the player forgets their new password immediately after. It happens.
        this.announce_().announceToAdministrators(
            Message.ACCOUNT_ADMIN_NICKNAME_CHANGED, player.name, player.id, newNickname);

        // Update the nickname of |player|. This will sync to Pawn as well.
        player.name = newNickname;

        return alert(player, {
            title: 'Account management',
            message: `Your nickname has been changed.`
        });
    }

    // Returns whether the given |nickname| is both valid and available on the server.
    async isValidAvailableNickname(nickname) {
        if (!/^[0-9a-z\[\]\(\)\$@\._=]{1,24}$/i.test(nickname))
            return false;  // invalid nickname
        
        // Verify that there are no other players in-game with this nickname.
        for (const player of server.playerManager) {
            if (player.name.toLowerCase() === nickname.toLowerCase())
                return false;
        }

        const summary = await this.database_.getPlayerSummaryInfo(nickname);
        return summary === null;
    }

    // Runs the change password flow for the given |player|. They will first have to verify their
    // current password, after which they're able to give a new password.
    async changePassword(player) {
        const verifyCurrentPassword = await Question.ask(player, {
            question: 'Changing your password',
            message: 'Enter your current password to verify your identity',
            constraints: {
                validation: AccountDatabase.prototype.validatePassword.bind(
                                this.database_, player.name),
                explanation: 'That password is incorrect. We need to validate this to make sure ' +
                             'that you\'re really changing your own password.',
                abort: 'Sorry, we need to validate your identity!',
            }
        });

        if (!verifyCurrentPassword)
            return;  // the user couldn't verify their current password

        // Give the |player| multiple attempts to pick a reasonably secure password. We don't set
        // high requirements, but we do need them to be a little bit sensible with their security.
        const password = await Question.ask(player, {
            question: 'Changing your password',
            message: 'Enter the new password that you have in mind',
            constraints: {
                validation: AccountCommands.prototype.isSufficientlySecurePassword.bind(this),
                explanation: 'The password must be at least 8 characters long, and contain at ' +
                             'least one number, symbol or a character of different casing.',
                abort: 'Sorry, you need to have a reasonably secure password!'
            }
        });

        if (!password)
            return;  // the user aborted out of the flow

        // Now execute the command to actually change the password in the database.
        await this.database_.changePassword(player.name, password);

        // Announce the change to administrators, so that the change is known by at least a few more
        // people in case the player forgets their new password immediately after. It happens.
        this.announce_().announceToAdministrators(
            Message.ACCOUNT_ADMIN_PASSWORD_CHANGED, player.name, player.id);

        return alert(player, {
            title: 'Account management',
            message: `Your password has been changed.`
        });
    }

    // Enables the |player|, who is a VIP of Las Venturas Playground, manage the aliases with which
    // they can play on the server under their own account.
    async manageAliases(currentPlayer, targetPlayer) {
        const player = targetPlayer || currentPlayer;
        const aliases = await this.database_.getAliases(player.name);
        
        const dialog = new Menu('Alias management', ['Alias', 'Last active']);
        if (player === currentPlayer) {
            dialog.addItem(
                'Create a new alias', '-',
                AccountCommands.prototype.createAlias.bind(this, player, aliases));
        } else {
            dialog.addItem('{BEC7CC}Unable to create aliases for other players.', '-');
        }

        if (!aliases || !aliases.aliases.length)
            return dialog.displayForPlayer(player);
        
        dialog.addItem('-----', '-----');

        for (const alias of aliases.aliases) {
            const nickname = alias.nickname;
            const lastActive = alias.lastSeen ? this.formatDate(alias.lastSeen) : '{BEC7CC}(never)';

            dialog.addItem(
                nickname, lastActive,
                player === currentPlayer ? AccountCommands.prototype.deleteAlias.bind(
                                               this, player, alias)
                                         : undefined /* not allowed to delete aliases */);
        }

        return dialog.displayForPlayer(currentPlayer);
    }

    // Flow that enables a player to create a new alias, which is to be added to their account.
    async createAlias(player, aliases) {
        const aliasFrequencyDays = this.getSettingValue('vip_alias_limit_days');
        const aliasLimit =
            player.isAdministrator() ? this.getSettingValue('vip_alias_limit_admin')
                                     : this.getSettingValue('vip_alias_limit_player');

        if (aliases) {
            let mostRecentCreation = 0;  // the beginning of time
            let mostRecentAlias = null;

            // People are allowed a maximum number of aliases on the server, which depends a bit on
            // whether they're an administrator or a regular player. Management members adhere to
            // administrator limits, but can override this using Nuwani commands.
            if (aliases && aliases.aliases.length >= aliasLimit) {
                return alert(player, {
                    title: 'Alias management',
                    message: `You're only allowed ${aliasLimit} aliases, so are not able to ` +
                             `add a new one right now.`
                });
            }

            // Aliases can only be created once in a certain number of days. The frequency will
            // be ignored for administrators because they can override it anyway.
            for (const alias of aliases.aliases) {
                if (!alias.created)
                    continue;
                
                if (mostRecentCreation > alias.created.getTime())
                    continue;

                mostRecentCreation = Math.max(mostRecentCreation, alias.created.getTime());
                mostRecentAlias = alias.nickname;
            }

            const mostRecentCreationDays =
                Math.round(Math.abs(Date.now() - mostRecentCreation) / (86400 * 1000));

            if (mostRecentCreationDays < aliasFrequencyDays && !player.isAdministrator()) {
                return alert(player, {
                    title: 'Alias management',
                    message: `You're allowed to create an alias once per ${aliasFrequencyDays} ` +
                             `days, and it's only been ${mostRecentCreationDays} days since you ` +
                             `added ${mostRecentAlias}. Please wait a bit longer!`
                });
            }
        }

        // The user can pick their new alias themselves. This uses validation identical to changing
        // one's nickname, and requires both validity and availability.
        const newAlias = await Question.ask(player, {
            question: 'Alias management',
            message: 'Enter the alias that you would like to create',
            constraints: {
                validation: AccountCommands.prototype.isValidAvailableNickname.bind(this),
                explanation: 'Your new alias needs to be a valid SA-MP nickname, and be ' +
                             'available on Las Venturas Playground',
                abort: 'Sorry, you need to pick a valid and available nickname!'
            }
        });

        if (!newAlias)
            return;  // the user aborted out of the flow

        await this.database_.addAlias(player.name, newAlias, /* allowAlias= */ true);

        // Announce the change to administrators, so that the change is known by at least a few more
        // people in case the player forgets their new password immediately after. It happens.
        this.announce_().announceToAdministrators(
            Message.ACCOUNT_ADMIN_ALIAS_CREATED, player.name, player.id, newAlias);

        return alert(player, {
            title: 'Alias management',
            message: `The alias ${newAlias} has been created.`
        });
    }

    // Flow that enables a player to remove the given |alias| from their account.
    async deleteAlias(player, alias) {
        const aliasFrequencyDays = this.getSettingValue('vip_alias_limit_days');

        // Non-administrators are subject to limits in frequency for creating and removing aliases,
        // which means that aliases need a certain age before they can be deleted.
        const aliasAgeDays =
            Math.round(Math.abs(Date.now() - alias.created.getTime()) / (86400 * 1000));
        
        if (aliasAgeDays < aliasFrequencyDays && !player.isAdministrator()) {
            return alert(player, {
                title: 'Alias management',
                message: `You're allowed to delete aliases after they're ${aliasFrequencyDays} ` +
                         `days old, but it's only been ${aliasAgeDays} days since you created ` +
                         `the ${alias.nickname} alias. Please wait a bit longer!`
            });
        }

        // The alias and/or an account named after the alias cannot currently be connected.
        if (server.playerManager.getByName(alias.nickname) !== null) {
            return alert(player, {
                title: 'Alias management',
                message: `The alias ${newAlias} is currently in use, and cannot be deleted.`
            });
        }

        // Deletion of stuff should be guarded by a confirmation dialog.
        const confirmation = await confirm(player, {
            title: 'Alias management',
            message: `Are you sure that you want to remove the ${alias.nickname} alias?`,
        });

        if (!confirmation)
            return;  // they changed their mind
        
        // Actually delete the |alias|, and inform administrators of this change.
        await this.database_.removeAlias(player.name, alias.nickname, /* allowAlias= */ true);

        this.announce_().announceToAdministrators(
            Message.ACCOUNT_ADMIN_ALIAS_DELETED, player.name, player.id, alias.nickname);

        return alert(player, {
            title: 'Alias management',
            message: `The alias ${alias.nickname} has been deleted.`
        });
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

        ], { pageSize: this.getSettingValue('record_page_count') });

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

        ], { pageSize: this.getSettingValue('session_page_count') });

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

    // Returns whether the |password| is secure enough to be used in-game. We don't set a lot of
    // requirements, except that it needs to be at least eight characters in length and contain
    // at least one character of different casing OR a number mixed with characters.
    isSufficientlySecurePassword(password) {
        const length = password.length;

        if (length < 8)
            return false;  // too short

        let strength = 0;

        if (/[a-z]/.test(password))
            ++strength;  // lower-case character
        if (/[A-Z]/.test(password))
            ++strength;  // upper-case character
        if (/[0-9]/.test(password))
            ++strength;  // number
        if (/[\?,\.'\\\-~_\[\]\{\}]/.test(password))
            ++strength;  // symbol

        return strength >= 2;
    }


    dispose() {
        this.playground_().unregisterCommand('account');

        this.announce_ = null;
        this.database_ = null;
        this.playground_ = null;

        server.commandManager.removeCommand('account');
    }
}
