// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('EconomyCalculator', (it, beforeEach) => {
    let calculator = null;

    beforeEach(() => {
        const feature = server.featureManager.loadFeature('economy');

        calculator = feature.economyCalculator_;
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
        calculator.dispose = () => 1;

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

    it('should be able to determine the value for a house appropriately', assert => {
        // Returns the value for a house based on its purchase price and ownership days,
        const calculateHousePrice = (purchasePrice, ownershipDays, varianceValue) => {
            calculator.setVarianceValueForTests(varianceValue);
            return calculator.calculateHouseValue(purchasePrice, ownershipDays * 86400);
        };

        const PurchasePrice = 80643816.73;
        const MaximumRefundValue = 0.7 * PurchasePrice;

        // Change detector tests against the spreadsheet.
        assert.closeTo(calculateHousePrice(PurchasePrice,   0.5, 50), 28695758.12, 1);
        assert.closeTo(calculateHousePrice(PurchasePrice,     1, 50), 29166180.38, 1);
        assert.closeTo(calculateHousePrice(PurchasePrice,     3, 50), 31047869.44, 1);
        assert.closeTo(calculateHousePrice(PurchasePrice,     7, 50), 34811247.56, 1);
        assert.closeTo(calculateHousePrice(PurchasePrice,    14, 50), 41397159.25, 1);
        assert.closeTo(calculateHousePrice(PurchasePrice, 30.25, 50), 56450671.71, 1);
        assert.closeTo(calculateHousePrice(PurchasePrice, 60.50, 50), 56450671.71, 1);
        assert.closeTo(calculateHousePrice(PurchasePrice, 90.75, 50), 56450671.71, 1);

        // Verify that the variance is no more than 5% of the total house price.
        assert.closeTo(calculateHousePrice(PurchasePrice, 100,   0), 0.95 * MaximumRefundValue, 1);
        assert.closeTo(calculateHousePrice(PurchasePrice, 100,  50), MaximumRefundValue, 1);
        assert.closeTo(calculateHousePrice(PurchasePrice, 100, 100), 1.05 * MaximumRefundValue, 1);

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

    it ('calculates the correct prize for a killtime', assert => {
        const expectedPrizeWith1pAnd0kills = 25000;
        const expectedPrizeWith1pAnd1kills = 25000;
        const expectedPrizeWith1pAnd24kills = 25000;
        const expectedPrizeWith1pAnd25kills = 25000;
        const expectedPrizeWith1pAnd26kills = 26000;

        const expectedPrizeWith5pAnd4kills = 25000;
        const expectedPrizeWith5pAnd5kills = 25000;
        const expectedPrizeWith5pAnd6kills = 30000;

        const expectedPrizeWith10pAnd2kills = 25000;
        const expectedPrizeWith10pAnd3kills = 30000;
        const expectedPrizeWith10pAnd4kills = 40000;

        // 1 participant making X kills
        assert.equal(calculator.calculateKilltimeAwardPrize(1, 0), expectedPrizeWith1pAnd0kills);
        assert.equal(calculator.calculateKilltimeAwardPrize(1, 1), expectedPrizeWith1pAnd1kills);
        assert.equal(calculator.calculateKilltimeAwardPrize(1, 24), expectedPrizeWith1pAnd24kills);
        assert.equal(calculator.calculateKilltimeAwardPrize(1, 25), expectedPrizeWith1pAnd25kills);
        assert.equal(calculator.calculateKilltimeAwardPrize(1, 26), expectedPrizeWith1pAnd26kills);

        // 5 participants making X kills
        assert.equal(calculator.calculateKilltimeAwardPrize(5, 4), expectedPrizeWith5pAnd4kills);
        assert.equal(calculator.calculateKilltimeAwardPrize(5, 5), expectedPrizeWith5pAnd5kills);
        assert.equal(calculator.calculateKilltimeAwardPrize(5, 6), expectedPrizeWith5pAnd6kills);

        // 10 participants making X kills
        assert.equal(calculator.calculateKilltimeAwardPrize(10, 2), expectedPrizeWith10pAnd2kills);
        assert.equal(calculator.calculateKilltimeAwardPrize(10, 3), expectedPrizeWith10pAnd3kills);
        assert.equal(calculator.calculateKilltimeAwardPrize(10, 4), expectedPrizeWith10pAnd4kills);
    });
});
