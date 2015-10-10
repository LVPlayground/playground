// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * When a player is gambling in a casino, we need slightly special handling to make sure that their
 * server-sided money reflects what they're doing on the client. Until San Andreas: Multiplayer adds
 * specialized callbacks for informing us, we have to rely on a number of heuristics.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class CasinoMoneyException {
    /**
     * Called by the money state tracker when a player has reported an unknown increase in money
     * in their client side state. This could be the case when the player is gambling in a casino,
     * which is what we're here to verify.
     *
     * @param playerId Id of the player for who a difference in money has been reported.
     * @param difference The amount of money this report entails.
     * @return boolean Whether we are able to justify this increase.
     */
    public bool: isLegitimateDifference(playerId, difference) {
        // If the player is not in a casino, we can say with certainty that the difference is not
        // legitimate because of gambling reasons.
        if (CasinoArea->casinoForPlayer(playerId) == NoCasino)
            return false;

        // TODO: Vastly improve this heuristic. We can keep track of the gambling history of the
        // player to determine exactly how much they should be winning.
        if (difference >= -10000 && difference <= 10000)
            return true;

        return false;
    }
};
