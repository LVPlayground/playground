// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * One of the many tools LVP can use to track hackers/cheaters is the ability to spectate players.
 * This class will take care of the necessary commands and underlying handler. In order to avoid
 * players from 'knowing' they're being watched; we'll have to very creative with this.
 *
 * When the player is finally being watched, we show a set of 3D textlabels with some basic information
 * regarding the player's name, Id, vehicle name and more.
 *
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 */
class PlayerSpectateHandler {
    // Track if any player is currently spectating.
    new bool: m_isSpectating[MAX_PLAYERS];

    // Keep track of the subject playerId for every watching user.
    new m_watchingPlayerId[MAX_PLAYERS];

    // Save the 3D text label Id for every player.
    new PlayerText3D: m_playerLabelId[MAX_PLAYERS] = {PlayerText3D: INVALID_3DTEXT_ID, ...};

    // Save the player's position on first /watch usage.
    new Float: m_playerPosition[MAX_PLAYERS][3];

    // Save the player's interior on first /watch usage.
    new m_playerInterior[MAX_PLAYERS];

    // Track if the player's position/interior needs to be set on spawn.
    new bool: m_resetPosition[MAX_PLAYERS];

    /**
     * Start spectating a player.
     *
     * @param playerId Id of the player who issued this command.
     * @param subjectId Id or name of the player to watch.
     */
    public startSpectating(playerId, subjectId) {
        // If a player was already watching somebody, make sure to destroy the existing textlabel.
        if (m_isSpectating[playerId] == true) {
            new oldSubjectId = m_watchingPlayerId[playerId];
            DeletePlayer3DTextLabel(playerId, m_playerLabelId[oldSubjectId]);
        } else { // else, we can start initializing our settings
            GetPlayerPos(playerId, m_playerPosition[playerId][0], m_playerPosition[playerId][1],
                m_playerPosition[playerId][2]);
            m_playerInterior[playerId] = GetPlayerInterior(playerId);

            m_isSpectating[playerId] = true;
            TogglePlayerSpectating(playerId, true);
        }

        m_watchingPlayerId[playerId] = subjectId;

        // This function will take care of the actual spectating and textlabel creation.
        this->synchronizeSpectateEnvironment(playerId, subjectId, GetPlayerVehicleID(subjectId),
            GetPlayerInterior(subjectId), GetPlayerVirtualWorld(subjectId), true /* reattach == true */);

        return 1;
    }

    /**
     * Issued when a player stops spectating. Reset all the player's variables and respawn him/her.
     *
     * @param playerId Id of the player who issued this command.
     * @param subject Id or name of the player who's being watched.
     */
    public stopSpectating(playerId, subjectId) {
        if (m_isSpectating[playerId] == false)
            return 0;

        m_isSpectating[playerId] = false;
        m_watchingPlayerId[playerId] = Player::InvalidId;

        // Destroy the textlabel.
        DeletePlayer3DTextLabel(playerId, m_playerLabelId[subjectId]);

        // Toggle player not spectating anymore, this will respawn the player.
        TogglePlayerSpectating(playerId, false);

        // Since we want to restore the player's position and interior from before spectating,
        // we will toggle this boolean which is being checked OnPlayerSpawn.
        m_resetPosition[playerId] = true;

        return 1;
    }

