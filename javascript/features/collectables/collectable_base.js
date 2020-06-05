// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import ScopedEntities from 'entities/scoped_entities.js';

// Interface for collectable types that's called by the CollectableManager when there's a change in
// available data for a particular player, for example when they log in.
export class CollectableBase {
    mapIconType_ = null;
    name_ = null;
    singularName_ = null;

    collectableItems_ = null;
    entities_ = null;
    icons_ = null;
    statistics_ = null;

    constructor({ mapIconType = null, name = null, singularName = null } = {}) {
        this.mapIconType_ = mapIconType;
        this.name_ = name;
        this.singularName_ = singularName;

        this.collectableItems_ = new Map();
        this.entities_ = new ScopedEntities({ interiorId: 0, virtualWorld: 0 });
        this.icons_ = new Set();
        this.statistics_ = new WeakMap();
    }

    // Gets the entities using which objects, tags and other things can be created.
    get entities() { return this.entities_; }

    // Gets the name of this collectable series, for display in user interfaces.
    get name() { return this.name_; }

    // Gets the singular name of a collectable within this series.
    get singularName() { return this.singularName_; }

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
    // Section: Player statistics and API
    // ---------------------------------------------------------------------------------------------

    // Returns the statistics for the given |player|, or NULL when there aren't any.
    getPlayerStatistics(player) { return this.statistics_.get(player) ?? null; }

    // Returns whether there are stored statistics for the given |player|.
    hasPlayerStatistics(player) { return this.statistics_.has(player); }

    // Stores the |statistics| for the given |player|.
    setPlayerStatistics(player, statistics) { this.statistics_.set(player, statistics); }

    // ---------------------------------------------------------------------------------------------
    // Section: Implementable API
    // ---------------------------------------------------------------------------------------------

    // Called when the collectables have to be initialized.
    initialize() {}

    // Clears all the collectables for the given |player|, generally because they've left the server
    // or, for some other reason, should not participate in the game anymore.
    clearCollectablesForPlayer(player) {
        this.statistics_.delete(player);
    }

    // Called when the collectables for the |player| have to be refreshed because (a) they've joined
    // the server as a guest, (b) they've identified to their account, or (c) they've started a new
    // round of collectables and want to collect everything again.
    refreshCollectablesForPlayer(player, statistics) {}

    // ---------------------------------------------------------------------------------------------
    // Section: Default behaviour
    // ---------------------------------------------------------------------------------------------

    // Counts the number of collectables that the player has collected already. Returns a structure
    // in the format of { total, round }, both of which are numbers.
    countCollectablesForPlayer(player) {
        const statistics = this.statistics_.get(player);
        return {
            total: statistics?.collected.size ?? 0,
            round: statistics?.collectedRound.size ?? 0,
        };
    }

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

    // Called when the |player| wants to start a new round for these collectables. Their state
    // should thus be reset to that of a new player, without losing benefits.
    startCollectableRoundForPlayer(player) {
        const statistics = this.statistics_.get(player);
        if (!statistics)
            throw new Error(`There are no statistics known for ${player.name}.`);
        
        statistics.collectedRound = new Set();
        statistics.round++;

        this.refreshCollectablesForPlayer(player, statistics);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        if (this.entities_) {
            this.entities_.dispose();
            this.entities_ = null;
        }
    }
}
