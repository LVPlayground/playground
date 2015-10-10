// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

// How many gang turfs should we allow on LVP?
#define MAX_GANG_TURFS 10

/**
 * Gang turfs (or zones as SA:MP likes to call them) are small pieces of land that are to be
 * captured by gangs, defended, or attacked. When a turf is captured by a gang, it will have the
 * same color on the mini-map as the gang itself, therefore being quite distinctive. Other gangs
 * are then able to attack this turf and recapture it. Capturing takes a small amount of time,
 * and certain amount of gang-players to be possible.
 *
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 */
class GangTurfs {
    // The layer created here is to identify whether the player is on a gang zone.
    public const GangLayerId = @counter(ZoneLayer);

    // Initiate an invalid Id for gang zones created by GangZoneCreate.
    const InvalidZoneId = -1;

    // Set a default color for turfs which haven't been captured by any gang yet.
    const DefaultTurfColor = Color::LightRedBackground;

    // What's the minimum amount of gang players required to capture a turf?
    const MinimumAmountForCapture = 1;

    // How many seconds does the gang have to hold a turf before they've captured it?
    const CaptureDuration = 180;

    // Each turf requires a set of details specified for that turf.
    enum turfDetails {
        turfLayerId, /* Id of the created gang layer by the ZoneLayer */
        turfZoneId, /* Id of the created gang zone by GangZoneCreate */
        turfName[32], /* name of the turf */
        Float: minX, /* X-coordinate for the west side of the turf */
        Float: maxX, /* X-coordinate for the east side of the turf */
        Float: minY, /* Y-coordinate for the south side of the turf */
        Float: maxY, /* Y-coordinate for the north side of the turf */
        turfOwnerId /* Id of the gang currently owning the turf, which will determine the turf color */
    }

    // Create an array holding all gang turf information.
    new m_gangTurfs[MAX_GANG_TURFS][turfDetails] = {
        {ZoneManager::InvalidLayerId, InvalidZoneId, "Ammunation (/taxi 4)", 2525.77, 2680.91, 1953.70, 2106.00, Gang::InvalidId},
        {ZoneManager::InvalidLayerId, InvalidZoneId, "FightClub (/taxi 12)", 1927.07, 2122.52, 2115.48, 2204.77, Gang::InvalidId},
        {ZoneManager::InvalidLayerId, InvalidZoneId, "GangBase (1)", 1410.82, 1543.22, 2712.60, 2890.37, Gang::InvalidId},
        {ZoneManager::InvalidLayerId, InvalidZoneId, "GangBase (2)", 1121.17, 1410.82, 2712.60, 2866.72, Gang::InvalidId},
        {ZoneManager::InvalidLayerId, InvalidZoneId, "The Strip (/taxi 0)", 1829.85, 2035.08, 1277.33, 1450.26, Gang::InvalidId},
        {ZoneManager::InvalidLayerId, InvalidZoneId, "Main Bank (/taxi 10)", 2427.30, 2602.27, 1080.59, 1190.92, Gang::InvalidId},
        {ZoneManager::InvalidLayerId, InvalidZoneId, "LVP University", 973.25, 1205.83, 960.33, 1185.06, Gang::InvalidId},
        {ZoneManager::InvalidLayerId, InvalidZoneId, "The Big Spread Ranch", 667.70, 800.34, 1922.09, 2098.36, Gang::InvalidId},
        {ZoneManager::InvalidLayerId, InvalidZoneId, "K.A.C.C. Military Fuel", 2487.44, 2710.34, 2612.37, 2864.36, Gang::InvalidId},
        {ZoneManager::InvalidLayerId, InvalidZoneId, "Baseball Stadium", 1254.37, 1500.48, 2057.30, 2273.45, Gang::InvalidId}
    };

    // We'll have to keep track how many gang players are currently residing on a turf.
    new m_turfPlayers[MAX_GANG_TURFS][MAX_GANGS];

    // When enough gang players are on a turf, capturing can start.
    new bool: m_captureActive[MAX_GANG_TURFS][MAX_GANGS];

