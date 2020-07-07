// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { TeamResolver } from 'features/games_deathmatch/teams/team_resolver.js';

// Resolves teams in a randomized way. This means that the teams will have roughly the same amount
// of participants in them, but deciding which team somebody ends up on is done by a dice roll.
export class RandomizedTeamsResolver extends TeamResolver {

}
