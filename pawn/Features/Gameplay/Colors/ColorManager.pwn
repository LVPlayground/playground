// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Textual representations for the index in the player color stacks certain color statuses
 * represent, so we can avoid having random index accesses all over in this class.
 */
enum _: PlayerColorIndex {
    // The default color associated with the player's Id.
    DefaultColorIndex,

    // The custom color which can be set in their profile. Available for VIPs.
    CustomColorIndex,

    // The color associated with the gang they have joined.
    GangColorIndex,

    // The color associated with the minigame they're playing.
    MinigameColorIndex,

    // The color which overrides all other values. Should be very sparsely used.
    OverrideColorIndex
};

/**
 * Each player gets a color assigned by default. We predefine 200 colors, and in case the player's
 * Id is higher than 199 we loop back to color zero. The comments exist so it's easy to identify
 * which color Id is included on which row for a human reader.
 */
new g_defaultPlayerColors[200] = {
    //     --0         --1         --2         --3         --4         --5         --6         --7         --8         --9
    0x2FC827AA, 0x0FD9FAAA, 0xDC143CAA, 0xE3AC12AA, 0x778899AA, 0x00F853AA, 0x65ADEBAA, 0xFF1493AA, 0xF4A460AA, 0xEE82EEAA, // 00-
    0xDCDE3DAA, 0xA55E2CAA, 0x829DC7AA, 0x0495CDAA, 0x14FF7FAA, 0xCB7ED3AA, 0xC95054AA, 0xFAFB71AA, 0x247C1BAA, 0xF13232AA, // 01-
    0xFA24CCAA, 0xB36B72AA, 0x4380D8AA, 0xFF9249AA, 0xFF99C2AA, 0xFF2727AA, 0x8952EBAA, 0x467E40AA, 0xAFAFAFAA, 0xFF44A9AA, // 02-
    0xC1F7ECAA, 0x4EFF00AA, 0x00DBFFAA, 0xDB36FAAA, 0xDA7825AA, 0xD64260AA, 0x384BCAAA, 0xD2EB1BAA, 0xAC376EAA, 0xB8A66BAA, // 03-
    0x2FC827AA, 0x0FD9FAAA, 0xDC143CAA, 0xE3AC12AA, 0x778899AA, 0x00F853AA, 0x65ADEBAA, 0xFF1493AA, 0xF4A460AA, 0xEE82EEAA, // 04-
    0xDCDE3DAA, 0xA55E2CAA, 0x829DC7AA, 0x0495CDAA, 0x14FF7FAA, 0xCB7ED3AA, 0xC95054AA, 0xFAFB71AA, 0x247C1BAA, 0xF13232AA, // 05-
    0xFA24CCAA, 0xB36B72AA, 0x4380D8AA, 0xFF9249AA, 0xFF99C2AA, 0xFF2727AA, 0x8952EBAA, 0x467E40AA, 0xAFAFAFAA, 0xFF44A9AA, // 06-
    0xC1F7ECAA, 0x4EFF00AA, 0x00DBFFAA, 0xDB36FAAA, 0xDA7825AA, 0xD64260AA, 0x384BCAAA, 0xD2EB1BAA, 0xAC376EAA, 0xB8A66BAA, // 07-
    0x2FC827AA, 0x0FD9FAAA, 0xDC143CAA, 0xE3AC12AA, 0x778899AA, 0x00F853AA, 0x65ADEBAA, 0xFF1493AA, 0xF4A460AA, 0xEE82EEAA, // 08-
    0xDCDE3DAA, 0xA55E2CAA, 0x829DC7AA, 0x0495CDAA, 0x14FF7FAA, 0xCB7ED3AA, 0xC95054AA, 0xFAFB71AA, 0x247C1BAA, 0xF13232AA, // 09-
    0xFA24CCAA, 0xB36B72AA, 0x4380D8AA, 0xFF9249AA, 0xFF99C2AA, 0xFF2727AA, 0x8952EBAA, 0x467E40AA, 0xAFAFAFAA, 0xFF44A9AA, // 10-
    0xC1F7ECAA, 0x4EFF00AA, 0x00DBFFAA, 0xDB36FAAA, 0xDA7825AA, 0xD64260AA, 0x384BCAAA, 0xD2EB1BAA, 0xAC376EAA, 0xB8A66BAA, // 11-
    0x2FC827AA, 0x0FD9FAAA, 0xDC143CAA, 0xE3AC12AA, 0x778899AA, 0x00F853AA, 0x65ADEBAA, 0xFF1493AA, 0xF4A460AA, 0xEE82EEAA, // 12-
    0xDCDE3DAA, 0xA55E2CAA, 0x829DC7AA, 0x0495CDAA, 0x14FF7FAA, 0xCB7ED3AA, 0xC95054AA, 0xFAFB71AA, 0x247C1BAA, 0xF13232AA, // 13-
    0xFA24CCAA, 0xB36B72AA, 0x4380D8AA, 0xFF9249AA, 0xFF99C2AA, 0xFF2727AA, 0x8952EBAA, 0x467E40AA, 0xAFAFAFAA, 0xFF44A9AA, // 14-
    0xC1F7ECAA, 0x4EFF00AA, 0x00DBFFAA, 0xDB36FAAA, 0xDA7825AA, 0xD64260AA, 0x384BCAAA, 0xD2EB1BAA, 0xAC376EAA, 0xB8A66BAA, // 15-
    0x2FC827AA, 0x0FD9FAAA, 0xDC143CAA, 0xE3AC12AA, 0x778899AA, 0x00F853AA, 0x65ADEBAA, 0xFF1493AA, 0xF4A460AA, 0xEE82EEAA, // 16-
    0xDCDE3DAA, 0xA55E2CAA, 0x829DC7AA, 0x0495CDAA, 0x14FF7FAA, 0xCB7ED3AA, 0xC95054AA, 0xFAFB71AA, 0x247C1BAA, 0xF13232AA, // 17-
    0xFA24CCAA, 0xB36B72AA, 0x4380D8AA, 0xFF9249AA, 0xFF99C2AA, 0xFF2727AA, 0x8952EBAA, 0x467E40AA, 0xAFAFAFAA, 0xFF44A9AA, // 17-
    0xC1F7ECAA, 0x4EFF00AA, 0x00DBFFAA, 0xDB36FAAA, 0xDA7825AA, 0xD64260AA, 0x384BCAAA, 0xD2EB1BAA, 0xAC376EAA, 0xB8A66BAA  // 19-
};

