// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * In order to be able to accept Property Events in all layers of the gamemode, we need to abstract
 * the happenings of property events in a separate, higher-up class.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class PropertyEvents {
    /**
     * When a player modifies their vehicle, for example in a modification shop by changing the colors
     * or adding a new modification, they modify their vehicle. The owner of the cash-for-vehicle-
     * modification property will get a small amount of money.
     */
    public onVehicleModified() {
        new propertyId = PropertyManager->propertyForSpecialFeature(VehicleModificationsFeature);
        if (propertyId != Property::InvalidId && Property(propertyId)->ownerId() != Player::InvalidId)
            GiveRegulatedMoney(Property(propertyId)->ownerId(), CustomizationShopOwnerShare);
    }

    /**
     * When a player buys a property flagged with a special feature, we'll have to inform the player
     * about this special feature.
     *
     * @param playerId Id of the player who bought the property.
     * @param feature The special feature set.
     */
    public handleFeatureInformation(playerId, PropertyFeature: feature) {
        switch (feature) {
            case ReadGroupConversationsFeature: {
                SendClientMessage(playerId, Color::PropertyFeatureText,
                    "With the purchase of the Seti @ Home satellite, you'll be able to see gang messages of other people!");

                CallRemoteFunction("OnSetiOwnershipChange", "i", playerId);
            }
            case CustomTaxAirportFeature: {
                SendClientMessage(playerId, Color::PropertyFeatureText,
                    "With the purchase of the Las Venturas Airport, you can set the customs tax using /customtax.");
                SendClientMessage(playerId, Color::PropertyFeatureText,
                    "You'll also earn a percentage of customs tax that is earned as players enter the airport.");
            }

            case BombshopFeature:
                SendClientMessage(playerId, Color::PropertyFeatureText,
                    "You now own the Las Venturas bombshop! You'll receive a percentage of the money customers spend on bombs.");

            case FreeTeleportFeature:
                SendClientMessage(playerId, Color::PropertyFeatureText,
                    "You now own the Area 69's main control lab. Being the owner, you can (car)teleport for free!");

            case LoansFeature: {
                SendClientMessage(playerId, Color::PropertyFeatureText,
                    "You now own the Las Venturas Main bank! You'll receive a percentage of income paid from borrowed money,");
                SendClientMessage(playerId, Color::PropertyFeatureText, "and can set the interest rate using /interest!");
            }

            case BarFeature: {
                SendClientMessage(playerId, Color::PropertyFeatureText,
                    "You now own the Craw Bar!");
                SendClientMessage(playerId, Color::PropertyFeatureText, "You'll receive a percentage of the customers' money every time somebody purchases a drink.");
            }

            case TaxiCompanyFeature: {
                SendClientMessage(playerId, Color::PropertyFeatureText,
                    "You now own the Kaufman Cabs! Being the owner, you can use the service for free,");
                SendClientMessage(playerId, Color::PropertyFeatureText,
                    " and you'll receive a percentage every time somebody uses the service. You can set a new taxi price using /taxiprice.");
            }

            case PoliceFeature:
                SendClientMessage(playerId, Color::PropertyFeatureText,
                    "With the Las Venturas Playground Police Department, you'll receive a percentage of money made from Wanted Levels.");

            case ExportFeature: {
                SendClientMessage(playerId, Color::PropertyFeatureText, "You now own the Las Venturas Exports!");
                SendClientMessage(playerId, Color::PropertyFeatureText,
                    "Everytime a player exports a vehicle, you'll earn 10 percent of that vehicle's value!");
            }

            case ArmourFeature:
                SendClientMessage(playerId, Color::PropertyFeatureText,
                    "You now own the Ammu-nation, you'll regain some armour every so often!");

            case HealthFeature:
                SendClientMessage(playerId, Color::PropertyFeatureText,
                    "With the purchase of the Fort Carson Medical Center, you'll regain some health every so often!");

            case WeaponsAmmoFeature:
                SendClientMessage(playerId, Color::PropertyFeatureText,
                    "You now own the Shooting Range! You'll receive some ammo for your weapons every so often!");

            case HealthProtectionFeature: {
                SendClientMessage(playerId, Color::PropertyFeatureText, "You now own the LVP HeadQuarters!");
                SendClientMessage(playerId, Color::PropertyFeatureText,
                    "Nobody is able to buy this property if you're near it, and you'll regain some health every so often.");
            }
        }
    }
};

forward OnSetiOwnershipChange(playerid);
public OnSetiOwnershipChange(playerid) {}
