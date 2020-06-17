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

    it('should be able to display the damage leaderboard', async (assert) => {
        gunther.respondToDialog({ response: 0 /* Dismiss */ });

        // (1) Have [CP]Humza be online as Russell on their account, with session metrics.
        await russell.identify({ userId: 125 });

        russell.stats.session.onlineTime = 18 * 60 * 60;  // 18 hours?!
        russell.stats.session.damageGiven = 100000;
        russell.stats.session.damageTaken = 10000;
        russell.stats.session.shotsHit = 2000;

        // (2) Have |gunther| see the damage leaderboard dialog.
        assert.isTrue(await gunther.issueCommand('/top damage'));
        assert.deepEqual(gunther.getLastDialogAsTable(), {
            columns: [
                'Player',
                'Damage given / taken',
                'Per hour',
                'Per shot',
            ],
            rows: [
                [
                    '1. {FF8C13}[BB]Ricky92',
                    '149.61k{BDBDBD} / 125.74k',
                    '3.8k / hour',
                    '4.51 / shot',
                ],
                [
                    '2. {65ADEB}[CP]Humza',  // player is online, stats and position amended
                    '136.73k{BDBDBD} / 58.5k',
                    '3.27k / hour',
                    '10.37 / shot',
                ],
                [
                    '3. {C1F7EC}TheMightyQ',
                    '111.73k{BDBDBD} / 94.15k',
                    '3.47k / hour',
                    '4.26 / shot',
                ],
                [
                    '4. {C1F7EC}ioutHO',
                    '29.54k{BDBDBD} / 28.39k',
                    '6.23k / hour',
                    '4.15 / shot',
                ],
            ]
        });
    });
});
