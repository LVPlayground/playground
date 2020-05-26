// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CollectableDelegate } from 'features/collectables/collectable_delegate.js';
import ScopedEntities from 'entities/scoped_entities.js';
import { Vector } from 'base/vector.js';

// File (JSON) in which all the individual barrels have been stored. The JSON data will have been
// categorized per area, which are static properties on the RedBarrels class.
const kBarrelDataFile = 'data/collectables/red_barrels.json';

// Implements the Red Barrels functionality, where players have to shoot the red barrels scattered
// across the map in an effort to clean up all those dangerous explosives.
export class RedBarrels extends CollectableDelegate {
    // Identifiers for the different categories of barrels.
    static kAreaLasVenturas = 'Las Venturas';

    manager_ = null;

    barrels_ = null;
    entities_ = null;
    icons_ = null;

    constructor(manager) {
        super();

        this.manager_ = manager;

        this.barrels_ = new Map();
        this.entities_ = new ScopedEntities();
        this.icons_ = new Set();

        server.objectManager.addObserver(this);
    }

    // ---------------------------------------------------------------------------------------------
    // CollectableDelegate implementation:
    // ---------------------------------------------------------------------------------------------

    // Called when the collectables have to be initialized. All the Red Barrel data will be loaded
    // from the JSON configuration file to the |barrels_| class property.
    initialize() {
        const data = JSON.parse(readFile(kBarrelDataFile));

        for (const area of [ RedBarrels.kAreaLasVenturas ]) {
            if (!data.hasOwnProperty(area) || !Array.isArray(data[area]))
                throw new Error(`No barrels are defined for the ${area} area.`);

            for (const barrel of data[area]) {
                if (this.barrels_.has(barrel.id))
                    throw new Error(`Duplicate barrels found for Id:${barrel.id}`);

                this.barrels_.set(barrel.id, {
                    area,
                    position: new Vector(...barrel.position),
                    rotation: new Vector(...barrel.rotation),
                });
            }
        }
    }

    // Called when the collectables for the |player| have to be refreshed because (a) they've joined
    // the server as a guest, (b) they've identified to their account, or (c) they've started a new
    // round of collectables and want to collect everything again.
    refreshCollectablesForPlayer(player, collected) {}

    // Called when the map icons for the collectable should either be shown (when |visible| is set)
    // or hidden. This is a configuration setting available to Management members.
    refreshCollectableMapIcons(visible, streamDistance) {
        if ((visible && this.icons_.size) || (!visible && !this.icons_.size))
            return;  // no change in visibility state

        // Remove all created icons if |visible| has been set to false.
        if (!visible) {
            for (const mapIcon of this.icons_)
                mapIcon.dispose();
            
            this.icons_.clear();
            return;
        }

        // Otherwise create an icon for each of the defined spray tags.
        for (const { position } of this.barrels_.values()) {
            this.icons_.add(this.entities_.createMapIcon({
                type: 20,  // Fire
                position, streamDistance,
            }));
        }
    }
    
    // ---------------------------------------------------------------------------------------------

    // Called when the |player| has shot the given |object|. If this is one of their barrels, we'll
    // consider them as having scored a point.
    onPlayerShootObject(player, object) {}

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.objectManager.removeObserver(this);

        this.entities_.dispose();
        this.entities_ = null;
    }
}
