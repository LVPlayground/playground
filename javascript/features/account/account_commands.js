// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { AccountDatabase } from 'features/account/account_database.js';
import { CommandBuilder } from 'components/commands/command_builder.js';
import { Menu } from 'components/menu/menu.js';
import { Question } from 'components/dialogs/question.js';

import { alert } from 'components/dialogs/alert.js';
import { confirm } from 'components/dialogs/confirm.js';
import { formatDate, fromNow } from 'base/time.js';
import { format } from 'base/format.js';
import { messages } from 'features/account/account.messages.js';
import { random } from 'base/random.js';

import * as signals from 'features/instrumentation/instrumentation_signals.js';

// File in which the registration message has been stored.
const kRegistrationFile = 'data/commands/register.json';

// Provides access to in-game commands related to account management.
export class AccountCommands {
    announce_ = null;
    instrumentation_ = null;
    settings_ = null;

    // Cache for the contents of the registration dialog, which are stored in //data.
    registrationDialogCache_ = null;

    // The AccountDatabase instance which will execute operations.
    database_ = null;

    constructor(announce, instrumentation, settings, database) {
        this.announce_ = announce;
        this.instrumentation_ = instrumentation;
        this.settings_ = settings;

        this.database_ = database;

        // /account
        // /account [player]
        server.commandManager.buildCommand('account')
            .description(`Enables you to manage your LVP account.`)
            .sub(CommandBuilder.kTypePlayer, 'target')
                .description(`Enables administrators to manage anyone's account.`)
                .restrict(Player.LEVEL_ADMINISTRATOR)
                .build(AccountCommands.prototype.onAccountCommand.bind(this))
            .build(AccountCommands.prototype.onAccountCommand.bind(this));

        // /nearby [player]
        server.commandManager.buildCommand('nearby')
            .description(`Displays information about a player's neighbours.`)
            .restrict(Player.LEVEL_ADMINISTRATOR, /* restrictTemporary= */ true)
            .parameters([ { name: 'player', type: CommandBuilder.kTypePlayer } ])
            .build(AccountCommands.prototype.onNearbyCommand.bind(this));

        // /register
        server.commandManager.buildCommand('register')
            .description(`Displays information on how to register on LVP.`)
            .build(AccountCommands.prototype.onRegisterCommand.bind(this));

        // /whereis [player]
        server.commandManager.buildCommand('whereis')
            .description(`Displays information about a player's whereabouts.`)
            .restrict(Player.LEVEL_ADMINISTRATOR, /* restrictTemporary= */ true)
            .parameters([ { name: 'player', type: CommandBuilder.kTypePlayer } ])
            .build(AccountCommands.prototype.onWhereisCommand.bind(this));

        // /whois [player]
        server.commandManager.buildCommand('whois')
            .description(`Displays information about a player's identity.`)
            .restrict(Player.LEVEL_ADMINISTRATOR, /* restrictTemporary= */ true)
            .parameters([ { name: 'player', type: CommandBuilder.kTypePlayer } ])
            .build(AccountCommands.prototype.onWhoisCommand.bind(this));
    }

    // ---------------------------------------------------------------------------------------------

