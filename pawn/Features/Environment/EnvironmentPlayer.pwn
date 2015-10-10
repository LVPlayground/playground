// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Each player has their own environment data, in which we update the time and weather which applies
 * to them given their current position.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class EnvironmentPlayer <playerId (MAX_PLAYERS)> {
    /**
     * Updates the dynamic environment for each connected player. Retrieve all required information
     * for each of the systems and request them to update the player's state if anything changed.
     */
    @list(SecondTimer)
    public static updatePlayers() {
        new Float: positionVector[3];
        for (new playerId = 0; playerId <= PlayerManager->highestPlayerId(); ++playerId) {
            if (Player(playerId)->isConnected() == false || Player(playerId)->isNonPlayerCharacter())
                continue; // don't process players who aren't connected or are NPCs.

            GetPlayerPos(playerId, positionVector[0], positionVector[1], positionVector[2]);

            // TODO: Implement support for the per-feature updates.
        }
    }
};
