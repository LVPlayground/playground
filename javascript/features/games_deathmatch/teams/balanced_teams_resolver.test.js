// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { BalancedTeamsResolver } from 'features/games_deathmatch/teams/balanced_teams_resolver.js';
import { DeathmatchGame } from 'features/games_deathmatch/deathmatch_game.js';

describe('BalancedTeamsResolver', (it, beforeEach) => {
    let gunther = null;
    let lucy = null;
    let resolver = null;
    let russell = null;

    beforeEach(() => {
        resolver = new BalancedTeamsResolver();

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        russell = server.playerManager.getById(/* Russell= */ 1);
        lucy = server.playerManager.getById(/* Lucy= */ 2);

        populateEnduringStatistics();
    });

    // Populates the enduring statistics of the players.
    function populateEnduringStatistics() {
        // -- kills
        gunther.stats.enduring.killCount = 100;  // 1st
        russell.stats.enduring.killCount = 90;  // 2nd
        lucy.stats.enduring.killCount = 80;  // 3rd

        // -- damage ratio
        gunther.stats.enduring.damageTaken = 100;
        gunther.stats.enduring.damageGiven = 50;  // 2nd (0.5)

        russell.stats.enduring.damageTaken = 200;
        russell.stats.enduring.damageGiven = 200;  // 1st (1)

        lucy.stats.enduring.damageTaken = 0;
        lucy.stats.enduring.damageGiven = 0;  // 3rd (0)

        // -- shots ratio
        gunther.stats.enduring.shotsHit = 50;
        gunther.stats.enduring.shotsTaken = 200;  // 3rd (0.25)

        russell.stats.enduring.shotsHit = 50;
        russell.stats.enduring.shotsTaken = 100;  // 2nd (0.5)

        lucy.stats.enduring.shotsHit = 200;
        lucy.stats.enduring.shotsTaken = 66.6666;  // 1st (3)

        // -- accuracy
        gunther.stats.enduring.shotsMissed = 50;  // 2nd (0.5)
        russell.stats.enduring.shotsMissed = 50;  // 2nd (0.5)
        lucy.stats.enduring.shotsMissed = 50;  // 1st (0.8)
    }

    it('should be able to rank players by their statistics', assert => {
        const rankings = resolver.determineRankings(new Map([
            [ gunther, { kills: 100, damageRatio: 1,  shotRatio: 2, accuracy: 0.5 } ],
            [ russell, { kills: 200, damageRatio: .5, shotRatio: 1, accuracy: 0.8 } ],
            [ lucy,    { kills: 150, damageRatio: 2,  shotRatio: 0, accuracy: 0.3 } ],
        ]));

        assert.deepEqual([ ...rankings.values() ], [
            {
                kills: 3,
                damageRatio: 2,
                shotRatio: 1,
                accuracy: 2,
            },
            {
                kills: 1,
                damageRatio: 3,
                shotRatio: 2,
                accuracy: 1,
            },
            {
                kills: 2,
                damageRatio: 1,
                shotRatio: 3,
                accuracy: 3,
            }
        ]);
    });

    it('should be able to create scores for each player based on their rankings', assert => {
        const scores = {};
        
        for (const [ player, score ] of resolver.computePlayerScores([ gunther, russell, lucy ]))
            scores[player.name] = score;
        
        // Verify that the scores are what we expect them to be. Gunther wins because they're first
        // in regards to kill count, which we carry most.
        assert.deepEqual(scores, {
            Gunther: 110,
            Russell: 105,
            Lucy: 70
        });
    });

    it('should be able to divide players in equally sized teams', assert => {
        const players = [ russell, lucy ];

        // (1) Have Russell and Lucy join the game. Russell will become part of Team Alpha (higher
        // score), and Lucy will become part of Team Bravo.
        const teams = {
            [DeathmatchGame.kTeamAlpha]: new Set(),
            [DeathmatchGame.kTeamBravo]: new Set(),
        };

        for (const { player, team } of resolver.resolve(players))
            teams[team].add(player);
        
        assert.equal(teams[DeathmatchGame.kTeamAlpha].size, 1);
        assert.equal(teams[DeathmatchGame.kTeamBravo].size, 1);

        assert.isTrue(teams[DeathmatchGame.kTeamAlpha].has(russell));
        assert.isTrue(teams[DeathmatchGame.kTeamBravo].has(lucy));

        // (2) Have Gunther join the game. Team Bravo is the weaker team, so they should be slotted
        // in there to balance things out more evenly.
        teams[resolver.resolveForPlayer(gunther)].add(gunther);

        assert.equal(teams[DeathmatchGame.kTeamAlpha].size, 1);
        assert.equal(teams[DeathmatchGame.kTeamBravo].size, 2);

        assert.isTrue(teams[DeathmatchGame.kTeamBravo].has(gunther));
    });

    it('should sensibly balance over forcing even-odd for odd numbers of participants', assert => {
        const players = [ gunther, russell, lucy ];

        // Have Gunther, Russell and Lucy join the game. They will be ranked in that order based on
        // their skill, so strict even/odd would put Gunther (110) and Lucy (70) in Team Alpha, and
        // Russell (105) in Team Bravo. Objectively Lucy would have to join Team Bravo instead.
        const teams = {
            [DeathmatchGame.kTeamAlpha]: new Set(),
            [DeathmatchGame.kTeamBravo]: new Set(),
        };

        for (const { player, team } of resolver.resolve(players))
            teams[team].add(player);
        
        assert.equal(teams[DeathmatchGame.kTeamAlpha].size, 1);
        assert.equal(teams[DeathmatchGame.kTeamBravo].size, 2);

        assert.isTrue(teams[DeathmatchGame.kTeamAlpha].has(gunther));
        assert.isTrue(teams[DeathmatchGame.kTeamBravo].has(russell));
        assert.isTrue(teams[DeathmatchGame.kTeamBravo].has(lucy));
    });
});
