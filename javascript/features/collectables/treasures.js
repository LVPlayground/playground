// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CollectableBase } from 'features/collectables/collectable_base.js';

// Title of the notification that will be shown to the player when finding a book, and another one
// for the notification to be shown when a treasure associated with that book has been found.
const kBookNotificationTitle = 'uncovered!';
const kTreasureNotificationTitle = 'treasure!';

// File (JSON) in which all the treasure data has been stored.
const kTreasuresDataFile = 'data/collectables/treasures.json';

// Model Ids for the pickups that should be created.
export const kBookPickupId = 2894;
export const kTreasurePickupId = 1276;

// Implements the Treasure Hunt functionality, where players have to find books which then unlock
// treasure that could be found. This is a two-stage collectable.
export class Treasures extends CollectableBase {
    collectables_ = null;
    manager_ = null;

    constructor(collectables, manager) {
        super({
            mapIconType: 44 /* Triads Casino */,
            name: 'Treasures',
            singularName: 'Treasure'
        });

        this.collectables_ = collectables;
        this.manager_ = manager;
    }

    // ---------------------------------------------------------------------------------------------
    // CollectableBase implementation:
    // ---------------------------------------------------------------------------------------------

    // Called when the collectables have to be initialized. The data file lists them all, with two
    // vectors per spray tag, one for position, one for rotation.
    initialize() {}

    // Clears all the collectables for the given |player|, generally because they've left the server
    // or, for some other reason, should not participate in the game anymore.
    clearCollectablesForPlayer(player) {}

    // Called when the collectables for the |player| have to be refreshed because (a) they've joined
    // the server as a guest, (b) they've identified to their account, or (c) they've started a new
    // round of collectables and want to collect everything again.
    refreshCollectablesForPlayer(player, statistics) {}

    // ---------------------------------------------------------------------------------------------

    dispose() {
        super.dispose();
    }
}
