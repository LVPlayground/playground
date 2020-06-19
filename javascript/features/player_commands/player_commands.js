// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Feature } from 'components/feature_manager/feature.js';
import { PlayerCommandsCommands } from 'features/player_commands/player_commands_commands.js';

export default class PlayerCommands extends Feature {
    constructor() {
        super();

        const abuse = this.defineDependency('abuse');
        const announce = this.defineDependency('announce');
        const finance = this.defineDependency('finance');

        this.commands_ = new PlayerCommandsCommands(abuse, announce, finance);
        this.commands_.buildCommands();
    }

    dispose() {
        this.commands_.dispose();
        this.commands_ = null;
    }
}
