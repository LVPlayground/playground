// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import HouseExtension from 'features/houses/house_extension.js';

// Responsible for managing the gang zones visible on the map.
//
// Gangs that have a certain penetration in a given area will have the area awarded as their zone.
// The gang zone will be displayed on each player's minimap in the gang's colour. The gang zone's
// area will be influenced by the value of the created houses and the residential value.
//
// An approximation of the gang zones that will be created can be seen on the following page:
//
//     https://www.sa-mp.nl/tools/visualize-map/zones.php
//
// The actual algorithm is significantly more complicated, accounts for more edge conditions (e.g.
// overlapping zones and the exclusion zone) and has a concept of house values.
class GangZones extends HouseExtension {
    constructor(manager, economy, gangs) {
        super();

        this.loaded_ = false;

        this.economy_ = economy;
        this.manager_ = manager;

        // Set of houses that are part of a gang zone.
        this.participatingHouses_ = new Set();

        // Number of times that the gang zones have been recomputed.
        this.recomputationCounter_ = 0;

        this.gangs_ = gangs;
        this.gangs_.addReloadObserver(this, feature => feature.addObserver(this));

        // Observe mutations to gangs. When a player joins or leaves a gang we may have to recompute
        // the gang zones that are to be drawn on the map.
        this.gangs_().addObserver(this);
    }

    // Gets the number of times that the gang zones have been recomputed.
    get recomputationCounter() { return this.recomputationCounter_; }

    // ---------------------------------------------------------------------------------------------

    // Triggers a full recomputation of the gang zones that should be created on Las Venturas
    // Playground. Will only swap out the zones when one or more zones have changed.
    async recomputeZones() {
        this.recomputationCounter_++;

        // TODO: Implement the algorithm.
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the gangs feature has finished loading. A recomputation of all gang zones on the
    // map will be triggered at this point.
    onLoaded() {
        this.loaded_ = true;
        this.recomputeZones();
    }

    // Called when a house has been purchased. Will recompute zones unless the house system hasn't
    // finished loading yet, in which case we don't want to flood the systems with joins.
    onHouseCreated(location) {
        if (this.loaded_ && location.settings.ownerGangId)
            this.recomputeZones();
    }

    // Called when a player identified by |userId| has joined a gang identified by |gangId|. This
    // might mean that the gang's area now qualifies to be considered a gang zone.
    onUserJoinGang(userId, gangId) {
        if (this.manager_.getHousesForUser(userId).length > 0)
            this.recomputeZones();
    }

    // Called when a player identified by |userId| has left a gang identified by |gangId|. When the
    // gang owns a gang zone, it may mean the zone's critical mass has now disappeared.
    onUserLeaveGang(userId, gangId) {
        for (const location of this.manager_.getHousesForUser(userId)) {
            if (!this.participatingHouses_.has(location))
                continue;

            this.recomputeZones();
            return;
        }
    }

    // Called when the |location| has been removed. The gang zones will have to be recomputed when
    // the |location| previously was part of a zone.
    onHouseRemoved(location) {
        if (this.participatingHouses_.has(location))
            this.recomputeZones();
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.gangs_().removeObserver(this);
    }
}

export default GangZones;
