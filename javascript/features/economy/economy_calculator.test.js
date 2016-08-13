// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const EconomyCalculator = require('features/economy/economy_calculator.js');

describe('EconomyCalculator', (it, beforeEach, afterEach) => {
    let calculator = null;

    beforeEach(() => calculator = new EconomyCalculator());
    afterEach(() => {
        if (calculator)
            calculator.dispose();
    });

    it('should have a variance that updates once per hour', async(assert) => {
        assert.isNotNull(calculator.variance);

        let previousVariance = calculator.variance;
        let misses = 0;

        for (let iter = 0; iter < 5; iter++) {
            // Advancing the server's clock will cause the wait() function to yield.
            await server.clock.advance(60 * 60 * 1000 /* updateFrequency */);

            if (calculator.variance === previousVariance)
                ++misses;

            previousVariance = calculator.variance;
        }

        // There is a minor, but not impossible chance that the variance ends up being the same
        // value multiple times in a row, so allow for up to three sequential identical values.
        assert.isBelowOrEqual(misses, 3);

        // Updating the variance should stop when the calculator has been disposed of.
        calculator.dispose();

        await server.clock.advance(60 * 60 * 1000 /* updateFrequency */);

        assert.equal(previousVariance, calculator.variance);
    });

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
            return calculator.calculateHousePrice(residentialValue, 0, interiorValue);
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

    it('should be able to consider parking lots for house pricing accordingly', assert => {
        calculator.setVarianceValueForTests(50);

        for (let residentialValue = 0; residentialValue <= 5; ++residentialValue) {
            let previousValue = null;

            for (let parkingLotCount = 0; parkingLotCount <= 3; ++parkingLotCount) {
                const value = calculator.calculateHousePrice(residentialValue, parkingLotCount, 0);

                if (previousValue)
                    assert.isAbove(value, previousValue);

                previousValue = value;
            }
        }
    });

    it('should be able to price vehicles for houses appropriately', assert => {
        const minimum = EconomyCalculator.PRICE_RANGE_HOUSE_VEHICLES[0];
        const maximum = EconomyCalculator.PRICE_RANGE_HOUSE_VEHICLES[1];
        const delta = maximum - minimum;

        const residentialPercentage = 0.4875;
        const vehiclePercentage = 0.5;
        const variancePercentage = 0.0125;

        // Returns the vehicle price that has been determined for the three input values.
        const calculateVehiclePrice = (residentialValue, vehicleValue, varianceValue) => {
            calculator.setVarianceValueForTests(varianceValue);
            return calculator.calculateHouseVehiclePrice(residentialValue, vehicleValue);
        };

        const errorMargin = delta * 0.01;

        // The minimum and maximum prices should be adhered to.
        assert.equal(calculateVehiclePrice(0, 0, 0), minimum);
        assert.equal(calculateVehiclePrice(4, 100, 100), maximum);

        // The residential percentage should matter for the indicated percentage.
        assert.closeTo(calculateVehiclePrice(4, 0, 0) - calculateVehiclePrice(0, 0, 0),
                       delta * residentialPercentage, errorMargin);
        assert.closeTo(calculateVehiclePrice(4, 100, 100) - calculateVehiclePrice(0, 100, 100),
                       delta * residentialPercentage, errorMargin);

        // The vehicle percentage should matter for the indicated percentage.
        assert.closeTo(calculateVehiclePrice(0, 100, 0) - calculateVehiclePrice(0, 0, 0),
                       delta * vehiclePercentage, errorMargin);
        assert.closeTo(calculateVehiclePrice(4, 100, 100) - calculateVehiclePrice(4, 0, 100),
                       delta * vehiclePercentage, errorMargin);

        // The variance percentage should matter for the indicated percentage.
        assert.closeTo(calculateVehiclePrice(0, 0, 100) - calculateVehiclePrice(0, 0, 0),
                       delta * variancePercentage, errorMargin);
        assert.closeTo(calculateVehiclePrice(4, 100, 100) - calculateVehiclePrice(4, 100, 0),
                       delta * variancePercentage, errorMargin);

        // It should throw when any of the input values are out of range.
        assert.throws(() => calculateVehiclePrice(-1, 0, 0));
        assert.throws(() => calculateVehiclePrice(0, -1, 0));
        assert.throws(() => calculateVehiclePrice(0, 0, -1));
        assert.throws(() => calculateVehiclePrice(200, 0, 0));
        assert.throws(() => calculateVehiclePrice(0, 200, 0));
        assert.throws(() => calculateVehiclePrice(0, 0, 200));
    });
});
