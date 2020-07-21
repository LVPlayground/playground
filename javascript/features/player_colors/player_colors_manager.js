// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { PlayerEventObserver } from 'components/events/player_event_observer.js';

import { kDefaultAlpha } from 'features/player_colors/default_colors.js';

// The Manager is responsible for aligning server state with our internal representation, and for
// making sure that new players have the appropriate colours assigned to them.
export class PlayerColorsManager extends PlayerEventObserver {
    #colors_ = null;
    #overrides_ = null;

    constructor() {
        super();

        this.#colors_ = new WeakMap();
        this.#overrides_ = new WeakMap();
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
    // how they're currently represented on the server, that will be amended, as will invisiblity
    // settings which are controlled per-player.
    synchronizeForPlayer(player) {
        const didColorChange = this.synchronizeColorForPlayer(player);
        if (!didColorChange)
            return;

        // Map containing the override colours that have already been determined. This will be reset
        // in full when SetPlayerColor is called, as it sends the same RPC to the SA-MP clients.
        const overrideMap = new WeakMap();

        for (const target of server.playerManager) {
            if (target.isNonPlayerCharacter())
                continue;  // don't bother updating colours for NPCs

            if (target === player)
                continue;  // don't bother updating the player for.. themselves

            this.synchronizeVisibilityForPlayer(player, target, overrideMap);
        }

        this.#overrides_.set(player, overrideMap);
    }

    // Synchronizes whether the |target| can see the |player|. These will be updated based on the
    // determined |player|'s current color, and then overrides on top of that.
    synchronizeVisibilityForPlayer(player, target, overrideMap = null) {
        overrideMap = overrideMap ?? this.#overrides_.get(player);

        const playerBaseColor = this.#colors_.get(player);
        const playerTargetColor =
            player.colors.isVisibleForPlayer(target) ? playerBaseColor.withAlpha(kDefaultAlpha)
                                                     : playerBaseColor.withAlpha(0);

        // If the |playerTargetColor| equals the |playerBaseColor|, then no override is necessary.
        // Delete any that have been created so far, after updating this with the player.
        if (playerTargetColor === playerBaseColor) {
            if (overrideMap.has(target)) {
                overrideMap.delete(target);

                player.setColorForPlayer(target, playerBaseColor);
            }

            return;
        }

        // Otherwise the |playerTargetColor| is different from the |playerBaseColor|, which means
        // that a new override has to be created for this pair of players.
        if (overrideMap.get(target) === playerTargetColor)
            return;  // the override already exists

        overrideMap.set(target, playerTargetColor);

        player.setColorForPlayer(target, playerTargetColor);
    }

    // Synchronizes the current color for the given |player|. Returns whether the colour has changed
    // for the given |player|, and further synchronization might have to happen.
    synchronizeColorForPlayer(player) {
        const currentBaseColor = player.colors.gameColor ||
                                 player.colors.gangColor ||
                                 player.colors.customColor ||
                                 player.colors.levelColor ||
                                 player.colors.baseColor;

        // The |player|'s current colour might have to be amended based on their visibility.
        const currentColor = player.colors.visible ? currentBaseColor
                                                   : currentBaseColor.withAlpha(0);

        // If the |currentColor| is the same as the stored color, bail out.
        if (this.#colors_.get(player) === currentColor)
            return false;

        this.#colors_.set(player, currentColor);

        player.rawColor = currentColor;
        return true;
    }

    // ---------------------------------------------------------------------------------------------
    // PlayerManager observer
    // ---------------------------------------------------------------------------------------------

    // Called when the given |player| has connected with the server.
    onPlayerConnect(player) { this.synchronizeForPlayer(player); }

    // Called when the level of the given |player| has changed.
    onPlayerLevelChange(player) { this.synchronizeForPlayer(player); }

    // Called when the |player| has freshly spawned into the world.
    onPlayerSpawn(player) {
        const overrideMap = this.#overrides_.get(player);
        if (!overrideMap || !overrideMap.size)
            return;  // there are no overrides for the given |player|

        for (const target of server.playerManager) {
            const overrideColor = overrideMap.get(target);
            if (!overrideColor)
                continue;  // no override has been created for the given |target|

            player.setColorForPlayer(target, overrideColor);
        }
    }

    // Called when the |target| has just streamed in for the given |player|.
    onPlayerStreamIn(player, target) {
        const overrideMap = this.#overrides_.get(target);
        if (!overrideMap || !overrideMap.has(player))
            return;  // there are no overrides for the given |player| for the given |target|

        target.setColorForPlayer(player, overrideMap.get(player));
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.playerManager.removeObserver(this);
        server.deferredEventManager.removeObserver(this);
    }
}
