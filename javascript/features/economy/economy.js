// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import EconomyCalculator from 'features/economy/economy_calculator.js';
import Feature from 'components/feature_manager/feature.js';
import ResidentialValueMap from 'features/economy/residential_value_map.js';
import VehicleValueMap from 'features/economy/vehicle_value_map.js';

// The economy feature provides a lower-level interface enabling other features to figure out the
// right price to charge for a certain thing, or the right prize to award for a certain event.
class Economy extends Feature {
    constructor() {
        super();

        this.economyCalculator_ = new EconomyCalculator();
        this.residentialValueMap_ = new ResidentialValueMap();
        this.vehicleValueMap_ = new VehicleValueMap();
    }

    // ---------------------------------------------------------------------------------------------
    // Public API of the economy feature.
    // ---------------------------------------------------------------------------------------------

    // Calculates and returns the price of a house at |position| with the given |interiorValue|,
    // which must be in range of [0, 9]. A variance factor will be applied to the price.
    calculateHousePrice(position, parkingLotCount, interiorValue) {
        return this.economyCalculator_.calculateHousePrice(
            /* residentialValue */ this.residentialValueMap_.query(position),
            /* parkingLotCount */  parkingLotCount,
            /* interiorValue */    interiorValue);
    }

    // Calculates the value of a house after it has been in possession of a particular player for
    // |ownershipDuration| seconds. Different from normal economics, the value of a house increases
    // as the player owns it for a longer amount of time, to discourage players from switching
    // houses very frequently (which will turn out expensive for them).
    calculateHouseValue(position, parkingLotCount, interiorValue, ownershipDuration) {
        return this.economyCalculator_.calculateHouseValue(
            /* purchasePrice */     this.calculateHousePrice(
                                        position, parkingLotCount, interiorValue),
            /* ownershipDuration */ ownershipDuration);
    }

    // Calculates the price for the given |feature| for a house at |position|.
    calculateHouseFeaturePrice(position, feature) {
        let featureValue = null;

        switch (feature) {
            case 'health':  // health pickup
            case 'armour':  // armour pickup
                featureValue = 2;
                break;

            default:
                throw new Error('Unrecognized house feature: ' + feature);
        }

        return this.economyCalculator_.calculateHouseFeaturePrice(
            /* residentialValue */ this.residentialValueMap_.query(position),
            /* parkingLotCount */  featureValue);
    }

    // Calculates and returns the price of placing a vehicle with |modelId| at the |position|.
    // A variance factor will be applied to the price.
    calculateHouseVehiclePrice(position, modelId) {
        return this.economyCalculator_.calculateHouseVehiclePrice(
            /* residentialValue */ this.residentialValueMap_.query(position),
            /* vehicleValue */     this.vehicleValueMap_.query(modelId));
    }

    // Returns whether the |position| is located in one of the residential exclusion zones, that is,
    // areas on the map where we don't allow residential activity.
    isResidentialExclusionZone(position) {
        return this.residentialValueMap_.query(position) === 5;
    }

    // Calculated and returns the prize for a few minutes of killtime. It is calculated bases on the
    // amount of players multiplied by kills. It always returns a minimum of 25k.
    calculateKilltimeAwardPrize(participants, kills) {
        return this.economyCalculator_.calculateKilltimeAwardPrize(participants, kills);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.economyCalculator_.dispose();
    }
}

export default Economy;
