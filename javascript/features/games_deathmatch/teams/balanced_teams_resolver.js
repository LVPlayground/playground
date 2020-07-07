// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { TeamResolver } from 'features/games_deathmatch/teams/team_resolver.js';

// Resolves teams in a balanced manner, i.e. looks at player statistics, experience, ranks them and
// then tries to divide the players in two groups in a fair manner.
export class BalancedTeamsResolver extends TeamResolver {

}
