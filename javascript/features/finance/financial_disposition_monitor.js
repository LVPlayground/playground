// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { FinancialNativeCalls } from 'features/finance/financial_natives.js';

// How frequently should the disposition monitor verify that all monetary values known by each
// player are in line with that the regulator wants them to be.
export const kDispositionMonitorSpinDelay = 1500;

// Set of the casino areas that exist in San Andreas. In-game coordinates.
export const kCasinoAreas = new Set([
    [ 1928.1771,  987.5739, 1970.5675, 1042.8369 ], // Four Dragons casino
    [ 2171.3618, 1584.2649, 2279.4915, 1628.6199 ], // Caligula's
    [ 1117.5068,  -11.2747, 1142.4843,   12.5986 ]  // Private Casino (VIP room)
]);

// Maximum amount of money that could change hands in casinos.
export const kCasinoMaximumDifference = 10000;

// The financial disposition monitor is responsible for keeping the in-game money of all players in
// line with what the financial regulator thinks 
export class FinancialDispositionMonitor {
    disposed_ = null;
    regulator_ = null;

    constructor(regulator, NativeCallsConstructor = FinancialNativeCalls) {
        this.disposed_ = false;
        this.regulator_ = regulator;
        this.nativeCalls_ = new NativeCallsConstructor();
    }

    // Spins until the disposition monitor gets disposed of. At the configured interval, will check
    // the amount of cash each player has, and align that with the financial regulator.
    async monitor() {
        await wait(kDispositionMonitorSpinDelay);
        while (!this.disposed_) {
            for (const player of server.playerManager) {
                const expectedCash = this.regulator_.getPlayerCashAmount(player);
                const actualCash = this.nativeCalls_.getPlayerMoney(player);

                if (expectedCash === actualCash)
                    continue;
                
                // TODO: Allow small changes in Pay 'n Spray shops
                // TODO: Allow small changes when tuning vehicles
                
                const absoluteDifference = Math.abs(expectedCash - actualCash);
                if (this.isInCasino(player) && absoluteDifference <= kCasinoMaximumDifference) {
                    this.regulator_.setPlayerCashAmount(player, actualCash);
                    continue;
                }

                this.nativeCalls_.givePlayerMoney(player, expectedCash - actualCash);
            }

            await wait(kDispositionMonitorSpinDelay);
        }
    }

    // Returns whether the given |player| currently is in a casino.
    isInCasino(player) {
        const position = player.position;
        for (const casino of kCasinoAreas) {
            if (casino[0] > position.x || casino[2] < position.x)
                continue;
            
            if (casino[1] > position.y || casino[3] < position.y)
                continue;
            
            return true;
        }

        return false;
    }

    dispose() {
        this.disposed_ = true;
    }
}