/**
 * Each player has got a nickname color, which might change throughout the game session. The
 * Color Manager's duty is to set the right nickname colors and to keep track of previous ones.
 *
 * The default color of a certain player is set upon joining; this color is determined based on
 * their Id, and it may be subject to change. The Color Manager follows this hierarchy to decide 
 * which nickname color should any given player have (least important to most important):
 *
 * - Default player color, based on his Id;
 * - Custom player color (e.g. VIP's nickname color);
 * - Gang color;
 * - Minigame color (e.g. to distinguish two different teams).
 * - Override colors (e.g. the pause handler).
 *
 * @author Manuele "Kase" Macchia <kaseify@gmail.com>
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class ColorManager {
    // The value we use to identify unused slots in the player's color stack.
    const InvalidColorId = -1;

    // A stack containing the colors which could apply to this user, in reversed order of priority
    // (index [0] is their default color, whereas index[4] is their override color).
    new m_playerColorStack[MAX_PLAYERS][5];

    // The index in the player's color stack where they're currently at.
    new m_playerColorIndex[MAX_PLAYERS];

    // Whether the player's marker on the mini-map should be hidden.
    new bool: m_playerMarkerHidden[MAX_PLAYERS];

    // An array with the stored custom colors for each of the players.
    new m_storedPlayerCustomColor[MAX_PLAYERS];

    /**
     * Set the player's color to the default value for their player Id when they connect to Las
     * Venturas Playground, and resets any previous color state which may have been present.
     *
     * @param playerId Id of the player who connected to the server.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect(playerId) {
        for (new colorIndex = 0; colorIndex < 5; ++colorIndex)
            m_playerColorStack[playerId][colorIndex] = InvalidColorId;

        m_playerColorStack[playerId][DefaultColorIndex] = this->defaultColorForPlayerId(playerId);
        m_playerColorIndex[playerId] = 0;

        m_playerMarkerHidden[playerId] = false;
        m_storedPlayerCustomColor[playerId] = InvalidColorId;

        SetPlayerColor(playerId, m_playerColorStack[playerId][DefaultColorIndex]);
    }

    /**
     * Returns the color the player has in normal gameplay. This disregards temporary colors such
     * as those set by minigames.
     *
     * @param playerId Id of the player to get their actual color for.
     * @return integer The color this player will be playing with.
     */
    public playerColor(playerId) {
        if (m_playerColorStack[playerId][GangColorIndex] != InvalidColorId)
            return m_playerColorStack[playerId][GangColorIndex];

        if (m_playerColorStack[playerId][CustomColorIndex] != InvalidColorId)
            return m_playerColorStack[playerId][CustomColorIndex];

        return m_playerColorStack[playerId][DefaultColorIndex];
    }

    /**
     * Returns the custom player color if they have any, or NULL if they don't have any. This is
     * slightly different from how we store it internally (where -1 is an invalid color), but it's
     * how the database will be handling colors.
     *
     * @param playerId Id of the player to get the custom color from.
     * @return integer The custom color assigned to this player, if any.
     */
    public playerCustomColor(playerId) {
        if (m_playerColorStack[playerId][CustomColorIndex] == InvalidColorId)
            return 0;

        return m_playerColorStack[playerId][CustomColorIndex];
    }

    /**
     * Changes the custom color associated with this player. This is a feature available to all VIP
     * members of the server, as well as to all members of the LVP Staff.
     *
     * @param playerId Id of the player to set their custom color for.
     * @param color The custom color itself, in 0xRRGGBBAA format, to set for this player.
     */
    public setPlayerCustomColor(playerId, color) {
        m_playerColorStack[playerId][CustomColorIndex] = color;
        this->synchronizePlayerColorIndex(playerId);
    }

    /**
     * Stores a copy of the current player's custom color in a local buffer. This is necessary
     * because giving a player temporary moderator or administrator rights shouldn't override the
     * custom color we store for them in the database.
     *
     * @param playerId Id of the player to store the existing custom color for.
     */
    public storeExistingPlayerCustomColor(playerId) {
        if (m_storedPlayerCustomColor[playerId] != InvalidColorId)
            return; // only store the first color.

        m_storedPlayerCustomColor[playerId] = m_playerColorStack[playerId][CustomColorIndex];
    }

    /**
     * Restores the previous custom color set for a player if we are aware of any. Just like is the
     * case with the storeExistingPlayerCustomColor() method, this is necessary to support giving
     * players custom-like colors for temporary staff rights.
     *
     * @param playerId Id of the player to restore the previous custom color for.
     */
    public restorePreviousPlayerCustomColor(playerId) {
        if (m_storedPlayerCustomColor[playerId] == InvalidColorId)
            return;

        m_playerColorStack[playerId][CustomColorIndex] = m_storedPlayerCustomColor[playerId];
        m_storedPlayerCustomColor[playerId] = InvalidColorId;

        this->synchronizePlayerColorIndex(playerId);
    }

    /**
     * Releases the custom color owned by this player. The only case in which we should be using
     * this method is when they gained temporary administrator rights and that they were taken away
     * again. For all other intents and purposes, think twice whether this is what you need.
     *
     * @param playerId Id of the player to release the custom color for.
     */
    public releasePlayerCustomColor(playerId) {
        m_playerColorStack[playerId][CustomColorIndex] = InvalidColorId;
        if (m_playerColorIndex[playerId] == CustomColorIndex)
            this->synchronizePlayerColorIndex(playerId);
    }

    /**
     * Sets the color associated with the gang this player has joined. The color can be updated at
     * any time as well, for example because the gang changes their color.
     *
     * @param playerId Id of the player to set the gang-level color for.
     * @param color The color itself, in 0xRRGGBBAA format, to set for the gang color.
     */
    public setPlayerGangColor(playerId, color) {
        m_playerColorStack[playerId][GangColorIndex] = color;
        this->synchronizePlayerColorIndex(playerId);
    }

    /**
     * Releases the player's gang color and frees up the slot. Unless the player is in a minigame,
     * their color will be reverted back to either their custom or the default color.
     *
     * @param playerId Id of the player to release the gang-level color for.
     */
    public releasePlayerGangColor(playerId) {
        m_playerColorStack[playerId][GangColorIndex] = InvalidColorId;
        if (m_playerColorIndex[playerId] == GangColorIndex)
            this->synchronizePlayerColorIndex(playerId);
    }

    /**
     * Sets the minigame color which this player has been assigned for the minigame they're currently
     * involved in. These colors have a higher priority than most colors in the system.
     *
     * @param playerId Id of the player to set the minigame color for.
     * @param color The color, in 0xRRGGBBAA format, to set for this minigame.
     */
    public setPlayerMinigameColor(playerId, color) {
        m_playerColorStack[playerId][MinigameColorIndex] = color;
        this->synchronizePlayerColorIndex(playerId);
    }

    /**
     * Releases the minigame color which was previously imposed on this player. Their color will be
     * changed back to whatever color now has the highest priority.
     *
     * @param playerId Id of the player to reset the minigame color of.
     */
    public releasePlayerMinigameColor(playerId) {
        m_playerColorStack[playerId][MinigameColorIndex] = InvalidColorId;
        if (m_playerColorIndex[playerId] == MinigameColorIndex)
            this->synchronizePlayerColorIndex(playerId);
    }

    /**
     * Sets the color for this player which will override any other value. This should be very
     * sparsely used given the impact it has - even minigame colors will have less priority.
     *
     * @param playerId Id of the player to set the override color for.
     * @param color The color, in 0xRRGGBBAA format, to override with.
     */
    public setPlayerOverrideColor(playerId, color) {
        m_playerColorStack[playerId][OverrideColorIndex] = color;
        this->synchronizePlayerColorIndex(playerId);
    }

    /**
     * Releases the player's override color again. This will change the player's color back to
     * whatever now has the highest priority, likely their gang or default color.
     *
     * @param playerId Id of the player to release the override color for.
     */
    public releasePlayerOverrideColor(playerId) {
        m_playerColorStack[playerId][OverrideColorIndex] = InvalidColorId;
        this->synchronizePlayerColorIndex(playerId);
    }

    /**
     * Toggles whether the player's marker on the minimap should be hidden for all other players.
     * This is mostly useful for minigames. Don't forget to reset this!
     *
     * @param playerId The player for whom to hide their marker on the map.
     * @param hidden Whether the player's marker should be hidden.
     */
    public setPlayerMarkerHidden(playerId, bool: hidden) {
        m_playerMarkerHidden[playerId] = hidden;
        this->synchronizePlayerColorIndex(playerId);
    }

    /**
     * After one of the player's colors in the stack has been changed, we may need to update their
     * color to the highest value in the stack and update the player's color index with that index.
     *
     * @param playerId Id of the player to synchronize the color index for.
     */
    private synchronizePlayerColorIndex(playerId) {
        for (new colorIndex = 4; colorIndex >= 0; --colorIndex) {
            if (m_playerColorStack[playerId][colorIndex] == InvalidColorId)
                continue;

            m_playerColorIndex[playerId] = colorIndex;
            break;
        }

        new color = m_playerColorStack[playerId][m_playerColorIndex[playerId]];
        if (m_playerMarkerHidden[playerId] == true)
            color &= 0x333333FF;

        SetPlayerColor(playerId, color);
    }

    /**
     * Returns the default color which would be applied to a certain player Id. This is used by
     * various commands which allow setting of a player's color by providing a color Id.
     *
     * @param playerId Id of the player to retrieve the default color for.
     * @return integer The default color which would be applied to this player.
     */
    public defaultColorForPlayerId(playerId) {
        return g_defaultPlayerColors[playerId % sizeof(g_defaultPlayerColors)];
    }
};
