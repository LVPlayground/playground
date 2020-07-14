// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Vector } from 'base/vector.js';

import createTestEnvironment from 'features/houses/test/test_environment.js';

describe('HouseVehicleCommands', (it, beforeEach) => {
    let gunther = null;
    let manager = null;
    let russell = null;

    beforeEach(async() => {
        await createTestEnvironment();

        const feature = server.featureManager.loadFeature('houses');

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        manager = feature.manager_;
        russell = server.playerManager.getById(/* Russell= */ 1);

        await gunther.identify({ userId: 42 });
    });

    it('should offer the ability to save house vehicles', async (assert) => {
        assert.equal(manager.getHousesForPlayer(gunther).length, 1);

        const vehicle = server.vehicleManager.createVehicle({
            modelId: 411,  // Infernus
            position: new Vector(0, 0, 0),
            rotation: 250,
        });

        // Have |gunther| enter the |vehicle|, so that it's clear what has to be saved.
        gunther.enterVehicle(vehicle);

        // (1) The dialog is shown immediately for players who own a house.
        gunther.respondToDialog({ response: 0 /* Dismiss */ });

        assert.isTrue(await gunther.issueCommand('/v save'));
        assert.equal(gunther.lastDialogTitle, 'House vehicle options');
        assert.deepEqual(gunther.getLastDialogAsTable(/* hasColumns= */ true).rows, [
            [
                'Guntherplaza',
                '#1',
                '{FFFF00}Infernus',
            ],
            [
                'Guntherplaza',
                '#2',
                '{9E9E9E}vacant',
            ]
        ]);

        // (2) A disambiguation dialog is shown for administrators who save a vehicle.
        gunther.level = Player.LEVEL_ADMINISTRATOR;

        gunther.respondToDialog({ response: 0 /* Dismiss */ });

        assert.isTrue(await gunther.issueCommand('/v save'));
        assert.equal(gunther.lastDialogTitle, 'Vehicle options');
        assert.deepEqual(gunther.getLastDialogAsTable(/* hasColumns= */ false), [
            'Save as a house vehicle',
            'Save to the vehicle layout',
        ]);

        // (3) The player can abort out of the confirmation dialog.

        // (4) The vehicle can be saved successfully.
    });

    it('should recreate the vehicle when it has been replaced', async (assert) => {
        // (1) If nobody is currently in the vehicle, replace and respawn straight away.

        // (2) If occupants are in the vheicle, they should be moved over.
    });

    it(`should fully serialize a vehicle's modification state when saving it`, async (assert) => {
        
    });
});
