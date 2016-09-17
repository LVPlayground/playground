// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Rather than implementing a reactive money-cheat detection system, we'll be proactive and have the
 * server control the money rather than the client. This means that the gamemode will keep track of
 * how much money a player is supposed to have, and will correct it when it's off.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class PlayerMoneyState <playerId (MAX_PLAYERS)> {
    // What is the highest amount of money a player is able to carry at any given time?
    const MaximumMoneyValue = 2147483647;

    // What is the lowest amount of money a player is able to carry at any given time?
    const MinimumMoneyValue = -2147483648;

    // What is the highest money value that Grand Theft Auto can tell us about?
    const MaximumGtaMoneyValue = 999999999;

    // What is the maximum value we may consider as a legimite increase or decrease of the player's
    // money? Further investigation to the reason will be skipped if it's more than this.
    const MaximumLegitimateMoneyIncrease = 10000;

    // With which steps in increases should a player be reported to administrators? This should be
    // high enough to ensure that we don't send too many messages to the administrators.
    const MinimumIncreaseValueForAdministratorNotice = 1000000;

    // How much cash is the player currently carrying with their character?
    new m_cash;

    // What is the latest increase in money this player received? We can filter out some easy, more
    // obvious increases this way (which happen right after connection, for example).
    new m_latestIncrease;

    // Keeps track of the total sum of increases a player has made. After a certain threshold has
    // been met, indicated by MinimumIncreaseValueForAdministratorNotice, tell on them.
    new m_unauthorizedIncreases;

    /**
     * Initialize a player's money when they connect to Las Venturas Playground. We don't give them
     * any money to start with, and make sure that the client is aware of this.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect() {
        ResetPlayerMoneyPrivate(playerId);
        m_unauthorizedIncreases = 0;
        m_latestIncrease = 0;
        m_cash = 0;
    }

    /**
     * Retrieves the amount of money this player currently has. We won't consult what the player
     * thinks they have, because we believe the server knows better. You can use the normal SA-MP
     * GetPlayerMoney() native function, which will end up here.
     *
     * @return integer The amount of money this player currently has.
     */
    public inline current() {
        return m_cash;
    }

    /**
     * What is the lastest increase in money requested for this player? Since there is a small delay
     * in sending data to the client and applying it there, we may get an innocence report.
     *
     * @return integer The value of the latest increase of this player.
     */
    private inline latestIncrease() {
        return m_latestIncrease;
    }

    /**
     * Resets the latest increase. Because sometimes a player is receiving the same amount of money
     * repeaditly over a short period of time, we can't just ignore these increases.
     */
    private inline resetLatestIncrease() {
        m_latestIncrease = 0;
    }

    /**
     * It is very much possible that the player wins some money in a casino or does a stunt. We need
     * to detect these cases and then add the money manually. This is different from the approaches
     * we previously took, in which we tried to prove that the increase was not just.
     */
    @list(SecondTimer)
    public static onSecondTimerTick() {
        for (new playerId = 0; playerId <= PlayerManager->highestPlayerId(); ++playerId) {
            if (Player(playerId)->isConnected() == false)
                continue; // this player is not connected.

            new money = GetPlayerMoneyPrivate(playerId),
                expected = PlayerMoneyState(playerId)->current();

            if (money == expected)
                continue; // the amount of money hasn't diverged.

            // SA-MP seems to be unable to tell us about any money value higher than 999.999.999, and
            // returns that even though the amount of money we think a player has may be higher. If
            // we get this value as the client's count, then we're *probably* good.
            if (money == MaximumGtaMoneyValue)
                continue;

            new difference = money - expected,
                absoluteDifference = difference < 0 ? 0 - difference : difference;

            // The difference could be equal to the latest increase we gave to this player, in which
            // case the server and client just didn't had a chance to synchronize yet. Let's also
            // reset the latest increase because this could be a repeated payment.
            if (difference == PlayerMoneyState(playerId)->latestIncrease()) {
                PlayerMoneyState(playerId)->resetLatestIncrease();
                continue;
            }

            // Only consider finding exceptions if the increase (or decrease) is within reason. Then
            // check with the various exception systems if they are able to justify the difference.
            if (absoluteDifference < MaximumLegitimateMoneyIncrease) {
                if (CasinoMoneyException->isLegitimateDifference(playerId, difference) ||
                    VehicleMoneyException->isLegitimateDifference(playerId, difference) ||
                    (difference >= -12 && difference < 0) /** burger shops **/) {
                    // One of the exception systems marked this increase as being valid. Increase
                    // the player's server-sided money and proceed to the next player.
                    PlayerMoneyState(playerId)->increase(difference, false /* discrete */,
                                                         true /* skipSync */);
                    continue;
                }
            }

            // We have not been able to identify why this player's money is diverging. As such,
            // synchronize their local status with that of the server again.
            GivePlayerMoneyPrivate(playerId, expected - money);
        }
    }

    /**
     * Increases the current value with the given amount. If the value is negative, it will be
     * substracted from the player's balance. We clamp the total amount of cash between the limits
     * of a signed 32-bit integer, making sure the player doesn't end up with negative money.
     *
     * Because of the clamping, we need to do four individual checks: the current amount of money
     * can be both positive and negative, and the amount to add can be positive and negative.
     *
     * @param amount The amount of money which should be given to this player.
     * @param discrete Should we keep this increase discrete, meaning no visual feedback?
     * @param skipSync Whether synchronization of the player's amount should be skipped.
     */
    public increase(amount, bool: discrete = false, bool: skipSync = false) {
        if (m_cash > 0 && amount > 0) {
            // Edgy case (1): Positive cash, positive increase.
            if ((MaximumMoneyValue - m_cash) >= amount)
                m_cash += amount;
            else
                m_cash = MaximumMoneyValue;
        } else if (m_cash < 0 && amount < 0) {
            // Edgy case (2): Negative cash, negative increase.
            if ((MinimumMoneyValue - m_cash) <= amount)
                m_cash += amount;
            else
                m_cash = MinimumMoneyValue;
        } else {
            // Otherwise we can be reasonably secure in amending the current amount.
            m_cash += amount;
        }

        m_latestIncrease = amount;

        // Now re-synchronize the amount of money with the player, based on what we think they
        // should be having right now. Do this by giving them the difference (even when negative).
        if (!skipSync)
            GivePlayerMoneyPrivate(playerId, m_cash - GetPlayerMoneyPrivate(playerId));

        // Report this change to the money indicator, so we can give them visual feedback of what
        // happened. We won't show the indicator if this is a discrete money change.
        if (discrete == false)
            MoneyIndicator->reportMoneyChangeForPlayer(playerId, amount);
    }

    /**
     * Resets the amount of money this player owns to zero, both in our local state and synchronized
     * to the player itself. The same effect happens when they connect to the server, or die.
     */
    public reset() {
        ResetPlayerMoneyPrivate(playerId);
        m_cash = 0;
    }
};

