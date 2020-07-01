// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CollectableBase } from 'features/collectables/collectable_base.js';
import { Vector } from 'base/vector.js';

import { createSeed, random, randomSeed } from 'base/random.js';
import { intersect } from 'base/set_extensions.js';

// Title of the notification that will be shown to the player when finding a book, and another one
// for the notification to be shown when a treasure associated with that book has been found.
const kBookNotificationTitle = 'uncovered!';
const kTreasureNotificationTitle = 'treasure!';

// File (JSON) in which all the treasure data has been stored.
const kTreasuresDataFile = 'data/collectables/treasures.json';

// Radius, in units, a player has to be within a collectable in order to "collect" it.
export const kCollectableRadius = 2;

// Model Ids for the pickups that should be created.
export const kBookPickupModelId = 2894;
export const kTreasurePickupModelId = 1276;

// Implements the Treasure Hunt functionality, where players have to find books which then unlock
// treasure that could be found. This is a two-stage collectable.
export class Treasures extends CollectableBase {
    // Types of collectables this class deals with.
    static kTypeBook = 0;
    static kTypeTreasure = 1;

    collectables_ = null;
    manager_ = null;

    // Map from Player instance to a mapping of book collectable IDs to treasure collectable IDs.
    playerTreasureMapping_ = new Map();

    // Map from Player instance to a mapping of area instances to collectable IDs, and a second map
    // that provides a similar mapping from collectable IDs to objects.
    playerAreaMapping_ = new Map();
    playerObjectMapping_ = new Map();

    // Set of all collectable IDs, so quickly be able to initialize and diff operations.
    books_ = new Set();
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
        }
    }

    // Clears all the collectables for the given |player|, generally because they've left the server
    // or, for some other reason, should not participate in the game anymore.
    clearCollectablesForPlayer(player) {
        super.clearCollectablesForPlayer(player);
        
        // (1) Delete all the areas that have been created for the |player|.
        if (this.playerAreaMapping_.has(player)) {
            for (const area of this.playerAreaMapping_.get(player).keys())
                area.dispose();
        }

        // (2) Delete all the objects that have been created for the |player|.
        if (this.playerObjectMapping_.has(player)) {
            for (const object of this.playerObjectMapping_.get(player).values())
                object.dispose();
        }

        // (3) Delete the player-specific mappings and storage for this series.
        this.playerAreaMapping_.delete(player);
        this.playerObjectMapping_.delete(player);

        this.playerTreasureMapping_.delete(player);

        // Prune the scoped entities to get rid of references to deleted objects.
        this.entities.prune();
    }

    // Called when the collectables for the |player| have to be refreshed because (a) they've joined
    // the server as a guest, (b) they've identified to their account, or (c) they've started a new
    // round of collectables and want to collect everything again.
    refreshCollectablesForPlayer(player, statistics) {
        if (this.playerTreasureMapping_.has(player))
            this.clearCollectablesForPlayer(player);

        this.createTreasureMapping(player);
        this.setPlayerStatistics(player, statistics);

        this.playerAreaMapping_.set(player, new Map());
        this.playerObjectMapping_.set(player, new Map());

        for (const collectableId of this.books_) {
            if (statistics.collectedRound.has(collectableId)) {
                const treasureId = this.determineTreasureForBookForPlayer(player, collectableId);
                if (statistics.collectedRound.has(treasureId))
                    continue;  // all collected!

                this.createPickupableForPlayer(player, treasureId);
            } else {
                this.createPickupableForPlayer(player, collectableId);
            }
        }
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

    // Creates the book Id => treasure Id mapping for the given |player|. This is different for
    // each player, because we're mean and want to stop collaboration :)
    createTreasureMapping(player) {
        const uniqueValue = player.account.isIdentified() ? player.account.userId
                                                          : player.name;

        const seed = createSeed(`TR:${uniqueValue}`);
        const mapping = new Map();

        const treasures = [ ...this.treasures_ ];
        for (const collectableId of this.books_) {
            const index = randomSeed(seed, treasures.length);
            const treasureId = treasures.splice(index, 1)[0];

            mapping.set(collectableId, treasureId);
        }

        this.playerTreasureMapping_.set(player, mapping);
    }

    // Computes the collectableId representing the treasure that will be unlocked when the given
    // |bookCollectableId| has been unlocked for the given |player|.
    determineTreasureForBookForPlayer(player, bookCollectableId) {
        if (!this.playerTreasureMapping_.has(player))
            throw new Error(`Treasure mappings have not been initialized for the given ${player}`);
        
        const mapping = this.playerTreasureMapping_.get(player);
        if (!mapping.has(bookCollectableId))
            throw new Error(`The given book collectable Id (${bookCollectableId}) is not mapped.`);

        return mapping.get(bookCollectableId);
    }

    // Creates a pickupable for the given |player|. This will create a per-player object, as we
    // can't mimic this behaviour with pickups, with an area around it that will inform us when they
    // have "picked it up". The |collectableId| decides its appearance.
    createPickupableForPlayer(player, collectableId) {
        const { type, position } = this.getCollectable(collectableId);

        // (1) Create a circular area around the collectable for the player.
        const area = this.entities.createCircularArea(position, kCollectableRadius, {
            playerId: player.id,
        });

        area.addObserver(this);

        // (2) Create the object representing this collectable for the player.
        const object = this.entities.createObject({
            modelId: type === Treasures.kTypeBook ? kBookPickupModelId
                                                  : kTreasurePickupModelId,

            position,
            rotation: random(360),

            playerId: player.id,
        });

        // (3) Store both the |area| and the |object| specifically for the |player|.
        this.playerAreaMapping_.get(player).set(area, collectableId);
        this.playerObjectMapping_.get(player).set(collectableId, object);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |player| enters the given |area|, which should be one of the collectables
    // that are part of this series. We consider this as them having picked up the collectable.
    onPlayerEnterArea(player, area) {
        const areaMapping = this.playerAreaMapping_.get(player);
        const objectMapping = this.playerObjectMapping_.get(player);

        if (!areaMapping || !areaMapping.has(area) || !objectMapping)
            throw new Error(`Received an event for an area that's not part of this collectable.`);

        const collectableId = areaMapping.get(area);
        const collectable = this.getCollectable(collectableId);

        if (collectable.type === Treasures.kTypeBook)
            this.onPlayerDiscoverBook(player, collectableId);
        else
            this.onPlayerDiscoverTreasure(player, collectableId);
    }

    // Called when the |player| has discovered the given |book|, which is a collectable Id.
    onPlayerDiscoverBook(player, bookCollectableId) {
        player.sendMessage(`You've discovered something that you're not meant to find just yet ;)`);
    }

    // Called when the |player| has discovered the given |treasure|, also a collectable Id.
    onPlayerDiscoverTreasure(player, treasureCollectableId) {}

    // ---------------------------------------------------------------------------------------------

    dispose() {
        super.dispose();  // will delete all entities

        this.playerAreaMapping_.clear();
        this.playerObjectMapping_.clear();

        this.playerTreasureMapping_.clear();
    }
}
