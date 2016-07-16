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
    public const SlapAnnouncement = 0xB1FC17FF;

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
    public const VipChat = 0x00E1E1AA;

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
    public const MinigameTransparentGreen = 0x33AA3300;

    // Colors related to statuses of special players.
    public const AdministratorColor = 0xFFFF00AA;
    public const NonPlayerCharacterColor = 0xFFFFFFAA;

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
};