    /**
     * Create gang layers and zones when the gamemode is initializing. The layers are needed to check
     * whenever a player is entering/leaving the turf, while zones are used to give the turfs a
     * color on the mini-map. SA:MP also provided a function to make zones flash on the mini-map,
     * which we can use whenever a turf is under attack.
     */
    public __construct() {
        ZoneManager->createLayer(GangTurfs::GangLayerId);

        for (new turf = 0; turf < MAX_GANG_TURFS; turf++) {
            m_gangTurfs[turf][turfLayerId] = ZoneLayer(GangTurfs::GangLayerId)->createZone(
                m_gangTurfs[turf][minX], m_gangTurfs[turf][maxX], m_gangTurfs[turf][minY],
                m_gangTurfs[turf][maxY], 35.0 /* height */);

            m_gangTurfs[turf][turfZoneId] = GangZoneCreate(m_gangTurfs[turf][minX], m_gangTurfs[turf][minY],
                m_gangTurfs[turf][maxX], m_gangTurfs[turf][maxY]);
        }
    }

    /**
     * The gang turfs' color has to be applied for every player who's connecting to the server.
     *
     * @param playerId Id of the player who connected to the server.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect(playerId) {
        for (new turf = 0; turf < MAX_GANG_TURFS; turf++)
            GangZoneShowForPlayer(playerId, m_gangTurfs[turf][turfZoneId], DefaultTurfColor);

        return 1;
    }

    /**
     * Enough gang players are residing on a turf, the turf isn't being captured at the moment:
     * lets start capturing! First we'll mark that the zone is under attack by the gang, which can
     * be used in other functions. Then the zone will get a flash-animation applied on, meaning
     * players are able to see on the mini-map that the turf is under attack.
     *
     * @param zoneId Id of the zone to initiate the capture for.
     * @param gangId Id of the gang capturing the turf.
     */
    private initiateTurfCapture(zoneId, gangId) {
        m_captureActive[zoneId][gangId] = true;

        new ownerId = Gang::InvalidId, name[32];
        ownerId = m_gangTurfs[zoneId][turfOwnerId];
        format(name, sizeof(name), "%s", m_gangTurfs[zoneId][turfName]);

        new notice[128];
        if (ownerId != Gang::InvalidId) {
            GangZoneFlashForAll(zoneId, GangSettings(ownerId)->color());

            format(notice, sizeof(notice), "* WARNING: Turf %s under attack by %s!", name, Gang(gangId)->nameString());
            Gang(ownerId)->sendMessageToMembers(Color::Warning, notice);
        } else
            GangZoneFlashForAll(zoneId, DefaultTurfColor);

        //this->startCountDown(gangId);

        return 1;
    }

    /**
     * Return whether or not a particular gang turf is currently being captured.
     *
     * @param zoneId Id of the zone to check the capture status for.
     */
    private bool: turfUnderAttack(zoneId) {
        for (new gangId = 0; gangId < MAX_GANGS; gangId++) {
            if (m_captureActive[zoneId][gangId] == true)
                return true;
        }

        return false;
    }

    /**
     * When a gang player enters a turf, we check if there are enough gang players around to start
     * the turf capture. This should only be able when the turf isn't being captured already.
     *
     * @param playerId Id of the player who just entered a gang turf.
     * @param zoneId Id of the zone in the layer which they just entered.
     */
    @switch(OnPlayerEnterZone, GangTurfs::GangLayerId)
    public onPlayerEnterTurf(playerId, zoneId) {
        new gangId = GangPlayer(playerId)->gangId();
        if (GangPlayer(playerId)->gangId() == Gang::InvalidId)
            return 0;

        m_turfPlayers[zoneId][gangId]++;

        if (m_turfPlayers[zoneId][gangId] >= MinimumAmountForCapture && this->turfUnderAttack(zoneId) == false)
            this->initiateTurfCapture(zoneId, gangId);

        return 1;
    }

    /**
     * When a gang player leaves a turf, we check if there is an ongoing capture for this gang, and
     * make sure to half this capture when not enough players are residing on the turf.
     *
     * @param playerId Id of the player who just left a gang turf.
     * @param zoneId Id of the zone in the layer which they just left.
     */
    @switch(OnPlayerLeaveZone, GangTurfs::GangLayerId)
    public onPlayerLeaveTurf(playerId, zoneId) {
        new gangId = GangPlayer(playerId)->gangId();
        if (gangId == Gang::InvalidId)
            return 0;

        if (m_turfPlayers[zoneId][gangId] > 0)
            m_turfPlayers[zoneId][gangId]--;

        //if (m_turfPlayers[zoneId][gangId] < MinimumAmountForCapture && m_captureActive[zoneId][gangId] == true)
            //this->haltTurfCapture(zoneId, gangId);

        return 1;
    }
};
