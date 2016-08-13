// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const HouseLocation = require('features/houses/house_location.js');
const ParkingLotRemover = require('features/houses/utils/parking_lot_remover.js');

describe('ParkingLotRemover', (it, beforeEach, afterEach) => {
    const location = new HouseLocation({
        id: 0,
        position: new Vector(500, 500, 0)
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
});
