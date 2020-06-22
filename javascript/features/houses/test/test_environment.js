// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Economy from 'features/economy/economy.js';
import Houses from 'features/houses/houses.js';
import MockLocation from 'features/location/test/mock_location.js';

// Exports a function that fully initializes a test environment for the houses feature.
export default async function createTestEnvironment() {
    server.featureManager.registerFeaturesForTests({
        economy: Economy,
        houses: Houses,
        location: MockLocation,
    });

    server.featureManager.loadFeature('houses');

    const abuse = server.featureManager.getFeatureForTests('abuse');
    const gangs = server.featureManager.getFeatureForTests('gangs');
    const houses = server.featureManager.getFeatureForTests('houses');
    const streamer = server.featureManager.getFeatureForTests('streamer');

    await houses.manager_.ready;

    return {
        abuse: abuse,
        commands: houses.commands_,
        gangs: gangs,
        manager: houses.manager_,
        streamer: streamer
    };
};
