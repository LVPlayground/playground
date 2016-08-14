// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ScopedEntities = require('entities/scoped_entities.js');

// The JSON data file in which all the interior markers have been defined.
const INTERIOR_MARKERS_FILE = 'data/interior_markers.json';
const INTERIOR_MARKERS_MINIGAME_FILE = 'data/interior_markers_minigames.json';

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

        // The pickup that a player is expected to be teleported to.
        this.expectedPickup_ = new WeakMap();

        // The most recent marker that a player has entered.
        this.latestMarker_ = new WeakMap();

        const markers = JSON.parse(readFile(INTERIOR_MARKERS_FILE));
        markers.forEach((marker, markerId) =>
            this.loadMarker(marker, markerId, VirtualWorld.forInterior(markerId), false));

        const minigameMarkers = JSON.parse(readFile(INTERIOR_MARKERS_MINIGAME_FILE));
        minigameMarkers.forEach((marker, markerId) =>
            this.loadMarker(marker, markerId, marker.virtualWorld, true));

        server.pickupManager.addObserver(this);
    }

    // Gets the number of interior markers that have been created on the map.
    get markerCount() { return this.markers_.size; }

    // Returns the name of the latest marker the |player| has passed through.
    getLatestMarkerForPlayer(player) { return this.latestMarker_.get(player); }

    // Loads the |marker|. Each defined marker must have an entry position and a return position,
    // which create for a linked set of markers. Each position exists of an ID, 3D vector containing
    // the actual position, rotation for the player to animate to and the destination interior Id.
    loadMarker(marker, count, virtualWorld, shareVirtualWorld) {
        const entranceMarker = marker.entry;
        const entrancePosition = new Vector(...entranceMarker.position);
        const entranceWorld = shareVirtualWorld ? virtualWorld : 0 /* main world */;

        const exitMarker = marker.return;
        const exitPosition = new Vector(...exitMarker.position);
        const exitWorld = virtualWorld;

        const entrancePickup = this.entities_.createPickup({
            modelId: 19902 /* yellow entrance marker */,
            position: entrancePosition,
            virtualWorld: entranceWorld
        });

        this.markers_.set(entrancePickup, {
            name: entranceMarker.id + ':ENTER',

            // Animation direction
            rotation: exitMarker.rotation,

            // Destination
            destination: exitPosition.translate({ z: 1 }),
            rotation: entranceMarker.rotation % 360,

            interiorId: exitMarker.interiorId,
            virtualWorld: exitWorld
        });

        const exitPickup = this.entities_.createPickup({
            modelId: 19902 /* yellow entrance marker */,
            position: exitPosition,
            virtualWorld: exitWorld
        });

        this.markers_.set(exitPickup, {
            name: exitMarker.id + ':EXIT',

            // Animation direction
            rotation: entranceMarker.rotation,

            // Destination
            destination: entrancePosition.translate({ z: 1 }),
            rotation: entranceMarker.rotation % 360,

            interiorId: entranceMarker.interiorId,
            virtualWorld: entranceWorld
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

        this.expectedPickup_.set(player, marker.expectedPickup);
        this.latestMarker_.set(player, marker.name);

        if ((Math.random() * 10) >= 7 /* 30% chance */)
            player.sendMessage(Message.INTERIOR_FACING_ANGLE_PROMO);

        player.position = marker.destination;
        player.rotation = marker.rotation;

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
