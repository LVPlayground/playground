// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * The HitmanTracker class handles all the bounties in LVP, keeps track of them, and rewards the
 * bounty hunters on succesful killing.
 *
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 */
class HitmanTracker <playerId (MAX_PLAYERS)> {
    // Maximum total bounty than can be placed on a player's head: 1 billion dollar.
    public const MaximumBountyAmount = 1000000000;

    // We need a member property to store every player's bounty.
    new m_playerBounty;

    // We need a member property to hold the UNIX timestap of /hitman usage.
    new m_lastHitmanUsageTime;

    /**
     * Getter to hold the total bounty amount placed on the player's head.
     *
     * @return integer Total bounty amount.
     */
    public inline playerBounty() {
        return (m_playerBounty);
    }

    /**
     * Getter to hold the UNIX timestap of the moment /hitman was used
     *
     * @return integer Time in seconds.
     */
    public inline lastHitmanUsageTime() {
        return (m_lastHitmanUsageTime);
    }

    /**
     * Update the bounty the player has on his head.
     *
     * @param playerBounty The new amount of money on the player's head.
     * @return boolean Were we able to update the player's bounty to the given value?
     */
    public bool: setBounty(playerBounty) {
        if (playerBounty < 0)
            return false; 

        m_playerBounty = min(playerBounty, HitmanTracker::MaximumBountyAmount);
        return true;
    }

    /**
     * Make sure that all information held by this class is reset when a player disconnects from the
     * server, as we don't want new players to carry a bounty of a player before them.
     */
    @list(OnPlayerDisconnect)
    public onPlayerDisconnect() {
        m_playerBounty = 0;
        m_lastHitmanUsageTime = 0;
    }

    /**
     * When a player carrying a bounty dies, we check if this is either on purpose (suicide), or he
     * actually got killed. In the latter case, we reward the killer with the bounty and remove the
     * bounty from the killed player.
     */
    @list(OnPlayerDeath)
    public onPlayerDeath(killerId, reason) {
        if (killerId == Player::InvalidId)
            return 0;

        if (Player(killerId)->isConnected() == true && !IsPlayerInMinigame(playerId) && m_playerBounty > 0) {
            new message[128];
            format(message, sizeof(message), "* You've earned $%d because you've killed %s (%d).",
                m_playerBounty, Player(playerId)->nicknameString(), playerId);
            SendClientMessage(killerId, Color::Success, message);

            GivePlayerMoney(killerId, m_playerBounty);
            m_playerBounty = 0;
        }

        return 1;
        #pragma unused reason
    }
};
