// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const HouseExtension = require('features/houses/house_extension.js');
const StoredPickup = require('features/streamer/stored_pickup.js');

// Delay, in seconds, after which a health pickup in a house respawns.
const HealthPickupRespawnDelay = 180;

// Delay, in seconds, after which an armour pickup in a house respawns.
const ArmourPickupRespawnDelay = 180;

// Extension that allows players to place health and armour pickups in their house.
class Pickups extends HouseExtension {
    constructor(manager, streamer) {
        super();

        this.manager_ = manager;

        // Map of locations to the pickups created as part of them.
        this.locations_ = new Map();

        this.streamer_ = streamer;
        this.streamer_.addReloadObserver(this, Pickups.prototype.onStreamerReloaded);
    }

    // Gets the global instance of the PickupStreamer. Value should not be cached.
    get streamer() { return this.streamer_().getPickupStreamer(); }

    // ---------------------------------------------------------------------------------------------

    // Adds a menu item to |menu| that enables the player to select their desired pickups.
    onHouseSettingsCommand(player, location, menu) {
        if (!player.isManagement())
            return;  // this feature hasn't launched yet

        // TODO: Support and display a "Pickups" sub-menu.
    }

    // ---------------------------------------------------------------------------------------------

    // Called when a house has been created in the |location|. The pickups, when available, will
    // be created on behalf of the location.
    onHouseCreated(location) {
        for (const [feature, position] of location.interior.features) {
            let modelId = null;
            let respawnDelay = -1;

            switch (feature) {
                case 'health':
                    modelId = 1240;
                    respawnDelay = HealthPickupRespawnDelay;
                    break;

                case 'armour':
                    modelId = 1242;
                    respawnDelay = ArmourPickupRespawnDelay;
                    break;
            }

            if (!modelId)
                continue;  // not one of the features supported by this extension

            if (!this.locations_.has(location))
                this.locations_.set(location, new Set());

            const storedPickup = new StoredPickup({
                type: Pickup.TYPE_PERSISTENT,
                virtualWorld: VirtualWorld.forHouse(location),

                modelId, position, respawnDelay,

                enterFn: Pickups.prototype.onFeatureActivate.bind(this, feature)
            });

            this.locations_.get(location).add(storedPickup);
            this.streamer.add(storedPickup);
        }
    }

    // Called when the house in the |location| is about to be removed. Remove any pickups from the
    // streamer that were created as part of it.
    onHouseRemoved(location) {
        const storedPickups = this.locations_.get(location);
        if (!storedPickups)
            return;  // the |location| has no pickup features

        for (const storedPickup of storedPickups)
            this.streamer.delete(storedPickup);

        this.locations_.delete(location);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |feature| has to be activated for the |player|.
    onFeatureActivate(feature, player) {
        switch (feature) {
            case 'health':
                player.health = 100;
                break;

            case 'armour':
                player.armour = 100;
                break;

            default:
                throw new Error('Invalid feature activated: ' + feature);
        }
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the streamer has been reloaded. All pickups that were created as part of houses
    // should be re-added to the new instance.
    onStreamerReloaded() {
        const streamer = this.streamer;

        for (const storedPickups of this.locations_.values()) {
            for (const storedPickup of storedPickups)
                this.streamer_.add(storedPickup);
        }
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.streamer_.removeReloadObserver(this);

        {
            const streamer = this.streamer;

            for (const storedPickups of this.locations_.values()) {
                for (const storedPickup of storedPickups)
                    streamer.delete(storedPickup);
            }
        }

        this.locations_.clear();
        this.locations_ = null;
    }
}

exports = Pickups;
