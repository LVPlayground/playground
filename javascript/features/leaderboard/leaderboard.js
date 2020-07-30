// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/command_manager/command_builder.js';
import { Feature } from 'components/feature_manager/feature.js';
import { LeaderboardDatabase } from 'features/leaderboard/leaderboard_database.js';
import { Menu } from 'components/menu/menu.js';
import { MockLeaderboardDatabase } from 'features/leaderboard/mock_leaderboard_database.js';

import { format } from 'base/format.js';

// The leaderboard feature uses detailed, session-associated statistics to display dynamic and
// running metrics of the individuals and gangs that are most active on Las Venturas Playground. The
// leaderboards are most interesting to fighting players, but we'll cater for the freeroamers too.
export default class Leaderboard extends Feature {
    database_ = null;
    settings_ = null;

    constructor() {
        super();

        // Uses the `Player.stats` supplement to amend leaderboard data with live metrics.
        this.defineDependency('player_stats');

        // Uses settings to configure display of the leaderboard.
        this.settings_ = this.defineDependency('settings');

        // Provides the ability to fetch leadership information from the database.
        this.database_ = server.isTest() ? new MockLeaderboardDatabase()
                                         : new LeaderboardDatabase();

        // The `/top` command, which shows the server's current leaderboard.
        server.deprecatedCommandManager.buildCommand('top')
            .parameters([{ name: 'view', type: CommandBuilder.WORD_PARAMETER, optional: true }])
            .build(Leaderboard.prototype.onLeaderboardCommand.bind(this));
    }

    // ---------------------------------------------------------------------------------------------
    // Internal functionality
    // ---------------------------------------------------------------------------------------------

    // Implementation of the `/top` command. Shows a dialog to the |player| with the current
    // leaderboard of Las Venturas Playground. Subject to configurability.
    async onLeaderboardCommand(player, maybeView) {
        const view = maybeView ?? this.settings_().getValue('playground/leaderboard_default_view');
        const settings = {
            days: this.settings_().getValue('playground/leaderboard_limit_days'),
            limit: this.settings_().getValue('playground/leaderboard_limit_entries'),
        };

        let data = null;

        switch (view) {
            case 'accuracy':
                data = await this.getAccuracyLeaderboardData(settings);
                break;

            case 'damage':
                data = await this.getDamageLeaderboardData(settings);
                break;

            case 'gangs':
                data = await this.getGangsLeaderboardData(settings);
                break;

            case 'kills':
                data = await this.getKillsLeaderboardData(settings);
                break;

            default:
                return this.displayLeaderboardDialog(player);
        }

        // Display the |data| in a simple menu. All display is standardized.
        const dialog = new Menu(data.title, data.headers, {
            pageSize: this.settings_().getValue('playground/leaderboard_page_count'),
        });

        for (const entry of data.leaderboard)
            dialog.addItem(...entry);

        await dialog.displayForPlayer(player);
    }

    // Gets the `data` for displaying the accuracy-based leaderboard. Processes the raw database
    // data into something that's somewhat nice to look at.
    async getAccuracyLeaderboardData(settings) {
        const leaderboard = await this.database_.getAccuracyLeaderboard(settings);
        const headers = [ 'Player', 'Accuracy (hit / missed)', 'Strike ratio', 'Hits / hour' ];

        return {
            title: 'Accuracy Statistics',
            headers,
            leaderboard: leaderboard.map((result, index) => {
                let player, accuracy, strike, online;

                // (1) Rank and player identifier
                player = (index + 1) + '. ';

                if (result.color)
                    player += `{${result.color.toHexRGB()}}${result.nickname}`;
                else
                    player += result.nickname;

                // (2) Actual accuracy, with the individual shot numbers.
                accuracy = format('%.2f%%{BDBDBD} (%s / %s)',
                    result.accuracy * 100,
                    this.toFormattedQuantityUnit(result.shotsHit),
                    this.toFormattedQuantityUnit(result.shotsMissed));

                // (3) Strike/hit ratio of the player.
                strike = format('%.2f',
                    result.shotsTaken > 0 ? result.shotsHit / result.shotsTaken
                                          : result.shotsHit);

                // (4) Amount of shots hit per hour of playing time.
                online = this.toFormattedQuantityUnit(
                    result.shotsHit / (result.duration / 3600)) + '{9E9E9E} / hour';

                return [ player, accuracy, strike, online ];
            }),
        };
    }

