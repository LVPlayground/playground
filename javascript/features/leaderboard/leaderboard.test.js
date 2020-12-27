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
        assert.isTrue(await gunther.issueCommand('/top accuracy'));
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
        assert.isTrue(await gunther.issueCommand('/top damage'));
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

    it('should be able to display the gangs leaderboard', async (assert) => {
        gunther.respondToDialog({ response: 0 /* Dismiss */ });

        // (1) Have the Legendary Warrior Russell be part of The Outlaws for this exercise.
        await russell.identify();

        russell.gangId = 9003;
        russell.stats.session.deathCount = 100;
        russell.stats.session.killCount = 280;
        russell.stats.session.damageGiven = 25000; 
        russell.stats.session.damageTaken = 5000;
        russell.stats.session.shotsHit = 10000;
        russell.stats.session.shotsMissed = 0;

        // (2) Have |gunther| see the damage leaderboard dialog.
        assert.isTrue(await gunther.issueCommand('/top gangs'));
        assert.deepEqual(gunther.getLastDialogAsTable(), {
            columns: [
                'Gang',
                'Kills',
                'Damage',
                'Accuracy',
            ],
            rows: [
                [
                    '1. {4EFF00}Cheap People{9E9E9E} (x16)',
                    '1,636{BDBDBD} / 1,406 (1.16)',
                    '453.49k{BDBDBD} / 426.51k (1.06)',
                    '36.02%{BDBDBD} (128.45k shots)',
                ],
                [
                    '2. {8952EB}Anonymous Game{9E9E9E} (x5)',
                    '1,447{BDBDBD} / 1,375 (1.05)',
                    '396.93k{BDBDBD} / 384.59k (1.03)',
                    '42.73%{BDBDBD} (80.2k shots)',
                ],
                [
                    '3. {C1F7EC}The Outlaws{9E9E9E} (x5)',  // gang is online, stats & rank amended
                    '1,441{BDBDBD} / 807 (1.79)',
                    '321.36k{BDBDBD} / 233.1k (1.38)',
                    '51.46%{BDBDBD} (73.91k shots)',
                ],
                [
                    '4. {0FD9FA}Camin Bulevar{9E9E9E} (x8)',
                    '1,431{BDBDBD} / 2,073 (0.69)',
                    '422.63k{BDBDBD} / 523.23k (0.81)',
                    '33.33%{BDBDBD} (123.31k shots)',
                ],
            ]
        });
    });

    it('should be able to display the kills leaderboard', async (assert) => {
        gunther.respondToDialog({ response: 0 /* Dismiss */ });

        // (1) Have Sophia_Naz be online as Russell on their account, with session metrics.
        await russell.identify({ userId: 125 });

        russell.stats.session.onlineTime = 8 * 60 * 60;  // 8 hours
        russell.stats.session.deathCount = 250;
        russell.stats.session.killCount = 260;
        russell.stats.session.shotsHit = 3000;
        russell.stats.session.shotsMissed = 3000;

        // (2) Have |gunther| see the kills leaderboard dialog.
        assert.isTrue(await gunther.issueCommand('/top kills'));
        assert.deepEqual(gunther.getLastDialogAsTable(), {
            columns: [
                'Player',
                'Kills / deaths',
                'Kills / hour',
                'Shots / kill',
            ],
            rows: [
                [
                    '1. {FF8C13}[BB]Ricky92',
                    '891{BDBDBD} / 561 (1.59)',
                    '17{9E9E9E} / hour',
                    '55.83{9E9E9E} / kill',
                ],
                [
                    '2. {247C1B}[inC]Reni[CP]',
                    '526{BDBDBD} / 409 (1.29)',
                    '8{9E9E9E} / hour',
                    '80.65{9E9E9E} / kill',
                ],
                [
                    '3. {7B68EE}Sophia_Naz',  // player is online, stats and position amended
                    '500{BDBDBD} / 514 (0.97)',
                    '11{9E9E9E} / hour',
                    '63.41{9E9E9E} / kill',
                ],
                [
                    '4. {8952EB}[AG]Newski',
                    '380{BDBDBD} / 188 (2.02)',
                    '27{9E9E9E} / hour',
                    '33.98{9E9E9E} / kill',
                ],
            ]
        });
    });

    it('should be able to display the reaction tests leaderboard', async (assert) => {
        gunther.respondToDialog({ response: 0 /* Dismiss */ });

        // (1) Have Sand be online as Russell on their account, with session metrics.
        await russell.identify({ userId: 116903 });

        russell.stats.session.onlineTime = 8 * 60 * 60;  // 8 hours
        russell.stats.session.reactionTests = 50;

        // (2) Have |gunther| see the kills leaderboard dialog.
        assert.isTrue(await gunther.issueCommand('/top reaction'));
        assert.deepEqual(gunther.getLastDialogAsTable(), {
            columns: [
                'Player',
                'Reaction tests',
                'Reaction tests / hour',
            ],
            rows: [
                [
                    '1. {7A26FF}Sand',  // player is online, stats and position amended
                    '189{9E9E9E} / 1,461',
                    '2.76{9E9E9E} / hour',
                ],
                [
                    '2. {384BCA}Ds]_CH1R4Q_[TM',
                    '186{9E9E9E} / 10,736',
                    '3.71{9E9E9E} / hour',
                ],
                [
                    '3. {007306}[nDz]S0n1c',
                    '106{9E9E9E} / 3,676',
                    '7.77{9E9E9E} / hour',
                ],
                [
                    '4. Sinned',
                    '51{9E9E9E} / 10,228',
                    '1.37{9E9E9E} / hour',
                ],
            ]
        });
    });

    it('is able to display an overview of the leaderboards', async (assert) => {
        gunther.respondToDialog({ response: 0 /* Dismiss */ });

        assert.isTrue(await gunther.issueCommand('/top'));
        assert.deepEqual(gunther.getLastDialogAsTable(), {
            columns: [
                'Leaderboard',
                'Leader',
            ],
            rows: [
                [
                    'Accuracy{9E9E9E} (/top accuracy)',
                    '{384BCA}Ds]_ch1r4q_{9E9E9E} (57.81%)',
                ],
                [
                    'Damage{9E9E9E} (/top damage)',
                    '{FF8C13}[BB]Ricky92{9E9E9E} (149.61k damage)',
                ],
                [
                    'Gangs{9E9E9E} (/top gangs)',
                    '{4EFF00}Cheap People{9E9E9E} (1,636 kills)',
                ],
                [
                    'Kills{9E9E9E} (/top kills)',
                    '{FF8C13}[BB]Ricky92{9E9E9E} (891 kills)',
                ],
                [
                    'Reaction tests{9E9E9E} (/top reaction)',
                    '{384BCA}Ds]_CH1R4Q_[TM{9E9E9E} (186 reaction tests)',
                ],
            ]
        });
    });
});
