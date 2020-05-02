// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

class BankAccount {
    // Maximum balance of any kind of bank account.
    public const MaximumBalance = 2000000000;

    // What is the pickup handler Id for the bank pickup?
    public const BankHandlerId = @counter(PickupHandler);

    // What is the balance they currently have available in their account?
    new m_balance[MAX_PLAYERS];

    // Is the player currently in the main bank building?
    new bool: m_inBank[MAX_PLAYERS];

    /**
     * Creates the pickup necessary to determine whether someone is in the Las Venturas Playground
     * Central Bank building. We'll be using callbacks for verifying whether they are.
     */
    public __construct() {
        PickupController->createPickup(BankAccount::BankHandlerId, MainBankDollarPickupId,
            PersistentPickupType, 373.8596, 173.7510, 1008.3893, -1);
    }

    /**
     * Make sure that all information held by this class is reset when a new player connects to the
     * server, as we don't want players to be able to access the funds of a player before them.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect(playerId) {
        m_inBank[playerId] = false;
        m_balance[playerId] = 0;
    }

    /**
     * Returns the balance currently available in the player's account. This will always have a
     * maximum of the account type the player currently has.
     *
     * @return integer The amount of money in the player's bank account.
     */
    public inline balance(playerId) {
        return (m_balance[playerId]);
    }

    /**
     * Returns the maximum amount of money that can be deposited to the bank account. This value
     * effectively is equal to [maximum balance]-[current balance].
     *
     * @return integer The maximum amount of money the player can deposit.
     */
    public availableBalance(playerId) {
        return max(0, BankAccount::MaximumBalance - m_balance[playerId]);
    }

    /**
     * Returns the maximum amount of money that the player can store in their account. This is
     * different based on the account type the player has.
     *
     * @return integer The maximum amount of money the player can store.
     */
    public maximumBalance(playerId) {
        return BankAccount::MaximumBalance;
        #pragma unused playerId
    }

    /**
     * Update the amount of money the player has in their account. After setting the new balance,
     * this method will make sure that we stay within the caps of the player's account type.
     *
     * @param balance The new amount of money in the player's account.
     * @return boolean Were we able to update the player's balance to the given value?
     */
    public bool: setBalance(playerId, balance) {
        if (balance < 0)
            return false; // we don't accept negative balances.

        m_balance[playerId] = min(balance, BankAccount::MaximumBalance);

        return true;
    }

    /**
     * Returns whether the player currently is in the main bank building. This will be used by the
     * bank commands to determine whether the /bankaccount command can be used.
     *
     * @return boolean Is the player currently in the bank building?
     */
    public inline bool: inBank(playerId) {
        return (m_inBank[playerId]);
    }

    /**
     * When a player enters the bank checkpoint, mark them as being in the bank so commands work and
     * give them a brief overview of the options available to them.
     *
     * @param pickupId Id of the pickup they started touching. Unused.
     * @param extraId Additional Id allowing features to route this pickup.
     */
    @switch(OnPlayerEnterPickup, BankAccount::BankHandlerId)
    public onPlayerEnterBank(playerId, pickupId, extraId) {
        m_inBank[playerId] = true;

        // Announce the options to them in an information box.
        ShowBoxForPlayer(playerId, "Welcome to the Las Venturas Playground Main Bank. Please type ~r~/bankaccount~w~ to get started.");

        #pragma unused pickupId, extraId
    }

    /**
     * When a player leaves the bank's checkpoint again, mark them as having left the bank, making
     * sure that the /bankaccount command no longer works.
     *
     * @param pickupId Id of the pickup they left. Unused.
     * @param extraId Additional Id allowing features to route this pickup.
     */
    @switch(OnPlayerLeavePickup, BankAccount::BankHandlerId)
    public onPlayerLeaveBank(playerId, pickupId, extraId) {
        m_inBank[playerId] = false;

        #pragma unused pickupId, extraId
    }
};

// Functions exposed to JavaScript code.
forward OnGetPlayerBankBalance(playerId);
public OnGetPlayerBankBalance(playerId) {
    if (!Player(playerId)->isConnected())
        return 0;

    return BankAccount->balance(playerId);
}

forward OnSetPlayerBankBalance(playerId, balance);
public OnSetPlayerBankBalance(playerId, balance) {
    if (!Player(playerId)->isConnected())
        return;

    BankAccount->setBalance(playerId, balance);
}
