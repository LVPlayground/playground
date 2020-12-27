// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DeathmatchGame } from 'features/games_deathmatch/deathmatch_game.js';
import { TeamResolver } from 'features/games_deathmatch/teams/team_resolver.js';

// Resolves teams in the free-for-all mode, in which case there are no teams at all. Each player
// will automagically be assigned to the Individual group.
export class FreeForAllResolver extends TeamResolver {
    // Returns whether this team resolver is for a team-based game. Despite being called a team
    // resolver, the FFA mode actually exists for individuals.
    isTeamBased() { return false; }

    // Resolves the intended teams for the given |players|, a sequence. In free-for-all mode, each
    // of them will be playing to their own agenda.
    resolve(players) {
        return [ ...players ].map(player => ({ player, team: DeathmatchGame.kTeamIndividual }));
    }

    // Resolves the intended team for the given |player|, who may have joined late. They will be
    // assigned a team based on the current balance.
    resolveForPlayer(player) { return DeathmatchGame.kTeamIndividual; }
}
