// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Offers a quick and clean way to determine whether a certain player is currently residing in a
 * casino, and if so, which one. We'll keep track of player positions automatically.
 *
 * Note that the Casino enumeration has been implemented in Interface/Enumerations.pwn because the
 * anticheat needs to use it before this class is defined.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class CasinoArea {
    // We need a layer on the Zone Manager for detecting whether the player is in a casino.
    public const CasinoLayerId = @counter(ZoneLayer);

    // Store which casino a player is currently residing in.
    new Casino: m_currentCasino[MAX_PLAYERS];

    /**
     * Register the zones we need upon gamemode initialization with the zone manager, to make sure
     * that we get the right notifications when a player enters or leaves a casino.
     */
    public __construct() {
        new Float: casinoAreas[3][4] = {
            { 1928.1771,  987.5739, 1970.5675, 1042.8369 }, // Four Dragons casino
            { 2171.3618, 1584.2649, 2279.4915, 1628.6199 }, // Caligula's
            { 1117.5068,  -11.2747, 1142.4843,   12.5986 }  // Private Casino (VIP room)
        };

        ZoneManager->createLayer(CasinoArea::CasinoLayerId);
        for (new index = 0; index < sizeof(casinoAreas); ++index) {
            ZoneLayer(CasinoArea::CasinoLayerId)->createZone(casinoAreas[index][0],
                casinoAreas[index][2], casinoAreas[index][1], casinoAreas[index][3], 3000.0);
        }
    }

    /**
     * Make sure that we don't identify the player as being in a casino when they connect to the
     * server, otherwise they may accidentially get gambling warnings.
     *
     * @param playerId Id of the player who just connected to the server.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect(playerId) {
        m_currentCasino[playerId] = NoCasino;
    }

    /**
     * Returns the casino a player is currently residing in. If the player is not in a casino at
     * this time, then the NoCasino constant will be returned.
     *
     * @return Casino The casino this player is located in, or NoCasino.
     */
    public Casino: casinoForPlayer(playerId) {
        return m_currentCasino[playerId];
    }

    /**
     * Identify which casino a player has entered when we get a notification that they've entered
     * one. Then broadcast the OnPlayerEnterCasino notification list.
     *
     * @param playerId Id of the player who's entering a casino.
     * @param zoneId Id of the zone in the layer which they just entered.
     */
    @switch(OnPlayerEnterZone, CasinoArea::CasinoLayerId)
    public static onPlayerEnterCasino(playerId, zoneId) {
        switch (zoneId) {
            case 0: m_currentCasino[playerId] = FourDragonsCasino;
            case 1: m_currentCasino[playerId] = CaligulasCasino;
            case 2: m_currentCasino[playerId] = PrivateCasino;
            default:
                printf("[CasinoArea] ERROR: Unknown casino zone Id passed to onPlayerEnterCasino: %d.", zoneId);
        }

        // TODO: Broadcast the OnPlayerEnterCasino notification list.
        #pragma unused zoneId
    }

    /**
     * Make sure that we reset the player's state when they leave a casino (or rather, gambling
     * area). Also invoke the OnPlayerLeaveCasino notification list to make sure others know.
     *
     * @param playerId Id of the player who's entering a casino.
     * @param zoneId Id of the zone in the layer which they just entered.
     */
    @switch(OnPlayerLeaveZone, CasinoArea::CasinoLayerId)
    public static onPlayerLeaveCasino(playerId, zoneId) {
        // TODO: Broadcast the OnPlayerLeaveCasino notification list.

        m_currentCasino[playerId] = NoCasino;
        #pragma unused zoneId
    }
};
