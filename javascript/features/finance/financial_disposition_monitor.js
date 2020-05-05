// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { FinancialNativeCalls } from 'features/finance/financial_natives.js';

// How frequently should the disposition monitor verify that all monetary values known by each
// player are in line with that the regulator wants them to be.
export const kDispositionMonitorSpinDelay = 1500;

// Set of the casino areas that exist in San Andreas. In-game coordinates.
export const kCasinoAreas = new Set([
    [  1928.1771,  1970.5675,   987.5739,  1042.8369 ], // Four Dragons casino
    [  2171.3618,  2279.4915,  1584.2649,  1628.6199 ], // Caligula's
    [  1117.5068,  1142.4843,   -11.2747,    12.5986 ]  // Private Casino (VIP room)
]);

// Maximum amount of money that could change hands in casinos.
export const kCasinoMaximumDifference = 10000;

// Set of areas in which Pay and Spray shops are located. In-game coordinates.
export const kPayAndSprayShops = new Set([
    [  1965.2133,  1989.2133,  2150.5351,  2174.5351 ],  // Redlands East
    [  -112.2489,   -88.2489,  1104.4254,  1130.4254 ],  // Fort Carson, Bone County
    [ -1432.1639, -1408.1639,  2574.4477,  2598.4477 ],  // El Quebrados, Tierra Robada

    [ -2438.8510, -2414.8510,  1006.1301,  1030.1301 ],  // Juniper Hollow
    [ -1916.9877, -1892.9877,   268.6584,   292.6584 ],  // Doherty

    [   475.0262,   499.0262, -1752.1436, -1728.1436 ],  // Santa Maria Beach
    [  1012.9835,  1036.9835, -1034.3914, -1010.3914 ],  // Temple
    [  2053.0671,  2077.0671, -1845.4062, -1821.4062 ],  // Idlewood
    [   708.4891,   732.4891,  -462.5508,  -438.5508 ],  // Dillimore

    [   604.7832,   628.7832,   -86.8150,   -62.8150 ],  // Loco Low Co.
    [   605.5359,   629.5359,   -13.9900,    11.9900 ],  // TransFender
    [   603.2857,   627.2857,  -136.2390,  -112.2390 ]   // Wheel Arch Angel
]);

// Maximum amount of money that the player could pay in a Pay 'n Spray shop.
export const kPayAndSprayMaximumDifference = 300;

// After how many seconds do we start ignoring vehicle mod shops signals again.
const kModShopSignalExpirationMs = 2500;

// Maximum amount of money players can spent in the mod shops.
export const kModShopMaximumDifference = 10000;

// The financial disposition monitor is responsible for keeping the in-game money of all players in
// line with what the financial regulator thinks 
export class FinancialDispositionMonitor {
    disposed_ = null;
    regulator_ = null;

    lastVehicleModificationTime_ = null;

    constructor(regulator, NativeCallsConstructor = FinancialNativeCalls) {
        this.disposed_ = false;
        this.regulator_ = regulator;
        this.nativeCalls_ = new NativeCallsConstructor();

        this.lastVehicleModificationTime_ = new WeakMap();

        server.vehicleManager.addObserver(this);
    }

    // Spins until the disposition monitor gets disposed of. At the configured interval, will check
    // the amount of cash each player has, and align that with the financial regulator.
    async monitor() {
        await wait(kDispositionMonitorSpinDelay);
        while (!this.disposed_) {
            const currentTime = server.clock.monotonicallyIncreasingTime();

            for (const player of server.playerManager) {
                const expectedCash = this.regulator_.getPlayerCashAmount(player);
                const actualCash = this.nativeCalls_.getPlayerMoney(player);

                if (expectedCash === actualCash)
                    continue;

                const difference = actualCash - expectedCash;
                const absoluteDifference = Math.abs(difference);

                const lastVehicleModificationTime = this.lastVehicleModificationTime_.get(player);
                const lastVehicleModificationValid =
                    lastVehicleModificationTime >= (currentTime - kModShopSignalExpirationMs);

                if (lastVehicleModificationValid &&
                        difference >= -kModShopMaximumDifference && difference < 0) {
                    this.regulator_.setPlayerCashAmount(player, actualCash, true);
                    continue;
                }
                
                if (this.isInPayAndSprayShop(player) &&
                        difference >= -kPayAndSprayMaximumDifference && difference < 0) {
                    this.regulator_.setPlayerCashAmount(player, actualCash, true);
                    continue;
                }

                if (this.isInCasino(player) && absoluteDifference <= kCasinoMaximumDifference) {
                    this.regulator_.setPlayerCashAmount(player, actualCash, true);
                    continue;
                }

                this.nativeCalls_.givePlayerMoney(player, expectedCash - actualCash);
            }

            await wait(kDispositionMonitorSpinDelay);
        }
    }

    // Returns whether the given |player| currently is in a casino.
    isInCasino(player) {
        return this.isInArea(player, kCasinoAreas);
    }

    // Returns whether the given |player| currently is in a Pay 'n Spray shop.
    isInPayAndSprayShop(player) {
        return this.isInArea(player, kPayAndSprayShops);
    }

    // Returns whether the |player| is currently in one of the |areas|.
    isInArea(player, areas) {
        const position = player.position;
        for (const area of areas) {
            if (position.x < area[0] || position.x > area[1])
                continue;
            
            if (position.y < area[2] || position.y > area[3])
                continue;
            
            return true;
        }

        return false;
    }

    onVehicleMod(player) {
        this.lastVehicleModificationTime_.set(player, server.clock.monotonicallyIncreasingTime());
    }
    onVehiclePaintjob(player) {
        this.lastVehicleModificationTime_.set(player, server.clock.monotonicallyIncreasingTime());
    }
    onVehicleRespray(player) {
        this.lastVehicleModificationTime_.set(player, server.clock.monotonicallyIncreasingTime());
    }

    dispose() {
        server.vehicleManager.removeObserver(this);

        this.disposed_ = true;
    }
}
