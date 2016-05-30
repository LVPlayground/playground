// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const EconomyCalculator = require('features/economy/economy_calculator.js');

describe('EconomyCalculator', (it, beforeEach, afterEach) => {
    let calculator = null;

    beforeEach(() => calculator = new EconomyCalculator());
    afterEach(() => calculator = null);

    it('should be able to price houses appropriately', assert => {
        const minimum = EconomyCalculator.PRICE_RANGE_HOUSES[0];
        const maximum = EconomyCalculator.PRICE_RANGE_HOUSES[1];
        const delta = maximum - minimum;

        const residentialPercentage = 0.4;
        const interiorPercentage = 0.5875;
        const variancePercentage = 0.0125;

        // Returns the house price that has been determined for the three input values.
        const calculateHousePrice = (residentialValue, interiorValue, varianceValue) => {
            calculator.setVarianceValueForTests(varianceValue);
            return calculator.calculateHousePrice(residentialValue, interiorValue);
        };

        const errorMargin = delta * 0.01;

        // The minimum and maximum prices should be adhered to.
        assert.equal(calculateHousePrice(0, 0, 0), minimum);
        assert.equal(calculateHousePrice(4, 9, 100), maximum);

        // The residential percentage should matter for the indicated percentage.
        assert.closeTo(calculateHousePrice(4, 0, 0) - calculateHousePrice(0, 0, 0),
                       delta * residentialPercentage, errorMargin);
        assert.closeTo(calculateHousePrice(4, 9, 100) - calculateHousePrice(0, 9, 100),
                       delta * residentialPercentage, errorMargin);

        // The interior percentage should matter for the indicated percentage.
        assert.closeTo(calculateHousePrice(0, 9, 0) - calculateHousePrice(0, 0, 0),
                       delta * interiorPercentage, errorMargin);
        assert.closeTo(calculateHousePrice(4, 9, 100) - calculateHousePrice(4, 0, 100),
                       delta * interiorPercentage, errorMargin);

        // The variance percentage should matter for the indicated percentage.
        assert.closeTo(calculateHousePrice(0, 0, 100) - calculateHousePrice(0, 0, 0),
                       delta * variancePercentage, errorMargin);
        assert.closeTo(calculateHousePrice(4, 9, 100) - calculateHousePrice(4, 9, 0),
                       delta * variancePercentage, errorMargin);

        // It should throw when any of the input values are out of range.
        assert.throws(() => calculateHousePrice(-1, 0, 0));
        assert.throws(() => calculateHousePrice(0, -1, 0));
        assert.throws(() => calculateHousePrice(0, 0, -1));
        assert.throws(() => calculateHousePrice(200, 0, 0));
        assert.throws(() => calculateHousePrice(0, 200, 0));
        assert.throws(() => calculateHousePrice(0, 0, 200));
    });
});
