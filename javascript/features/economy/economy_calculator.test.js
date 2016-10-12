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
        // Returns the house price that has been determined for the three input values.
        const calculateHousePrice = (residentialValue, parkingLots, interiorValue,
                                     varianceValue) => {
            calculator.setVarianceValueForTests(varianceValue);
            return calculator.calculateHousePrice(residentialValue, parkingLots, interiorValue);
        };

        // It should throw when any of the input values are out of range.
        assert.throws(() => calculateHousePrice(-1, 0, 0, 0));
        assert.throws(() => calculateHousePrice(0, 0, -1, 0));
        assert.throws(() => calculateHousePrice(0, 0, 0, -1));
        assert.throws(() => calculateHousePrice(200, 0, 0, 0));
        assert.throws(() => calculateHousePrice(0, 0, 200, 0));
        assert.throws(() => calculateHousePrice(0, 0, 0, 200));

        // Change detector tests against the spreadsheet.
        assert.closeTo(calculateHousePrice(0, 0, 0, 50), 502683.81, 1);
        assert.closeTo(calculateHousePrice(1, 0, 1, 50), 4315644.63, 1);
        assert.closeTo(calculateHousePrice(2, 0, 3, 50), 16083508.12, 1);
        assert.closeTo(calculateHousePrice(3, 0, 5, 50), 68762910.64, 1);
        assert.closeTo(calculateHousePrice(4, 0, 7, 50), 120811688.90, 1);
        assert.closeTo(calculateHousePrice(5, 0, 9, 50), 302758437.81, 1);

        // Verify that the variance is no more than 5% of the total house price.
        assert.closeTo(calculateHousePrice(4, 0, 2, 0), 0.95 * 34332631.99, 1);
        assert.closeTo(calculateHousePrice(4, 0, 2, 50), 34332631.99, 1);
        assert.closeTo(calculateHousePrice(4, 0, 2, 100), 1.05 * 34332631.99, 1);

        // Verify that parking lots costs are proprtional to the residential factor.
        const parkingLotCosts = [150000, 275000, 1000000, 1500000, 2000000, 2500000];

        parkingLotCosts.forEach((cost, residentialValue) => {
            const base = calculateHousePrice(residentialValue, 0, 0, 50);
            for (let count = 1; count < 3; ++count) {
                assert.closeTo(
                    calculateHousePrice(residentialValue, count, 0, 50), base + cost * count, 1);
            }
        });
    });

    it('should be able to price features for houses appropriately', assert => {
        // Returns the house price that has been determined for the three input values.
        const calculateFeaturePrice = (residentialValue, featureValue, varianceValue) => {
            calculator.setVarianceValueForTests(varianceValue);
            return calculator.calculateHouseFeaturePrice(residentialValue, featureValue);
        };

        // It should throw when any of the input values are out of range.
        assert.throws(() => calculateFeaturePrice(-1, 0, 0));
        assert.throws(() => calculateFeaturePrice(0, -1, 0));
        assert.throws(() => calculateFeaturePrice(0, 0, -1));
        assert.throws(() => calculateFeaturePrice(200, 0, 0));
        assert.throws(() => calculateFeaturePrice(0, 200, 0));
        assert.throws(() => calculateFeaturePrice(0, 0, 200));

        // Change detector tests against the spreadsheet.
        assert.closeTo(calculateFeaturePrice(0, 0, 50), 185000.00, 1);
        assert.closeTo(calculateFeaturePrice(1, 1, 50), 1427311.75, 1);
        assert.closeTo(calculateFeaturePrice(2, 2, 50), 4886950.10, 1);
        assert.closeTo(calculateFeaturePrice(3, 3, 50), 16405897.73, 1);
        assert.closeTo(calculateFeaturePrice(4, 4, 50), 42128812.92, 1);
        assert.closeTo(calculateFeaturePrice(5, 5, 50), 124907861.77, 1);

        // Verify that the variance is no more than 5% of the total feature price.
        assert.closeTo(calculateFeaturePrice(4, 2, 0), 0.95 * 19505983.51, 1);
        assert.closeTo(calculateFeaturePrice(4, 2, 50), 19505983.51, 1);
        assert.closeTo(calculateFeaturePrice(4, 2, 100), 1.05 * 19505983.51, 1);
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