    // /account
    // /account [player]
    //
    // Opens the account management flow for either the |player| or |targetPlayer|, when set. The
    // availability of options is dependent on server configuration, as well as the player's rights
    // on the server in general. Certain options are limited to VIPs like alias feature.
    async onAccountCommand(currentPlayer, targetPlayer) {
        const player = targetPlayer || currentPlayer;

        if (!player.account.isRegistered()) {
            currentPlayer.sendMessage(messages.account_not_registered, { player });
            return;
        }

        const features = {
            aliases: player.isVip() && this.getSettingValue('vip_alias_control'),
            changename: this.getSettingValue('nickname_control'),
            changepass: this.database_.canUpdatePasswords() &&
                        this.getSettingValue('password_control'),
            information: this.getSettingValue('info_visibility'),
            record: this.getSettingValue('record_visibility'),
            sessions: this.getSettingValue('session_visibility'),

            // Special case: Beta-server features for amending otherwise immutable settings.
            beta: this.settings_().getValue('server/beta_features'),
        };

        const dialog = new Menu(messages.account_dialog_management);

        // Enables the |player| to change their nickname. This can only be done a limited number of
        // times in a specific time period. Changing their nickname will immediately apply. This
        // option may only be used when the |player| is the current player.
        if (features.changename && player === currentPlayer) {
            dialog.addItem(
                messages.account_label_change_nickname,
                AccountCommands.prototype.changeNickname.bind(this, currentPlayer));
        }

        // Enables the |player| to change their password. The new password needs to be reasonably
        // secure, and match the password guidelines on the website. This option may only be used
        // when the |player| is the current player.
        if (features.changepass && player === currentPlayer) {
            dialog.addItem(
                messages.account_label_change_password,
                AccountCommands.prototype.changePassword.bind(this, currentPlayer));
        }

        // Enables the |player| to manage their aliases. VIPs are allowed a certain number of custom
        // names on top of their username, which they are able to control themselves.
        if (features.aliases) {
            dialog.addItem(
                messages.account_label_manage_aliases,
                AccountCommands.prototype.manageAliases.bind(this, currentPlayer, targetPlayer));
        }

        // Enables the |player| to see information about their account.
        if (features.information) {
            dialog.addItem(
                messages.account_label_view_information,
                AccountCommands.prototype.displayInfo.bind(this, currentPlayer, targetPlayer));
        }

        // Enables the |player| to view their record, with the exception of notes as they are only
        // accessible to administrators and Management members.
        if (features.record) {
            dialog.addItem(
                messages.account_label_view_record,
                AccountCommands.prototype.displayRecord.bind(this, currentPlayer, targetPlayer));
        }

        // Enables the |player| to view their recent playing sessions, together with some basic
        // information that can be shown about the session.
        if (features.sessions) {
            dialog.addItem(
                messages.account_label_view_sessions,
                AccountCommands.prototype.displaySessions.bind(this, currentPlayer, targetPlayer));
        }

        // Enables the |player| to change their own settings, otherwise restricted to Management
        // members. They can give themselves VIP rights, and change their own level.
        if (features.beta) {
            dialog.addItem(
                messages.account_label_manage_account,
                AccountCommands.prototype.displayManage.bind(this, currentPlayer, targetPlayer));
        }

        if (!dialog.hasItems()) {
            currentPlayer.sendMessage(messages.account_not_available);
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

        // Record this action in the database.
        this.instrumentation_().recordSignal(
            player, signals.kAccountNameChange, player.name, newNickname);

        // Announce the change to administrators, so that the change is known by at least a few more
        // people in case the player forgets their new password immediately after. It happens.
        this.announce_().announceToAdministrators(messages.account_admin_nickname_changed, {
            nickname: newNickname,
            player,
        });

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
            isPrivate: true,  // display this as a password
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
            isPrivate: true,  // display this as a password field
            constraints: {
                validation: AccountCommands.prototype.isSufficientlySecurePassword.bind(this),
                explanation: 'The password must be at least 8 characters long, and contain at ' +
                             'least one number, symbol or a character of different casing.',
                abort: 'Sorry, you need to have a reasonably secure password!'
            }
        });

        if (!password)
            return;  // the user aborted out of the flow

        // The |player| must confirm that they indeed picked the right password, so we ask again.
        const confirmPassword = await Question.ask(player, {
            question: 'Changing your password',
            message: 'Please enter your password again to verify.',
            isPrivate: true,  // display this as a password field
            constraints: {
                validation: input => input === password,
                explanation: 'You must enter exactly the same password again to make sure that ' +
                             'you didn\'t accidentally misspell it.',
                abort: 'Sorry, you need to confirm your password!'
            }
        });

        if (!confirmPassword || confirmPassword !== password)
            return;  // the user aborted out of the flow

