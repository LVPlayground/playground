// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { BanDatabase } from 'features/punishments/ban_database.js';
import { CommandBuilder } from 'components/commands/command_builder.js';
import { DetectorResults } from 'features/sampcac/detector_results.js';
import { Menu } from 'components/menu/menu.js';
import { Question } from 'components/dialogs/question.js';

import { alert } from 'components/dialogs/alert.js';
import { confirm } from 'components/dialogs/confirm.js';
import { format } from 'base/format.js';
import { formatDate } from 'base/time.js';

// Contains a series of commands that may be used by in-game administrators to inspect and manage
// kicks and bans on the server. Note that a player's history can be seen with `/account` already.
export class PunishmentCommands {
    announce_ = null;
    database_ = null;
    sampcac_ = null;
    settings_ = null;

    constructor(database, announce, sampcac, settings) {
        this.database_ = database;
        this.announce_ = announce;
        this.sampcac_ = sampcac;
        this.settings_ = settings;

        // /lastbans [limit=10]
        server.commandManager.buildCommand('lastbans')
            .description('Display the most recently issued bans on the server.')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([{ name: 'limit', type: CommandBuilder.kTypeNumber, defaultValue: 10 }])
            .build(PunishmentCommands.prototype.onLastBansCommand.bind(this));

        // /scan [player]
        server.commandManager.buildCommand('scan')
            .description('Scan a particular player for possible cheating.')
            .restrict(Player.LEVEL_ADMINISTRATOR, /* restrictTemporary= */ true)
            .sub('reload')
                .description('Reload the scan detection configuration.')
                .restrict(Player.LEVEL_MANAGEMENT)
                .build(PunishmentCommands.prototype.onScanReloadCommand.bind(this))
            .parameters([{ name: 'player', type: CommandBuilder.kTypePlayer }])
            .build(PunishmentCommands.prototype.onScanCommand.bind(this));

        // /scanall
        server.commandManager.buildCommand('scanall')
            .description('Scans all players on the server for possible cheating.')
            .restrict(Player.LEVEL_MANAGEMENT)
            .build(PunishmentCommands.prototype.onScanAllCommand.bind(this));
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
        dialog.addItem('Uptime', this.formatUptime(results.uptime));

        // (2) Add each of the detectors to the |dialog|, if any have been loaded. They have to be
        // sorted prior to being added, as they've been stored in arbitrary order.
        if (results.detectors.size > 0) {
            dialog.addItem('----------', '----------');

            let detectors = [ ...results.detectors ].sort((lhs, rhs) => {
                return lhs[0].localeCompare(rhs[0]);
            });

            // Unless the |player| is a Management member, we filter out out all detectors that came
            // back negative or undeterminable. They don't have to know what we can detect.
            if (!player.isManagement()) {
                detectors = detectors.filter(detector => {
                    return detector[1] === DetectorResults.kResultDetected;
                });
            }

            // (a) Add all the |detectors| to the output dialog.
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

            // (b) If there were no detectors at all, show that to them too. The message will differ
            // based on whether a scan was supported or not.
            if (!detectors.length) {
                if (results.supported)
                    dialog.addItem('{4CAF50}No cheats detected', '{9E9E9E}-');
                else
                    dialog.addItem('{FF5722}Unable to run the detectors', '{9E9E9E}-');
            }
        }

        // (3) Display the |dialog| to the |player|, and call it a day.
        await dialog.displayForPlayer(player);
    }

    // Scans all players on the server for possible cheating. Will show a dialog of all in-game
    // human players, their SA-MP version and whether anything was detected.
    async onScanAllCommand(player) {
        const resultPromises = [];

        // (1) Start scans for all human players connected to the server.
        for (const target of server.playerManager) {
            if (target.isNonPlayerCharacter())
                continue;

            resultPromises.push(this.sampcac_().detect(target));
        }

        player.sendMessage(Message.PUNISHMENT_SCAN_ALL_STARTING, resultPromises.length);

        // (2) Wait until all the scans have completed. They may not be complete.
        const results = await Promise.all(resultPromises);
        const dialog = new Menu('Scan results', [
            'Player',
            'Version',
            'Minimized',
            'Result'
        ], { pageSize: 50 /* just in the odd case that there's >50 people in-game... */ });

        for (const result of results) {
            const nickname = format(
                '{%s}%s', result.player.colors.currentColor.toHexRGB(), result.player.name);

            let version = null;

            // (a) Format the SA-MP version used. SAMPCAC users will be highlighted in green, where
            // users for whom detections are supported will be yellow. All others will be red.
            if (result.sampcacVersion)
                version = '{4CAF50}' + result.version;
            else if (result.supported)
                version = '{CDDC39}' + result.version;
            else
                version = '{FF5722}' + result.version;

            const minimized = !!result.minimized ? '{FF5722}yes' : '{4CAF50}no';
            const detections = [ ...result.detectors ].filter(detector => {
                return detector[1] === DetectorResults.kResultDetected;
            });

            let detectionResult = null;

            // (b) Format the detection result. There either are detections (red), no detections
            // (green), or an unknown result because scans are not supported (grey).
            if (detections.length > 1)
                detectionResult = `{FF5722}${detectionResult.length} detections`;
            else if (detections.length === 1)
                detectionResult = `{FF5722}1 detection`;
            else if (!result.supported)
                detectionResult = `{9E9E9E}unknown`;
            else
                detectionResult = `{4CAF50}no detections`;

            // (c) Add the data to the dialog. Selecting a particular player will act as if the
            // administrator executed the `/scan` command on them, for more details.
            dialog.addItem(nickname, version, minimized, detectionResult, () => {
                return this.onScanCommand(player, result.player);
            });
        }

        // (3) Display the results dialog to the current |player|.
        dialog.displayForPlayer(player);
    }

    // Called when someone wishes to reload the SAMPCAC definition file. Generally only needed when
    // changes have been made, but it's undesirable to reload the entire feature.
    onScanReloadCommand(player) {
        this.sampcac_().reload();

        // Tell adminstrators about the definition file being reloaded.
        this.announce_().announceToAdministrators(
            Message.PUNISHMENT_SCAN_RELOADED_ADMIN, player.name, player.id);

        player.sendMessage(Message.PUNISHMENT_SCAN_RELOADED);
    }

    // ---------------------------------------------------------------------------------------------

    // Utility function to format the uptime, which we'd like to follow a syntax slightly different
    // from most other times and dates, as granularity is more important here.
    formatUptime(uptime) {
        if (!uptime)
            return '{9E9E9E}none';

        const days = Math.floor(uptime / 86400);
        const hours = Math.floor(uptime / 3600) % 24;
        const minutes = Math.floor(uptime / 60) % 60;
        const seconds = Math.floor(uptime) % 60;

        if (days > 1)
            return format('%d days, %02d:%02d:%02d', days, hours, minutes, seconds);
        else if (days === 1)
            return format('1 day, %02d:%02d:%02d', hours, minutes, seconds);
        else
            return format('%02d:%02d:%02d', hours, minutes, seconds);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.commandManager.removeCommand('lastbans');
        server.commandManager.removeCommand('scan');
    }
}
