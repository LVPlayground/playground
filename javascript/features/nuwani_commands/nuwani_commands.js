// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Feature from 'components/feature_manager/feature.js';

import { NuwaniCommand } from 'features/nuwani_commands/nuwani_command.js';
import { PlayerCommands } from 'features/nuwani_commands/player_commands.js';

// Provides a series of commands, both in-game and for people on IRC, to communicate among
// themselves. This is in addition to the functionality provided internally in Nuwani.
export class NuwaniCommands extends Feature {
    announce_ = null;
    nuwani_ = null;

    commands_ = null;
    nuwaniCommand_ = null;

    constructor() {
        super();

        // Certain actions will have to be announced to administrators
        this.announce_ = this.defineDependency('announce');

        // It's no surprise that the commands will have to depend on the feature.
        this.nuwani_ = this.defineDependency('nuwani');
        this.nuwani_.addReloadObserver(this, () => this.initializeIrcCommands());

        // The Playground feature provides access control to the in-game command.
        const playground = this.defineDependency('playground');

        // Provides the in-game `/nuwani` command.
        this.nuwaniCommand_ = new NuwaniCommand(this.announce_, this.nuwani_, playground);

        this.initializeIrcCommands();
    }

    // Initializes the IRC commands that are provided as part of the NuwaniCommands feature. This
    // will be called on initial server load, as well as in response to `nuwani` feature reloads.
    initializeIrcCommands() {
        const commandManager = this.nuwani_().commandManager;

        this.commands_ = [
            new PlayerCommands(commandManager),
        ];
    }

    dispose() {
        for (const instance of this.commands_)
            instance.dispose();
        
        this.commands_ = null;

        this.nuwani_.removeReloadObserver(this);
        this.nuwani_ = null;

        this.announce_ = null;
    }
}

export default NuwaniCommands;
