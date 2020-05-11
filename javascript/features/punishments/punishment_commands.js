// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { BanDatabase } from 'features/punishments/ban_database.js';
import CommandBuilder from 'components/command_manager/command_builder.js';
import Menu from 'components/menu/menu.js';
import Question from 'components/dialogs/question.js';

import alert from 'components/dialogs/alert.js';
import confirm from 'components/dialogs/confirm.js';
import { formatDate } from 'base/time.js';

// Contains a series of commands that may be used by in-game administrators to inspect and manage
// kicks and bans on the server. Note that a player's history can be seen with `/account` already.
export class PunishmentCommands {
    database_ = null;
    settings_ = null;

    constructor(database, announce, settings) {
        this.database_ = database;
        this.announce_ = announce;
        this.settings_ = settings;

        // /lastbans [limit=10]
        server.commandManager.buildCommand('lastbans')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([{ name: 'limit', type: CommandBuilder.NUMBER_PARAMETER, optional: true }])
            .build(PunishmentCommands.prototype.onLastBansCommand.bind(this));
    }

    // /lastbans
    //
    // Displays the most recent bans issued on the server to the administrator. Clicking on one of
    // the bans enables the in-game admin to revoke the ban, with a particular reason.
    async onLastBansCommand(player, limit = 10) {
        const lastBans = await this.database_.getRecentBans(limit);
        if (!lastBans || !lastBans.length) {
            return alert(player, {
                title: 'Punishment management',
                message: 'No recent bans could be found in the database.',
            });
        }

        const display = new Menu('Punishment management', [
            'Date',
            'Nickname',
            'Issued by',
            'Reason',

        ], { pageSize: this.settings_().getValue('account/record_page_count') });
        
        for (const entry of lastBans) {
            const date = formatDate(entry.date, /* includeTime= */ true);

            display.addItem(
                date, entry.nickname, entry.issuedBy, entry.reason,
                PunishmentCommands.prototype.removeRecentBan.bind(this, player, entry));
        }

        await display.displayForPlayer(player);
    }

    // Starts the flow enabling administrators to revoke a previously instated ban. They'll first be
    // asked if this is really what they want. If it is, they must give a non-empty reason. When
    // that passes as well, the ban will be lifted.
    async removeRecentBan(player, entry) {
        const confirmIntention = await confirm(player, {
            title: 'Punishment management',
            message: `Are you sure that you want to revoke the ban on ${entry.nickname}?`,
        });

        if (!confirmIntention)
            return;  // they must have misclicked on an entry
        
        // Minimum length the unban reason has to be, in characters.
        const kMinimumReasonLength = 5;

        // Ask the |player| what the reason for removing the ban is.
        const reason = await Question.ask(player, {
            question: 'Punishment management',
            message: `For what reason are you lifting the ban on ${entry.nickname}?`,
            constraints: {
                validation: (reason) => reason.length >= kMinimumReasonLength,
                explanation: 'The reason for the unban must be at least five characters long.',
                abort: 'Sorry, you need to pick a valid reason!'
            }
        });

        if (!reason)
            return;  // the user aborted out of the flow

        await Promise.all([
            this.database_.unban(entry.id),
            this.database_.addEntry({
                type: BanDatabase.kTypeUnban,
                sourceUserId: player.account.userId,
                sourceNickname: player.name,
                subjectNickname: entry.nickname,
                note: reason
            })
        ]);

        this.announce_().announceToAdministrators(
            Message.PUNISHMENT_ADMIN_UNBAN, player.name, player.id, entry.nickname, reason);

        return alert(player, {
            title: 'Punishment management',
            message: `The ban on ${entry.nickname} has been lifted.`,
        });
    }

    dispose() {
        server.commandManager.removeCommand('lastbans');
    }
}
