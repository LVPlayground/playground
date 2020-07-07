// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { TeamResolver } from 'features/games_deathmatch/teams/team_resolver.js';

// Resolves teams in the free-for-all mode, in which case there are no teams at all. Each player
// will automagically be assigned to the Individual group.
export class FreeForAllResolver extends TeamResolver {

}
