// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const CommandBuilder = require('components/command_manager/command_builder.js');
const Dialog = require('components/dialogs/dialog.js');
const Gang = require('features/gangs/gang.js');
const Menu = require('components/menu/menu.js');
const QuestionSequence = require('components/dialogs/question_sequence.js');

// Implements the commands available as part of the persistent gang feature. The primary ones are
// /gang and /gangs, each of which has a number of sub-options available to them.
class GangCommands {
    constructor(manager) {
        this.manager_ = manager;

        // Map of players to the gangs they have been invited by.
        this.invitations_ = new WeakMap();

        // /pgang [create]
        server.commandManager.buildCommand('pgang')
            .restrict(Player.LEVEL_ADMINISTRATOR)
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
            .build(GangCommands.prototype.onGangCommand.bind(this));

        // /pgangs [top]
        server.commandManager.buildCommand('pgangs')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .build(GangCommands.prototype.onGangsCommand.bind(this));

        // Promises that can be used for testing purposes.
        this.createdPromiseForTesting_ = null;
        this.joinPromiseForTesting_ = null;
        this.kickPromiseForTesting_ = null;
        this.leavePromiseForTesting_ = null;
        this.membersPromiseForTesting_ = null;
        this.settingsPromiseForTesting_ = null;
    }

    // Called when the player uses the `/gang create` command to create a new gang. If the player is
    // eligible, it will start a wizard of dialog boxes requesting the necessary information from
    // the player. All values must be unique among other gangs in the database.
    onGangCreateCommand(player) {
        let resolveForTests = null;

        if (!player.isRegistered()) {
            player.sendMessage(Message.GANGS_NOT_REGISTERED);
            return;
        }

        if (this.manager_.gangForPlayer(player) !== null) {
            player.sendMessage(Message.GANGS_ALREADY_SET);
            return;
        }

        // Create a "gang has been created" promise that tests can use to observe progress.
        this.createdPromiseForTesting_ = new Promise(resolve => resolveForTests = resolve);

        // Options for asking the player what the gang's full name should be.
        const nameQuestion = {
            question: 'Choose your gang\'s name',
            message: 'What is the full name your gang will be known as?',
            constraints: {
                min: 4, max: 32,
                explanation: 'The name of your gang must be between 4 and 32 characters long.',
                abort: 'Sorry, you cannot create a gang without a valid name!'
            }
        };

        // Options for asking the player what the gang's tag should be.
        const tagQuestion = {
            question: 'Choose your gang\'s tag',
            message: 'What should we use as the gang\'s tag (without brackets)?',
            constraints: {
                min: 1, max: 5,
                explanation: 'The tag of your gang must be between 1 and 5 characters long, and ' +
                             'does not have to contain brackets.',
                abort: 'Sorry, you cannot create a gang without a valid tag!'
            }
        };

        // Options for asking the player what the gang's goal should be.
        const goalQuestion = {
            question: 'Choose your gang\'s goal',
            message: 'In one sentence, what is the purpose of your gang?',
            constraints: {
                min: 4, max: 128,
                explanation: 'The goal of your gang must be between 4 and 128 characters long, ' +
                             'just a brief sentence.',
                abort: 'Sorry, you cannot create a gang without a goal!'
            }
        };

        // Ask the questions to the player, and only proceed if they answered everything.
        QuestionSequence.ask(player, [ nameQuestion, tagQuestion, goalQuestion ]).then(answers => {
            if (!answers)
                return;  // they clicked `cancel` or got a dialog with an explanation

            const [ name, tag, goal ] = answers;

            this.manager_.createGangForPlayer(player, tag, name, goal).then(result => {
                if (!result)
                    return;  // the player disconnected from the server

                // TODO(Russell): Announce the gang's creation to administrators.

                player.sendMessage(Message.GANG_DID_CREATE, result.name);

            }, error => {
                return Dialog.displayMessage(
                    player, 'Unable to create your gang', error.message, 'Close', '');

            }).then(() => resolveForTests())
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

        // The invitee must be registered with Las Venturas Playground.
        if (!invitee.isRegistered()) {
            player.sendMessage(Message.GANG_INVITE_NOT_REGISTERED, invitee.name);
            return;
        }

        this.invitations_.set(invitee, gang);

        // TODO(Russell): Announce the invitation to administrators?
        // TODO(Russell): Announce the invitation to other gang members.

        player.sendMessage(Message.GANG_DID_INVITE, invitee.name, invitee.id);
        invitee.sendMessage(Message.GANG_INVITED, player.name, player.id, gang.name);
    }

    // Called when the player uses the `/gang join` command to accept an earlier invitation. They
    // must not be part of a gang when using this command.
    onGangJoinCommand(player) {
        let resolveForTests = null;

        if (!this.invitations_.has(player)) {
            player.sendMessage(Message.GANG_JOIN_NO_INVITATION);
            return;
        }

        const currentGang = this.manager_.gangForPlayer(player);
        const gang = this.invitations_.get(player);

        if (currentGang !== null) {
            player.sendMessage(Message.GANG_JOIN_IN_GANG, currentGang.name);
            return;
        }

        // Create a "gang has been created" promise that tests can use to observe progress.
        this.joinPromiseForTesting_ = new Promise(resolve => resolveForTests = resolve);

        // Add the player to the gang they have been invited to.
        this.manager_.addPlayerToGang(player, gang).then(gang => {
            if (!gang)
                return;  // the player has since disconnected from the server

            player.sendMessage(Message.GANG_DID_JOIN, gang.name);

            // TODO(Russell): Announce the join to administrators?
            // TODO(Russell): Announce the join to other gang members.

            this.invitations_.delete(player);

        }).then(() => resolveForTests());
    }

    // Called when the player uses the `/gang kick [member]` command. It enables gang leaders and
    // managers to remove other members from the gang. The kicked player does not have to be on the
    // server- otherwise people who are in trouble could just not show up for a while.
    onGangKickCommand(player, member) {
        let resolveForTests = null;

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

        // TODO(Russell): Allow |member| to be a player Id as well as a name?
        const lowerCaseMember = member.toLowerCase();

        // Create a "player has been kicked" promise that tests can use to observe progress.
        this.kickPromiseForTesting_ = new Promise(resolve => resolveForTests = resolve);

        // Get a list of all members in the gang, whether they're in-game or not.
        this.manager_.getFullMemberList(gang, false /* groupByRole */).then(members => {
            let matchingMembers = [];

            for (let member of members) {
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

            const promise =
                memberToKick.player ? this.manager_.removePlayerFromGang(memberToKick.player, gang)
                                    : this.manager_.removeMemberFromGang(memberToKick.userId);

            return promise.then(() => {
                player.sendMessage(Message.GANG_KICK_REMOVED, memberToKick.nickname, gang.name);

                // TODO(Russell): Announce the change to the administrators.
                // TODO(Russell): Announce the change to the online gang members.
            });

        }).then(() => resolveForTests());
    }

    // Called when the player uses the `/gang leave` command. It will show a confirmation dialog
    // informing them of the consequences of leaving the gang. This differs for Leaders and regular
    // members of a gang, because gangs cannot be left without a leader.
    onGangLeaveCommand(player) {
        let resolveForTests = null;

        const gang = this.manager_.gangForPlayer(player);
        if (!gang) {
            player.sendMessage(Message.GANG_NOT_IN_GANG);
            return;
        }

        // Create a "player has left" promise that tests can use to observe progress.
        this.leavePromiseForTesting_ = new Promise(resolve => resolveForTests = resolve);

        const commonMsg = Message.format(Message.GANG_LEAVE_CONFIRMATION, gang.name);

        // Regular members and managers of a gang can leave without succession determination.
        if (gang.getPlayerRole(player) != Gang.ROLE_LEADER) {
            Dialog.displayMessage(player, 'Are you sure?', commonMsg, 'Yes', 'No').then(result => {
                if (!result.response)
                    return;  // the player changed their mind

                return this.manager_.removePlayerFromGang(player, gang).then(() => {
                    player.sendMessage(Message.GANG_DID_LEAVE, gang.name);

                    // TODO(Russell): Announce the player's departure to administrators.
                    // TODO(Russell): Announce the player's departure to other gang members.
                });

            }).then(() => resolveForTests());

            return;
        }

        // The |player| is a leader of the gang, confirm the succession, if any, with them.
        this.manager_.determineSuccessionAfterDeparture(player, gang).then(succession => {
            // If there is no known succession, there either are no other members of the gang or the
            // gang has multiple leaders, in which case succession is unnecessary.
            if (!succession) {
                return Promise.all([
                    null /* successionUserId */,
                    Dialog.displayMessage(player, 'Are you sure?', commonMsg, 'Yes', 'No')
                ]);
            }

            // The confirmation message includes the player who is about to be promoted to leader.
            const confirmationMsg = Message.format(Message.GANG_LEAVE_PROMO_CONFIRMATION, gang.name,
                                                   succession.username, succession.role);

            return Promise.all([
                succession.userId,
                Dialog.displayMessage(player, 'Are you sure?', confirmationMsg, 'Yes', 'No')
            ]);

        }).then(([successionUserId, result]) => {
            if (!result.response)
                return;  // the player changed their mind

            // Remove |player| from the |gang| and promote |successionUserId| to leader when set.
            let actions = [ this.manager_.removePlayerFromGang(player, gang) ];
            if (successionUserId) {
                actions.push(
                    this.manager_.updateRoleForUserId(successionUserId, gang, Gang.ROLE_LEADER));
            }

            return Promise.all(actions).then(() => {
                player.sendMessage(Message.GANG_DID_LEAVE, gang.name);

                // TODO(Russell): Announce the player's departure to administrators.
                // TODO(Russell): Announce the player's departure to other gang members.
            });

        }).then(() => resolveForTests());
    }

    // Called when the player uses the `/gang members` command. All members of their gang, whether
    // they are logged in or not, will be displayed to them.
    onGangMembersCommand(player) {
        let resolveForTests = null;

        const gang = this.manager_.gangForPlayer(player);
        if (!gang) {
            player.sendMessage(Message.GANG_NOT_IN_GANG);
            return;
        }

        // Create a "gang has been created" promise that tests can use to observe progress.
        this.membersPromiseForTesting_ = new Promise(resolve => resolveForTests = resolve);

        // Retrieve the full memberlist of this gang, not those who are currently in-game.
        this.manager_.getFullMemberList(gang, true /* groupByRole */).then(members => {
            player.sendMessage(Message.GANG_MEMBERS_HEADER, gang.tag, gang.name);

            // Formats messages for a particular group of members and sends them to the player when
            // there is at least a single player in the group.
            function formatAndSendGroup(label, members) {
                if (!members.length)
                    return;

                const membersPerRow = 8;
                for (let i = 0; i < members.length; i += membersPerRow) {
                    const membersRow = members.slice(i, membersPerRow);

                    let message = '';
                    if (i == 0 /* first row */)
                        message += '{B1FC17}' + label + '{FFFFFF}: ';

                    // Format and append each member. Online members will visually stand out.
                    membersRow.forEach(member => {
                        const { nickname, player } = member;

                        if (player)
                            message += '{B1FC17}' + nickname + '{FFFFFF} (Id: ' + player.id + '), ';
                        else
                            message += nickname + ', ';
                    });

                    // Finally, send the message to the player.
                    player.sendMessage(message.substr(0, message.length - 2));
                }
            }

            formatAndSendGroup('Leaders', members.leaders);
            formatAndSendGroup('Managers', members.managers);
            formatAndSendGroup('Members', members.members);

        }).then(() => resolveForTests());
    }

    // Called when a player types the `/gang settings` command. This command is only available for
    // gang leaders, and allows them to change their gang's settings.
    onGangSettingsCommand(player) {
        let resolveForTests = null;

        const gang = this.manager_.gangForPlayer(player);
        if (!gang) {
            player.sendMessage(Message.GANG_NOT_IN_GANG);
            return;
        }

        if (gang.getPlayerRole(player) !== Gang.ROLE_LEADER) {
            player.sendMessage(Message.GANG_SETTINGS_NO_LEADER);
            return;
        }

        // Create a "gang has been created" promise that tests can use to observe progress.
        this.settingsPromiseForTesting_ = new Promise(resolve => resolveForTests = resolve);

        let menu = new Menu('Which setting do you want to change?', ['Option', 'Current value']);
        menu.addItem('The name', gang.name, () => {

        });

        menu.addItem('The tag', gang.tag, () => {

        });

        menu.addItem('The goal', gang.goal, () => {

        });

        // TODO(Russell): Add an option to change the gang's color. The color picker probably needs
        // to be displayed by the gamemode, where that logic currently lives.

        menu.displayForPlayer(player);

        // TODO(Russell): Move this to the individual handling functions of the menu.
        resolveForTests();
    }

    // Called when the player uses the `/gang` command without parameters. It will show information
    // on the available sub commands, as well as the feature itself.
    onGangCommand(player) {
        player.sendMessage(Message.GANGS_HEADER);
        player.sendMessage(Message.GANG_INFO_1);
        player.sendMessage(Message.GANG_INFO_2);
        player.sendMessage(
            Message.COMMAND_USAGE, '/gang [create/invite/join/kick/leave/members/settings]');
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

        player.sendMessage(Message.GANGS_BEST_ADV);
    }

    // Cleans up the state created by this class, i.e. unregisters the commands.
    dispose() {
        server.commandManager.removeCommand('pgangs');
    }
}

exports = GangCommands;
