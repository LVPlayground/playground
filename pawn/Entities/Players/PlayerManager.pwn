// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * The Player Manager maintains state about the connected group of players as a whole, and provides
 * convenience methods for the rest of the gamemode to use. An example of this is that the class
 * maintains the highest player Id currently in use, allowing you to limit loops.
 *
 * Since timing of the invocation of these methods matters, they are called from the PlayerEvents
 * class as the very first or last method after a player connects or disconnects from LVP.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class PlayerManager {
    // What is the highest Player Id currently in use?
    new m_highestPlayerId;

    // How many players are currently connected to Las Venturas Playground?
    new m_connectedPlayerCount;

    // Ids of the players found as part of findPlayerByIdOrPartialName, if more than one.
    new m_foundPlayerList[5];

    // Keep track of the player's drunk level in order to calculate the FPS for this player.
    new m_drunkLevel[MAX_PLAYERS];

    // Save the player's calculated frames per second (FPS).
    new m_framesPerSecond[MAX_PLAYERS];

    /**
     * Invoked when a new player connects to the server.
     *
     * @param playerId Id of the player who connected to the server.
     */
    public onPlayerConnect(playerId) {
        ++m_connectedPlayerCount;
        if (m_highestPlayerId < playerId)
            m_highestPlayerId = playerId;
    }

    /**
     * Invoked when a player disconnects from the server. Establish the new highest player Id if the
     * current highest Id belonged to this user, by walking backwards over the possible player Ids.
     *
     * @param playerId Id of the player who disconnected from Las Venturas Playground.
     */
    public onPlayerDisconnect(playerId) {
        --m_connectedPlayerCount;
        if (m_highestPlayerId != playerId)
            return;

        m_highestPlayerId = 0;
        for (new highestId = playerId - 1; highestId >= 0; --highestId) {
            if (Player(highestId)->isConnected() == false)
                continue;

            m_highestPlayerId = highestId;
            return;
        }
    }

    /**
     * What is the highest player Id currently in use?
     *
     * @return integer The highest player Id currently in use.
     */
    public inline highestPlayerId() {
        return (m_highestPlayerId);
    }

    /**
     * Retrieve the number of players currently connected to Las Venturas Playground.
     *
     * @return integer How many people are currently connected to the server?
     */
    public inline connectedPlayerCount() {
        return (m_connectedPlayerCount);
    }

    /**
     * Find an online player based on their player Id or (part of) their nickname. All players who
     * are currently in the game will be considered. The result of the search action will be the
     * return value of this method, whereas the found playerId will be stored in the argument.
     *
     * @param searchString The string to search for in the set of online players.
     * @param playerId Id of the player that has been found, or Player::InvalidId.
     * @return FindPlayerResult Result of this find action.
     */
    public FindPlayerResult: findPlayerByIdOrPartialName(searchString[], &playerId) {
        for (new index = 0; index < sizeof(m_foundPlayerList); ++index)
            m_foundPlayerList[index] = Player::InvalidId;

        new foundPlayerId = Player::InvalidId,
            searchLength = strlen(searchString);

        playerId = Player::InvalidId;

        // If a numeric text has been given as the player Id, then we can take the quick path and
        // assume that it's a player Id. Check whether that player is on, and return an Id.
        if (IsNumeric(searchString)) {
            foundPlayerId = strval(searchString);
            if (Player(foundPlayerId)->isConnected() == false)
                return PlayerIdNotConnected;

            playerId = foundPlayerId;
            return PlayerFound;
        }

        // Since it's not a number that's been given, we're going to search through all the online
        // players. The search string needs to be at least three characters long (incidentally this
        // also is the minimum length of a nickname). Then do a fuzzy search.
        if (searchLength < 3)
            return PlayerNameTooShort;

        new matchedPlayerCount = 0;
        for (new currentId = 0; currentId <= PlayerManager->highestPlayerId(); ++currentId) {
            if (matchedPlayerCount >= 5)
                break; // too much players have already been found.

            if (Player(currentId)->isConnected() == false || Player(currentId)->isNonPlayerCharacter() == true)
                continue; // the player with currentId is not connected or is an NPC.

            if (strfind(Player(currentId)->nicknameString(), searchString, true) == -1)
                continue;

            m_foundPlayerList[matchedPlayerCount++] = currentId;
        }

        if (matchedPlayerCount == 0)
            return PlayerNameNotFound;

        if (matchedPlayerCount >= 2)
            return PlayerNameAmbiguous;

        playerId = m_foundPlayerList[0];
        return PlayerFound;
    }

    /**
     * Retrieve a player Id that has been found as a result of the findPlayerByIdOrPartialName()
     * method, when multiple players have been found. A maximum of five results are available.
     *
     * @param resultIndex Index of the result, must be between 0 and 4.
     * @return playerId Id of the player at the given index.
     */
    public foundPlayerIdResult(resultIndex) {
        return m_foundPlayerList[resultIndex];
    }

    /**
     * Calculate the player's FPS based on their drunk level.
     *
     * @param playerId Id of the player to calculate the FPS for.
     */
    @list(SecondTimerPerPlayer)
    public onSecondTimerTick(playerId) {
        if (Player(playerId)->isNonPlayerCharacter() == true)
            return 0;

        new drunkLevel = GetPlayerDrunkLevel(playerId),
            previousDrunkLevel = m_drunkLevel[playerId];

        if (drunkLevel < 100)
            SetPlayerDrunkLevel(playerId, 2000);

        if (previousDrunkLevel != drunkLevel) {
            new framesUpdate = previousDrunkLevel - drunkLevel;
            m_drunkLevel[playerId] = drunkLevel;

            if (framesUpdate > 0 && framesUpdate < 256)
                m_framesPerSecond[playerId] = framesUpdate - 1;
        }

        return 1;
    }

    /**
     * Retrieve a player's FPS based on our calculation every second.
     *
     * @param playerId Id of the player to retrieve the FPS for.
     * @return integer The amount of frames produced in a second.
     */
    public inline framesPerSecond(playerId) {
        return (m_framesPerSecond[playerId]);
    }
};

// Include the test-suite for the PlayerManager class.
#include "Entities/Players/PlayerManager.tests.pwn"