    /**
     * Synchronize the spectate state and 3D textlabel. This has to be done for every vehicle state
     * change, interior change and world change.
     *
     * @param playerId Id of the player who issued this command.
     * @param subject Id or name of the player who's being watched.
     * @param vehicleId Id of the vehicle the subject resides in, if any.
     * @param interiorId Id of the interior the subject resides in.
     * @param worldId Id of the world the subject resides in.
     * @param reattach Is it necessary to adapt the spectate mode?
     */
    public synchronizeSpectateEnvironment(playerId, subjectId, vehicleId, interiorId, worldId, bool: reattach) {
        // Set the correct interior Id for our spectator.
        SetPlayerInterior(playerId, interiorId);

        // Set the correct world Id for our spectator.
        SetPlayerVirtualWorld(playerId, worldId);

        // Destroy the old label Id if not already done.
        if (m_playerLabelId[subjectId] != PlayerText3D: INVALID_3DTEXT_ID)
            DeletePlayer3DTextLabel(playerId, m_playerLabelId[subjectId]);

        // Format the proper textlabel depending on the player's vehicle state.
        new labelText[256], Float: armour, Float: playerHealth, Float: vehicleHealth;
        GetPlayerArmour(subjectId, armour);
        GetPlayerHealth(subjectId, playerHealth);

        if (vehicleId != 0) {
            if (reattach == true)
                PlayerSpectateVehicle(playerId, vehicleId); /* default spectate mode */

            GetVehicleHealth(vehicleId, vehicleHealth);

            format(labelText, sizeof(labelText),
                "{B4CCE8}Armour: {FF8E02}%.1f{B4CCE8} - Health: {FF8E02}%.1f{B4CCE8}\r\nPing: {FF8E02}%d{B4CCE8} - FPS: {FF8E02}%d{B4CCE8}\r\nVehicle: {FF8E02}%s{B4CCE8} (%.1f)\r\nWorld: {FF8E02}%d",
                armour, playerHealth, GetPlayerPing(subjectId), PlayerManager->framesPerSecond(subjectId),
                VehicleModel(GetVehicleModel(vehicleId))->nameString(), vehicleHealth, worldId);

            // Create and attach the 3D textlabel to our subject.
            m_playerLabelId[subjectId] = CreatePlayer3DTextLabel(playerId, labelText, Color::White, 0.0 /* offset X */,
                0.0 /* offset Y */, 0.7 /* offset Z */, 50.0 /* draw distance */, Player::InvalidId, vehicleId, 1);
        } else {
            if (reattach == true)
                PlayerSpectatePlayer(playerId, subjectId); /* default spectate mode */

            format(labelText, sizeof(labelText),
                "{B4CCE8}Armour: {FF8E02}%.1f{B4CCE8} - Health: {FF8E02}%.1f{B4CCE8}\r\nPing: {FF8E02}%d{B4CCE8} - FPS: {FF8E02}%d{B4CCE8}\r\nVehicle: {FF8E02}none{B4CCE8}\r\nWorld: {FF8E02}%d",
                armour, playerHealth, GetPlayerPing(subjectId), PlayerManager->framesPerSecond(subjectId), worldId);

            // Create and attach the 3D textlabel to our subject.
            m_playerLabelId[subjectId] = CreatePlayer3DTextLabel(playerId, labelText, Color::White, 0.0 /* offset X */,
                0.0 /* offset Y */, -0.5 /* offset Z */, 50.0 /* draw distance */, subjectId, Vehicle::InvalidId, 1);
        }

        return 1;
    }

    /**
     * To start watching a player, we offer the /watch command.
     *
     * @param playerId Id of the player who issued this command.
     * @param player Id or name of the player to watch.
     * @command /watch [player]
     */
    @command("watch")
    public onWatchCommand(playerId, params[]) {
        if (Player(playerId)->isAdministrator() == false)
            return 0;

        if (Command->parameterCount(params) != 1) {
            SendClientMessage(playerId, Color::Information, "Usage: /watch [player]");
            return 1;
        }

        new subjectId = Command->playerParameter(params, 0, playerId);
        if (subjectId == Player::InvalidId)
            return 1;

        if (playerId == subjectId) {
            SendClientMessage(playerId, Color::Error, "You can't watch yourself.");
            return 1;
        }

        if (m_watchingPlayerId[playerId] == subjectId) {
            SendClientMessage(playerId, Color::Error, "You're already watching this player.");
            return 1;
        }

        if (m_isSpectating[subjectId] == true) {
            SendClientMessage(playerId, Color::Error, "This player is currently watching an other player.");
            return 1;
        }

        this->startSpectating(playerId, subjectId);

        return 1;
    }

