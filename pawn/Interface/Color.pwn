// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * As colors in Pawn are formatted as RGBA, it may not always be immediately obvious what the result
 * is going to be. As such, expose the colors as public constants in this class, allowing code to
 * refer to "Color::Red" instead.
 */
class Color {
    // Invalid colors will be stored as -1, allowing us to easily identify them.
    public const InvalidColor = -1;

    // How many cells need to be reserves for textual colors (RRGGBB plus a NULL cell).
    public const TextualColorLength = 7;

    // The following messages should be used for the different kinds of messages. Choose them based
    // on the severity of the message you're sending to the player.
    public const Debug = 0xAFAFAFAA;
    public const Information = 0xFFFFFFFF;
    public const Warning = 0xFFFF00AA;
    public const Error = 0xDC143CFF;
    public const Success = 0x33AA33AA;

    // The following colors are associated with certain kind of messages in the gamemode. All messages
    // issued by the gamemode should be as consistent as possible.
    public const MinigameAnnouncement = 0xCCD782FF;
    public const MinigameAnnouncementHighlight = 0x838F31FF;
    public const PropertyTycoonAnnouncement = 0xFFFF00AA;

    // =============================================================================================
    //                                       ~~~~~~~~~~~~~~~~
    // Colors above this line must have been FORMALLY APROVED by Russell.
    //                                       ~~~~~~~~~~~~~~~~
    // All other colors need to be added below this line.
    //
    // =============================================================================================

    public const ActionRequired = 0x33AA33AA;
    public const PlayerStatistics = 0xFF9900DD;

    // Colors meant for chat messages related to certain features.
    public const GangChat = 0x33CCFFAA;
    public const RegularChat = 0xFF9900AA;
    public const VipChat = 0x00E1E1AA;
    public const PrivateMessageReceived = 0xFFDC1833;
    public const PrivateMessageSent = 0xFCF54500;

    // The highlight blue color which we use to put emphasis on certain words.
    public const HighlightBlue = 0x40CCFFFF;

    // Color for paused players.
    public const InactivePlayerColor = 0x333333FF;

    // General colors, slightly adjusted to look better in Grand Theft Auto.
    public const Red = 0xDC143CFF;
    public const White = 0xFFFFFFFF;
    public const Green = 0x33AA33AA;

    public const LightGrayBackground = 0x00000085;
    public const LightRedBackground = 0x770F0085;

    // Colors used for certain functionalities in the gamemode.
    public const ConnectionMessage = 0xCCCCCCAA;
    public const PropertyTextLabel = 0x33AA33FF;
    public const PropertyFeatureText = 0xFF66FFAA;

    // Colors frequently used in minigames.
    public const MinigameTransparentRed = 0xDC143C00;
    public const MinigameTransparentBlue = 0x33CCFF00;

    // Colors related to statuses of special players.
    public const AdministratorColor = 0xFFFF00AA;
    public const ModeratorColor = 0xFF8C13FF;
    public const NonPlayerCharacterColor = 0xFFFFFFAA;

    /**
     * Converts a simple 0xRRGGBB numerical color value to the RGBA format which is expected by
     * San Andreas: Multiplayer. We store colors in RGB format in the database. An alpha of 0xAA is
     * automatically appended, which matches what we'd like for most colors, but this can be amended
     * by passing an alternative alpha value as the [alpha] parameter.
     *
     * @param color The simple numeric color assigned for this player.
     * @param alpha Optional parameter indicating which alpha level this color should have.
     * @return integer The same color, but in 0xRRGGBBAA format with the given alpha.
     */
    public fromRGB(color, alpha = 0xAA) {
        new red = (color >> 16) & 0xFF,
            green = (color >> 8) & 0xFF,
            blue = color & 0xFF;

        return red << 24 | green << 16 | blue << 8 | alpha;
    }

    /**
     * Convert a RGBA color to a hexadecimal color (SA-MP standard).
     * 
     * @param red Red channel's value.
     * @param green Green channel's value.
     * @param blue Blue channel's value.
     * @param alpha Alpha channel's value.
     * @return integer Standard hexadecimal color.
     */
    public fromRGBA(red, green, blue, alpha) {
        return red << 24 | green << 16 | blue << 8 | alpha;
    }

    /**
     * Converts a integer-based color to a RRGGBB string representation, for more convenient usage
     * in format() and similar functions.
     *
     * @param color The color which should be converted to a string value, in 0xRRGGBBAA format.
     * @param buffer The buffer in which the created string should be stored. At least 7 cells.
     * @param bufferSize The size of the buffer in which we store the color value.
     */
    public toString(color, buffer[], bufferSize) {
        new red = (color >> 24) & 0xFF,
            green = (color >> 16) & 0xFF,
            blue = (color >> 8) & 0xFF;

        format(buffer, bufferSize, "%02x%02x%02x", red, green, blue);
    }

    /**
     * Convert a string containing a hex color to it's integer.
     * Source: http://wiki.sa-mp.com/wiki/Colors.
     * 
     * @param string The string containing the hex color.
     * @return integer Integer of the color.
     */
    public fromHexToInt(string[]) {
        if (string[0] == 0)
            return 0;

        new cur = 1, int = 0;
        for (new i = strlen(string); i > 0; i--) {
            if (string[i - 1] < 58)
                int = int + cur * (string[i - 1] - 48);
            else
                int = int + cur * (string[i - 1] - 65 + 10);
            cur = cur * 16;
        }
        return int;
    }
};
