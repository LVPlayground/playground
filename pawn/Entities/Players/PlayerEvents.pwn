// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * We encapsulate all callbacks in the PlayerEvents class for a few reasons. Firstly, this allows
 * us to have more control over what happens, and class-based debugging tools can jump in more
 * easily. Furthermore, some operations need to be prioritized in a non-random way.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class PlayerEvents <playerId (MAX_PLAYERS)> {
    // Time in milliseconds between two timestamps of connections originating from the same IP address.
    const DefaultDelayConnection = 500;

    // Amount of milliseconds an IP will be blocked if invalid usage is measured.
    const BlockageDuration = 1800000;

    // Keep track of the most recent connected IP address.
    new m_lastConnectionAddress[16];

    // Keep track of the most recent connection timestamp.
    new m_lastConnectionTimestamp;

    /**
     * An incoming connection indicates a player (or NPC) who is in the progress of joining the
     * server. This callback is used to check for invalid connection usage.
     *
     * Too many connections originating from the same IP blocks the connecting player.
     * Too fast successive connections originating from the same IP temporary blocks the IP address.
     *
     * @param ipAddress The IP address of the joining player.
     */
    public onIncomingConnection(ipAddress[], port) {
        // Stop checking if the player is connecting from the localhost, which usually implies
        // the player is a NPC.
        if (!strcmp(ipAddress, "127.0.0.1", true))
            return 1;

        // Count the number of players ingame who are connected from the connecting IP address. Only
        // allow a certain number of connections from the same IP.
        new matchedPlayers = 0;
        for (new connectedId = 0; connectedId <= PlayerManager->highestPlayerId(); connectedId++) {
            if (!Player(connectedId)->isConnected() || Player(connectedId)->isNonPlayerCharacter())
                continue;

            if (!strcmp(ipAddress, Player(connectedId)->ipAddressString(), true))
                matchedPlayers++;
        }

        // Check if the maximum number of players ingame from the same IP has been reached.
        if (matchedPlayers >= GetMaximumConnectionsPerIP()) {
            printf("Player [%d] shares IP with %d ingame players.", playerId, matchedPlayers);
            Kick(playerId); // deny player entry
        }

        // If the connecting IP resembles the penultimate connecting IP, check the time difference
        // between both connections. When the two IPs connect in rapid order, temporary block the IP.
        // This will result in closed connections for ingame players using the same IP address.
        if (!strcmp(ipAddress, m_lastConnectionAddress, true)
            && (Time->currentHighResolutionTime() - m_lastConnectionTimestamp) < DefaultDelayConnection) {
            printf("Blocking [%s] for 30 minutes due to flooding.", ipAddress);
            BlockIpAddress(ipAddress, BlockageDuration); // block the IP address
        }

        // Save last incoming connection details and timestamp.
        memcpy(m_lastConnectionAddress, ipAddress, 0, strlen(ipAddress) * 4, sizeof(m_lastConnectionAddress));
        m_lastConnectionAddress[min(strlen(ipAddress), sizeof(m_lastConnectionAddress) - 1)] = 0;
        m_lastConnectionTimestamp = Time->currentHighResolutionTime();

        return 1;
        #pragma unused port
    }

    /**
     * The OnPlayerConnect callback will be invoked by the SA-MP server once a player has connected
     * and is able to spawn. This is the time to initialize and reset settings for the player.
     *
     * @return integer Any value, as Pawn sets a requirement for public functions to return a value.
     */
    public onPlayerConnect() {
        if (this->detectInvalidConnectionValues())
            return Kick(playerId);

        PlayerManager->onPlayerConnect(playerId);
        Player(playerId)->onConnect();

        if (Player(playerId)->isNonPlayerCharacter() == false)
            Instrumentation->recordActivity(PlayerConnectActivity);

        Annotation::ExpandList<OnPlayerConnect>(playerId);

        return OnPlayerLVPConnect(playerId);
    }

    /**
     * Detects invalid values in the data the player has transmitted to the server. Invalid values
     * are often used to crash a server, which is a highly undesirable situation.
     *
     * @return boolean Whether invalid values were detected.
     */
    private bool: detectInvalidConnectionValues() {
        if (IsPlayerNPC(playerId))
            return false;  // NPCs send bogus data by default

        new nickname[128], hash[128];

        GetPlayerName(playerId, nickname, sizeof(nickname));
        gpci(playerId, hash, sizeof(hash));

        if (!(3 <= strlen(nickname) <= MAX_PLAYER_NAME)) {
            printf("Player [%d] connected with an invalid nickname.", playerId);
            return true;  // a player's nickname must be [3, MAX_PLAYER_NAME] characters, inclusive
        }

        if (!(24 <= strlen(hash) <= 64)) {
            printf("Player [%d, %s] connected with an invalid GPCI.", playerId, nickname);
            return true;  // a player's GPCI must be [24, 64] characters, inclusive
        }

        return false;
    }

    /**
     * After a player leaves the server, this method will be invoked allowing the gamemode to do all
     * required clean-up work. The reason parameter can have three valid values, namely (0) when the
     * player times out, (1) when they leave by closing GTA, or (2) when they are kicked or banned.
     *
     * @param reason The reason for the player's disconnection.
     */
    public onPlayerDisconnect(reason) {
        Annotation::ExpandList<OnPlayerDisconnect>(playerId);

        if (Player(playerId)->isNonPlayerCharacter() == false) {
            Instrumentation->recordActivity(PlayerDisconnectActivity, 
                Time->currentTime() - Player(playerId)->connectionTime());
        }

        /// @todo Get rid of the OnPlayerLVPDisconnect function.
        OnPlayerLVPDisconnect(playerId, reason);

        Player(playerId)->onDisconnect();
        PlayerManager->onPlayerDisconnect(playerId);

        return 1;
    }

    /**
     * Invoked when the player right-clicks anywhere on the San Andreas map, through the option
     * available to them in GTA's menu.
     *
     * @param positionX X-coordinate of the location where they clicked.
     * @param positionY Y-coordinate of the location where they clicked.
     * @param positionZ Z-coordinate of the location where they clicked. Inaccurate.
     */
    public onPlayerClickMap(Float: positionX, Float: positionY, Float: positionZ) {
        if (Player(playerId)->isConnected() == false || Player(playerId)->isNonPlayerCharacter() == true)
            return 0;

        // Forward the OnPlayerClickMap callback to those who are interested in it.
        Annotation::ExpandList<OnPlayerClickMap>(playerId, positionX, positionY, positionZ);

        return 1;
    }
};

/**
 * Forward each of the methods to their documented counterpart in the PlayerEvents class, where our
 * implementation will reside. The cost of introducing an additional call here is negligible.
 */
public OnIncomingConnection(playerid, ip_address[], port) { PlayerEvents(playerid)->onIncomingConnection(ip_address, port); return 1; }
public OnPlayerClickMap(playerid, Float:fX, Float:fY, Float:fZ) { PlayerEvents(playerid)->onPlayerClickMap(fX, fY, fZ); return 1; }