    /**
     * If the watching crew member decides to stop spectating, he/she can use the /stopwatch command.
     *
     * @param playerId Id of the player who issued this command.
     * @param params Any further text that the player passed to the command. Unused.
     * @command /stopwatch
     */
    @command("stopwatch")
    public onStopwatchCommand(playerId, params[]) {
        if (Player(playerId)->isAdministrator() == false)
            return 0;

        if (m_isSpectating[playerId] == false) {
            SendClientMessage(playerId, Color::Error, "You aren't spectating anyone at the moment. Use \"/watch\" first.");
            return 1;
        }

        new subjectId = m_watchingPlayerId[playerId];
        this->stopSpectating(playerId, subjectId);

        return 1;
        #pragma unused params
    }

    /**
     * Reset all variables for every connecting player.
     *
     * @param playerId Id of the connecting player
     */
    @list(OnPlayerConnect)
    public onPlayerConnect(playerId) {
        m_isSpectating[playerId] = false;
        m_watchingPlayerId[playerId] = Player::InvalidId;
        m_resetPosition[playerId] = false;

        return 1;
    }

    /**
     * If a watched player disconnects for any reason, we'll have to act accordingly. Let's inform
     * the watching user and stop the spectating.
     *
     * @param playerId Id of the disconnecting player.
     */
    @list(OnPlayerDisconnect)
    public onPlayerDisconnect(playerId) {
        for (new spectator = 0; spectator <= PlayerManager->highestPlayerId(); spectator++) {
            if (m_watchingPlayerId[spectator] != playerId || m_isSpectating[spectator] == false)
                continue;

            new notice[128], playerName[MAX_PLAYER_NAME+1];

            // Store the player's name separately in case the player gets kicked/banned.
            GetPlayerName(playerId, playerName, sizeof(playerName));
            format(notice, sizeof(notice), "%s (Id:%d) left the server, spectating has been stopped.",
                playerName, playerId);

            SendClientMessage(spectator, Color::Information, notice);
            this->stopSpectating(spectator, playerId);
        }

        return 1;
    }

    /**
     * If the player respawned because of quitting spectate mode, we'll be so kind to restore that
     * player's old position and interior.
     *
     * @param playerId Id of the spawning player.
     */
    @list(OnPlayerSpawn)
    public onPlayerSpawn(playerId) {
        if (m_resetPosition[playerId] == false)
            return 0;

        // Set the correct position and interior on respawn.
        SetPlayerVirtualWorld(playerId, World::MainWorld);
        SetPlayerPos(playerId, m_playerPosition[playerId][0], m_playerPosition[playerId][1], m_playerPosition[playerId][2]);
        SetPlayerInterior(playerId, m_playerInterior[playerId]);

        m_resetPosition[playerId] = false;

        return 1;
    }

    /**
     * A state change requires us to change specate mode.
     *
     * @param playerId Id of the state changing player.
     * @param newState The new state.
     * @param oldState The old state.
     */
    @list(OnPlayerStateChange)
    public onPlayerStateChange(playerId, newState, oldState) {
        for (new spectator = 0; spectator <= PlayerManager->highestPlayerId(); spectator++) {
            if (m_watchingPlayerId[spectator] != playerId || m_isSpectating[spectator] == false)
                continue;

            // For a new state, we'll have to synchronize the spectate mode.
            this->synchronizeSpectateEnvironment(spectator, playerId, GetPlayerVehicleID(playerId),
                GetPlayerInterior(playerId), GetPlayerVirtualWorld(playerId), true /* reattach == true */);
        }

        return 1;
        #pragma unused newState, oldState
    }

    /**
     * An interior change requires us to change specate mode.
     *
     * @param playerId Id of the interior changing player.
     * @param newInteriorId The new interior Id.
     * @param oldInteriorId The old interior Id.
     */
    @list(OnPlayerInteriorChange)
    public onPlayerInteriorChange(playerId, newInteriorId, oldInteriorId) {
        for (new spectator = 0; spectator <= PlayerManager->highestPlayerId(); spectator++) {
            if (m_watchingPlayerId[spectator] != playerId || m_isSpectating[spectator] == false)
                continue;

            // For an other interior, we'll have to synchronize the spectate mode.
            this->synchronizeSpectateEnvironment(spectator, playerId, GetPlayerVehicleID(playerId),
                newInteriorId, GetPlayerVirtualWorld(playerId), true /* reattach == true */);
        }

        return 1;
        #pragma unused newInteriorId, oldInteriorId
    }

