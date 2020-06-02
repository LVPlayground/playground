// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import ScopedEntities from 'entities/scoped_entities.js';

// Interface for collectable types that's called by the CollectableManager when there's a change in
// available data for a particular player, for example when they log in.
export class CollectableBase {
    mapIconType_ = null;

    collectableItems_ = null;
    entities_ = null;
    icons_ = null;

    constructor({ mapIconType = null, name = null } = {}) {
        this.mapIconType_ = mapIconType;
        this.name_ = name;

        this.collectableItems_ = new Map();
        this.entities_ = new ScopedEntities({ interiorId: 0, virtualWorld: 0 });
        this.icons_ = new Set();
    }

    // Gets the entities using which objects, tags and other things can be created.
    get entities() { return this.entities_; }

    // Gets the name of this collectable series, for display in user interfaces.
    get name() { return this.name_; }

    // ---------------------------------------------------------------------------------------------
    // Section: Access to each of the collectables
    // ---------------------------------------------------------------------------------------------

    // Adds the collectable with |id|, represented by |data|, to the internal collection.
    addCollectable(id, data) {
        if (this.collectableItems_.has(id))
            throw new Error(`Duplicate collectable ID: ${id}.`);

        this.collectableItems_.set(id, data);
    }

    // Returns the total number of collectables represented for this type.
    getCollectableCount() { return this.collectableItems_.size; }

    // Returns a reference to a mutable Map<id, data> with all the collectables for this type.
    getCollectables() { return this.collectableItems_; }

    // Returns a particular collectable by its id, or NULL when it doesn't exist.
    getCollectable(id) { return this.collectableItems_.get(id) ?? null; }

    // ---------------------------------------------------------------------------------------------
    // Section: Implementable API
    // ---------------------------------------------------------------------------------------------

    // Called when the collectables have to be initialized.
    initialize() {}

    // Counts the number of collectables that the player has collected already. Returns a structure
    // in the format of { total, round }, both of which are numbers.
    countCollectablesForPlayer(player) { return { total: 0, round: 0 }; }

    // Clears all the collectables for the given |player|, generally because they've left the server
    // or, for some other reason, should not participate in the game anymore.
    clearCollectablesForPlayer(player) {}

    // Called when the collectables for the |player| have to be refreshed because (a) they've joined
    // the server as a guest, (b) they've identified to their account, or (c) they've started a new
    // round of collectables and want to collect everything again.
    refreshCollectablesForPlayer(player, statistics) {}

    // ---------------------------------------------------------------------------------------------
    // Section: Default behaviour
    // ---------------------------------------------------------------------------------------------

    // Called when the map icons for the collectable should either be shown (when |visible| is set)
    // or hidden. This is a configuration setting available to Management members.
    refreshCollectableMapIcons(visible, streamDistance) {
        if ((visible && this.icons_.size) || (!visible && !this.icons_.size))
            return;  // no change in visibility state

        if (!this.mapIconType_)
            return;  // this type isn't represented with map icons

        // Remove all created icons if |visible| has been set to false.
        if (!visible) {
            for (const mapIcon of this.icons_)
                mapIcon.dispose();
            
            this.icons_.clear();
            return;
        }

        // Otherwise create an icon for each of the defined spray tags.
        for (const { position } of this.collectableItems_.values()) {
            this.icons_.add(this.entities_.createMapIcon({
                type: this.mapIconType_,
                position, streamDistance,
            }));
        }
    }

    dispose() {
        if (this.entities_) {
            this.entities_.dispose();
            this.entities_ = null;
        }
    }
}
