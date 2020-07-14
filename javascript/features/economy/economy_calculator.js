// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Update frequency, in milliseconds, of the variance. Currently set to one hour.
const kVarianceUpdateFrequencyMs = 60 * 60 * 1000;

// The economy calculator class determines the actual price of something based on a number of input
// variables. There is also a variance factor in range of [0, 100] that changes at predetermined
// times, to make sure that prices within Las Venturas Playground continue to differ a little bit.
//
// The sources, calculations and overviews for all prices will be captured in the following sheet:
//   https://docs.google.com/spreadsheets/d/1C3DvpxKWYoWe7tFSeaGF2EtzfyEiERJ0WQrYn-H5BUI/edit#gid=0
//
// Please be sure to update it when you modify values in this calculator.
export class EconomyCalculator {
    constructor() {
        this.varianceValue_ = null;
        this.disposed_ = false;

        this.updateVariance();
    }

    // Gets the variance that's currently being applied to certain calculations.
    get variance() { return this.varianceValue_; }

    // Calculates the price for a house. The |residentialValue| must be in range of [0, 5], the
    // |interiorValue| must be in range of [0, 9]. The variance factor will be included. This value
    // is being calculated based on the following spreadsheet:
    //
    //   https://docs.google.com/spreadsheets/d/1R01tp9WF_lHS3JP2DDqsLKhZOM7illJa3DF4gK3t3yY/edit
    //
    calculateHousePrice(residentialValue, parkingLotCount, interiorValue) {
        if (residentialValue < 0 || residentialValue > 5) {
            throw new Error(
                'The residential value must be in range of [0, 5] (was ' + residentialValue + ').');
        }

        if (interiorValue < 0 || interiorValue > 9) {
            throw new Error(
                'The interior value must be in range of [0, 9] (was ' + interiorValue + ').');
        }

        // The balance between the residential value, interior value and variance in the price.
        const residentialWeight = 0.5;
        const interiorWeight = 0.5;

        // There are three bands for base residential and interior prices: remote locations (RV of
        // 0), cheap locations (RV of 1) and other locations (RV between 2 and 5).
        const residentialBase = residentialValue === 0 ? 150000
                                                       : (residentialValue === 1 ? 275000
                                                                                 : 500000);

        const interiorBase = residentialValue === 0 ? 350000
                                                    : (residentialValue === 1 ? 400000
                                                                              : 750000);

        // The calculation exponents depend on the residential and interior values.
        const residentialExponent =
            [1.00, 1.15, 1.20, 1.30, 1.35, 1.50][residentialValue];
        const interiorExponent =
            [1.07, 1.22, 1.24, 1.26, 1.35, 1.37, 1.39, 1.41, 1.42, 1.43][interiorValue];

        // Now stuff all values together and define the residential and interior prices.
        const residentialPrice = residentialWeight * Math.pow(residentialBase, residentialExponent);
        const interiorPrice = interiorWeight * Math.pow(interiorBase, interiorExponent);

        // Each parking lot is worth the max(1, residentialValue) multiplied by the base price.
        const parkingLotPrice = parkingLotCount * (residentialBase * Math.max(1, residentialValue));

        // The fixed price is the determined price of this property, without accounting for variance
        const fixedPrice = residentialPrice + interiorPrice + parkingLotPrice;

        // The variance will either decrease or increase the price by, at most, 5%.
        const varianceFactor = 1 + ((-50 + this.varianceValue_) / 1000);

        // Return the fixed price influenced by the current |varianceFactor|.
        return fixedPrice * varianceFactor;
    }

    // Calculates the current house value based on the |purchasePrice| and the |ownershipDuration|.
    // The value will be influenced by the variance factor by up to 5%.
    //
    //   https://docs.google.com/spreadsheets/d/1R01tp9WF_lHS3JP2DDqsLKhZOM7illJa3DF4gK3t3yY/edit
    //
    calculateHouseValue(purchasePrice, ownershipDuration) {
        const BaseRefundPercentage = 35;
        const MaximumRefundPercentage = 70;

        const MaximizeRefundPeriod = 30 /* days */ * 86400;

        // Determine the refund percentage based on the |ownershipDuration|.
        const refundPercentage =
            Math.min(MaximumRefundPercentage,
                     BaseRefundPercentage + ((MaximumRefundPercentage - BaseRefundPercentage) *
                        (ownershipDuration / MaximizeRefundPeriod)));

        // Calculate the refund based on the |purchasePrice| and the |refundPercentage|.
        const refund = purchasePrice * (refundPercentage / 100);

        // The variance will either decrease or increase the refund by, at most, 5%.
        const varianceFactor = 1 + ((-50 + this.varianceValue_) / 1000);

        return refund * varianceFactor;
    }

    // Calculates the price for a feature of value |featureValue|, which must be in range of [0, 5],
    // at a location having |residentialValue|, which must be in range of [0, 5] as well. The
    // variance factor will be included in the feature's price as well.
    //
    //  https://docs.google.com/spreadsheets/d/1R01tp9WF_lHS3JP2DDqsLKhZOM7illJa3DF4gK3t3yY/edit
    //
    calculateHouseFeaturePrice(residentialValue, featureValue) {
        if (residentialValue < 0 || residentialValue > 5) {
            throw new Error(
                'The residential value must be in range of [0, 5] (was ' + residentialValue + ').');
        }

        if (featureValue < 0 || featureValue > 5) {
            throw new Error(
                'The feature value must be in range of [0, 5] (was ' + featureValue + ').');
        }

        const residentialBase = [185000, 125000, 130000, 100000, 90000, 45000][residentialValue];
        const residentialExponent = [1.00, 1.15, 1.20, 1.30, 1.35, 1.50][residentialValue];
        const featureExponent = [1.00, 1.05, 1.09, 1.11, 1.14, 1.16][featureValue];

        const residentialPrice = Math.pow(residentialBase, residentialExponent);
        const featurePrice = Math.pow(residentialPrice, featureExponent);

        // The variance will either decrease or increase the price by, at most, 5%.
        const varianceFactor = 1 + ((-50 + this.varianceValue_) / 1000);

        // Return the feature's price influenced by the current |varianceFactor|.
        return featurePrice * varianceFactor;
    }

    // Updates the variance value with a new random number in range of [0, 100]. The method will
    // schedule another invocation of itself unless the calculator has since been disposed of.
    updateVariance() {
        if (this.disposed_)
            return;

        this.varianceValue_ = Math.random() * 100;
        wait(kVarianceUpdateFrequencyMs).then(
            EconomyCalculator.prototype.updateVariance.bind(this));
    }

    // Sets the variance value to |value| for testing purposes only.
    setVarianceValueForTests(value) {
        if (value < 0 || value > 100) {
            throw new Error(
                'The variance factor must be in range of [0, 100] (was ' + value + ').');
        }

        this.varianceValue_ = value;
    }

    // Calculates the award for 2, 1 is not possible, or more minutes of killtime. There is a minimum prize of 25k if
    // there is not enough killing and/or participants. This way we keep the players encouraged to take part in kill-
    // time while meanwhile keep the economy stable.
    calculateKilltimeAwardPrize(participants, kills) {
        const minimumPrizeMoney = 25000;

        const startPrizeMoney = 1000;
        const multiplier = participants * kills;

        const calculatedPrizeMoney = startPrizeMoney * multiplier;

        return calculatedPrizeMoney < minimumPrizeMoney ? minimumPrizeMoney : calculatedPrizeMoney;
    }

    dispose() {
        this.disposed_ = true;
    }
}