    // Gets the `data` for displaying the damage leaderboard from the database, transforming the
    // display-specific information in a uniform structure for display.
    async getDamageLeaderboardData(settings) {
        const leaderboard = await this.database_.getDamageLeaderboard(settings);
        const headers = [ 'Player', 'Damage given / taken', 'Damage / hour', 'Damage / shot' ];

        return {
            title: 'Damage Statistics',
            headers,
            leaderboard: leaderboard.map((result, index) => {
                let player, stats, online, shots;

                // (1) Rank and player identifier
                player = (index + 1) + '. ';

                if (result.color)
                    player += `{${result.color.toHexRGB()}}${result.nickname}`;
                else
                    player += result.nickname;

                // (2) Amount of damage given & taken. Put emphasis on damage given.
                stats  = this.toFormattedQuantityUnit(result.damageGiven);
                stats += '{BDBDBD} / ' + this.toFormattedQuantityUnit(result.damageTaken);

                // (3) Amount of damage inflicted per hour of online time.
                online = this.toFormattedQuantityUnit(
                    result.damageGiven / (result.duration / 3600)) + '{9E9E9E} / hour';

                // (4) Amount of damage inflicted per shot.
                shots = this.toFormattedQuantityUnit(
                    result.damageGiven / result.shots) + '{9E9E9E} / shot';

                return [ player, stats, online, shots ];
            }),
        };
    }

    // Composes and returns the leaderboard data for the Gangs display, which focuses on gangs
    // rather than individual players. Combines a different subset of statistics.
    async getGangsLeaderboardData(settings) {
        const leaderboard = await this.database_.getGangsLeaderboard(settings);
        const headers = [ 'Gang', 'Kills', 'Damage', 'Accuracy' ];

        return {
            title: 'Gang Statistics',
            headers,
            leaderboard: leaderboard.map((result, index) => {
                let gang, kills, damage, accuracy;

                // (1) Rank and player identifier
                gang = (index + 1) + '. ';

                if (result.color)
                    gang += `{${result.color.toHexRGB()}}${result.name}`;
                else
                    gang += result.name;

                if (result.members > 1)
                    gang += `{9E9E9E} (x${result.members})`;

                // (2) Kills, deaths and ratio
                kills = format('%d{BDBDBD} / %d (%.2f)',
                    result.killCount, result.deathCount, result.ratio);

                // (3) Damage statistics & ratio
                damage = format('%s{BDBDBD} / %s (%.2f)',
                    this.toFormattedQuantityUnit(result.damageGiven),
                    this.toFormattedQuantityUnit(result.damageTaken), result.damageRatio);

                // (4) Shot statistics & accuracy
                accuracy = format('%.2f%%{BDBDBD} (%s shots)',
                    result.accuracy * 100, this.toFormattedQuantityUnit(result.shots));

                return [ gang, kills, damage, accuracy ];
            }),
        };
    }

    // Gets the `data` for displaying the kills leaderboard from the database, making sure that all
    // the data that should be shown is appropriate for display.
    async getKillsLeaderboardData(settings) {
        const leaderboard = await this.database_.getKillsLeaderboard(settings);
        const headers = [ 'Player', 'Kills / deaths', 'Kills / hour', 'Shots / kill' ];

        return {
            title: 'Kill Statistics',
            headers,
            leaderboard: leaderboard.map((result, index) => {
                let player, stats, online, shots;

                // (1) Rank and player identifier
                player = (index + 1) + '. ';

                if (result.color)
                    player += `{${result.color.toHexRGB()}}${result.nickname}`;
                else
                    player += result.nickname;

                // (2) Amount of kills and death, including their k/d ratio.
                stats = format('%d{BDBDBD} / %d (%.2f)',
                    result.killCount, result.deathCount, result.ratio);

                // (3) Amount of players murdered per hour of in-game time.
                online = format('%d{9E9E9E} / hour', result.killCount / (result.duration / 3600));

                // (4) Number of shots fired for each of their kills.
                shots = this.toFormattedQuantityUnit(
                    result.shots / result.killCount) + '{9E9E9E} / kill';

                return [ player, stats, online, shots ];
            }),
        };
    }

