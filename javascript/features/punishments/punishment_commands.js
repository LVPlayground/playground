// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import CommandBuilder from 'components/command_manager/command_builder.js';
import Menu from 'components/menu/menu.js';

import alert from 'components/dialogs/alert.js';
import { formatDate } from 'base/time.js';

// Contains a series of commands that may be used by in-game administrators to inspect and manage
// kicks and bans on the server. Note that a player's history can be seen with `/account` already.
export class PunishmentCommands {
    database_ = null;
    settings_ = null;

    constructor(database, settings) {
        this.database_ = database;
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

            display.addItem(date, entry.nickname, entry.issuedBy, entry.reason);
        }

        await display.displayForPlayer(player);
    }

    dispose() {
        server.commandManager.removeCommand('lastbans');
    }
}
