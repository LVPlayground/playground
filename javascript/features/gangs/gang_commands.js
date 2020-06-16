// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { ColorPicker } from 'components/dialogs/color_picker.js';
import { CommandBuilder } from 'components/command_manager/command_builder.js';
import { Dialog } from 'components/dialogs/dialog.js';
import Gang from 'features/gangs/gang.js';
import GangDatabase from 'features/gangs/gang_database.js';
import { GangFinance } from 'features/gangs/gang_finance.js';
import { Menu } from 'components/menu/menu.js';
import { PlayerSetting } from 'entities/player_setting.js';
import { Question } from 'components/dialogs/question.js';
import { QuestionSequence } from 'components/dialogs/question_sequence.js';

import { alert } from 'components/dialogs/alert.js';
import { confirm } from 'components/dialogs/confirm.js';
import { format } from 'base/format.js';
import { formatDate, fromNow } from 'base/time.js';

// Options for asking the player what the gang's full name should be.
const NAME_QUESTION = {
    question: 'Choose your gang\'s name',
    message: 'What is the full name your gang will be known as?',
    constraints: {
        validation: /^[a-zA-Z0-9àáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð\s,\.'\-~_]{4,32}$/u,
        explanation: 'The name of your gang must be between 4 and 32 characters long and should ' +
                     'not contain very exotic characters.',

        abort: 'Sorry, a gang must have a valid name!'
    }
};

// Options for asking the player what the gang's tag should be.
const TAG_QUESTION = {
    question: 'Choose your gang\'s tag',
    message: 'What should we use as the gang\'s tag (without brackets)?',
    constraints: {
        validation: /^[a-zA-Z0-9,\.\-_]{1,5}$/,
        explanation: 'The tag of your gang must be between 1 and 5 characters long (without the ' +
                     'brackets) and be a valid username.',

        abort: 'Sorry, a gang must have a valid tag!'
    }
};

// Options for asking the player what the gang's goal should be.
const GOAL_QUESTION = {
    question: 'Choose your gang\'s goal',
    message: 'In one sentence, what is the purpose of your gang?',
    constraints: {
        validation: /^[a-zA-Z0-9àáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð\s,\.'\-~_!?]{4,50}$/u,
        explanation: 'The goal of your gang must be between 4 and 50 characters long and should ' +
                     'not contain very exotic characters.',

        abort: 'Sorry, a gang must have a valid goal!'
    }
};

// Options for asking the player what the gang's skin should be.
const SKIN_QUESTION = {
    question: 'Choose your gang\'s skin',
    message: 'What is the skin your gang will use?',
    constraints: {
        // The validation will be updated based upon the entries of player_classes.json
        validation: /^([0-9]|[1-9][0-9]|1[0-1][0-9]|120|12[2-9]|1[3-9][3-9]|2[0-9][0-9])$/u,
        explanation: 'The skin your members will have if enabled',

        abort: 'Sorry, a gang must have a valid skin!'
    }
};

// Implements the commands available as part of the persistent gang feature. The primary ones are
// /gang and /gangs, each of which has a number of sub-options available to them.
class GangCommands {
    constructor(manager, announce, finance, settings) {
        this.manager_ = manager;
        this.announce_ = announce;
        this.finance_ = finance;
        this.settings_ = settings;

        // Map of players to the gangs they have been invited by.
        this.invitations_ = new WeakMap();

        // Command: /gang
        server.commandManager.buildCommand('gang')
            .sub('create')
                .build(GangCommands.prototype.onGangCreateCommand.bind(this))
            .sub('invite')
                .parameters([{ name: 'player', type: CommandBuilder.PLAYER_PARAMETER }])
                .build(GangCommands.prototype.onGangInviteCommand.bind(this))
            .sub('join')
                .build(GangCommands.prototype.onGangJoinCommand.bind(this))
            .sub('kick')
                .parameters([{ name: 'member', type: CommandBuilder.WORD_PARAMETER }])
                .build(GangCommands.prototype.onGangKickCommand.bind(this))
            .sub('leave')
                .build(GangCommands.prototype.onGangLeaveCommand.bind(this))
            .sub('members')
                .build(GangCommands.prototype.onGangMembersCommand.bind(this))
            .sub('settings')
                .build(GangCommands.prototype.onGangSettingsCommand.bind(this))
            .sub('transactions')
                .build(GangCommands.prototype.onGangTransactionsCommand.bind(this))
            .build(GangCommands.prototype.onGangCommand.bind(this));

        // Command: /gangs
        server.commandManager.buildCommand('gangs')
            .sub(CommandBuilder.PLAYER_PARAMETER)
                .build(GangCommands.prototype.onGangsInfoCommand.bind(this))
            .build(GangCommands.prototype.onGangsCommand.bind(this));
        
        // /gbalance
        server.commandManager.buildCommand('gbalance')
            .build(GangCommands.prototype.onGangBalanceCommand.bind(this));
        
        // /gbank [[amount] | all]
        server.commandManager.buildCommand('gbank')
            .sub('all')
                .build(GangCommands.prototype.onGangBankCommand.bind(this))
            .parameters([{ name: 'amount', type: CommandBuilder.NUMBER_PARAMETER }])
            .build(GangCommands.prototype.onGangBankCommand.bind(this));

        // /gwithdraw [[amount] | all]
        server.commandManager.buildCommand('gwithdraw')
            .sub('all')
                .build(GangCommands.prototype.onGangWithdrawCommand.bind(this))
            .parameters([{ name: 'amount', type: CommandBuilder.NUMBER_PARAMETER }])
            .build(GangCommands.prototype.onGangWithdrawCommand.bind(this));
    }

    // Called when the player uses the `/gang create` command to create a new gang. If the player is
    // eligible, it will start a wizard of dialog boxes requesting the necessary information from
    // the player. All values must be unique among other gangs in the database.
    async onGangCreateCommand(player) {
        if (!player.account.isRegistered()) {
            player.sendMessage(Message.GANGS_NOT_REGISTERED);
            return;
        }

        if (this.manager_.gangForPlayer(player) !== null) {
            player.sendMessage(Message.GANGS_ALREADY_SET);
            return;
        }

        // Ask the questions to the player, and only proceed if they answered everything.
        await QuestionSequence.ask(player, [NAME_QUESTION, TAG_QUESTION, GOAL_QUESTION]).then(
                async(answers) => {
            if (!answers)
                return;  // they clicked `cancel` or got a dialog with an explanation

            const [ name, tag, goal ] = answers;
            try {
                const result = await this.manager_.createGangForPlayer(player, tag, name, goal);
                if (!result)
                    return;  // the player disconnected from the server

                this.announce_().announceToPlayers(
                    Message.GANG_ANNOUNCE_CREATED, player.name, name);

                player.sendMessage(Message.GANG_DID_CREATE, result.name);

            } catch (error) {
                await Dialog.displayMessage(
                    player, 'Unable to create your gang', error.message, 'Close', '');
            }
        });
    }

    // Called when the player uses the `/gang invite` command to invite |invitee| in their gang. The
    // invitation will be open until the |invitee| accepts, gets invited by another gang or leaves.
    onGangInviteCommand(player, invitee) {
        const gang = this.manager_.gangForPlayer(player);
        if (!gang) {
            player.sendMessage(Message.GANG_NOT_IN_GANG);
            return;
        }

        // Only leaders and managers of a gang can invite new members.
        if (![ Gang.ROLE_LEADER, Gang.ROLE_MANAGER ].includes(gang.getPlayerRole(player))) {
            player.sendMessage(Message.GANG_INVITE_NO_MANAGER);
            return;
        }

        // Players cannot invite themselves to the gang.
        if (invitee === player) {
            player.sendMessage(Message.GANG_INVITE_SELF);
            return;
        }

        // The invitee must be registered with Las Venturas Playground.
        if (!invitee.account.isRegistered()) {
            player.sendMessage(Message.GANG_INVITE_NOT_REGISTERED, invitee.name);
            return;
        }

        // The invitee cannot be part of the gang already.
        if (gang.hasPlayer(invitee)) {
            player.sendMessage(Message.GANG_INVITE_IS_MEMBER, invitee.name);
            return;
        }

        // People should not be able to hammer specific players with invites.
        if (this.invitations_.has(invitee) && this.invitations_.get(invitee).inviter === player) {
            player.sendMessage(Message.GANG_INVITE_NO_HAMMER, invitee.name);
            return;
        }

        this.invitations_.set(invitee, {
            gang: gang,
            inviter: player
        });

        player.sendMessage(Message.GANG_DID_INVITE, invitee.name, invitee.id);
        invitee.sendMessage(Message.GANG_INVITED, player.name, player.id, gang.name);

        this.manager_.announceToGang(gang, player, Message.GANG_INTERNAL_ANNOUNCE_INVITATION,
                                     player.name, invitee.name, invitee.id);

        this.announce_().announceToAdministrators(
            Message.GANG_ANNOUNCE_INVITATION, player.name, player.id, invitee.name, invitee.id,
            gang.name);
    }

    // Called when the player uses the `/gang join` command to accept an earlier invitation. They
    // must not be part of a gang when using this command.
    async onGangJoinCommand(player) {
        if (!this.invitations_.has(player)) {
            player.sendMessage(Message.GANG_JOIN_NO_INVITATION);
            return;
        }

        const currentGang = this.manager_.gangForPlayer(player);
        const gang = this.invitations_.get(player).gang;

        if (currentGang !== null) {
            player.sendMessage(Message.GANG_JOIN_IN_GANG, currentGang.name);
            return;
        }

        // Add the player to the gang they have been invited to.
        if (!await this.manager_.addPlayerToGang(player, gang))
            return;  // the player has since disconnected from the server

        player.sendMessage(Message.GANG_DID_JOIN, gang.name);

        this.manager_.announceToGang(
            gang, player, Message.GANG_INTERNAL_ANNOUNCE_JOINED, player.name, player.id);

        this.announce_().announceToPlayers(
            Message.GANG_ANNOUNCE_JOINED, player.name, gang.name);

        this.invitations_.delete(player);
    }

    // Called when the player uses the `/gang kick [member]` command. It enables gang leaders and
    // managers to remove other members from the gang. The kicked player does not have to be on the
    // server- otherwise people who are in trouble could just not show up for a while.
    async onGangKickCommand(player, member) {
        const gang = this.manager_.gangForPlayer(player);
        if (!gang) {
            player.sendMessage(Message.GANG_NOT_IN_GANG);
            return;
        }

        const playerRole = gang.getPlayerRole(player);

        // Only leaders and managers of a gang can kick members.
        if (![ Gang.ROLE_LEADER, Gang.ROLE_MANAGER ].includes(playerRole)) {
            player.sendMessage(Message.GANG_KICK_NO_MANAGER);
            return;
        }

        const lowerCaseMember = member.toLowerCase();
        const maybeMemberId = parseInt(member, 10);

        // Get a list of all members in the gang, whether they're in-game or not.
        const members = await this.manager_.getFullMemberList(gang, false /* groupByRole */);

        let matchingMembers = [];
        for (let member of members) {
            // Give matching gang members by their player Id (for online members) precedence.
            if (member.player !== null && !Number.isNaN(maybeMemberId)) {
                if (member.player === server.playerManager.getById(maybeMemberId)) {
                    matchingMembers = [ member ];
                    break;
                }
            }

            if (!member.nickname.toLowerCase().includes(lowerCaseMember))
                continue;

            matchingMembers.push(member);
        }

        // Bail out if no members matched the member query.
        if (!matchingMembers.length) {
            player.sendMessage(Message.GANG_KICK_NO_MATCH, member);
            return;
        }

        // Bail out if the member query turned out to be ambiguous.
        if (matchingMembers.length > 1) {
            player.sendMessage(Message.GANG_KICK_AMBIGUOUS_MATCH,
                               matchingMembers.slice(0, 3).map(member => member.nickname));
            return;
        }

        const memberToKick = matchingMembers[0];

        // Bail out if |memberToKick| and |player| describe the same person.
        if (memberToKick.player === player) {
            player.sendMessage(Message.GANG_KICK_SELF_NOT_ALLOWED);
            return;
        }

        // Bail out if |player| is a manager and |member| is not a Member.
        if (playerRole === Gang.ROLE_MANAGER && memberToKick.role != Gang.ROLE_MEMBER) {
            player.sendMessage(Message.GANG_KICK_NOT_ALLOWED);
            return;
        }

        const nickname = memberToKick.nickname;

        await memberToKick.player ? this.manager_.removePlayerFromGang(memberToKick.player, gang)
                                  : this.manager_.removeMemberFromGang(memberToKick.userId, gang);

        player.sendMessage(Message.GANG_KICK_REMOVED, nickname, gang.name);

        this.manager_.announceToGang(
            gang, player, Message.GANG_INTERNAL_ANNOUNCE_KICKED, player.name, nickname);

        this.announce_().announceToAdministrators(
            Message.GANG_ANNOUNCE_KICKED, player.name, player.id, nickname, gang.name);
    }

    // Called when the player uses the `/gang leave` command. It will show a confirmation dialog
    // informing them of the consequences of leaving the gang. This differs for Leaders and regular
    // members of a gang, because gangs cannot be left without a leader.
    async onGangLeaveCommand(player) {
        const gang = this.manager_.gangForPlayer(player);
        if (!gang) {
            player.sendMessage(Message.GANG_NOT_IN_GANG);
            return;
        }

        const common = Message.format(Message.GANG_LEAVE_CONFIRMATION, gang.name);

        // Regular members and managers of a gang can leave without succession determination.
        if (gang.getPlayerRole(player) != Gang.ROLE_LEADER) {
            if (!await confirm(player, { title: 'Are you sure?', message: common }))
                return;  // the player changed their mind

            await this.manager_.removePlayerFromGang(player, gang);

            player.sendMessage(Message.GANG_DID_LEAVE, gang.name);

            this.manager_.announceToGang(
                gang, player, Message.GANG_INTERNAL_ANNOUNCE_LEFT, player.name);

            this.announce_().announceToPlayers(Message.GANG_ANNOUNCE_LEFT,
                player.name, gang.name);

            return;
        }

        // The |player| is a leader of the gang, confirm the succession, if any, with them.
        const succession = await this.manager_.determineSuccessionAfterDeparture(player, gang);

        // If there is no known succession, there either are no other members of the gang or the
        // gang has multiple leaders, in which case succession is unnecessary.
        if (!succession) {
            if (!await confirm(player, { title: 'Are you sure?', message: common }))
                return;  // the player changed their mind

        } else {
            const confirmationMsg = Message.format(Message.GANG_LEAVE_PROMO_CONFIRMATION, gang.name,
                                                   succession.username, succession.role);

            if (!await confirm(player, { title: 'Are you sure?', message: confirmationMsg }))
                return;  // the player changed their mind
        }

        await this.manager_.removePlayerFromGang(player, gang);
        if (succession)
            await this.manager_.updateRoleForUserId(succession.userId, gang, Gang.ROLE_LEADER);

        player.sendMessage(Message.GANG_DID_LEAVE, gang.name);

        this.manager_.announceToGang(
            gang, player, Message.GANG_INTERNAL_ANNOUNCE_LEFT, player.name);

        this.announce_().announceToPlayers(Message.GANG_ANNOUNCE_LEFT,
            player.name, gang.name);
    }

    // Called when the player uses the `/gang members` command. All members of their gang, whether
    // they are logged in or not, will be displayed to them.
    async onGangMembersCommand(player) {
        const gang = this.manager_.gangForPlayer(player);
        if (!gang) {
            player.sendMessage(Message.GANG_NOT_IN_GANG);
            return;
        }

        // Retrieve the full memberlist of this gang, not those who are currently in-game.
        const members = await this.manager_.getFullMemberList(gang, false /* groupByRole */);
        
        // Compile a set of online users, to reflect their last activity time more accurately than
        // relying on the database, which may not have updated yet.
        const ingame = new Set();

        for (const otherPlayer of server.playerManager) {
            if (otherPlayer.account.isIdentified())
                ingame.add(otherPlayer.account.userId);
        }

        // Display a dialog with all the relevant information about the member(s).
        const dialog = new Menu('Gang members', [
            'Position',
            'Nickname',
            'Last seen',

        ], { pageSize: this.settings_().getValue('gangs/member_page_count') });

        for (const member of members) {
            const position = GangDatabase.toRoleString(member.role);
            const nickname = member.nickname;

            if (ingame.has(member.userId))
                member.lastSeen = new Date();

            let lastSeen = '{CCCCCC}never';
            if (member.lastSeen && !Number.isNaN(member.lastSeen.getTime()))
                lastSeen = fromNow({ date: member.lastSeen });
            
            dialog.addItem(position, nickname, lastSeen);
        }

        await dialog.displayForPlayer(player);
    }

    // Called when a player types the `/gang settings` command. This command is only available for
    // gang leaders, and allows them to change their gang's settings.
    async onGangSettingsCommand(player) {
        const gang = this.manager_.gangForPlayer(player);
        if (!gang) {
            player.sendMessage(Message.GANG_NOT_IN_GANG);
            return;
        }

        const isLeader = gang.getPlayerRole(player) === Gang.ROLE_LEADER;
        const isManager = isLeader || gang.getPlayerRole(player) === Gang.ROLE_MANAGER;

        const menu = new Menu('Which setting do you want to change?', ['Option', 'Current value']);
        if (isLeader) {
            menu.addItem('Member settings', '-', async() => {
                const members = await this.manager_.getFullMemberList(gang);
                const membersMenu =
                    new Menu('Which member do you want to update?', ['Name', 'Role']);

                members.forEach(member => {
                    const roleString = GangDatabase.toRoleString(member.role);

                    membersMenu.addItem(member.nickname, roleString, async() =>
                        await this.onGangSettingsMemberCommand(player, member));
                });

                await membersMenu.displayForPlayer(player);
            });

            menu.addItem('Member color', '-', async() => {
                const color = await ColorPicker.show(player);
                if (!color)
                    return;  // the leader decided to not update the gang's color

                const colorName = '#' + color.toHexRGB();

                await this.manager_.updateColor(gang, color);

                this.manager_.announceToGang(
                    gang, null, Message.GANG_INTERNAL_ANNOUNCE_NEW_COLOR, player.name,
                    colorName);

                this.announce_().announceToAdministrators(
                    Message.GANG_ANNOUNCE_NEW_COLOR, player.name, player.id, gang.name,
                    colorName);

                const formattedMessage =
                    Message.format(Message.GANG_SETTINGS_NEW_COLOR, colorName);

                await alert(player, {
                    title: 'The color has been updated',
                    message: formattedMessage
                });
            });

            menu.addItem('Member skin', gang.skinId ?? '-', async() => {
                // TODO: We'll probably want to move this to a class selection class in the future.
                const availableSkins = JSON.parse(readFile('data/player_classes.json'));

                let question = SKIN_QUESTION;                
                question.constraints.validation = new RegExp(`^(${availableSkins.join('|')})$`);
                
                const answer = await Question.ask(player, question);
                if (!answer)
                    return;  // the leader decided to not update the gang's skin

                const skinId = +answer;
                await this.manager_.updateSkinId(gang, skinId);

                this.manager_.announceToGang(
                    gang, null, Message.GANG_INTERNAL_ANNOUNCE_NEW_SKIN, player.name,
                    skinId);

                this.announce_().announceToAdministratorsWithFilter(
                    Message.GANG_ANNOUNCE_NEW_SKIN, 
                    PlayerSetting.ANNOUNCEMENT.GANGS, 
                    PlayerSetting.SUBCOMMAND.GANGS_CHANGED_SKIN,
                    player.name, player.id, gang.name,
                    skinId);

                const formattedMessage =
                    Message.format(Message.GANG_SETTINGS_NEW_SKIN, skinId);

                await alert(player, {
                    title: 'The color has been updated',
                    message: formattedMessage
                });
            });
        }

        if (isManager) {
            let encryptionLabel = '';
            if (!gang.chatEncryptionExpiry) {
                encryptionLabel = '{FF0000}No encryption';
            } else {
                const timeDiff = server.clock.formatRelativeTime(gang.chatEncryptionExpiry);
                encryptionLabel = timeDiff.includes('from now') ? '{00FF00}Secure until ' + timeDiff
                                                                : '{FF0000}Expired ' + timeDiff;
            }

            menu.addItem('Gang chat encryption', encryptionLabel, async() => {
                const purchaseMenu = new Menu('How much encryption time to buy?', ['Time', 'Price'])
                const prices = [
                    [ '1 hour',    200000,    3600 ],
                    [ '1 day',    1500000,   86400 ],
                    [ '1 week',   7500000,  604800 ],
                    [ '1 month', 25000000, 2613600 ]
                ];

                const currentBalance = await this.finance_().getPlayerAccountBalance(player);

                for (const [label, price, seconds] of prices) {
                    const pricePrefix = (price < currentBalance ? '{00FF00}' : '{FF0000}');
                    const priceLabel = pricePrefix + Message.format('%$', price);

                    purchaseMenu.addItem(label, priceLabel, async(player) => {
                        const balance = await this.finance_().getPlayerAccountBalance(player);
                        if (balance < price) {
                            return await alert(player, {
                                title: 'Unable to purchase the additional time',
                                message: Message.format(Message.GANG_SETTINGS_ENC_TIME_MONEY,
                                                        price, balance)
                            });
                        }

                        await this.finance_().withdrawFromPlayerAccount(player, price);
                        await this.manager_.updateChatEncryption(gang, player, seconds);

                        await alert(player, {
                            title: 'The encryption package has been purchased',
                            message: Message.format(Message.GANG_SETTINGS_ENC_TIME_BOUGHT,
                                                    label, price)
                        });
                    });
                }

                await purchaseMenu.displayForPlayer(player);
            });
        }

        if (isLeader) {
            menu.addItem('Gang name', gang.name, async() => {
                const answer = await Question.ask(player, NAME_QUESTION);
                if (!answer)
                    return;  // the leader decided to not update the gang's name

                const formerName = gang.name;

                const result = await this.manager_.updateName(gang, answer);
                if (!result) {
                    return await alert(player, {
                        title: 'Unable to update the gang name',
                        message: Message.GANG_SETTINGS_NAME_TAKEN
                    });
                }

                this.manager_.announceToGang(
                    gang, null, Message.GANG_INTERNAL_ANNOUNCE_NEW_NAME, player.name,
                    answer);

                this.announce_().announceToAdministrators(
                    Message.GANG_ANNOUNCE_NEW_NAME, player.name, player.id, formerName,
                    answer);

                await alert(player, {
                    title: 'The name has been updated',
                    message: Message.format(Message.GANG_SETTINGS_NEW_NAME, answer)
                });
            });

            menu.addItem('Gang tag', gang.tag, async() => {
                const answer = await Question.ask(player, TAG_QUESTION);
                if (!answer)
                    return;  // the leader decided to not update the gang's tag

                const result = await this.manager_.updateTag(gang, answer);
                if (!result) {
                    return await alert(player, {
                        title: 'Unable to update the gang tag',
                        message: Message.GANG_SETTINGS_TAG_TAKEN
                    });
                }

                this.manager_.announceToGang(
                    gang, null, Message.GANG_INTERNAL_ANNOUNCE_NEW_TAG, player.name,
                    answer);

                this.announce_().announceToAdministrators(
                    Message.GANG_ANNOUNCE_NEW_TAG, player.name, player.id, gang.name,
                    answer);

                await alert(player, {
                    title: 'The tag has been updated',
                    message: Message.format(Message.GANG_SETTINGS_NEW_TAG, answer)
                });
            });

            menu.addItem('Gang goal', gang.goal, async() => {
                const answer = await Question.ask(player, GOAL_QUESTION);
                if (!answer)
                    return;  // the leader decided to not update the gang's goal

                await this.manager_.updateGoal(gang, answer);

                this.manager_.announceToGang(
                    gang, null, Message.GANG_INTERNAL_ANNOUNCE_NEW_GOAL, player.name,
                    answer);

                this.announce_().announceToAdministrators(
                    Message.GANG_ANNOUNCE_NEW_GOAL, player.name, player.id, gang.name,
                    answer);

                await alert(player, {
                    title: 'The goal has been updated',
                    message: Message.format(Message.GANG_SETTINGS_NEW_GOAL, answer)
                });
            });

            const balanceAccessOptions = new Map([
                [ GangDatabase.kAccessLeader, 'Leader only' ],
                [ GangDatabase.kAccessLeaderAndManagers, 'Leader and managers' ],
                [ GangDatabase.kAccessEveryone, 'Everyone' ],
            ]);

            const balanceAccessLabel = balanceAccessOptions.get(gang.balanceAccess) ?? 'Unknown';

            menu.addItem('Gang balance withdrawals', balanceAccessLabel, async() => {
                const optionMenu = new Menu('Who can withdraw money?', ['Option', 'Selected']);

                for (const [value, label] of balanceAccessOptions) {
                    const selected = value === gang.balanceAccess ? 'X' : '';

                    optionMenu.addItem(label, selected, async() => {
                        await this.manager_.updateBalanceAccess(gang, value);
                        await alert(player, {
                            title: 'Access setting has been updated',
                            message: 'Gang bank account withdrawal access has been updated.',
                        });
                    });
                }

                await optionMenu.displayForPlayer(player);
            });
        }

        const usesGangColor = gang.usesGangColor(player);
        const colorPreferenceUsage = usesGangColor ? 'Gang color'
                                                   : 'Personal color';

        // All members have the ability to change their color preferences. This enables, for
        // example, administrators to be in a gang whilst not being forced to use the gang's color.
        menu.addItem('My color', colorPreferenceUsage, async() => {
            const colorMenu =
                new Menu('Do you want to use the gang\'s color?', ['Option', 'Selected']);

            colorMenu.addItem('Yes, use the gang color', usesGangColor ? 'X' : '', async() => {
                await this.manager_.updateColorPreference(gang, player, true);
                await alert(player, {
                    title: 'Your color has been updated',
                    message: Message.GANG_SETTINGS_USE_GANG_COLOR
                });
            });

            colorMenu.addItem('No, use my personal color', !usesGangColor ? 'X' : '', async() => {
                await this.manager_.updateColorPreference(gang, player, false);
                await alert(player, {
                    title: 'Your color has been updated',
                    message: Message.GANG_SETTINGS_USE_PERSONAL_COLOR
                });
            });

            await colorMenu.displayForPlayer(player);
        });

        const usesGangSkin = gang.usesGangSkin(player);
        const gangSkinPreferenceUsage = usesGangSkin ? 'Gang skin'
                                                     : 'Personal skin';
        
        // All members have the ability to change their skin preference. This enables gangs,
        // for example BA, to use the clown skin.
        menu.addItem('My skin', gangSkinPreferenceUsage, async() => {
            const skinMenu =
                new Menu('Do you want to use the gang\'s skin?', ['Option', 'Selected']);

                skinMenu.addItem('Yes, use the gang skin', usesGangSkin ? 'X' : '', async() => {
                await this.manager_.updateSkinPreference(gang, player, true);
                await alert(player, {
                    title: 'Your skin has been updated',
                    message: Message.GANG_SETTINGS_USE_GANG_SKIN
                });
            });

            skinMenu.addItem('No, use my personal skin', !usesGangSkin ? 'X' : '', async() => {
                await this.manager_.updateSkinPreference(gang, player, false);
                await alert(player, {
                    title: 'Your skin has been updated',
                    message: Message.GANG_SETTINGS_USE_PERSONAL_SKIN
                });
            });

            await skinMenu.displayForPlayer(player);
        });

        await menu.displayForPlayer(player);
    }

    // Called when the settings of a given gang member have to be updated. The gang leader can
    // promote or demote everybody in the gang, except for themselves.
    async onGangSettingsMemberCommand(player, member) {
        const gang = this.manager_.gangForPlayer(player);

        // The leader cannot modify their own settings. If they want to leave the gang, they will
        // have to use `/gang leave` instead.
        if (member.player === player) {
            return await alert(player, {
                title: 'You cannot change your own settings!',
                message: Message.GANG_SETTINGS_SELF_CHANGE
            });
        }

        const memberName = member.nickname;
        const currentRole = member.role;

        // The menu has to be personalized based on the |member| and their current role.
        const optionMenu = new Menu('What do you want to do?');

        // Function that can be referred to for updating a member's role to a certain value.
        async function updateMemberRole(newRole) {
            await this.manager_.updateRoleForUserId(member.userId, gang, newRole);

            const role = GangDatabase.toRoleString(newRole).toLowerCase();
            const formattedMessage =
                Message.format(Message.GANG_SETTINGS_ROLE_UPDATED, member.nickname, role);

            const mutation = newRole < currentRole ? 'promoted' : 'demoted';

            this.manager_.announceToGang(
                gang, null, Message.GANG_INTERNAL_ANNOUNCE_ROLE_CHANGED, player.name,
                mutation, member.nickname, role);

            await alert(player, {
                title: 'The member has been updated!',
                message: formattedMessage
            });
        }

        // Bound references to the above functions to use as the event listeners.
        const updateToLeader = updateMemberRole.bind(this, Gang.ROLE_LEADER);
        const updateToManager = updateMemberRole.bind(this, Gang.ROLE_MANAGER);
        const updateToMember = updateMemberRole.bind(this, Gang.ROLE_MEMBER);

        // Add the "promote X to Y" and "demote X to Y" options.
        switch (member.role) {
            case Gang.ROLE_LEADER:
                optionMenu.addItem('Demote ' + memberName + ' to manager.', updateToManager);
                optionMenu.addItem('Demote ' + memberName + ' to member.', updateToMember);
                break;
            case Gang.ROLE_MANAGER:
                optionMenu.addItem('Promote ' + memberName + ' to leader.', updateToLeader);
                optionMenu.addItem('Demote ' + memberName + ' to member.', updateToMember);
                break;
            case Gang.ROLE_MEMBER:
                optionMenu.addItem('Promote ' + memberName + ' to leader.', updateToLeader);
                optionMenu.addItem('Promote ' + memberName + ' to manager.', updateToManager);
                break;
            default:
                throw new Error('Invalid role: ' + member.role);
        }

        // Add the "kick X from gang" option.
        optionMenu.addItem('Kick ' + memberName + ' from the gang.', async() => {
            await member.player && member.player.isConnected()
                ? this.manager_.removePlayerFromGang(member.player, gang)
                : this.manager_.removeMemberFromGang(member.userId, gang);

            const formattedMessage =
                Message.format(Message.GANG_SETTINGS_MEMBER_KICKED, member.nickname);

            this.manager_.announceToGang(
                gang, null, Message.GANG_INTERNAL_ANNOUNCE_KICKED, player.name,
                member.nickname);

            this.announce_().announceToAdministrators(
                Message.GANG_ANNOUNCE_KICKED, player.name, player.id, member.nickname,
                gang.name);

            if (member.player && member.player.isConnected())
                member.player.sendMessage(Message.GANG_KICKED, player.name, gang.name);

            await alert(player, {
                title: 'The member has been kicked!',
                message: formattedMessage
            });
        });

        await optionMenu.displayForPlayer(player);
    }

    // Called when the player uses the `/gang transactions` command, which shows them an overview of
    // the most recent transactions to their gang bank.
    async onGangTransactionsCommand(player) {
        const gang = this.manager_.gangForPlayer(player);
        if (!gang) {
            player.sendMessage(Message.GBANK_NOT_IN_GANG);
            return;
        }

        // Fetch the financial transactions from the database. Each is attributed with information.
        const transactions = await this.manager_.database.getTransactionLog(gang.id, {
            limit: this.settings_().getValue('gangs/account_transaction_count')
        });

        if (!transactions) {
            return alert(player, {
                title: 'Financial transactions',
                message: 'No transactions could be found on this account.',
            });
        }

        // Display a dialog with all the relevant information about the transaction(s).
        const dialog = new Menu('Financial transactions', [
            'Date',
            'Nickname',
            'Amount',
            'Reason',

        ], { pageSize: this.settings_().getValue('gangs/account_transaction_page_count') });

        for (const transaction of transactions) {
            const date = formatDate(transaction.date, /* includeTime= */ false);
            const username = transaction.username ?? 'LVP';
            const amount = transaction.amount > 0
                ? format('{43A047}%$', transaction.amount)
                : format('{F4511E}-%$', Math.abs(transaction.amount));
            
            dialog.addItem(date, username, amount, transaction.reason);
        }

        await dialog.displayForPlayer(player);
    }

    // Called when the player uses the `/gang` command without parameters. It will show information
    // on the available sub commands, as well as the feature itself.
    onGangCommand(player) {
        player.sendMessage(Message.GANGS_HEADER);
        player.sendMessage(Message.GANG_INFO_1);
        player.sendMessage(Message.GANG_INFO_2);
        player.sendMessage(
            Message.COMMAND_USAGE,
            '/gang [create/invite/join/kick/leave/members/settings/transactions]');

        player.sendMessage(Message.COMMAND_USAGE, '/gbank, /gwithdraw and /gbalance');
    }

    // Called when the player uses the `/gangs [player]` command. It will display information about
    // the gang the given player is part of when issued by an administrator.
    onGangsInfoCommand(player, subject) {
        const gang = this.manager_.gangForPlayer(subject);
        if (gang) {
            const roleString = GangDatabase.toRoleString(gang.getPlayerRole(subject));
            player.sendMessage(
                Message.GANGS_INFO_PLAYER, subject.name, subject.id, roleString, gang.name);
        } else {
            player.sendMessage(Message.GANGS_INFO_PLAYER_NONE, subject.name, subject.id);
        }
    }

    // Called when the player uses the `/gangs` command. It will, by default, list the gangs that
    // are currently represented on Las Venturas Playground.
    onGangsCommand(player) {
        let gangs = this.manager_.gangs;

        // Sort the |gangs| by number of in-game players in descending order, then by the name of
        // the gang, which is the order they will be presented in.
        gangs.sort((lhs, rhs) => {
            if (lhs.memberCount < rhs.memberCount)
                return 1;
            if (lhs.memberCount > rhs.memberCount)
                return -1;

            return lhs.name.localeCompare(rhs.name);
        });

        player.sendMessage(Message.GANGS_HEADER);

        // Display a line for each of the entries in |gangs|, that has now been sorted.
        gangs.forEach(gang => {
            const color = gang.color ? gang.color.toHexRGB() : 'B1FC17';
            const tag = gang.tag;
            const name = gang.name;
            const memberCount = gang.memberCount;
            const memberSuffix = gang.memberCount == 1 ? '' : 's';

            player.sendMessage(Message.GANGS_ONLINE, color, tag, name, memberCount, memberSuffix);
        });

        if (!gangs.length)
            player.sendMessage(Message.GANGS_NONE_ONLINE);
    }

    // /gbalance
    //
    // Displays the current balance of the gang's joint bank account. Transaction logs can be seen
    // by using the "/gang settings" command, which has an option available for that.
    async onGangBalanceCommand(player) {
        const gang = this.manager_.gangForPlayer(player);
        if (!gang) {
            player.sendMessage(Message.GBANK_NOT_IN_GANG);
            return;
        }

        const balance = await this.manager_.finance.getAccountBalance(gang.id);

        player.sendMessage(
            Message.GBANK_BALANCE, gang.name, balance, GangFinance.kMaximumBankAmount);
    }

    // /gbank [[amount] | all]
    //
    // Deposits either the given amount, or all cash being carried, into the gang's bank account.
    // This is subject to the same checks, restrictions and syntax as the "/bank" command.
    async onGangBankCommand(player, amount) {
        const gang = this.manager_.gangForPlayer(player);
        if (!gang) {
            player.sendMessage(Message.GBANK_NOT_IN_GANG);
            return;
        }

        const cash = this.finance_().getPlayerCash(player);
        if (!amount)
            amount = cash;

        if (amount > cash) {
            player.sendMessage(Message.GBANK_NOT_ENOUGH_CASH, amount);
            return;
        }

        const balance = await this.manager_.finance.getAccountBalance(gang.id);
        const availableBalance = GangFinance.kMaximumBankAmount - balance;

        if (availableBalance < amount) {
            player.sendMessage(Message.GBANK_NO_AVAILABLE_BALANCE, GangFinance.kMaximumBankAmount);
            return;
        }

        // Actually deposit the |amount| in the gang's bank account, with attribution.
        await this.manager_.finance.depositToAccount(
            gang.id, player.account.userId, amount, 'Personal contribution');

        // Take the |amount| of money away from the player personally.
        this.finance_().takePlayerCash(player, amount);
        
        // Tell everyone in the gang who happens to be about about this mutation.
        this.manager_.announceToGang(
            gang, player, Message.GBANK_ANNOUNCE_DEPOSIT, player.name, player.id, amount);

        player.sendMessage(Message.GBANK_STORED, amount, gang.name, gang.balance);
    }

    // /gwithdraw [[amount] | all]
    //
    // Withdraws the given amount of money from the gang's bank account. The |player| must have
    // permission in order to be able to do this, as it's a dangerous functionality.
    async onGangWithdrawCommand(player, amount) {
        const gang = this.manager_.gangForPlayer(player);
        if (!gang) {
            player.sendMessage(Message.GBANK_NOT_IN_GANG);
            return;
        }

        const isLeader = gang.getPlayerRole(player) === Gang.ROLE_LEADER;
        const isManager = isLeader || gang.getPlayerRole(player) === Gang.ROLE_MANAGER;

        // Gang leaders have the ability to restrict who's able to withdraw money from the gang's
        // shared account. This is enforced by this piece of code.
        const allowed =
            (gang.balanceAccess === GangDatabase.kAccessEveryone) ||
            (gang.balanceAccess === GangDatabase.kAccessLeaderAndManagers && isManager) ||
            (gang.balanceAccess === GangDatabase.kAccessLeader && isLeader);

        if (!allowed) {
            player.sendMessage(Message.GBANK_NOT_ALLOWED);
            return;
        }

        const balance = await this.manager_.finance.getAccountBalance(gang.id);
        if (!amount)
            amount = balance;

        if (amount > balance) {
            player.sendMessage(Message.GBANK_NOT_ENOUGH_FUNDS, gang.name, amount);
            return;
        }

        // Actually give |player| the money they've withdrawn.
        if (!this.finance_().givePlayerCash(player, amount)) {
            player.sendMessage(
                Message.GBANK_NO_AVAILABLE_CASH, FinancialRegulator.kMaximumCashAmount);
            return;
        }

        // Take the money from the bank account as a personal withdraw, because all mutations will
        // be attributed and shown in the account's financial records.
        await this.manager_.finance.withdrawFromAccount(
            gang.id, player.account.userId, amount, 'Personal withdrawal');
        
        // Tell everyone in the gang who happens to be about about this mutation.
        this.manager_.announceToGang(
            gang, player, Message.GBANK_ANNOUNCE_WITHDRAWAL, player.name, player.id, amount);

        player.sendMessage(Message.GBANK_WITHDRAWN, amount, gang.name, gang.balance);
    }

    // Cleans up the state created by this class, i.e. unregisters the commands.
    dispose() {
        server.commandManager.removeCommand('gwithdraw');
        server.commandManager.removeCommand('gbank');
        server.commandManager.removeCommand('gbalance');
        server.commandManager.removeCommand('gang');
        server.commandManager.removeCommand('gangs');
    }
}

export default GangCommands;
