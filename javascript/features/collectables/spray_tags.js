// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CollectableDelegate } from 'features/collectables/collectable_delegate.js';
import ScopedEntities from 'entities/scoped_entities.js';

// Implements the Red Barrels functionality, where players have to shoot the red barrels scattered
// across the map in an effort to clean up all those dangerous explosives.
export class SprayTags extends CollectableDelegate {
    entities_ = null;
    manager_ = null;
    tags_ = null;

    constructor(manager) {
        super();

        this.entities_ = new ScopedEntities();
        this.manager_ = manager;
        this.tags_ = new Map();
    }

    // ---------------------------------------------------------------------------------------------
    // CollectableDelegate implementation:
    // ---------------------------------------------------------------------------------------------

    // Called when the collectables have to be initialized.
    initialize() {}

    // Called when the collectables for the |player| have to be refreshed because (a) they've joined
    // the server as a guest, (b) they've identified to their account, or (c) they've started a new
    // round of collectables and want to collect everything again.
    refreshCollectablesForPlayer(player, collected) {}

    // Called when the map icons for the collectable should either be shown (when |display| is set)
    // or hidden. This is a configuration setting available to Management members.
    refreshCollectableMapIcons(display) {}

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.entities_.dispose();
        this.entities_ = null;
    }
}
