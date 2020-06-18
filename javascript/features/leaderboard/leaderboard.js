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
        server.commandManager.buildCommand('top')
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

            default:
                return this.displayLeaderboardDialog(player, settings);
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
            title: 'Damage Statistics',
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

    // Displays the leaderboard dialog, which shows an overview of all the available lists, together
    // with the player who currently tops that ranking.
    async displayLeaderboardDialog(player, settings) {

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
        server.commandManager.removeCommand('top');

        this.settings_ = null;
        this.database_ = null;
    }
}
