// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('AbuseMonitor', (it, beforeEach) => {
    let gunther = null;
    let monitor = null;
    let settings = null;

    beforeEach(() => {
        gunther = server.playerManager.getById(/* Gunther= */ 0);
        monitor = server.featureManager.loadFeature('abuse').monitor_;
        settings = server.featureManager.loadFeature('settings');
    });

    it('should kick players for illegal vehicle modifications', assert => {
        const vehicle = server.vehicleManager.createVehicle({
            modelId: 411,  // Infernus

            position: new Vector(0, 0, 0),
            rotation: 180,
        });

        gunther.enterVehicle(vehicle);

        assert.isTrue(gunther.isConnected());
        assert.isTrue(vehicle.isConnected());

        assert.strictEqual(gunther.vehicle, vehicle);

        let defaultPrevented = false;

        // (1) Have |gunther| make a valid modification to the |vehicle|.
        dispatchEvent('vehiclemod', {
            preventDefault: () => defaultPrevented = true,

            playerid: gunther.id,
            vehicleid: vehicle.id,
            componentid: 1075,  // Rimshine Wheels
        });

        assert.isFalse(defaultPrevented);
        assert.isTrue(gunther.isConnected());
        assert.isTrue(vehicle.hasComponent(1075));

        // (2) Have |gunther| make an illegal modification to the |vehicle|.
        dispatchEvent('vehiclemod', {
            preventDefault: () => defaultPrevented = true,

            playerid: gunther.id,
            vehicleid: vehicle.id,
            componentid: 1144,  // Left Square Vents, not available for Infernus
        });

        assert.isTrue(defaultPrevented);
        assert.isFalse(gunther.isConnected());
        assert.isFalse(vehicle.hasComponent(1144));
    });
});
