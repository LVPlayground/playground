// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Registers an area handler for usage with the Pay 'n Spray shops around San Andreas. While we have
 * no interest in knowing about *which* shop they're in, at least the money state wants to be aware
 * of whether the player is in *any* of the shops right now.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class PayAndSprayShops {
    // We need a layer on the Zone Manager for detecting whether the player is in a shop.
    public const ZoneLayerId = @counter(ZoneLayer);

    // Indicates whether the player is currently in a Pay 'n Spray shop.
    new bool: m_playerInShop[MAX_PLAYERS];

    /**
     * Initialize the zone manager with the zones we'd like to know about, i.e. the Pay 'n Spray
     * locations spread around the San Andreas map.
     */
    public __construct() {
        new Float: shopPositions[12][2] = {
            {  1977.213378,  2162.535156 }, // Redlands East
            {  -100.248992,  1118.425415 }, // Fort Carson, Bone County
            { -1420.163940,  2586.447753 }, // El Quebrados, Tierra Robada

            { -2426.851074,  1018.130126 }, // Juniper Hollow
            { -1904.987792,   280.658477 }, // Doherty

            {   487.026214, -1740.143676 }, // Santa Maria Beach
            {  1024.983520, -1022.391418 }, // Temple
            {  2065.067138, -1833.406250 }, // Idlewood
            {   720.489135,  -450.550811 }, // Dillimore

            // Technically these are the interiors of the mod shops themselves, and therefore don't
            // qualify as Pay 'n Sprays. But you can respray your vehicle there..
            {   616.783203,   -74.815002 }, // Loco Low Co.
            {   617.535949,    -1.990000 }, // TransFender
            {   615.285705,  -124.239006 }  // Wheel Arch Angel
        };

        ZoneManager->createLayer(PayAndSprayShops::ZoneLayerId);
        for (new position = 0; position < sizeof(shopPositions); ++position) {
            ZoneLayer(PayAndSprayShops::ZoneLayerId)->createZone(shopPositions[position][0] - 12.0,
                shopPositions[position][0] + 12.0, shopPositions[position][1] - 12.0, shopPositions[position][1] + 12.0, 1200.0);
        }
    }

    /**
     * When a player connects to Las Venturas Playground, they're clearly not in a Pay 'n Spray.
     * Mark them as such to prevent false positives from the money state managers.
     *
     * @param playerId Id of the player who just connected to the server.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect(playerId) {
        m_playerInShop[playerId] = false;
    }

    /**
     * Returns whether the given player is currently known to be in a Pay 'n Spray shop.
     *
     * @return boolean Is this player in a pay 'n spray shop?
     */
    public bool: isPlayerInShop(playerId) {
        return m_playerInShop[playerId];
    }

    /**
     * Invoked by the zone manager when a player enters a Pay 'n Spray.
     *
     * @param playerId Id of the player who's entering a pay 'n spray.
     * @param zoneId Id of the zone in the layer which they just entered.
     */
    @switch(OnPlayerEnterZone, PayAndSprayShops::ZoneLayerId)
    public static onPlayerEnterShop(playerId, zoneId) {
        m_playerInShop[playerId] = true;
        #pragma unused zoneId
    }

    /**
     * Invoked by the zone manager when a player leaves a Pay 'n Spray.
     *
     * @param playerId Id of the player who's entering a pay 'n spray.
     * @param zoneId Id of the zone in the layer which they just entered.
     */
    @switch(OnPlayerLeaveZone, PayAndSprayShops::ZoneLayerId)
    public static onPlayerLeaveShop(playerId, zoneId) {
        m_playerInShop[playerId] = false;
        #pragma unused zoneId
    }
};
