// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Vector } from 'base/vector.js';
import { VehicleModel } from 'entities/vehicle_model.js';

import createTestEnvironment from 'features/houses/test/test_environment.js';

describe('HouseVehicleCommands', (it, beforeEach) => {
    let commands = null;
    let gunther = null;
    let manager = null;
    let russell = null;
    let streamer = null;

    beforeEach(async() => {
        await createTestEnvironment();

        const feature = server.featureManager.loadFeature('houses');

        commands = feature.vehicleCommands_;
        gunther = server.playerManager.getById(/* Gunther= */ 0);
        manager = feature.manager_;
        russell = server.playerManager.getById(/* Russell= */ 1);
        streamer = server.featureManager.loadFeature('streamer');

        // Move Gunther to be near the vehicle that's been saved for them.
        gunther.position = new Vector(500, 490, 500);

        await gunther.identify({ userId: 42 });
        await streamer.streamForTesting([ gunther, russell ]);
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
        gunther.respondToDialog({ listitem: 0 /* Save a house vehicle */ }).then(
            () => gunther.respondToDialog({ listitem: 0 /* Guntherplaza #1 */ })).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));
        
        assert.isTrue(await gunther.issueCommand('/v save'));
        assert.includes(gunther.lastDialog, 'Are you sure');

        // (4) The vehicle can be saved successfully.

        // ...
    });

    it('should only allow automobiles and bikes to be saved', async (assert) => {
        // (1) Spot-check a select few vehicles that can't be saved.
        const rejectionList = [ 520 /* Hydra */, 606 /* Luggage trailer */, 563 /* Raindance */ ];

        for (const modelId of rejectionList) {
            assert.setContext('model=' + modelId);
            assert.isFalse(
                commands.isVehicleEligible(gunther, { model: VehicleModel.getById(modelId) }));
        }

        // (2) Run a location selection flow and verify that the option is missing.
        gunther.respondToDialog({ response: 0 /* Dismiss */ });

        const vehicle = server.vehicleManager.createVehicle({
            modelId: 520,  // Infernus
            position: new Vector(0, 0, 0),
            rotation: 250,
        });

        // Have |gunther| enter the |vehicle|, so that it's clear what has to be saved.
        gunther.enterVehicle(vehicle);

        assert.isTrue(await gunther.issueCommand('/v save'));
        assert.isNull(gunther.lastDialog);

        // (3) Spot-check that Management members are able to override this.
        russell.level = Player.LEVEL_MANAGEMENT;

        assert.isTrue(
            commands.isVehicleEligible(russell, { model: VehicleModel.getById(520 /* Hydra */) }));

        // (4) Run a location selection flow and verify that the option exists.
        russell.respondToDialog({ response: 0 /* Dismiss */ });

        assert.isTrue(await russell.issueCommand('/v Gunther save'));
        assert.includes(russell.lastDialog, 'Save as a house vehicle');
    });

    it('should recreate the vehicle when it has been replaced', async (assert) => {
        // (1) If nobody is currently in the vehicle, replace and respawn straight away.

        // (2) If occupants are in the vheicle, they should be moved over.
    });

    it(`should fully serialize a vehicle's modification state when saving it`, async (assert) => {
        // ...
    });

    it('should make it possible to delete house vehicles again', async (assert) => {
        const vehicle = server.vehicleManager.createVehicle({
            modelId: 520,  // Infernus
            position: new Vector(0, 0, 0),
            rotation: 250,
        });

        // Have |gunther| enter the |vehicle|, so that it's clear what has to be saved.
        gunther.enterVehicle(vehicle);

        // (1) The option should not be available when not in a house-bound vehicle.
        gunther.respondToDialog({ response: 0 /* Dismiss */ });

        assert.isTrue(await gunther.issueCommand('/v delete'));
        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.VEHICLE_DELETE_HELP);

        // (2) Being in a house-bound vehicle that you don't own should give an error message.
        assert.equal(manager.vehicleController.count, 1);

        const streamableVehicle = [ ...manager.vehicleController.streamableVehicles_.values() ][0];
        assert.isNotNull(streamableVehicle.live);

        // Make |gunther| enter the live representation of the |streamableVehicle|.
        russell.enterVehicle(streamableVehicle.live);

        russell.respondToDialog({ response: 0 /* Dismiss */ });

        assert.isTrue(await russell.issueCommand('/v delete'));
        assert.equal(russell.messages.length, 0);
        assert.includes(russell.lastDialog, 'is owned by Gunther, you cannot delete it!');

        // (3) Being in an owned house-bound vehicle should delete the vehicle unless you bail out.
        gunther.enterVehicle(streamableVehicle.live);

        gunther.respondToDialog({ response: 1 /* Acknowledge */ }).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/v delete'));
        assert.includes(gunther.lastDialog, 'delete this Infernus');
        assert.includes(gunther.lastDialog, `that's owned by Gunther?`);

        // (4) Being in an owned house-bound vehicle should delete the vehicle.
        gunther.respondToDialog({ response: 1 /* Acknowledge */ }).then(
            () => gunther.respondToDialog({ response: 1 /* Acknowledge */ }));

        assert.isTrue(await gunther.issueCommand('/v delete'));
        assert.includes(gunther.lastDialog, 'Infernus has been removed');

        assert.isNull(streamableVehicle.live);
    });
});
