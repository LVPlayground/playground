// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CollectableDelegate } from 'features/collectables/collectable_delegate.js';
import ScopedEntities from 'entities/scoped_entities.js';

// File (JSON) in which all the spray tags have been stored. Each has a position and a rotation.
const kSprayTagsDataFile = 'data/collectables/spray_tags.json';

// Implements the SprayTag functionality, where players have to find the spray tags (usually on the
// walls) and spray them in order to collect them. Detection of the spray action is done in Pawn.
export class SprayTags extends CollectableDelegate {
    manager_ = null;

    entities_ = null;
    icons_ = null;
    tags_ = null;

    constructor(manager) {
        super();

        this.manager_ = manager;

        this.entities_ = new ScopedEntities();
        this.icons_ = new Set();        
        this.tags_ = new Map();
    }

    // ---------------------------------------------------------------------------------------------
    // CollectableDelegate implementation:
    // ---------------------------------------------------------------------------------------------

    // Called when the collectables have to be initialized. The data file lists them all, with two
    // vectors per spray tag, one for position, one for rotation.
    initialize() {
        const data = JSON.parse(readFile(kSprayTagsDataFile));

        for (const sprayTag of data) {
            if (this.tags_.has(sprayTag.id))
                throw new Error(`Duplicate spray tag found for Id:${sprayTag.id}`);

            this.tags_.set(sprayTag.id, {
                position: new Vector(...sprayTag.position),
                rotation: new Vector(...sprayTag.rotation),
            });
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
        for (const { position } of this.tags_.values()) {
            this.icons_.add(this.entities_.createMapIcon({
                type: 63,  // Pay 'n' Spray
                position, streamDistance,
            }));
        }
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.entities_.dispose();
        this.entities_ = null;
    }
}
