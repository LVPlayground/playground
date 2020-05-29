// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CollectableBase } from 'features/collectables/collectable_base.js';
import { CollectableDatabase } from 'features/collectables/collectable_database.js';
import { Vector } from 'base/vector.js';

// File (JSON) in which all the individual barrels have been stored. The JSON data will have been
// categorized per area, which are static properties on the RedBarrels class.
const kBarrelDataFile = 'data/collectables/red_barrels.json';

// Object Id that's been assigned to barrels throughout the map.
const kBarrelObjectId = 1225;

// Title of the notification that will be shown to the player upon blowing up a Red Barrel.
const kNotificationTitle = 'exploded!';

// Implements the Red Barrels functionality, where players have to shoot the red barrels scattered
// across the map in an effort to clean up all those dangerous explosives.
export class RedBarrels extends CollectableBase {
    // Identifiers for the different categories of barrels.
    static kAreaLasVenturas = 'Las Venturas';

    collectables_ = null;
    manager_ = null;

    // Map from |player| to set of GameObject instances for all their personal barrels.
    playerBarrels_ = null;

    constructor(collectables, manager) {
        super({ mapIconType: 20 /* Fire */ });

        this.collectables_ = collectables;
        this.manager_ = manager;

        this.playerBarrels_ = new Map();

        server.objectManager.addObserver(this);
    }

    // ---------------------------------------------------------------------------------------------
    // CollectableBase implementation:
    // ---------------------------------------------------------------------------------------------

    // Called when the collectables have to be initialized. All the Red Barrel data will be loaded
    // from the JSON configuration file to the |barrels_| class property.
    initialize() {
        const data = JSON.parse(readFile(kBarrelDataFile));

        for (const area of [ RedBarrels.kAreaLasVenturas ]) {
            if (!data.hasOwnProperty(area) || !Array.isArray(data[area]))
                throw new Error(`No barrels are defined for the ${area} area.`);

            for (const barrel of data[area]) {
                this.addCollectable(barrel.id, {
                    area,
                    position: new Vector(...barrel.position),
                    rotation: new Vector(...barrel.rotation),
                });
            }
        }
    }

    // Clears all the collectables for the given |player|, generally because they've left the server
    // or, for some other reason, should not participate in the game anymore.
    clearCollectablesForPlayer(player) {
        if (!this.playerBarrels_.has(player))
            return;  // the |player| already collected all the red barrels
        
        const barrels = this.playerBarrels_.get(player);
        for (const barrel of barrels.keys())
            barrel.dispose();
        
        this.playerBarrels_.delete(player);

        // Prune the scoped entities to get rid of references to deleted objects.
        this.entities.prune();
    }

    // Called when the collectables for the |player| have to be refreshed because (a) they've joined
    // the server as a guest, (b) they've identified to their account, or (c) they've started a new
    // round of collectables and want to collect everything again.
    refreshCollectablesForPlayer(player, collected) {
        if (this.playerBarrels_.has(player))
            this.clearCollectablesForPlayer(player);
        
        const barrels = new Map();
        for (const [ barrelId, { area, position, rotation } ] of this.getCollectables()) {
            if (collected.has(barrelId))
                continue;  // the |player| has already collected this barrel

            // TODO: Consider the |area| when barrels are all over the map.

            const barrel = this.entities.createObject({
                modelId: kBarrelObjectId,
                position, rotation,

                interiorId: 0,  // main world
                virtualWorld: 0,  // main world
                playerId: player.id,
            });

            barrels.set(barrel, barrelId);
        }

        this.playerBarrels_.set(player, barrels);
    }
    
    // ---------------------------------------------------------------------------------------------

    // Called when the |player| has shot the given |object|. If this is one of their barrels, we'll
    // consider them as having scored a point.
    onPlayerShootObject(player, object) {
        if (!this.playerBarrels_.has(player))
            return;  // the |player| does not have any barrels
        
        const barrels = this.playerBarrels_.get(player);
        if (!barrels.has(object))
            return;  // it's not one of our barrels that the player shot
        
        const kTotalBarrels = this.getCollectableCount();

        const barrelId = barrels.get(object);
        const remaining = barrels.size - 1;

        let message = null;

        // Compose an appropriate message to show to the player now that they've cleared a given
        // number of barrels. This depends on how many barrels are remaining.
        switch (remaining) {
            case 0:
                message = 'all Red Barrels have been cleaned up!';
                break;
            case 1:
                message = 'only one more barrel left to find';
                break;
            default:
                message = `${kTotalBarrels - remaining} / ${kTotalBarrels}`;
                break;
        }

        // Show a notification to the player about the Spray Tags they've collected.
        this.manager_.showNotification(player, kNotificationTitle, message);
    
        // Mark the collectable as having been collected, updating the |player|'s stats.
        this.manager_.markCollectableAsCollected(player, CollectableDatabase.kRedBarrel, barrelId);

        // Dispose of the barrel's object, and delete it from any and all object tracking that's
        // remaining in this class. It won't be needed anymore.
        object.dispose();

        barrels.delete(object);

        if (!barrels.size)
            this.playerBarrels_.delete(player);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        super.dispose();

        server.objectManager.removeObserver(this);
    }
}
