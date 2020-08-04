// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { SpectateGroup } from 'features/spectate/spectate_group.js';

// Responsible for keeping track of which players are spectating which player groups, and maintains
// the global player group through which all players can be spectated.
export class SpectateManager {
    #globalGroup_ = null;

    constructor() {
        // Initialize the global spectate group, through which all players can be observed.
        this.#globalGroup_ = new SpectateGroup(this, SpectateGroup.kSwitchAbandonBehaviour);

        server.playerManager.addObserver(this, /* replayHistory= */ true);
    }

    // ---------------------------------------------------------------------------------------------
    // Section: actual functionality
    // ---------------------------------------------------------------------------------------------

    // Called when the |player| should start spectating the given |group|, optionally starting with
    // the given |targetPlayer|. All permission and ability checks should've been done already.
    spectate(player, group, targetPlayer = null) {
        // TODO: Implement this function
    }

    // Called when the |player| should stop spectating. This function will silently fail if they are
    // not currently spectating anyone, as there is no work to do.
    stopSpectate(player) {
        // TODO: Implement this function
    }

    // ---------------------------------------------------------------------------------------------
    // Section: maintaining the global spectation group
    // ---------------------------------------------------------------------------------------------

    // Returns the global spectation group maintained by this class.
    getGlobalGroup() { return this.#globalGroup_; }

    // Called when the given |player| connects to the server. Makes sure that they're in the global
    // spectate group, so that administrators can keep an eye out on them.
    onPlayerConnect(player) {
        if (player.isNonPlayerCharacter())
            return;  // ignore non-player characters in global spectate groups

        this.#globalGroup_.addPlayer(player);
    }

    // Called when the given |player| has disconnected from the server. Removes them from the global
    // spectate group, and cleans up any remaining state if they're currently spectating someone.
    onPlayerDisconnect(player) {
        this.#globalGroup_.removePlayer(player);

        // TODO: Clean-up state if the |player| is currently spectating anyone.
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the given |group| has been updated. Will have to make sure that the interface for
    // all people watching it will be updated as appropriate.
    onGroupUpdated(group) {
        // TODO: Implement this function
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.playerManager.removeObserver(this);
    }
}
