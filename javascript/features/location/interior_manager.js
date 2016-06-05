// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ScopedEntities = require('entities/scoped_entities.js');
const Vector = require('base/vector.js');

// The JSON data file in which all the interior markers have been defined.
const InteriorMarkersFile = 'data/interior_markers.json';

// The number of units a player will be teleported in front of the return marker. Must be larger
// than the range of a pickup, otherwise the player may get stuck in a teleportation loop.
const PositionOffset = 2;

// The default interior markers are disabled on Las Venturas Playground, instead we provide our own.
// This enables the system to determine whether it's OK for a player to enter the interior, which
// may have to be prevented because they recently were in a fight, and means that we can send them
// to their private virtual worlds avoiding needless interior fighting restrictions.
class InteriorManager {
    constructor() {
        this.entities_ = new ScopedEntities();
        this.markers_ = new Map();

        this.expectedPickup_ = new WeakMap();

        server.pickupManager.addObserver(this);

        const markers = JSON.parse(readFile(InteriorMarkersFile));

        // Allocate Virtual Worlds for each of the interiors that will be created.
        this.virtualWorlds_ = server.virtualWorldManager.allocateBlock(markers.length);

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
        const entrancePosition = new Vector(entranceMarker.position[0], entranceMarker.position[1],
                                            entranceMarker.position[2] + 1);

        const exitMarker = marker.return;
        const exitPosition = new Vector(exitMarker.position[0], exitMarker.position[1],
                                        exitMarker.position[2] + 1);

        const virtualWorld = this.virtualWorlds_.allocate();

        const entrancePickup = this.entities_.createPickup({
            modelId: 19902 /* yellow entrance marker */,
            position: new Vector(...entranceMarker.position),
            virtualWorld: entranceMarker.dimension
        });

        this.markers_.set(entrancePickup, {
            // Animation direction
            //rotation: entranceMarker.rotation,

            // Destination
            destination: exitPosition,//.translateTo2D(PositionOffset, exitMarker.rotation),
            rotation: entranceMarker.rotation % 360,

            interiorId: exitMarker.interiorId,
            virtualWorld: virtualWorld
        });

        const exitPickup = this.entities_.createPickup({
            modelId: 19902 /* yellow entrance marker */,
            position: new Vector(...exitMarker.position),
            virtualWorld: virtualWorld
        });

        this.markers_.set(exitPickup, {
            // Animation direction
            //rotation: exitMarker.rotation,

            // Destination
            destination: entrancePosition,//.translateTo2D(PositionOffset, entranceMarker.rotation),
            rotation: entranceMarker.rotation % 360,

            interiorId: entranceMarker.interiorId,
            virtualWorld: entranceMarker.dimension
        });

        // Cross-associate the markers with each other so that we can block the follow-up pickup.
        this.markers_.get(exitPickup).expectedPickup = entrancePickup;
        this.markers_.get(entrancePickup).expectedPickup = exitPickup;
    }

    // Called when a player enters a pickup. Teleport the player to the marker's destination if the
    // |pickup| is an interior marker, and the |player| is allowed to teleport.
    onPlayerEnterPickup(player, pickup) {
        const marker = this.markers_.get(pickup);
        if (!marker)
            return;  // the |pickup| is not an interior marker

        if (this.expectedPickup_.get(player) === pickup)
            return;  // they're expected to have stepped in this pickup

        // TODO(Russell): Animate the player whilst they enter the interior.

        this.expectedPickup_.set(player, marker.expectedPickup);

        player.position = marker.destination;
        player.facingAngle = marker.rotation;

        player.interiorId = marker.interiorId;
        player.virtualWorld = marker.virtualWorld;
    }

    onPlayerLeavePickup(player, pickup) {
        if (this.expectedPickup_.get(player) === pickup)
            this.expectedPickup_.delete(player);
    }

    dispose() {
        server.pickupManager.removeObserver(this);

        this.entities_.dispose();
        this.entities_ = null;
        this.markers_ = null;
    }
}

exports = InteriorManager;
