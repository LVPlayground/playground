// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Portal = require('features/location/portal.js');
const PortalLoader = require('features/location/portal_loader.js');
const ScopedEntities = require('entities/scoped_entities.js');

// The default interior markers are disabled on Las Venturas Playground, instead we provide our own.
// This enables the system to determine whether it's OK for a player to enter the interior, which
// may have to be prevented because they recently were in a fight, and means that we can send them
// to their private virtual worlds avoiding needless interior fighting restrictions.
class InteriorManager {
    constructor() {
        this.portalEntities_ = new ScopedEntities();
        this.portalLoader_ = new PortalLoader();
        this.portalMarkers_ = new Map();

        // Map of all portals on the server, to a boolean of whether they're toggleable or not.
        this.portals_ = new Map();

        // The pickup that a player is expected to enter next. Should be ignored to avoid loops.
        this.expectedPickup_ = new WeakMap();

        server.pickupManager.addObserver(this);
    }

    // Gets the number of portals that have been created on the server.
    get portalCount() { return this.portals_.size; }

    // Gets the number of markers that have been created on the server.
    get markerCount() { return this.portalMarkers_.size; }

    // Loads the portals from the |filename|. They will be added as toggleable portals, different
    // from the portals added programmatically by other features.
    loadPortalFile(filename) {
        const portals = this.portalLoader_.fromFile(filename);
        portals.forEach(portal =>
            this.createPortal(portal, true /* isToggleable */));
    }

    // Creates the |portal| in the Interior Manager, i.e. the actual pickups that represent the
    // portal and can be used by players, together with the information required for actually
    // dealing with the event of a player entering a pickup.
    createPortal(portal, isToggleable = false) {
        if (!(portal instanceof Portal))
            throw new Error('Portals must be instances of the Portal object.');

        this.portals_.set(portal, isToggleable);
        if (portal.disabled)
            return;

        const entrancePickup = this.portalEntities_.createPickup({
            modelId: 19902 /* yellow entrance marker */,
            position: portal.entrancePosition,
            virtualWorld: portal.entranceVirtualWorld
        });

        const exitPickup = this.portalEntities_.createPickup({
            modelId: 19902 /* yellow entrance marker */,
            position: portal.exitPosition,
            virtualWorld: portal.exitVirtualWorld
        });

        this.portalMarkers_.set(entrancePickup, { portal, type: 'entrance', peer: exitPickup });
        this.portalMarkers_.set(exitPickup, { portal, type: 'exit', peer: entrancePickup });
    }

    // Called when a player enters a pickup. Teleport the player to the marker's destination if the
    // |pickup| is a portal, and the |player| is allowed to teleport.
    onPlayerEnterPickup(player, pickup) {
        const marker = this.portalMarkers_.get(pickup);
        if (!marker)
            return;  // the |pickup| does not represent one of the portals

        if (this.expectedPickup_.get(player) === pickup)
            return;  // they're expected to have stepped in this pickup

        this.expectedPickup_.set(player, marker.peer);

        const portal = marker.portal;

        switch (marker.type) {
            case 'entrance':
                player.position = portal.exitPosition;
                player.rotation = portal.exitFacingAngle;
                player.interiorId = portal.exitInteriorId;
                player.virtualWorld = portal.exitVirtualWorld;
                break;
            case 'exit':
                player.position = portal.entrancePosition;
                player.rotation = portal.entranceFacingAngle;
                player.interiorId = portal.entranceInteriorId;
                player.virtualWorld = portal.entranceVirtualWorld;
                break;
            default:
                throw new Error('Unexpected marker type: ' + marker.type);
        }
    }

    // Called when the |player| has left the |pickup|.
    onPlayerLeavePickup(player, pickup) {
        if (this.expectedPickup_.get(player) === pickup)
            this.expectedPickup_.delete(player);
    }

    dispose() {
        server.pickupManager.removeObserver(this);

        this.portalEntities_.dispose();
        this.portalEntities_ = null;
    }
}

exports = InteriorManager;
