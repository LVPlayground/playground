// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CollectableBase } from 'features/collectables/collectable_base.js';
import { Vector } from 'base/vector.js';

import { createSeed, randomSeed } from 'base/random.js';
import { intersect } from 'base/set_extensions.js';
import { murmur3hash } from 'base/murmur3hash.js';

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

    // Map from Player instance => Map of Pickup instance to collectable Id
    playerPickups_ = new Map();
    playerSeeds_ = new Map();

    // Set of all collectable IDs, so quickly be able to initialize and diff
    books_ = new Set();
    treasures_ = new Set();
    treasuresArray_ = [];

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

        for (const info of data.books) {
            this.addCollectable(info.id, {
                type: Treasures.kTypeBook,
                position: new Vector(...info.position),
            });

            this.books_.add(info.id);
        }

        for (const info of data.treasures) {
            this.addCollectable(info.id, {
                type: Treasures.kTypeTreasure,
                position: new Vector(...info.position),
                hint: info.hint,
            });

            this.treasures_.add(info.id);
            this.treasuresArray_.push(info.id);
        }
    }

    // Clears all the collectables for the given |player|, generally because they've left the server
    // or, for some other reason, should not participate in the game anymore.
    clearCollectablesForPlayer(player) {
        super.clearCollectablesForPlayer(player);
        if (!this.playerPickups_.has(player))
            return;  // the |player| hasn't had their state initialized
        
        const pickups = this.playerPickups_.get(player);
        for (const pickup of pickups.keys())
            pickup.dispose();
        
        this.playerPickups_.delete(player);
        this.playerSeeds_.delete(player);

        // Prune the scoped entities to get rid of references to deleted objects.
        this.entities.prune();
    }

    // Called when the collectables for the |player| have to be refreshed because (a) they've joined
    // the server as a guest, (b) they've identified to their account, or (c) they've started a new
    // round of collectables and want to collect everything again.
    refreshCollectablesForPlayer(player, statistics) {
        if (this.playerPickups_.has(player))
            this.clearCollectablesForPlayer(player);
        
        this.setPlayerStatistics(player, statistics);

        const pickups = new Map();
        for (const collectableId of this.books_) {
            if (statistics.collectedRound.has(collectableId)) {
                // TODO: Create the treasures
            } else {
                const { position } = this.getCollectable(collectableId);
                const pickup = this.entities.createPickup({
                    modelId: kBookPickupId,
                    position: position,
                    playerId: player.id,
                });

                pickups.set(pickup, collectableId);
            }
        }

        this.playerPickups_.set(player, pickups);
    }

    // ---------------------------------------------------------------------------------------------
    // CollectableBase specialisations:
    // ---------------------------------------------------------------------------------------------

    // Returns the total number of collectables represented for this type. For Treasures, we only
    // count the treasures that have been collected by the player, so need to specialise.
    getCollectableCount() { return this.treasures_.size; }

    // Counts the number of collectables that the player has collected already. Returns a structure
    // in the format of { total, round }, both of which are numbers.
    countCollectablesForPlayer(player) {
        if (!this.hasPlayerStatistics(player))
            return super.countCollectablesForPlayer(player);

        const statistics = this.getPlayerStatistics(player);
        return {
            total: intersect(this.treasures_, statistics.collected).size,
            round: intersect(this.treasures_, statistics.collectedRound).size,
        };
    }

    // ---------------------------------------------------------------------------------------------

    // Computes the collectableId representing the treasure that will be unlocked when the given
    // |bookCollectableId| has been unlocked for the given |player|.
    determineTreasureForBookForPlayer(player, bookCollectableId) {
        if (!this.playerSeeds_.has(player)) {
            this.playerSeeds_.set(player,
                player.account.isIdentified() ? player.account.userId
                                              : murmur3hash(player.name));
        }

        const seed = this.playerSeeds_.get(player) + bookCollectableId;

        const treasureCount = this.treasures_.size;
        const treasureIndex = randomSeed(createSeed(seed.toString(24)), treasureCount);

        return this.treasuresArray_[treasureIndex];
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        super.dispose();  // will delete all entities

        this.playerPickups_.clear();
        this.playerSeeds_.clear();
    }
}
