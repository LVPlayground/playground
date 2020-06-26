// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CollectableBase } from 'features/collectables/collectable_base.js';
import { Vector } from 'base/vector.js';

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
    // Types of collectables this class deals with.
    static kTypeBook = 0;
    static kTypeTreasure = 1;

    collectables_ = null;
    manager_ = null;

    treasures_ = new Set();

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

    // Called when the collectables have to be initialized. The data file lists them all, with
    // separate sections for the books and the treasures.
    initialize() {
        const data = JSON.parse(readFile(kTreasuresDataFile));

        // (1) Load the books, add them as collectables.
        for (const info of data.books) {
            this.addCollectable(info.id, {
                type: Treasures.kTypeBook,
                position: new Vector(...info.position),
            });
        }

        // (2) Load the treasures, add them as collectables as well, but also add them to the local
        // |treasures_| set to be able to quickly count and identify them.
        for (const info of data.treasures) {
            this.addCollectable(info.id, {
                type: Treasures.kTypeTreasure,
                position: new Vector(...info.position),
                hint: info.hint,
            });

            this.treasures_.add(info.id);
        }
    }

    // Clears all the collectables for the given |player|, generally because they've left the server
    // or, for some other reason, should not participate in the game anymore.
    clearCollectablesForPlayer(player) {
        super.clearCollectablesForPlayer(player);
    }

    // Called when the collectables for the |player| have to be refreshed because (a) they've joined
    // the server as a guest, (b) they've identified to their account, or (c) they've started a new
    // round of collectables and want to collect everything again.
    refreshCollectablesForPlayer(player, statistics) {}

    // ---------------------------------------------------------------------------------------------
    // CollectableBase specialisations:
    // ---------------------------------------------------------------------------------------------

    // Returns the total number of collectables represented for this type. For Treasures, we only
    // count the treasures that have been collected by the player, so need to specialise.
    getCollectableCount() { return this.treasures_.size; }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        super.dispose();
    }
}
