// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Responsible for providing players with the ability to interact with the financial regulator and
// supporting services, by introducing a series of commands.
export class FinancialNatives {
    constructor(regulator) {
        this.regulator_ = regulator;

        provideNative(
            'GetPlayerMoneyJS', 'i', FinancialNatives.prototype.getPlayerMoney.bind(this));
        provideNative(
            'GivePlayerMoneyJS', 'ii', FinancialNatives.prototype.givePlayerMoney.bind(this));
        provideNative(
            'ResetPlayerMoneyJS', 'i', FinancialNatives.prototype.resetPlayerMoney.bind(this));
    }

    // native GetPlayerMoneyJS(playerid);
    getPlayerMoney(playerid) {

    }

    // native GivePlayerMoneyJS(playerid, amount);
    givePlayerMoney(playerid, amount) {

    }

    // native ResetPlayerMoneyJS(playerid);
    resetPlayerMoney(playerid) {
        
    }

    dispose() {
        provideNative('GetPlayerMoneyJS', 'i', () => 0);
        provideNative('GivePlayerMoneyJS', 'ii', () => 0);
        provideNative('ResetPlayerMoneyJS', 'i', () => 0);
    }
}
