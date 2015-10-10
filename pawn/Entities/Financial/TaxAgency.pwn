// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Tax manager keeps insight in the amount of money people are carrying with them at any given time 
 * and eventually applies custom taxes which will automatically be paid from their cash money.
 * 
 * @author Manuele "Kase" Macchia <kaseify@gmail.com>
 */
class TaxAgency {
    // Defines how much should a registered player have in their wallet to be taxable.
    const MinimumRegisteredPlayerTaxableAmount = 1000000;

    // Defines how much should a non-registered player have in their wallet to be taxable.
    const MinimumUnregisteredPlayerTaxableAmount = 300000;

    // Defines the base tax rate (percent).
    const TaxPercentageBaseline = 5;

    // Defines how much time should someone keep their cash money to get taxed.
    const MinutesUntilTaxCollection = 5;

    // Keeps track of how many minutes has a player kept his cash money, so we know when to tax him.
    new m_minutesPlayerHasHeldOnToCash[MAX_PLAYERS];

    /**
     * Calculates and applies the tax to the given player, at the given tax rate, and checks whether
     * he has gained any new achievement or not.
     *
     * @param playerId Id of the player we're taxing.
     * @param taxRate Rate at which we tax our player.
     * @return integer Amount of money paid by our player.
     */
    private applyTaxesForPlayerAndReturnAmount(playerId, taxRate) {
        new taxAmount = (GetPlayerMoney(playerId) / 100) * taxRate;
        GivePlayerMoney(playerId, -taxAmount);

        CAchieve__Tax(playerId, taxAmount);
        return taxAmount;
    }

    /**
     * Check whether the player is eligable for tax collection or not. We check the player's status
     * within the server (registered or unregistered) and if he's got more than the amount of money
     * we allow to keep as cash.
     *
     * @param playerId Id of the player we're taxing.
     * @param taxRate Rate at which we tax our player.
     * @return integer Amount of money paid by our player.
     */
    private bool: isPlayerEligableForTaxCollection(playerId) {
        if (GetPlayerMoney(playerId) >= MinimumRegisteredPlayerTaxableAmount)
            return true;

        if (GetPlayerMoney(playerId) >= MinimumUnregisteredPlayerTaxableAmount && Player(playerId)->isRegistered() == false)
            return true;

        return false;
    }

    /**
     * Gets called every minute by the main timer. Checks whether the player has to be taxed; if so,
     * ensures he calculates the correct rate and sends him a message to notify him of the tax. If
     * he's got some money a while ago, and now he isn't eligible anymore for tax collection (he
     * lost, spent or banked his cash money) OR he has already paid taxes last time, then we make
     * sure his tax cycle starts again from 0 minutes.
     *
     * @param playerId Id of the player we're taxing.
     * @param taxRate Rate at which we tax our player.
     */
    @list(MinuteTimerPerPlayer)
    public collectPlayerTaxes(playerId) {
        if (this->isPlayerEligableForTaxCollection(playerId)) {
            if (m_minutesPlayerHasHeldOnToCash[playerId] >= MinutesUntilTaxCollection) {
                new taxAmount = this->applyTaxesForPlayerAndReturnAmount(playerId, TaxPercentageBaseline),
                    notice[128];

                format(notice, sizeof(notice), "* You have paid $%s taxes.", formatPrice(taxAmount));
                SendClientMessage(playerId, Color::Red, notice);

                m_minutesPlayerHasHeldOnToCash[playerId] = 0;
            } else
                m_minutesPlayerHasHeldOnToCash[playerId]++;
        } else if (m_minutesPlayerHasHeldOnToCash[playerId] != 0)
            m_minutesPlayerHasHeldOnToCash[playerId] = 0;

        return 1;
    }
}