    /**
     * When a watched player is streamed out of the watching player's client, we'll have to reattach
     * them.
     *
     * @param playerId Id of the streamed out player.
     * @param forPlayerId Id of the player who has destreamed playerId.
     */
    @list(OnPlayerStreamOut)
    public onPlayerStreamOut(playerId, forPlayerId) {
        if (m_watchingPlayerId[forPlayerId] != playerId || m_isSpectating[forPlayerId] == false)
            return 0;

        // For a destream, we'll have to synchronize the spectate mode.
        this->synchronizeSpectateEnvironment(forPlayerId, playerId, GetPlayerVehicleID(playerId),
            GetPlayerInterior(playerId), GetPlayerVirtualWorld(playerId), true /* reattach == true */);

        return 1;
    }

    /**
     * We want to keep an eye on armour/health/ping-details of the watched player as best as possible,
     * in order to catch hackers faster. Therefore it's important we update these details frequently,
     * to provide the best spectating experience we can.
     *
     * @param playerId Id of the player to update the information for.
     */
    @list(SecondTimerPerPlayer)
    public onSecondTimerTick(playerId) {
        if (m_isSpectating[playerId] == false)
            return 0;

        // We won't have to change spectate mode, yet we update the textlabel details.
        new subjectId = m_watchingPlayerId[playerId];
        this->synchronizeSpectateEnvironment(playerId, subjectId, GetPlayerVehicleID(subjectId),
            GetPlayerInterior(subjectId), GetPlayerVirtualWorld(subjectId), false /* reattach == false */);

        return 1;
    }

    /**
     * Since m_isSpectating returns true when a player is spectating, and false when a player isn't,
     * we can use this to make a getter.
     *
     * @param playerId Id of the player to check the spectating situation for.
     * @return boolean Is the player currently spectating?
     */
    public bool: isSpectating(playerId) {
        return m_isSpectating[playerId];
    }

    /**
     * A state change of the player's key requires us to detect if the player wants to go to the
     * previous or next player to watch. This is done by checking the left and right arrow keys.
     *
     * @param playerId Id of the player changing their keys.
     * @param newKeys The new key(s).
     * @param oldKeys The old key(s).
     **/
    @list(OnPlayerKeyStateChange)
    public OnPlayerKeyStateChange(playerId, newkeys, oldkeys) {
        if (m_isSpectating[playerId]) {
            new playerIdToWatchAsString[3];

            if (PRESSED(KEY_LEFT)) {
                for (new playerIdToWatch = m_watchingPlayerId[playerId]; playerIdToWatch >= 0;) {
                    if (playerIdToWatch == 0)
                        playerIdToWatch = PlayerManager->highestPlayerId();
                    else
                        playerIdToWatch--;

                    if (Player(playerIdToWatch)->isConnected() == false)
                        continue;

                    if (playerId == playerIdToWatch || m_isSpectating[playerIdToWatch] == true)
                        continue;

                    format(playerIdToWatchAsString, sizeof(playerIdToWatchAsString), "%d", playerIdToWatch);
                    this->onWatchCommand(playerId, playerIdToWatchAsString);
                    break;
                }
            }

            if (PRESSED(KEY_RIGHT)) {
                for (new playerIdToWatch = m_watchingPlayerId[playerId]; playerIdToWatch <= PlayerManager->highestPlayerId();) {
                    if (playerIdToWatch == PlayerManager->highestPlayerId())
                        playerIdToWatch = 0;
                    else
                        playerIdToWatch++;

                    if (Player(playerIdToWatch)->isConnected() == false)
                        continue;

                    if (playerId == playerIdToWatch || m_isSpectating[playerIdToWatch] == true)
                        continue;

                    format(playerIdToWatchAsString, sizeof(playerIdToWatchAsString), "%d", playerIdToWatch);
                    this->onWatchCommand(playerId, playerIdToWatchAsString);
                    break;
                }
            }
        }
    }
};
