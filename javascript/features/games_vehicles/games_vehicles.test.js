// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { VehicleGame } from 'features/games_vehicles/vehicle_game.js';

describe('GamesVehicles', (it, beforeEach) => {
    let feature = null;
    let games = null;

    beforeEach(() => {
        feature = server.featureManager.loadFeature('games_vehicles');
        games = server.featureManager.loadFeature('games');
    });

    it('automatically re-registers games when the Games feature reloads', async (assert) => {
        class DrivingGame extends VehicleGame {}

        assert.isFalse(server.commandManager.hasCommand('drive'));

        feature.registerGame(DrivingGame, {
            name: 'Driving Game',
            goal: 'Drive along each other with in San Andreas.',
            command: 'drive',
        });

        assert.isTrue(server.commandManager.hasCommand('drive'));

        await server.featureManager.liveReload('games');

        assert.isTrue(server.commandManager.hasCommand('drive'));
    });
});
