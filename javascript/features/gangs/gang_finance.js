// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Contains all information relating to a gang's financial situation. This functionality is provided
// for gangs which are active in-game, as well as for gangs which aren't currently online.
export class GangFinance {
    // Bounary values for the amount of money a gang is able to store in their bank account. These
    // are the absolute boundaries, other limits might be imposed by other systems. Note that it is
    // possible for gang account to move into the negative based on recurring payments.
    static kMaximumBankAmount = 5354228880;
    static kMinimumBankAmount = 0;

    database_ = null;
    manager_ = null;

    constructor(database, manager) {
        this.database_ = database;
        this.manager_ = manager;
    }

    // ---------------------------------------------------------------------------------------------

    // Gets the current bank account balance of the given |gangId|. This prefers online gangs, then
    // hits the database for getting the actual balance of an offline gang.
    async getAccountBalance(gangId) {
        const gang = this.manager_.gangs_.get(gangId);
        if (gang)
            return gang.balance;

        return await this.database_.getBalance(gangId) ?? 0;
    }

    // Deposits the given |amount| into the bank account owned by |gangId|. The |userId| and
    // |reason| must be provided because all changes to gang bank accounts are attributed.
    async depositToAccount(gangId, userId, amount, reason) {
        if (amount <= 0)
            throw new Error('Gang bank deposits must be more than $0 in value.');

        await this.database_.processTransaction(gangId, userId, amount, reason);

        const gang = this.manager_.gangs_.get(gangId);
        if (gang)
            gang.balance += amount;
    }

    // Withdraws the given |amount| from the bank account owned by |gangId|. The |userId| should
    // be given, unless it's the server initiating the withdrawal. The |reason| must always be
    // given to explain this mutation in the bank account's balances.
    async withdrawFromAccount(gangId, userId, amount, reason) {
        if (amount <= 0)
            throw new Error('Gang bank withdrawals must be more than $0 in value.');

        await this.database_.processTransaction(gangId, userId, -amount, reason);

        const gang = this.manager_.gangs_.get(gangId);
        if (gang)
            gang.balance -= amount;
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {}
}
