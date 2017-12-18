// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Tests can inject a balance that should be returned by getBalanceForPlayer instead.
let mockedBalance = null;

// Class that acts as a bridge between JavaScript and Pawn for interacting with a player's monitary
// status, for instance the amount of money they have available in their bank account. All functions
// are asynchronous to make sure they can be used from callbacks, and are safe for use in tests.
class PlayerMoneyBridge {
    static async getBalanceForPlayer(player) {
        await Promise.resolve();

        if (server.isTest())
            return mockedBalance || 0;

        return pawnInvoke('OnGetPlayerBankBalance', 'i', player.id);
    }

    static async setBalanceForPlayer(player, balance) {
        await Promise.resolve();

        // Normalize the |balance| to be between 0 and the maximum value of a signed 32-bit integer.
        const normalizedBalance = Math.max(0, Math.min(balance, 2147483647));

        if (server.isTest()) {
            if (mockedBalance !== null)
                mockedBalance = normalizedBalance;

            return;
        }

        pawnInvoke('OnSetPlayerBankBalance', 'ii', player.id, normalizedBalance);
    }

    // Sets the mocked balance for the next call to getBalanceForPlayer().
    static setMockedBalanceForTests(balance) {
        mockedBalance = balance;
    }
}

export default PlayerMoneyBridge;
