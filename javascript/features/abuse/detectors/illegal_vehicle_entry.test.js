// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('IllegalVehicleEntry', (it, beforeEach) => {
    let gunther = null;
    let russell = null;

    let settings = null;

    beforeEach(() => {
        gunther = server.playerManager.getById(/* Gunther= */ 0);
        russell = server.playerManager.getById(/* Russell= */ 1);
        settings = server.featureManager.loadFeature('settings');

        // Make Russell an administrator so that he receives admin notices.
        russell.level = Player.LEVEL_ADMINISTRATOR;

        // Load the |abuse| feature to make sure the detectors are running.
        server.featureManager.loadFeature('abuse');
    });

    it('is able to detect illegal vehicle entry abuse', assert => {
        settings.setValue('abuse/detector_illegal_vehicle_entry', /* enabled= */ true);

        const vehicle = server.vehicleManager.createVehicle({
            modelId: 441,
            position: new Vector(200, 300, 50)
        });

        vehicle.lockForPlayer(gunther);

        assert.isTrue(vehicle.isLockedForPlayer(gunther));
        assert.equal(gunther.messages.length, 0);

        // Force |gunther| in the |vehicle|. This roughly matches how cheats enter vehicles.
        gunther.enterVehicle(vehicle);

        // Make sure that |russell| has received a warning about the incident.
        assert.equal(russell.messages.length, 1);
        assert.includes(
            russell.messages[0],
            Message.format(Message.ABUSE_ADMIN_DETECTED, gunther.name, gunther.id,
                           'illegal vehicle entry'));
    });
});
