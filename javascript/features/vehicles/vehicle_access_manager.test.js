// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const VehicleAccessManager = require('features/vehicles/vehicle_access_manager.js');

describe('VehicleAccessManager', (it, beforeEach, afterEach) => {
    let gunther = null;
    let manager = null;
    let storedVehicle = Object.create({});

    beforeEach(() => {
        // Structure that more or less mimics the API of the streamer.
        const fakeStreamer = {
            getVehicleStreamer: () => {
                return {
                    synchronizeAccessForVehicle: storedVehicle => {}
                };
            }
            
        };

        gunther = server.playerManager.getById(0 /* Gunther */);
        manager = new VehicleAccessManager(() => fakeStreamer);
    });

    afterEach(() => {
        if (manager)
            manager.dispose();
    });

    it('should be able to restrict vehicles to registered players', assert => {
        const russell = server.playerManager.getById(1 /* Russell */);

        assert.isFalse(gunther.isRegistered());

        assert.isFalse(manager.isLocked(storedVehicle));
        assert.isTrue(manager.canAccessVehicle(gunther, storedVehicle));
        assert.isTrue(manager.canAccessVehicle(russell, storedVehicle));

        gunther.identify({ userId: 5101 });

        manager.restrictToPlayer(storedVehicle, 5101);

        assert.isTrue(manager.isLocked(storedVehicle));
        assert.isTrue(manager.canAccessVehicle(gunther, storedVehicle));
        assert.isFalse(manager.canAccessVehicle(russell, storedVehicle));

        russell.identify({ userId: 9003 });

        assert.isTrue(manager.isLocked(storedVehicle));
        assert.isTrue(manager.canAccessVehicle(gunther, storedVehicle));
        assert.isFalse(manager.canAccessVehicle(russell, storedVehicle));

        manager.unlock(storedVehicle);

        assert.isFalse(manager.isLocked(storedVehicle));
        assert.isTrue(manager.canAccessVehicle(gunther, storedVehicle));
        assert.isTrue(manager.canAccessVehicle(russell, storedVehicle));
    });

    it('should be able to restrict vehicles to a minimum player level', assert => {
        assert.equal(gunther.level, Player.LEVEL_PLAYER);

        assert.isFalse(manager.isLocked(storedVehicle));
        assert.isTrue(manager.canAccessVehicle(gunther, storedVehicle));

        manager.restrictToPlayerLevel(storedVehicle, Player.LEVEL_ADMINISTRATOR);

        assert.isTrue(manager.isLocked(storedVehicle));
        assert.isFalse(manager.canAccessVehicle(gunther, storedVehicle));

        gunther.level = Player.LEVEL_ADMINISTRATOR;

        assert.isTrue(manager.isLocked(storedVehicle));
        assert.isTrue(manager.canAccessVehicle(gunther, storedVehicle));

        manager.restrictToPlayerLevel(storedVehicle, Player.LEVEL_MANAGEMENT);

        assert.isTrue(manager.isLocked(storedVehicle));
        assert.isFalse(manager.canAccessVehicle(gunther, storedVehicle));

        manager.unlock(storedVehicle);

        assert.isFalse(manager.isLocked(storedVehicle));
        assert.isTrue(manager.canAccessVehicle(gunther, storedVehicle));
    });

    it('should be able to restrict vehicles to VIP members', assert => {
        assert.isFalse(gunther.isVip());

        assert.isFalse(manager.isLocked(storedVehicle));
        assert.isTrue(manager.canAccessVehicle(gunther, storedVehicle));

        manager.restrictToVip(storedVehicle);

        assert.isTrue(manager.isLocked(storedVehicle));
        assert.isFalse(manager.canAccessVehicle(gunther, storedVehicle));

        gunther.setVip(true);

        assert.isTrue(manager.isLocked(storedVehicle));
        assert.isTrue(manager.canAccessVehicle(gunther, storedVehicle));

        manager.unlock(storedVehicle);

        assert.isFalse(manager.isLocked(storedVehicle));
        assert.isTrue(manager.canAccessVehicle(gunther, storedVehicle));
    });
});
