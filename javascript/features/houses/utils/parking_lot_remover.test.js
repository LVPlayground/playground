// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const HouseLocation = require('features/houses/house_location.js');
const ParkingLotRemover = require('features/houses/utils/parking_lot_remover.js');

describe('ParkingLotRemover', (it, beforeEach, afterEach) => {
    const location = new HouseLocation(0 /* id */, {
        facingAngle: 0,
        interiorId: 0,
        position: new Vector(500, 500, 0),

        parkingLots: [
            {
                id: 42,
                position: new Vector(500, 510, 0),
                rotation: 90
            },
            {
                id: 43,
                position: new Vector(490, 500, 0),
                rotation: 270
            }
        ]
    });

    let selector = null;
    let gunther = null;

    beforeEach(() => gunther = server.playerManager.getById(0 /* gunther */));
    afterEach(() => selector.dispose());

    it('should throw when canceling or confirming for an invalid player', assert => {
        selector = new ParkingLotRemover();

        assert.isFalse(selector.isSelecting(gunther));

        assert.throws(() => selector.confirmSelection(gunther));
        assert.throws(() => selector.cancelSelection(gunther));
    });

    it('should cancel when the operation is canceled', async(assert) => {
        selector = new ParkingLotRemover();

        assert.isFalse(selector.isSelecting(gunther));

        const selectionFinished = selector.select(gunther, location);

        assert.isTrue(selector.isSelecting(gunther));

        selector.cancelSelection(gunther);

        const selectionResult = await selectionFinished;

        assert.isFalse(selector.isSelecting(gunther));
        assert.isNull(selectionResult);
    });

    it('should cancel selection when the player disconnects', async(assert) => {
        selector = new ParkingLotRemover();

        assert.isFalse(selector.isSelecting(gunther));

        const selectionFinished = selector.select(gunther, location);

        assert.isTrue(selector.isSelecting(gunther));

        gunther.disconnect();

        const selectionResult = await selectionFinished;

        assert.isFalse(selector.isSelecting(gunther));
        assert.isNull(selectionResult);
    });

    it('should validate the Id given for confirmation', async(assert) => {
        selector = new ParkingLotRemover();

        assert.isFalse(selector.isSelecting(gunther));
        assert.equal(location.parkingLotCount, 2);

        const parkingLots = Array.from(location.parkingLots);
        const selectionFinished = selector.select(gunther, location);

        assert.isTrue(selector.isSelecting(gunther));

        // Gunther selects an invalid parking lot Id first, but then wants to try again with a valid
        // Id so that selection can continue.
        gunther.respondToDialog({ response: 1 /* Try again */ });

        // Select an invalid Id in the selector (valid Ids are [0-1]).
        selector.confirmSelection(gunther, 5);

        // Cycle through the confirm -> error dialog -> retry flow in a deterministic manner.
        {
            while (selector.isSelecting(gunther))
                await Promise.resolve();

            assert.isFalse(selector.isSelecting(gunther));
            assert.equal(
                gunther.lastDialog, Message.format(Message.HOUSE_PARKING_LOT_INVALID_ID, 5, 1));

            while (!selector.isSelecting(gunther))
                await Promise.resolve();

            assert.isTrue(selector.isSelecting(gunther));
        }

        // Select a valid Id in the selector (valid Ids are [0-1]).
        selector.confirmSelection(gunther, 1);

        const selectionResult = await selectionFinished;

        assert.isFalse(selector.isSelecting(gunther));
        assert.isNotNull(selectionResult);
        assert.equal(selectionResult, parkingLots[1]);
    });
});
