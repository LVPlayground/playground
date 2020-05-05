// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { FinancialNativeCalls } from 'features/finance/financial_natives.js';

// How frequently should the disposition monitor verify that all monetary values known by each
// player are in line with that the regulator wants them to be.
export const kDispositionMonitorSpinDelay = 2500;

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
                // TODO: Allow small changes in casinos

                this.nativeCalls_.givePlayerMoney(player, expectedCash - actualCash);
            }

            await wait(kDispositionMonitorSpinDelay);
        }
    }

    dispose() {
        this.disposed_ = true;
    }
}
