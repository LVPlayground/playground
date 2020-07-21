// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { PlayerEventObserver } from 'components/events/player_event_observer.js';

// The Manager is responsible for aligning server state with our internal representation, and for
// making sure that new players have the appropriate colours assigned to them.
export class PlayerColorsManager extends PlayerEventObserver {
    #colors_ = null;

    constructor() {
        super();

        this.#colors_ = new WeakMap();
    }

    // Observe the player manager to get connection and level change notifications. Not done in the
    // constructor because we have a chicken-and-egg problem between the Manager and the supplement.
    initialize() {
        server.deferredEventManager.addObserver(this);
        server.playerManager.addObserver(this, /* replayHistory= */ true);
    }

    // ---------------------------------------------------------------------------------------------

    // Returns the current color that has been assigned to the given |player|.
    getCurrentColorForPlayer(player) { return this.#colors_.get(player) ?? null; }

    // Synchronizes colour state for the given |player|. If the determined top-level color is not
    // how they're currently represented on the server, that will be amended.
    synchronizeForPlayer(player) {
        const currentColor = this.#colors_.get(player);
        const priorityColor = player.colors.gameColor ||
                              player.colors.gangColor ||
                              player.colors.customColor ||
                              player.colors.levelColor ||
                              player.colors.baseColor;

        // If the |player|'s priority color and current color are the same, bail out.
        if (currentColor === priorityColor)
            return;

        // Otherwise, update the |player|'s current color to the new priority color.
        this.#colors_.set(player, priorityColor);

        // TODO: Support visibility.
        // TODO: Support per-player visibility.

        player.rawColor = priorityColor;
    }

    // ---------------------------------------------------------------------------------------------
    // PlayerManager observer
    // ---------------------------------------------------------------------------------------------

    // Called when the given |player| has connected with the server.
    onPlayerConnect(player) { this.synchronizeForPlayer(player); }

    // Called when the level of the given |player| has changed.
    onPlayerLevelChange(player) { this.synchronizeForPlayer(player); }

    // Called when the |target| has just streamed in for the given |player|. We need to ensure
    // invisibility in this method, as that seems to reset through streaming.
    onPlayerStreamIn(player, target) {

    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.playerManager.removeObserver(this);
        server.deferredEventManager.removeObserver(this);
    }
}
