// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ObjectGroup = require('entities/object_group.js');
const Portal = require('features/location/portal.js');
const PortalLoader = require('features/location/portal_loader.js');
const ScopedEntities = require('entities/scoped_entities.js');

// The radius around a portal's entrance within which the label will be visible.
const PORTAL_LABEL_DRAW_DISTANCE = 20;

// The default interior markers are disabled on Las Venturas Playground, instead we provide our own.
// This enables the system to determine whether it's OK for a player to enter the interior, which
// may have to be prevented because they recently were in a fight, and means that we can send them
// to their private virtual worlds avoiding needless interior fighting restrictions.
class InteriorManager {
    constructor(interiorAbuseManager) {
        this.interiorAbuseManager_ = interiorAbuseManager;

        this.portalEntities_ = new ScopedEntities();
        this.portalLoader_ = new PortalLoader();

        this.portalLabels_ = new Map();
        this.portalMarkers_ = new Map();

        // Map of all portals on the server, to an object containing settings about the portal.
        this.portals_ = new Map();

        // The pickup that a player is expected to enter next. Should be ignored to avoid loops.
        this.expectedPickup_ = new WeakMap();

        // Fixes up a few unsolid pieces in interiors to make them properly usable.
        this.objectsToFixInteriors_ = ObjectGroup.create('data/objects/fix_interiors.json');

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

    // ---------------------------------------------------------------------------------------------

    // Creates the |portal| in the Interior Manager, i.e. the actual pickups that represent the
    // portal and can be used by players, together with the information required for actually
    // dealing with the event of a player entering a pickup.
    createPortal(portal, isToggleable = false) {
        if (portal.disabled) {
            this.portals_.set(portal, {
                toggleable: isToggleable,
                entrancePickup: null,
                exitPickup: null
            });

            return;
        }

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

        // Create the portal's label in the world if one has been defined.
        if (portal.label)
            this.portalLabels_.set(portal, this.createLabel(portal));

        this.portalMarkers_.set(entrancePickup, { portal, type: 'entrance', peer: exitPickup });
        this.portalMarkers_.set(exitPickup, { portal, type: 'exit', peer: entrancePickup });
        this.portals_.set(portal, {
            toggleable: isToggleable,
            entrancePickup: entrancePickup,
            exitPickup: exitPickup
        });
    }

    // Updates the |portal|'s label to be |label|. If the |label| either is not a string, or is the
    // empty string, then the |portal| will remove its label altogether.
    updatePortalLabel(portal, label) {
        if (!this.portals_.has(portal))
            throw new Error('The given Portal is not known to the interior manager.');

        // Remove the existing label if one has been added already.
        const existingLabel = this.portalLabels_.get(portal);
        if (existingLabel)
            existingLabel.dispose();

        // Update the |portal| status depending on the value of |label|.
        portal.label = typeof label === 'string' && label.length ? label
                                                                 : null;

        if (portal.label)
            this.portalLabels_.set(portal, this.createLabel(portal));
        else
            this.portalLabels_.delete(portal);
    }

    // Makes |player| enter the |portal|. The given |direction| must be one of ["entrance","exit"].
    // Permission checks will be skipped for this API.
    enterPortal(player, portal, direction) {
        if (!this.portals_.has(portal))
            throw new Error('The given Portal is not known to the interior manager.');

        const { toggleable, entrancePickup, exitPickup } = this.portals_.get(portal);

        switch (direction) {
            case 'entrance':
                this.expectedPickup_.set(player, exitPickup);

                if (portal.enterFn)
                    portal.enterFn(player);

                player.position = portal.exitPosition.translate({ z: 1 });
                player.rotation = portal.entranceFacingAngle;
                player.interiorId = portal.exitInteriorId;
                player.virtualWorld = portal.exitVirtualWorld;
                player.resetCamera();
                break;

            case 'exit':
                this.expectedPickup_.set(player, entrancePickup);

                if (portal.exitFn)
                    portal.exitFn(player);

                player.position = portal.entrancePosition.translate({ z: 1 });
                player.rotation = portal.exitFacingAngle;
                player.interiorId = portal.entranceInteriorId;
                player.virtualWorld = portal.entranceVirtualWorld;
                player.resetCamera();
                break;

            default:
                throw new Error('Unexpected direction: ' + direction);
        }
    }

    // Removes the |portal| from the interior manager. The associated pickups will be removed as
    // well. Note that players who are on the opposite end of the portal will not be able to return.
    removePortal(portal) {
        if (!this.portals_.has(portal))
            throw new Error('The given Portal is not known to the interior manager.');

        const { toggleable, entrancePickup, exitPickup } = this.portals_.get(portal);

        // Remove the label that has been associated with this portal's entrance.

        const label = this.portalLabels_.get(portal);
        if (label)
            label.dispose();

        // It's possible that there are no entrance or exit pickups when the portal had been
        // disabled, which is possible for portals imported from a portal definition

        if (entrancePickup) {
            this.portalMarkers_.delete(entrancePickup);
            entrancePickup.dispose();
        }

        if (exitPickup) {
            this.portalMarkers_.delete(exitPickup);
            exitPickup.dispose();
        }

        this.portals_.delete(portal);
    }

    // ---------------------------------------------------------------------------------------------

    // Determines if the |player| is allowed to enter the |portal|. Players can always exit a portal
    // that they previously entered- otherwise they would be locked inside.
    async canPlayerTeleport(player, portal) {
        if (portal.accessCheckFn !== null && !await portal.accessCheckFn(player))
            return false;  // the |portal|-specific check failed

        if (!this.interiorAbuseManager_.canPlayerTeleport(player))
            return false;  // the interior-abuse check failed.

        return true;
    }

    // ---------------------------------------------------------------------------------------------

    // Called when a player enters a pickup. Teleport the player to the marker's destination if the
    // |pickup| is a portal, and the |player| is allowed to teleport.
    async onPlayerEnterPickup(player, pickup) {
        const marker = this.portalMarkers_.get(pickup);
        if (!marker)
            return;  // the |pickup| does not represent one of the portals

        if (this.expectedPickup_.get(player) === pickup)
            return;  // they're expected to have stepped in this pickup

        const portal = marker.portal;

        // Apply the permission check if the |player| is attempting to enter the portal.
        if (marker.type === 'entrance') {
            if (!await this.canPlayerTeleport(player, portal))
                return;  // the player is not allowed to teleport right now
        }

        // Make the |player| enter or exit the |portal| with the shared infrastructure.
        this.enterPortal(player, portal, marker.type);
    }

    // Called when the |player| has left the |pickup|.
    onPlayerLeavePickup(player, pickup) {
        if (this.expectedPickup_.get(player) === pickup)
            this.expectedPickup_.delete(player);
    }

    // ---------------------------------------------------------------------------------------------

    // Creates a label for the |portal|.
    createLabel(portal) {
        return this.portalEntities_.createTextLabel({
            position: portal.entrancePosition.translate({ z: 2.3 }),
            drawDistance: PORTAL_LABEL_DRAW_DISTANCE,
            testLineOfSight: true,

            color: Color.WHITE,
            text: portal.label
        });
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.pickupManager.removeObserver(this);

        this.portalEntities_.dispose();
        this.portalEntities_ = null;
    }
}

exports = InteriorManager;
