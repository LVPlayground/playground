// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Objective } from 'features/games_deathmatch/objectives/objective.js';

// Continuous objective, where participants keep playing the game until they leave themselves,
// either through the "/leave" command or by disconneting from the server.
export class ContinuousObjective extends Objective {}