    // ---------------------------------------------------------------------------------------------

    // Displays the leaderboard dialog, which shows an overview of all the available lists, together
    // with the player who currently tops that ranking.
    async displayLeaderboardDialog(player) {
        const settings = {
            days: this.settings_().getValue('playground/leaderboard_limit_days'),

            // Only the #1 will be displayed, but it's possible for the database rankings to be
            // amended based on in-game statistics. Allow for that to happen.
            limit: 5,
        };

        // Collect results for all the leaderboards in parallel. This will take ~.25-.3 seconds,
        // but because our MySQL usage is asynchronous, we can afford to wait that period of time.
        const results = await Promise.all([
            this.database_.getAccuracyLeaderboard(settings),
            this.database_.getDamageLeaderboard(settings),
            this.database_.getGangsLeaderboard(settings),
            this.database_.getKillsLeaderboard(settings),
        ]);

        const dialog = new Menu('Las Venturas Playground', [
            'Leaderboard',
            'Leader',
        ]);

        // (1) Accuracy leaderboard
        {
            const label = 'Accuracy{9E9E9E} (/top accuracy)';
            const listener =
                Leaderboard.prototype.onLeaderboardCommand.bind(this, player, 'accuracy');

            let leader = '-';
            if (results[0].length) {
                const topResult = results[0][0];

                if (topResult.color)
                    leader = `{${topResult.color.toHexRGB()}}${topResult.nickname}`;
                else
                    leader = topResult.nickname;

                leader += format('{9E9E9E} (%.2f%%)', topResult.accuracy * 100);
            }

            dialog.addItem(label, leader, listener);
        }

        // (2) Damage leaderboard
        {
            const label = 'Damage{9E9E9E} (/top damage)';
            const listener =
                Leaderboard.prototype.onLeaderboardCommand.bind(this, player, 'damage');

            let leader = '-';
            if (results[1].length) {
                const topResult = results[1][0];

                if (topResult.color)
                    leader = `{${topResult.color.toHexRGB()}}${topResult.nickname}`;
                else
                    leader = topResult.nickname;

                leader += format('{9E9E9E} (%s damage)',
                    this.toFormattedQuantityUnit(topResult.damageGiven));
            }

            dialog.addItem(label, leader, listener);
        }

        // (3) Gangs leaderboard
        {
            const label = 'Gangs{9E9E9E} (/top gangs)';
            const listener = Leaderboard.prototype.onLeaderboardCommand.bind(this, player, 'gangs');

            let leader = '-';
            if (results[2].length) {
                const topResult = results[2][0];

                if (topResult.color)
                    leader = `{${topResult.color.toHexRGB()}}${topResult.name}`;
                else
                    leader = topResult.name;

                leader += format('{9E9E9E} (%d kills)', topResult.killCount);
            }

            dialog.addItem(label, leader, listener);
        }

        // (4) Kills leaderboard
        {
            const label = 'Kills{9E9E9E} (/top kills)';
            const listener = Leaderboard.prototype.onLeaderboardCommand.bind(this, player, 'kills');

            let leader = '-';
            if (results[3].length) {
                const topResult = results[3][0];

                if (topResult.color)
                    leader = `{${topResult.color.toHexRGB()}}${topResult.nickname}`;
                else
                    leader = topResult.nickname;

                leader += format('{9E9E9E} (%d kills)', topResult.killCount);
            }

            dialog.addItem(label, leader, listener);
        }

        await dialog.displayForPlayer(player);
    }

    // ---------------------------------------------------------------------------------------------

    // Formats the |value| to a particular quantity unit ready for display. For example, this method
    // will return "1.24M", "314k" and/or "571".
    toFormattedQuantityUnit(value) {
        if (value >= 1000000)
            return format('%.2fM', value / 1000000);
        else if (value >= 1000)
            return format('%.2fk', value / 1000);
        else
            return format('%.2f', value);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.deprecatedCommandManager.removeCommand('top');

        this.settings_ = null;
        this.database_ = null;
    }
}
