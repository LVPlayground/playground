// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Economy = require('features/economy/economy.js');
const HouseManager = require('features/houses/house_manager.js');
const MockHouseDatabase = require('features/houses/test/mock_house_database.js');

describe('HouseEntranceController', (it, beforeEach, afterEach) => {
    let manager = null;  // HouseManager
    let controller = null;  // HouseEntranceController

    afterEach(() => manager.dispose());
    beforeEach(async(assert) => {
        const economy = new Economy();

        manager = new HouseManager(() => economy);
        manager.database_ = new MockHouseDatabase();

        controller = manager.entranceController_;

        // All tests will depend on the basic house data to be available.
        await manager.loadHousesFromDatabase();
        assert.isAbove(manager.locationCount, 0);
    });

    it('should allow players to purchase their first house', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        // This will trigger the onPlayerEnterPickup event in the HouseEntranceController.
        gunther.position = new Vector(200, 250, 300);

        const minimumPrice =
            controller.economy_().calculateHousePrice(gunther.position, 0 /* parkingLotCount */,
                                                      0 /* interiorValue */);

        assert.equal(gunther.messages.length, 1);
        assert.equal(
            gunther.messages[0], Message.format(Message.HOUSE_PICKUP_CAN_PURCHASE, minimumPrice));
    });

    it('should not allow players who own a house to purchase another one', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        // Returning any non-NULL value from getHouseForPlayer() will do the trick.
        manager.getHouseForPlayer = player => true;

        // This will trigger the onPlayerEnterPickup event in the HouseEntranceController.
        gunther.position = new Vector(200, 250, 300);

        const minimumPrice =
            controller.economy_().calculateHousePrice(gunther.position, 0 /* parkingLotCount */,
                                                      0 /* interiorValue */);

        assert.equal(gunther.messages.length, 1);
        assert.equal(
            gunther.messages[0], Message.format(Message.HOUSE_PICKUP_CANNOT_PURCHASE, minimumPrice))
    });
});
