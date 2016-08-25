// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const HouseLocation = require('features/houses/house_location.js');
const ParkingLotCreator = require('features/houses/utils/parking_lot_creator.js');

describe('ParkingLotCreator', (it, beforeEach, afterEach) => {
    const location = new HouseLocation(0 /* id */, {
        facingAngle: 0,
        interiorId: 0,
        position: new Vector(500, 500, 0)
    });

    let selector = null;
    let gunther = null;

    beforeEach(() => gunther = server.playerManager.getById(0 /* gunther */));
    afterEach(() => selector.dispose());

    it('should throw when canceling or confirming for an invalid player', assert => {
        selector = new ParkingLotCreator();

        assert.isFalse(selector.isSelecting(gunther));

        assert.throws(() => selector.confirmSelection(gunther));
        assert.throws(() => selector.cancelSelection(gunther));
    });

    it('should cancel when the operation is canceled', async(assert) => {
        selector = new ParkingLotCreator();

        assert.isFalse(selector.isSelecting(gunther));

        const selectionFinished = selector.select(gunther, location);

        assert.isTrue(selector.isSelecting(gunther));

        selector.cancelSelection(gunther);

        const selectionResult = await selectionFinished;

        assert.isFalse(selector.isSelecting(gunther));
        assert.isNull(selectionResult);
    });

    it('should cancel selection when the player disconnects', async(assert) => {
        selector = new ParkingLotCreator();

        assert.isFalse(selector.isSelecting(gunther));

        const selectionFinished = selector.select(gunther, location);

        assert.isTrue(selector.isSelecting(gunther));

        gunther.disconnect();

        const selectionResult = await selectionFinished;

        assert.isFalse(selector.isSelecting(gunther));
        assert.isNull(selectionResult);
    });

    it('should display an error when the player is not in a vehicle', async(assert) => {
        selector = new class extends ParkingLotCreator {
            getCurrentVehiclePosition() {
                return null;
            }
            getCurrentVehicleRotation() {
                return null;
            }
        };

        assert.isFalse(selector.isSelecting(gunther));

        const selectionFinished = selector.select(gunther, location);

        assert.isTrue(selector.isSelecting(gunther));

        // Gunther wants to retry selecting a vehicle first, then confirm the selection again and
        // cancel the responding dialog.
        gunther.respondToDialog({ response: 1 /* Try again */ }).then(() =>
            gunther.respondToDialog({ response: 0 /* Cancel */ }));

        // First confirm the selection. This will trigger the first `error` dialog.
        selector.confirmSelection(gunther);

        // Cycle through the confirm -> error dialog -> retry flow in a deterministic manner.
        {
            while (selector.isSelecting(gunther))
                await Promise.resolve();

            assert.isFalse(selector.isSelecting(gunther));
            assert.equal(gunther.lastDialog, Message.HOUSE_PARKING_LOT_NOT_IN_VEHICLE);

            while (!selector.isSelecting(gunther))
                await Promise.resolve();

            assert.isTrue(selector.isSelecting(gunther));
        }

        selector.confirmSelection(gunther);

        const selectionResult = await selectionFinished;

        assert.isFalse(selector.isSelecting(gunther));
        assert.isNull(selectionResult);
    });

    it('should display an error when the player is too far away', async(assert) => {
        const OFFSET = 200;
        const OFFSET_SQ = OFFSET * OFFSET;

        selector = new class extends ParkingLotCreator {
            getCurrentVehiclePosition() {
                return location.position.translate({ x: OFFSET, y: OFFSET });
            }
            getCurrentVehicleRotation() {
                return 90.0;
            }
        };

        assert.isFalse(selector.isSelecting(gunther));

        const selectionFinished = selector.select(gunther, location);

        assert.isTrue(selector.isSelecting(gunther));

        // Gunther wants to retry selecting a vehicle first, then confirm the selection again and
        // cancel the responding dialog.
        gunther.respondToDialog({ response: 1 /* Try again */ }).then(() =>
            gunther.respondToDialog({ response: 0 /* Cancel */ }));

        // First confirm the selection. This will trigger the first `error` dialog.
        selector.confirmSelection(gunther);

        // Cycle through the confirm -> error dialog -> retry flow in a deterministic manner.
        {
            while (selector.isSelecting(gunther))
                await Promise.resolve();

            assert.isFalse(selector.isSelecting(gunther));
            assert.equal(
                gunther.lastDialog,
                Message.format(Message.HOUSE_PARKING_LOT_TOO_FAR, 150 /* maximum distance */,
                               Math.sqrt(OFFSET_SQ + OFFSET_SQ) /* current distance */));

            while (!selector.isSelecting(gunther))
                await Promise.resolve();

            assert.isTrue(selector.isSelecting(gunther));
        }

        selector.confirmSelection(gunther);

        const selectionResult = await selectionFinished;

        assert.isFalse(selector.isSelecting(gunther));
        assert.isNull(selectionResult);
    });

    it('should return the location when successfully chosen', async(assert) => {
        selector = new class extends ParkingLotCreator {
            getCurrentVehiclePosition() {
                return location.position.translate({ x: 10, y: 10 });
            }
            getCurrentVehicleRotation() {
                return 90.0;
            }
        };

        assert.isFalse(selector.isSelecting(gunther));

        const selectionFinished = selector.select(gunther, location);

        assert.isTrue(selector.isSelecting(gunther));

        selector.confirmSelection(gunther);

        const selectionResult = await selectionFinished;

        assert.isFalse(selector.isSelecting(gunther));
        assert.isNotNull(selectionResult);

        assert.deepEqual(selectionResult.position, location.position.translate({ x: 10, y: 10 }));
        assert.equal(selectionResult.rotation, 90.0);
    });
});
