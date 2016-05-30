// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Feature = require('components/feature_manager/feature.js');
const ResidentialValueMap = require('features/economy/residential_value_map.js');

// The economy feature provides a lower-level interface enabling other features to figure out the
// right price to charge for a certain thing, or the right prize to award for a certain event.
class Economy extends Feature {
    constructor() {
        super();

        this.residentialValueMap_ = new ResidentialValueMap();
    }

    // ---------------------------------------------------------------------------------------------
    // Public API of the economy feature.
    // ---------------------------------------------------------------------------------------------

    // TODO(Russell): Define the economy API.

    // ---------------------------------------------------------------------------------------------

    dispose() {}
}

exports = Economy;
