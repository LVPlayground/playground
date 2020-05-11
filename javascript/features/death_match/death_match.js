// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Feature from 'components/feature_manager/feature.js';
import { DeathMatchCommands } from "features/death_match/death_match_commands.js";
import { DeathMatchManger } from 'features/death_match/death_match_manager.js';

export default class DeathMatch extends Feature {
    constructor() {
        super();

        // Determines whether a player is allowed to teleport to the mini game right now.
        const abuse = this.defineDependency('abuse');

        this.manager_ = new DeathMatchManger(abuse);
        this.commands_ = new DeathMatchCommands(this.manager_);
    }

    dispose() {
        this.commands_.dispose();
    }
}