forward LVP_GetPlayerMoney(playerId);
forward LVP_GivePlayerMoney(playerId, amount);
forward LVP_ResetPlayerMoney(playerId);

/**
 * Publicly exposed API for getting the amount of money a player is currently carrying. This amount
 * is leading, whereas the native GetPlayerMoney() is being ignored by all of the gamemode.
 *
 * @param playerId Id of the player to get the amount of money they're carrying for.
 * @param integer The amount of money they're carring.
 */
public LVP_GetPlayerMoney(playerId) {
    return PlayerMoneyState(playerId)->current();
}

/**
 * Publicly exposed API for giving money to a player. This should be used instead of the normal
 * GivePlayerMoney method, which will trigger anticheat warnings.
 *
 * @param playerId Id of the player to give money to.
 * @param amount Amount of money to give to the player.
 */
public LVP_GivePlayerMoney(playerId, amount) {
    PlayerMoneyState(playerId)->increase(amount);
}

/**
 * Publicly exposed API for resetting the sum of money a player is carrying with them. This must be
 * used instead of the native ResetPlayerMoney in order for a filterscript to work well with our
 * anticheat system, which maintains its own money counts.
 *
 * @param playerId Id of the player to reset their money for.
 */
public LVP_ResetPlayerMoney(playerId) {
    PlayerMoneyState(playerId)->reset();
}

// Include the test-suite for this class.
#include "Entities/Financial/Anticheat/PlayerMoneyState.tests.pwn"
