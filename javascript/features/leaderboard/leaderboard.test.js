// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('Leaderboard', (it, beforeEach) => {
    let database = null;
    let gunther = null;
    let russell = null;

    beforeEach(() => {
        const feature = server.featureManager.loadFeature('leaderboard');

        database = feature.database_;
        gunther = server.playerManager.getById(/* Gunther= */ 0);
        russell = server.playerManager.getById(/* Russell= */ 1);
    })

    it('should be able to get all the session stats views for online players', async (assert) => {
        gunther.stats.session.killCount = 25;

        assert.equal(database.getOnlinePlayerStatistics().size, 0);

        await gunther.identify({ userId: 471 });

        const statistics = database.getOnlinePlayerStatistics();
        assert.equal(statistics.size, 1);
        assert.isTrue(statistics.has(471));
        assert.equal(statistics.get(471).killCount, 25);
    });

    it('should be able to display the accuracy leaderboard', async (assert) => {
        gunther.respondToDialog({ response: 0 /* Dismiss */ });

        // (1) Have [BA]AzKiller be online as Russell on their account, with session metrics.
        await russell.identify({ userId: 125 });

        russell.stats.session.onlineTime = 5 * 60 * 60;  // 5 hours
        russell.stats.session.shotsHit = 300;
        russell.stats.session.shotsMissed = 50;
        russell.stats.session.shotsTaken = 510;

        // (2) Have |gunther| see the accuracy leaderboard dialog.
        assert.isTrue(await gunther.issueCommand('/xxtop accuracy'));
        assert.deepEqual(gunther.getLastDialogAsTable(), {
            columns: [
                'Player',
                'Accuracy (hit / missed)',
                'Strike ratio',
                'Hits / hour',
            ],
            rows: [
                [
                    '1. {384BCA}Ds]_ch1r4q_',
                    '57.81%{BDBDBD} (1.68k / 1.23k)',
                    '3.21',
                    '108.85{9E9E9E} / hour',
                ],
                [
                    '2. {384BCA}[BA]AzKiller',   // player is online, stats and position amended
                    '53.01%{BDBDBD} (1.34k / 1.19k)',
                    '0.96',
                    '156.02{9E9E9E} / hour',
                ],
                [
                    '3. {0FD9FA}Jasmine',
                    '52.62%{BDBDBD} (15.2k / 13.69k)',
                    '1.82',
                    '650.04{9E9E9E} / hour',
                ],
                [
                    '4. {C1F7EC}TheMightyQ',
                    '39.98%{BDBDBD} (10.48k / 15.74k)',
                    '1.16',
                    '966.61{9E9E9E} / hour',
                ],
            ]
        });
    });

    it('should be able to display the damage leaderboard', async (assert) => {
        gunther.respondToDialog({ response: 0 /* Dismiss */ });

        // (1) Have [CP]Humza be online as Russell on their account, with session metrics.
        await russell.identify({ userId: 125 });

        russell.stats.session.onlineTime = 18 * 60 * 60;  // 18 hours?!
        russell.stats.session.damageGiven = 100000;
        russell.stats.session.damageTaken = 10000;
        russell.stats.session.shotsHit = 2000;

        // (2) Have |gunther| see the damage leaderboard dialog.
        assert.isTrue(await gunther.issueCommand('/xxtop damage'));
        assert.deepEqual(gunther.getLastDialogAsTable(), {
            columns: [
                'Player',
                'Damage given / taken',
                'Damage / hour',
                'Damage / shot',
            ],
            rows: [
                [
                    '1. {FF8C13}[BB]Ricky92',
                    '149.61k{BDBDBD} / 125.74k',
                    '3.8k{9E9E9E} / hour',
                    '4.51{9E9E9E} / shot',
                ],
                [
                    '2. {65ADEB}[CP]Humza',  // player is online, stats and position amended
                    '136.73k{BDBDBD} / 58.5k',
                    '3.27k{9E9E9E} / hour',
                    '10.37{9E9E9E} / shot',
                ],
                [
                    '3. {C1F7EC}TheMightyQ',
                    '111.73k{BDBDBD} / 94.15k',
                    '3.47k{9E9E9E} / hour',
                    '4.26{9E9E9E} / shot',
                ],
                [
                    '4. {C1F7EC}ioutHO',
                    '29.54k{BDBDBD} / 28.39k',
                    '6.23k{9E9E9E} / hour',
                    '4.15{9E9E9E} / shot',
                ],
            ]
        });
    });
});
