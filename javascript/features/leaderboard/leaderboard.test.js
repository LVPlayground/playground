// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('Leaderboard', (it, beforeEach) => {
    let gunther = null;
    
    beforeEach(() => {
        const feature = server.featureManager.loadFeature('leaderboard');

        gunther = server.playerManager.getById(/* Gunther= */ 0);
    })

    it('should be able to display the damage leaderboard', async (assert) => {
        gunther.respondToDialog({ response: 0 /* Dismiss */ });

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
                    '2. {C1F7EC}TheMightyQ',
                    '111.73k{BDBDBD} / 94.15k',
                    '3.47k / hour',
                    '4.26 / shot',
                ],
                [
                    '3. {65ADEB}[CP]Humza',
                    '36.73k{BDBDBD} / 48.5k',
                    '1.54k / hour',
                    '3.29 / shot',
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
