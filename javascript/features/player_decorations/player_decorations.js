// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DecorationRegistry } from 'features/player_decorations/decoration_registry.js';
import { DecorationSync } from 'features/player_decorations/decoration_sync.js';
import { Feature } from 'components/feature_manager/feature.js';

// Provides the ability for players to have a customised appearance. Whether they want full hair,
// a watch, funky glasses or anything else, this feature is able to drive it.
export default class PlayerDecorations extends Feature {
    constructor() {
        super();

        // This feature reads attachment information from the player's account supplements.
        this.defineDependency('account_provider');

        // The registry is aware of all the possible decorations available to players. Will be
        // initialized lazily, despite getting its data from disk.
        this.registry_ = new DecorationRegistry();

        // The sync object is responsible for making sure that the attached decorations for a
        // particular player stay in sync with what's actually necessary.
        this.sync_ = new DecorationSync(this.registry_);
    }

    // ---------------------------------------------------------------------------------------------
    // Public API of the PlayerDecorations feature
    // ---------------------------------------------------------------------------------------------

    // Resumes display of decorations for the given |player|. Optionally the |applyImmediately| flag
    // may be used to toggle whether the re-applied decorations should be set now, or at next spawn.
    resumeForPlayer(player, applyImmediately = true) {
        this.sync_.resumeForPlayer(player, applyImmediately);
    }

    // Suspends display of decorations for the given |player|.
    suspendForPlayer(player) { this.sync_.suspendForPlayer(player); }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.sync_.dispose();
        this.sync_ = null;
    }
}