        // Now execute the command to actually change the password in the database.
        await this.database_.changePassword(player.name, password);

        // Record this action in the database.
        this.instrumentation_().recordSignal(player, signals.kAccountPasswordChange);

        // Announce the change to administrators, so that the change is known by at least a few more
        // people in case the player forgets their new password immediately after. It happens.
        if (this.settings_().getValue('account/password_admin_joke')) {
            let fakePassword = null;
            switch (random(4)) {
                case 0:
                    fakePassword = player.name.toLowerCase().replace(/[^a-zA-Z]/g, '');
                    for (const [ before, after ] of [ ['a', 4], ['e', 3], ['i', 1], ['o', 0] ])
                        fakePassword = fakePassword.replaceAll(before, after);

                    break;
                case 1:
                    fakePassword =
                        player.name.toLowerCase().replace(/[^a-zA-Z]/g, '') +
                            (random(1000, 9999).toString());
                    break;
                case 2:
                    fakePassword = '1' + player.name.toLowerCase().replace(/[^a-zA-Z]/g, '') + '1';
                    break;
                case 3:
                    fakePassword = ['deagle', 'sawnoff', 'gtasa', 'lvpsux', 'password'][random(5)];
                    fakePassword += random(100, 999).toString();
                    break;
            }

            this.announce_().announceToAdministrators(messages.account_admin_password_changed2, {
                password: fakePassword,
                player,
            });
        } else {
            this.announce_().announceToAdministrators(messages.account_admin_password_changed, {
                player
            });
        }

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
            return dialog.displayForPlayer(currentPlayer);

        dialog.addItem('-----', '-----');

        for (const alias of aliases.aliases) {
            const nickname = alias.nickname;
            const lastActive = alias.lastSeen ? formatDate(alias.lastSeen) : '{BEC7CC}(never)';

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

        // Record this action in the database.
        this.instrumentation_().recordSignal(player, signals.kAccountAliasCreated, newAlias);

        // Announce the change to administrators, so that the change is known by at least a few more
        // people in case the player forgets their new password immediately after. It happens.
        this.announce_().announceToAdministrators(messages.account_admin_alias_created, {
            alias: newAlias,
            player,
        });

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
                message: `The alias ${alias.nickname} is currently in use, and cannot be deleted.`
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

        // Record this action in the database.
        this.instrumentation_().recordSignal(player, signals.kAccountAliasDeleted, alias.nickname);

        this.announce_().announceToAdministrators(messages.account_admin_alias_deleted, {
            alias: alias.nickname,
            player,
        });

        return alert(player, {
            title: 'Alias management',
            message: `The alias ${alias.nickname} has been deleted.`
        });
    }

    // Displays a menu to the |currentPlayer| with information about the account owned by either
    // themselves of the |targetPlayer|.
    async displayInfo(currentPlayer, targetPlayer) {
        const player = targetPlayer || currentPlayer;
        const information = await this.database_.getAccountInformation(player.account.userId);
        if (!information) {
            return alert(player, {
                title: 'Account information of ' + player.name,
                message: 'The information could not be retrieved. Note that this feature is not ' +
                         'available on the staging and local servers.',
            });
        }

        const display = new Menu('Account information of ' + player.name, [
            'Property',
            'Value',
        ]);

        display.addItem('Username', information.username);
        display.addItem('E-mail', information.email);
        display.addItem('Registered', formatDate(information.registered, true));
        display.addItem('Level', information.level);
        display.addItem('Karma', format('%d', information.karma));
        display.addItem('----------', '----------');

        // The financial information of an account is only accessible by the player themselves, or
        // by Management members who have ways of getting it anyway.
        const canAccessFinancialInformation =
            currentPlayer.isManagement() || player === currentPlayer;

        if ((information.vip || information.donations > 0) && canAccessFinancialInformation) {
            const donations = format('%$', information.donations).replace('$', '') + ' euro';

            display.addItem('VIP', information.vip ? 'Yes' : 'No');
            display.addItem('Donations', donations);
            display.addItem('----------', '----------');
        }

        display.addItem('Sessions', information.sessions);

        // Record this action in the database.
        this.instrumentation_().recordSignal(player, signals.kAccountViewInformation);

        await display.displayForPlayer(currentPlayer);
    }

