// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ScopedEntities = require('entities/scoped_entities.js');
const Vector = require('base/vector.js');

// The JSON data file in which all the interior markers have been defined.
const InteriorMarkersFile = 'data/interior_markers.json';

// The default interior markers are disabled on Las Venturas Playground, instead we provide our own.
// This enables the system to determine whether it's OK for a player to enter the interior, which
// may have to be prevented because they recently were in a fight, and means that we can send them
// to their private virtual worlds avoiding needless interior fighting restrictions.
class InteriorManager {
    constructor() {
        this.entities_ = new ScopedEntities();
        this.markers_ = new Map();

        const markers = JSON.parse(readFile(InteriorMarkersFile));
        markers.forEach(marker =>
            this.loadMarker(marker));
    }

    // Returns the number of interior markers that have been created on the map.
    get markerCount() { return this.markers_.size; }

    // Loads the |marker|. Each defined marker must have an entry position and a return position,
    // which create for a linked set of markers. Each position exists of an ID, 3D vector containing
    // the actual position, rotation for the player to animate to and the destination interior Id.
    loadMarker(marker) {
        const entranceMarker = marker.entry;
        const exitMarker = marker.return;

        const entrancePickup = this.entities_.createPickup({
            modelId: 19902 /* yellow entrance marker */,
            position: new Vector(...entranceMarker.position),
            virtualWorld: -1
        });

        this.markers_.set(entrancePickup, {
            // Animation direction
            rotation: entranceMarker.rotation,

            // Destination
            interiorId: exitMarker.interiorId,
            position: new Vector(...exitMarker.position)
        });

        const exitPickup = this.entities_.createPickup({
            modelId: 19902 /* yellow entrance marker */,
            position: new Vector(...exitMarker.position),
            virtualWorld: -1
        });

        this.markers_.set(exitPickup, {
            // Animation direction
            rotation: exitMarker.rotation,

            // Destination
            interiorId: exitMarker.interiorId,
            position: new Vector(...entranceMarker.position)
        });
    }

    dispose() {
        this.entities_.dispose();
        this.entities_ = null;
        this.markers_ = null;
    }
}

exports = InteriorManager;
