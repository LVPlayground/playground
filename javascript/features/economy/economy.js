// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const EconomyCalculator = require('features/economy/economy_calculator.js');
const Feature = require('components/feature_manager/feature.js');
const ResidentialValueMap = require('features/economy/residential_value_map.js');

// The economy feature provides a lower-level interface enabling other features to figure out the
// right price to charge for a certain thing, or the right prize to award for a certain event.
class Economy extends Feature {
    constructor() {
        super();

        this.economyCalculator_ = new EconomyCalculator();
        this.residentialValueMap_ = new ResidentialValueMap();
    }

    // ---------------------------------------------------------------------------------------------
    // Public API of the economy feature.
    // ---------------------------------------------------------------------------------------------

    // Calculates and returns the price of a house at |position| with the given |interiorValue|,
    // which must be in range of [0, 9]. A variance factor will be applied to the price.
    calculateHousePrice(position, interiorValue) {
        this.economyCalculator_.calculateHousePrice(
            /* residentialValue */ this.residentialValueMap_.query(position),
            /* interiorValue */    interiorValue);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {}
}

exports = Economy;