    // Displays a menu to the |currentPlayer| with the player record of their target. The Menu will
    // be paginated, and entries from the player's full history can be seen.
    async displayRecord(currentPlayer, targetPlayer) {
        const player = targetPlayer || currentPlayer;
        const record = await this.database_.getPlayerRecord(player.account.userId, {
            includeNotes: currentPlayer.isAdministrator(),
        });

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

            display.addItem(formatDate(entry.date), type, entry.issuedBy, entry.reason);
        }

        // Record this action in the database.
        this.instrumentation_().recordSignal(player, signals.kAccountViewRecord);

        await display.displayForPlayer(currentPlayer);
    }

    // Displays a menu to the |currentPlayer| with the most recent sessions of the target.
    async displaySessions(currentPlayer, targetPlayer) {
        const player = targetPlayer || currentPlayer;
        const sessions = await this.database_.getPlayerSessions({
            userId: player.account.userId,
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
            const date = formatDate(session.date, true);
            const duration = this.formatDuration(session.duration);

            display.addItem(date, session.nickname, duration, session.ip);
        }

        // Record this action in the database.
        this.instrumentation_().recordSignal(player, signals.kAccountViewSessions);

        await display.displayForPlayer(currentPlayer);
    }

    // Displays a menu that allows players to manage their own account. This feature is only enabled
    // when the Beta functionality has been set for this server.
    async displayManage(currentPlayer, targetPlayer) {
        const player = targetPlayer || currentPlayer;

        const summary = await this.database_.getPlayerSummaryInfo(player.name);
        if (!summary)
            return;  // something is fishy

        const display = new Menu('Account management for ' + player.name, [
            'Setting',
            'Value',
        ]);

        // Enables the |player| to change their own level. They will be force disconnected after
        // making changes, to make sure it propagates appropriately.
        display.addItem('Level', summary.level, async () => {
            const updateLevel = async (targetLevel) => {
                if (targetLevel === summary.level) {
                    return await alert(currentPlayer, {
                        title: 'Account management for ' + player.name,
                        message: `${player.name}'s level already is ${targetLevel}.`
                    });
                }

                await this.database_.setUserLevel(summary.user_id, targetLevel);
                await alert(currentPlayer, {
                    title: 'Account management for ' + player.name,
                    message: 'The level has been changed. They will now be force disconnected.'
                });

                this.announce_().announceToAdministrators(messages.account_admin_level_changed, {
                    level: targetLevel,
                    player,
                });

                wait(1000).then(() => player.kick());
            };

            const options = new Menu('Account management for ' + player.name);

            for (const level of ['Player', 'Administrator', 'Management'])
                options.addItem(level, updateLevel.bind(null, level))

            await options.displayForPlayer(currentPlayer);
        });

        // Enables the |player| to give themselves VIP rights, or take them away. They will be
        // force disconnected after making changes, to make sure it propagates appropriately.
        display.addItem('VIP', summary.is_vip ? 'Yes' : 'No', async () => {
            const updateVip = async (targetSetting) => {
                if (targetSetting === !!summary.is_vip) {
                    return await alert(currentPlayer, {
                        title: 'Account management for ' + player.name,
                        message: `${player.name}'s VIP status remains unchanged.`
                    });
                }

                await this.database_.setUserVip(summary.user_id, targetSetting);
                await alert(currentPlayer, {
                    title: 'Account management for ' + player.name,
                    message: 'The VIP status has been changed. They will now be force disconnected.'
                });

                this.announce_().announceToAdministrators(messages.account_admin_vip_changed, {
                    enabled: targetSetting ? 'enabled' : 'disabled',
                    player,
                });

                wait(1000).then(() => player.kick());
            };

            const options = new Menu('Account management for ' + player.name);

            options.addItem('Regular player', updateVip.bind(null, false));
            options.addItem('VIP player', updateVip.bind(null, true));

            await options.displayForPlayer(currentPlayer);
        });

        await display.displayForPlayer(currentPlayer);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |player| wants to know which other players live nearby the given |target|.
    // The results will be bucketed in groups of ~50km distances, to avoid this being too intrusive.
    // Only registered players who were in-game in the past year will be considered for this.
    async onNearbyCommand(player, target) {
        const results = await this.database_.nearby(target.ip);
        if (!results || !results.length) {
            return await alert(player, {
                title: `Who's near ${target.name}?!`,
                message: `No results were found for ${target.name}. We only consider sessions in ` +
                         `the past year, which might explain this.`
            });
        }

        const dialog = new Menu(`Who's near ${target.name}?!`, [
            'Nickname',
            'Distance',
            'Last seen',
        ]);

        for (const { username, sessions, lastSeen, distance } of results) {
            let sessionLabel = '';
            let distanceLabel = '{90A4AE}<150km';
            let activityLabel = fromNow({ date: lastSeen });

            if (sessions > 1)
                sessionLabel = ` {90A4AE}(${format('%d', sessions)}x)`;

            if (distance < 10)
                distanceLabel = '{B2FF59}<10km';
            else if (distance <= 50)
                distanceLabel = '{EEFF41}<50km';
            else if (distance <= 100)
                distanceLabel = '{CFD8DC}<100km';

            dialog.addItem(username + sessionLabel, distanceLabel, activityLabel);
        }

        await dialog.displayForPlayer(player);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |player| has typed the "/register" command. This will tell them where they
    // can sign up to create an account. When beta functionality is enabled, a brief registration
    // flow will be started immediately instead.
    async onRegisterCommand(player) {
        if (!this.settings_().getValue('server/beta_features')) {
            if (!this.registrationDialogCache_)
                this.registrationDialogCache_ = JSON.parse(readFile(kRegistrationFile));

            const message = this.registrationDialogCache_.join('\r\n');
            return alert(player, { message });
        }

        // Don't let players re-register their own account.
        if (player.account.isRegistered() || player.account.isIdentified()) {
            return await alert(player, {
                title: 'Register your account',
                message: `You are already logged in to an account. Join as a new user first.`,
            });
        }

        // Don't let the |player| register the account if an account with that name already exists.
        // This shouldn't ever happen unless the database connection was busted when they connected
        // to the server, but better to guard against it to make sure stuff doesn't mess up.
        const summary = await this.database_.getPlayerSummaryInfo(player.name);
        if (summary !== null) {
            return await alert(player, {
                title: 'Register your account',
                message: `An account named "${player.name}" already exists.`,
            });
        }

        // Give the |player| multiple attempts to pick a reasonably secure password. We don't set
        // high requirements, but we do need them to be a little bit sensible with their security.
        const password = await Question.ask(player, {
            question: 'Register your account',
            message: 'Enter the password to use for your account',
            isPrivate: true,  // display this as a password field
            constraints: {
                validation: AccountCommands.prototype.isSufficientlySecurePassword.bind(this),
                explanation: 'The password must be at least 8 characters long, and contain at ' +
                             'least one number, symbol or a character of different casing.',
                abort: 'Sorry, you need to have a reasonably secure password!'
            }
        });

        if (!password)
            return;  // the user aborted out of the flow

        // The |player| must confirm that they indeed picked the right password, so we ask again.
        const confirmPassword = await Question.ask(player, {
            question: 'Register your account',
            message: 'Please enter your password again to verify.',
            isPrivate: true,  // display this as a password field
            constraints: {
                validation: input => input === password,
                explanation: 'You must enter exactly the same password again to make sure that ' +
                             'you didn\'t accidentally misspell it.',
                abort: 'Sorry, you need to confirm your password!'
            }
        });

        if (!confirmPassword)
            return;  // the user aborted out of the flow

        await this.database_.createAccount(player.name, password);

        // Tell other administrators about the new account, giving everyone some opportunity to know
        // what's going on. Not least of all the people watching through Nuwani.
        this.announce_().announceToAdministrators(messages.account_admin_registered, { player });

        await alert(player, {
            title: 'Register your account',
            message: `Your account for "${player.name} has been created. You will be forced to ` +
                     `reconnect after dismissing this dialog.`,
        });

        player.kick();
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |player| wishes to locate the |target| through the "/whereis" command. This
    // isn't about their in-game location, but rather their physical location.
    async onWhereisCommand(player, target) {
        const results = await this.database_.whereIs(target.ip);
        if (!results.proxy && !results.location) {
            return await alert(player, {
                title: `Where is ${target.name}?!`,
                message: `I have no idea where ${target.name} is.. Sorry!`
            });
        }

        const dialog = new Menu(`Where is ${target.name}?!`, [
            'Field',
            'Value',
        ]);

        // (1) When proxy information is known,
        if (results.proxy) {
            dialog.addItem('{FFEB3B}Proxy information', '{9E9E9E}-');
            dialog.addItem('Proxy location', `${results.proxy.country} (${results.proxy.city})`);
            dialog.addItem('Proxy provider', `${results.proxy.isp} (${results.proxy.domain})`);
            dialog.addItem('Proxy network', `${results.proxy.networkName}`);
            dialog.addItem('Intended usage', results.proxy.usage.join(', '));
        }

        // (2) When location information is known,
        if (results.location) {
            if (results.proxy)
                dialog.addItem('----------', '----------');

            dialog.addItem('{FFEB3B}Location information', '{9E9E9E}-');
            dialog.addItem('Country', results.location.country);
            dialog.addItem('Region', results.location.region);
            dialog.addItem('City', results.location.city);

            dialog.addItem('Timezone', results.location.timeZone);
            // Current time estimation if we know DST?
        }

        await dialog.displayForPlayer(player);
    }

    // ---------------------------------------------------------------------------------------------

    // Enables administrators to quickly look up if the |targetPlayer| might be another player who's
    // recently been on the server. Results will be displayed with a level of certainty.
    async onWhoisCommand(player, targetPlayer) {
        const results = await this.database_.whois(targetPlayer.ip, targetPlayer.serial);
        if (!results.length) {
            return await alert(player, {
                title: `Who is ${targetPlayer.name}?!`,
                message: `No results were found for ${targetPlayer.name}. This might be their ` +
                         `first playing session, or they're really good at hiding.`
            });
        }

        const dialog = new Menu(`Who is ${targetPlayer.name}?!`, [
            'Nickname',
            'IP match',
            'Serial match',
            'Last seen',
        ]);

        for (const result of results) {
            let nickname = '';
            if (!result.registered)
                nickname += `{BEC7CC}${result.nickname}`;
            else
                nickname += result.nickname;

            if (result.hits > 1)
                nickname += ` {90A4AE}(${format('%d', result.hits)}x)`;

            let ip = '';
            if (result.ipDistance < 3)
                ip += `{FFEE58}`;
            else if (result.ipDistance === 4)
                ip += `{BEC7CC}`;

            ip += result.ipMatch;

            let serial = '';
            if (result.serial === targetPlayer.serial)
                serial += `{FFEE58}match`;
            else
                serial += `{BEC7CC}no match`;

            if (result.serialCommon)
                serial += ` {FF7043}(common)`;

            const lastSeen = fromNow({ date: result.lastSeen });

            dialog.addItem(nickname, ip, serial, lastSeen);
        }

        await dialog.displayForPlayer(player);
    }

    // ---------------------------------------------------------------------------------------------

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
        this.announce_ = null;
        this.database_ = null;
        this.playerIdentifier_ = null;

        server.commandManager.removeCommand('whois');
        server.commandManager.removeCommand('whereis');
        server.commandManager.removeCommand('register');
        server.commandManager.removeCommand('account');
    }
}
