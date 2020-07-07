// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DeathmatchGame } from 'features/games_deathmatch/deathmatch_game.js';
import { RandomizedTeamsResolver } from 'features/games_deathmatch/teams/randomized_teams_resolver.js';

describe('RandomizedTeamsResolver', it => {
    it('should be able to divide players in equally sized teams', assert => {
        const resolver = new RandomizedTeamsResolver();
        const players = [];

        // (1) Make sure that 50 players are connected to the server. Store them all in |players|.
        for (let playerId = 0; playerId < 50; ++playerId) {
            if (!server.playerManager.getById(playerId))
                dispatchEvent('playerconnect', { playerid: playerId });

            players.push(server.playerManager.getById(playerId));
        }

        // (2) Run all the |players| through the resolver and count how many of them are part of
        // which team. We expect exactly 25 players in each of the teams.
        const teams = {
            [DeathmatchGame.kTeamAlpha]: new Set(),
            [DeathmatchGame.kTeamBravo]: new Set(),
        };

        for (const { player, team } of resolver.resolve(players))
            teams[team].add(player);
        
        assert.equal(teams[DeathmatchGame.kTeamAlpha].size, 25);
        assert.equal(teams[DeathmatchGame.kTeamBravo].size, 25);

        // (3) Connect two more players, and add them, individually, to the resolver. Both teams
        // should now have 26 members, again, to keep them in sync.
        for (let playerId = 50; playerId < 52; ++playerId) {
            dispatchEvent('playerconnect', { playerid: playerId });

            const player = server.playerManager.getById(playerId);
            teams[resolver.resolveForPlayer(player)].add(player);
        }

        assert.equal(teams[DeathmatchGame.kTeamAlpha].size, 26);
        assert.equal(teams[DeathmatchGame.kTeamBravo].size, 26);

        // (4) Remove three players from Team Alpha, which creates unbalanced teams. Have three new
        // players join the game through the resolver. All three should be part of Team Alpha.
        for (const player of [ ...teams[DeathmatchGame.kTeamAlpha] ].slice(0, 3)) {
            teams[DeathmatchGame.kTeamAlpha].delete(player);
            resolver.onPlayerRemoved(player);
        }

        assert.equal(teams[DeathmatchGame.kTeamAlpha].size, 23);
        assert.equal(teams[DeathmatchGame.kTeamBravo].size, 26);
        
        for (let playerId = 52; playerId < 55; ++playerId) {
            dispatchEvent('playerconnect', { playerid: playerId });

            const player = server.playerManager.getById(playerId);
            teams[resolver.resolveForPlayer(player)].add(player);
        }

        assert.equal(teams[DeathmatchGame.kTeamAlpha].size, 26);
        assert.equal(teams[DeathmatchGame.kTeamBravo].size, 26);
    });
});
