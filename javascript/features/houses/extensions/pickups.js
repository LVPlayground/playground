// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const alert = require('components/dialogs/alert.js');
const confirm = require('components/dialogs/confirm.js');

const HouseExtension = require('features/houses/house_extension.js');
const Menu = require('components/menu/menu.js');
const StoredPickup = require('features/streamer/stored_pickup.js');

// Delay, in seconds, after which a health pickup in a house respawns.
const HealthPickupRespawnDelay = 180;

// Delay, in seconds, after which an armour pickup in a house respawns.
const ArmourPickupRespawnDelay = 180;

// Extension that allows players to place health and armour pickups in their house.
class Pickups extends HouseExtension {
    constructor(manager, economy, streamer) {
        super();

        this.manager_ = manager;
        this.economy_ = economy;

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
        menu.addItem('Pickup settings', '-', async(player) => {
            const pickupMenu = new Menu('Choose one of the pickups', ['Pickup', 'Purchased?']);
            const features = {
                health: 'Health pickup',
                armour: 'Armour pickup'
            };

            for (const [feature, name] of Object.entries(features)) {
                const alreadyPurchased = location.interior.features.has(feature);
                const label = alreadyPurchased ? '{FFFF00}Yes' : 'No';

                const normalizedName = name.toLowerCase();

                // Add an item to |pickupMenu| personalized for the |feature|.
                pickupMenu.addItem(name, label, async(player) => {
                    if (alreadyPurchased) {
                        const confirmed = await confirm(player, {
                            title: 'Do you really want to remove the pickup?',
                            message: Message.format(
                                Message.HOUSE_SETTINGS_PICKUP_REMOVE, normalizedName)
                        });

                        if (!confirmed)
                            return await pickupMenu.displayForPlayer(player);

                        await this.removeFeature(location, feature);
                        await alert(player, {
                            title: 'The pickup has been removed!',
                            message: Message.format(
                                Message.HOUSE_SETTINGS_PICKUP_REMOVED, normalizedName)
                        });

                        return;
                    }

                    // TODO: Ask the Economy feature for the price of this pickup.
                    const price = 25000000;

                    const confirmed = await confirm(player, {
                        title: 'Do you want to purchase this pickup?',
                        message: Message.format(
                            Message.HOUSE_SETTINGS_PICKUP_PURCHASE, normalizedName, price)
                    });

                    if (!confirmed)
                        return await pickupMenu.displayForPlayer(player);

                    // TODO: Take the money from the |player|.

                    // TODO: Should we enable the player to choose the position?
                    const position = new Vector(...location.interior.getData().features[feature]);

                    await this.createFeature(location, feature, position);
                    await alert(player, {
                        title: 'The pickup has been purchased!',
                        message: Message.format(
                            Message.HOUSE_SETTINGS_PICKUP_PURCHASED, normalizedName)
                    });
                });
            }

            await pickupMenu.displayForPlayer(player);
        });
    }

    // ---------------------------------------------------------------------------------------------

    // Creates the |feature| to |location| at the given |position|.
    async createFeature(location, feature, position) {
        await this.manager_.database.createHouseFeature(location, feature, position);

        // Creates the |feature| to be known in the |location|'s settings.
        location.interior.features.set(feature, position);

        // Creates the pickup that will enable the |feature| to be used.
        this.internalCreatePickup(location, feature, position);
    }

    // Removes the |feature| from the |location|.
    async removeFeature(location, feature) {
        await this.manager_.database.removeHouseFeature(location, feature);

        // Removes the |feature| from the |location|'s settings.
        location.interior.features.delete(feature);

        // Removes the pickup that enabled the |feature| to be used.
        this.internalDeletePickup(location, feature);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when a house has been created in the |location|. The pickups, when available, will
    // be created on behalf of the location.
    onHouseCreated(location) {
        for (const [feature, position] of location.interior.features)
            this.internalCreatePickup(location, feature, position);
    }

    // Called when the house in the |location| is about to be removed. Remove any pickups from the
    // streamer that were created as part of it.
    onHouseRemoved(location) {
        const storedPickups = this.locations_.get(location);
        if (!storedPickups)
            return;  // the |location| has no pickup features

        for (const [feature, storedPickup] of storedPickups)
            this.streamer.delete(storedPickup);

        this.locations_.delete(location);
    }

    // ---------------------------------------------------------------------------------------------

    // Creates the pickup responsible for providing |feature| for the |location|. Does not return
    // any value. The streamer will be responsible for making sure the pickup works.
    internalCreatePickup(location, feature, position) {
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
            return;  // not one of the features supported by this extension

        if (!this.locations_.has(location))
            this.locations_.set(location, new Map());

        const storedPickup = new StoredPickup({
            type: Pickup.TYPE_PERSISTENT,
            virtualWorld: VirtualWorld.forHouse(location),

            modelId, position, respawnDelay,

            enterFn: Pickups.prototype.onFeatureActivate.bind(this, location, feature)
        });

        this.locations_.get(location).set(feature, storedPickup);
        this.streamer.add(storedPickup);
    }

    // Deletes the pickup responsible for providing |feature| for the |location|. Does not return
    // any value. The pickup will be removed from the streamer immediately.
    internalDeletePickup(location, feature) {
        const features = this.locations_.get(location);
        if (!features)
            throw new Error('The |location| does not have any registered pickups.');

        const storedPickup = features.get(feature);
        if (!storedPickup)
            throw new Error('The |feature| has not been enabled for the |location|.');

        features.delete(feature);

        if (!features.size)
            this.locations_.delete(location);

        this.streamer.delete(storedPickup);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |feature| has to be activated for the |player|.
    onFeatureActivate(location, feature, player) {
        const isOwner = player.userId == location.settings.ownerId;
        const owner = location.settings.ownerName;

        switch (feature) {
            case 'health':
                if (isOwner) {
                    player.sendMessage(Message.HOUSE_PICKUP_HEALTH_RESTORED_SELF);
                } else {
                    player.sendMessage(Message.HOUSE_PICKUP_HEALTH_RESTORED, owner);
                    // TODO: Send a notification to the owner if they're currently in-game.
                }

                player.health = 100;
                break;

            case 'armour':
                if (isOwner) {
                    player.sendMessage(Message.HOUSE_PICKUP_ARMOUR_RESTORED_SELF);
                } else {
                    player.sendMessage(Message.HOUSE_PICKUP_ARMOUR_RESTORED, owner);
                    // TODO: Send a notification to the owner if they're currently in-game.
                }

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
            for (const storedPickup of storedPickups.values())
                streamer.add(storedPickup);
        }
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.streamer_.removeReloadObserver(this);

        {
            const streamer = this.streamer;

            for (const storedPickups of this.locations_.values()) {
                for (const storedPickup of storedPickups.values())
                    streamer.delete(storedPickup);
            }
        }

        this.locations_.clear();
        this.locations_ = null;
    }
}

exports = Pickups;
