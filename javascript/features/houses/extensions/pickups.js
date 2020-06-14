// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import HouseExtension from 'features/houses/house_extension.js';
import { Menu } from 'components/menu/menu.js';
import ScopedEntities from 'entities/scoped_entities.js';
import { VirtualWorld } from 'entities/virtual_world.js';

import { alert } from 'components/dialogs/alert.js';
import { confirm } from 'components/dialogs/confirm.js';

// Delay, in seconds, after which a health pickup in a house respawns.
const HealthPickupRespawnDelay = 180;

// Delay, in seconds, after which an armour pickup in a house respawns.
const ArmourPickupRespawnDelay = 180;

// Extension that allows players to place health and armour pickups in their house.
class Pickups extends HouseExtension {
    constructor(manager, economy, finance) {
        super();

        this.manager_ = manager;
        this.economy_ = economy;
        this.finance_ = finance;

        this.entities_ = new ScopedEntities();
        this.pickups_ = new Map();

        server.pickupManager.addObserver(this);
    }

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

                    // Determine the price of the |feature| based on the house's location in San
                    // Andreas, as well as the value of the given |feature| itself.
                    const price =
                        this.economy_().calculateHouseFeaturePrice(location.position, feature);

                    const balance = await this.finance_().getPlayerAccountBalance(player);
                    if (balance < price) {
                        return await alert(player, {
                            title: 'The pickup is too expensive!',
                            message: Message.format(
                                Message.HOUSE_SETTINGS_PICKUP_EXPENSIVE, normalizedName, price,
                                balance)
                        });
                    }

                    const confirmed = await confirm(player, {
                        title: 'Do you want to purchase this pickup?',
                        message: Message.format(
                            Message.HOUSE_SETTINGS_PICKUP_PURCHASE, normalizedName, price)
                    });

                    if (!confirmed)
                        return await pickupMenu.displayForPlayer(player);

                    await this.finance_().withdrawFromPlayerAccount(player, price);

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

    // Called when the house in the |location| is about to be removed. This method also is O(n) in
    // time complexity on the number of pickups, but removing a house is super rare.
    onHouseRemoved(houseLocation) {
        for (const [ pickup, { location } ] of this.pickups_) {
            if (location !== houseLocation)
                continue;
            
            pickup.dispose();
            
            this.pickups_.delete(pickup);
        }
    }

    // ---------------------------------------------------------------------------------------------

    // Creates the pickup responsible for providing |feature| for the |location|.
    internalCreatePickup(location, feature, position) {
        let modelId = null;
        let respawnDelay = null;

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

        const pickup = this.entities_.createPickup({
            modelId, position, respawnDelay,
            virtualWorld: VirtualWorld.forHouse(location),
        });

        this.pickups_.set(pickup, { location, feature });
    }

    // Deletes the pickup responsible for providing |feature| for the |location|. This method is
    // O(n) in time complexity on the number of pickups, but should be rather infrequent.
    internalDeletePickup(houseLocation, houseFeature) {
        for (const [ pickup, { location, feature } ] of this.pickups_) {
            if (location !== houseLocation || feature !== houseFeature)
                continue;
            
            pickup.dispose();

            this.pickups_.delete(pickup);
            return;
        }

        throw new Error(`Unable to find pickup for ${houseFeature} of the given ${houseLocation}.`);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |player| has picked up the given |pickup|.
    onPlayerEnterPickup(player, pickup) {
        if (!this.pickups_.has(pickup))
            return;  // the |pickup| is owned by another feature
        
        const { location, feature } = this.pickups_.get(pickup);

        const isOwner = player.account.userId == location.settings.ownerId;

        const ownerName = location.settings.ownerName;
        const owner = location.settings.owner;

        switch (feature) {
            case 'health':
                player.health = 100;

                if (isOwner) {
                    player.sendMessage(Message.HOUSE_PICKUP_HEALTH_RESTORED_SELF);
                    break;
                }

                // The player does not own the house, send a different message and inform the owner.
                player.sendMessage(Message.HOUSE_PICKUP_HEALTH_RESTORED, ownerName);
                if (owner)
                   owner.sendMessage(Message.HOUSE_PICKUP_HEALTH_USED, player.name, player.id);

                break;

            case 'armour':
                player.armour = 100;

                if (isOwner) {
                    player.sendMessage(Message.HOUSE_PICKUP_ARMOUR_RESTORED_SELF);
                    break;
                }

                // The player does not own the house, send a different message and inform the owner.
                player.sendMessage(Message.HOUSE_PICKUP_ARMOUR_RESTORED, ownerName);
                if (owner)
                    owner.sendMessage(Message.HOUSE_PICKUP_ARMOUR_USED, player.name, player.id);

                break;

            default:
                throw new Error('Invalid feature activated: ' + feature);
        }
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.pickupManager.removeObserver(this);

        this.entities_.dispose();
        this.entities_ = null;

        this.pickups_.clear();
    }
}

export default Pickups;
