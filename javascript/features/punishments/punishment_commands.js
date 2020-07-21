// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { BanDatabase } from 'features/punishments/ban_database.js';
import { CommandBuilder } from 'components/command_manager/command_builder.js';
import { DetectorResults } from 'features/sampcac/detector_results.js';
import { Menu } from 'components/menu/menu.js';
import { Question } from 'components/dialogs/question.js';

import { alert } from 'components/dialogs/alert.js';
import { confirm } from 'components/dialogs/confirm.js';
import { formatDate } from 'base/time.js';

// Contains a series of commands that may be used by in-game administrators to inspect and manage
// kicks and bans on the server. Note that a player's history can be seen with `/account` already.
export class PunishmentCommands {
    announce_ = null;
    database_ = null;
    playground_ = null;
    sampcac_ = null;
    settings_ = null;

    constructor(database, announce, playground, sampcac, settings) {
        this.database_ = database;
        this.announce_ = announce;
        this.sampcac_ = sampcac;
        this.settings_ = settings;

        this.playground_ = playground;
        this.playground_.addReloadObserver(this, () => this.registerTrackedCommands());

        this.registerTrackedCommands();

        // /lastbans [limit=10]
        server.commandManager.buildCommand('lastbans')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([{ name: 'limit', type: CommandBuilder.NUMBER_PARAMETER, defaultValue: 10 }])
            .build(PunishmentCommands.prototype.onLastBansCommand.bind(this));

        // /scan [player]
        server.commandManager.buildCommand('scan')
            .restrict(player => this.playground_().canAccessCommand(player, 'scan'))
            .parameters([{ name: 'player', type: CommandBuilder.PLAYER_PARAMETER }])
            .build(PunishmentCommands.prototype.onScanCommand.bind(this));
    }

    // Registers the commands that have to be known by the Playground feature for access tracking.
    registerTrackedCommands() {
        this.playground_().registerCommand('scan', Player.LEVEL_MANAGEMENT);
    }

    // ---------------------------------------------------------------------------------------------

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

    // Initializes a SAMPCAC scan on the given |target|, and displays a dialog to the |player| when
    // the scan has been completed. This could take several seconds.
    async onScanCommand(player, target) {
        if (target.isNonPlayerCharacter()) {
            player.sendMessage(Message.PUNISHMENT_SCAN_ERROR_NPC);
            return;
        }

        player.sendMessage(Message.PUNISHMENT_SCAN_STARTING, target.name, target.id);

        const results = await this.sampcac_().detect(target);
        const dialog = new Menu('Scan results', [ 'Detector', 'Result' ]);

        // (1) Add all the meta-data fields to the |dialog|.
        dialog.addItem('SA-MP Version', results.version);
        dialog.addItem('SAMPCAC Version', results.sampcacVersion || '{9E9E9E}none');
        dialog.addItem('SAMPCAC HwID', results.sampcacHardwareId || '{9E9E9E}none');
        dialog.addItem('Minimized', results.minimized ? '{FF5722}yes' : '{4CAF50}no');

        // (2) Add each of the detectors to the |dialog|, if any have been loaded. They have to be
        // sorted prior to being added, as they've been stored in arbitrary order.
        if (results.detectors.size > 0) {
            dialog.addItem('----------', '----------');

            const detectors = [ ...results.detectors ].sort((lhs, rhs) => {
                return lhs[0].localeCompare(rhs[0]);
            });

            for (const [ name, result ] of detectors) {
                let resultLabel = '{BDBDBD}undeterminable';

                switch (result) {
                    case DetectorResults.kResultUnavailable:
                        resultLabel = '{9E9E9E}unavailable';
                        break;

                    case DetectorResults.kResultClean:
                        resultLabel = '{4CAF50}not detected';
                        break;

                    case DetectorResults.kResultDetected:
                        resultLabel = '{FF5722}detected';
                        break;
                }

                dialog.addItem(name, resultLabel);
            }
        }

        // (3) Display the |dialog| to the |player|, and call it a day.
        await dialog.displayForPlayer(player);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.commandManager.removeCommand('lastbans');
        server.commandManager.removeCommand('scan');

        this.playground_().unregisterCommand('scan');

        this.playground_.removeReloadObserver(this);
        this.playground_ = null;
    }
}
