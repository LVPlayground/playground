// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * There are various actions a player can do with vehicles which are being offered outside of the
 * control of Las Venturas Playground. We try to catch some using heuristics, and we'll try to
 * validate whether a player's difference in money can be explained using, for example, a paintjob.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class VehicleMoneyException {
    // After how many seconds do we no longer care about what a player did to their vehicle?
    const VehicleOperationExpireTime = 5;

    // At what time did a player last modify their vehicle?
    new m_latestModificationTime[MAX_PLAYERS];

    // When did a player last get a paintjob done for their vehicle?
    new m_latestPaintjobTime[MAX_PLAYERS];

    // When did a player get a respray for their vehicle?
    new m_latestResprayTime[MAX_PLAYERS];

    /**
     * Called by the money state tracker when a player has reported an unknown increase in money
     * in their client side state. This could be because they've modified their vehicle or got a
     * paintjob, which we should be able to verify.
     *
     * @param playerId Id of the player for who a difference in money has been reported.
     * @param difference The amount of money this report entails.
     * @return boolean Whether we are able to justify this increase.
     */
    public bool: isLegitimateDifference(playerId, difference) {
        if (difference > 0)
            return false; // vehicle operations can only cost money.

        // If the player is in a Pay 'n Spray and didn't loose more than 300 dollar, take it.
        if (PayAndSprayShops->isPlayerInShop(playerId) && difference > -300)
            return true;

        new currentTime = Time->currentTime();
        if ((currentTime - m_latestResprayTime[playerId]) < VehicleOperationExpireTime ||
            (currentTime - m_latestPaintjobTime[playerId]) < VehicleOperationExpireTime ||
            (currentTime - m_latestModificationTime[playerId]) < VehicleOperationExpireTime) {
            // If the player has been modifying their vehicle in the past N seconds, then we'll mark
            // any decrease in their money in the range of [-3000, -1] to be legitimate.
            if (difference > -3000)
                return true;
        }

        // Otherwise we have no idea. Let's just return false -- maybe something else does.
        return false;
    }

    /**
     * Note down that the player is currently adding a modification to their vehicle. This could be
     * an indication that they're currently in a mod shop changing their vehicle.
     *
     * @param playerId Id of the player whose vehicle just got modified.
     */
    public markVehicleModForPlayer(playerId) {
        m_latestModificationTime[playerId] = Time->currentTime();
    }

    /**
     * Note down that a player's vehicle is currently getting a new paintjob. This is another data
     * point in recognizing that a player's money should be going down right now.
     *
     * @param playerId Id of the player who's currently getting a paintjob.
     */
    public markVehiclePaintjobForPlayer(playerId) {
        m_latestPaintjobTime[playerId] = Time->currentTime();
    }

    /**
     * Note down that a player's vehicle is currently getting a respray. This allows us to accept
     * the money decrease whenever this shows up for the player's account.
     *
     * @param playerId Id of the player who just got a respray for their vehicle.
     */
    public markVehicleResprayForPlayer(playerId) {
        m_latestResprayTime[playerId] = Time->currentTime();
    }
};
