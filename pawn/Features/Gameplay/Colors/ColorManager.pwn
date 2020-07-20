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

    // The color which overrides all above values. Should be very sparsely used.
    OverrideColorIndex,

    // The color associated with the minigame they're playing.
    MinigameColorIndex
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
 * - Override colors (e.g. the chase in main world);
 * - Minigame color (e.g. to distinguish two different teams).
 *
 * @author Manuele "Kase" Macchia <kaseify@gmail.com>
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class ColorManager {
    // The value we use to identify unused slots in the player's color stack.
    const InvalidColorId = 0xFFFFFFFF;

    // A stack containing the colors which could apply to this user, in reversed order of priority
    // (index [0] is their default color, whereas index[4] is their minigame color).
    new m_playerColorStack[MAX_PLAYERS][5];

    // The index in the player's color stack where they're currently at.
    new m_playerColorIndex[MAX_PLAYERS];

    // Whether the player's marker on the mini-map should be hidden.
    new bool: m_playerMarkerHidden[MAX_PLAYERS];

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

        SetPlayerColor(playerId, m_playerColorStack[playerId][DefaultColorIndex]);
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

    public releasePlayerCustomColor(playerId) {
        m_playerColorStack[playerId][CustomColorIndex] = InvalidColorId;
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
            color &= 0xFFFFFF00;

        SetPlayerColor(playerId, color);

        for (new forPlayerId = 0; forPlayerId <= PlayerManager->highestPlayerId(); forPlayerId++) {
            if (Player(forPlayerId)->isConnected() == false || Player(forPlayerId)->isNonPlayerCharacter() == true)
                continue;

            SetPlayerMarkerForPlayer(forPlayerId, playerId, color);
            ShowPlayerNameTagForPlayer(forPlayerId, playerId, !m_playerMarkerHidden[playerId]);
        }
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
