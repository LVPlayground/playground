// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

// How many rows should be displayed in the color picker?
const ColorPickerRowCount = 7;

// How many columns should be displayed in the color picker?
const ColorPickerColumnCount = 7;

// Total grid size in number of cells which, together, form a page of the color picker.
const ColorPickerGridSize = ColorPickerRowCount * ColorPickerColumnCount;

/**
 * Las Venturas Playground offers crew and VIPs to change car and player colors. In order to make
 * this as player friendly as possible, we show the user a nice color picker which makes it a lot
 * easier to change any color ingame.
 *
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class ColorPicker {
    // The textdraw used for creating the background and cancel-button of the color picker.
    new Text: m_globalColorPickerTextDraw[2] = {Text: INVALID_TEXT_DRAW, ...};

    // We need several textdraws for the selectable colors within the global environment.
    new Text: m_localColorPickerTextDraw[ColorPickerGridSize] = {Text: INVALID_TEXT_DRAW, ...};

    // Keep track of the target the user is using the color picker for.
    new ColorPickerResultTarget: m_colorPickerTarget[MAX_PLAYERS];

    // If an extra Id is required for changing a feature's color, we save it here.
    new m_colorPickerExtraId[MAX_PLAYERS];

    /**
     * A utility method to determine which color should be displayed by each cell in the color
     * picker. The formula depends on the page number the cell resides in, and the index of this cell.
     * At the end, we'll be using colors varying from 0 - 48.
     *
     * @param cellIndex Index of the cell for which to get the determined color.
     * @return integer The color which has to be displayed in this cell, in 0xRRGGBBAA format.
     */
    private colorForColorPickerCell(cellIndex) {
        return ColorManager->defaultColorForPlayerId(cellIndex);
    }

    /**
     * The color picker textdraws are created on gamemode initialization.
     *
     * The alignment here specifies the functions of letter- and textsize. Because we use alignment
     * setting 2 (centered); lettersize will determine the textdraw's height, given by the y-coordinate,
     * Textsize will determine the width, also given by the y-coordinate. In both size setters the
     * x-coordinate has no function.
     * Since we need several of our textdraws to be selectable, the textsize x- and y-coordinate
     * will specify the clickable area. The culprint here is that we have to specify a selectable
     * area without molesting the actual textdraw size.
     *
     * In order to achieve that, we will use these two size setters as according:
     *     TextDrawLetterSize(textdraw, 0.0, y) (x = 0.0 since it has no function in this case)
     *     TextDrawTextSize(textdraw, y, y)
     * Since the textsize y-coordinate actually specifies the textdraw's width, we'll set x equal
     * to y to match the selectable area's width. Also, since the y-coordinate at lettersize specifies
     * the textdraw's height, we'll have to match this up with the y-coordinate of textsize to create
     * a square with proper selectable area. To match these two y-coordinates up, we multiply the
     * textsize's y-coordinate with 0.135 to gain the value for the lettersize's y-coordinate.
     */
    @list(OnGameModeInit)
    public initializeColorPickerTextDraws() {
        // Create transparent background box.
        m_globalColorPickerTextDraw[0] = TextDrawCreate(86.0, 150.0, "_");
        TextDrawUseBox(m_globalColorPickerTextDraw[0], 1);
        TextDrawBoxColor(m_globalColorPickerTextDraw[0], Color::LightGrayBackground); /* transparent black */

        TextDrawAlignment(m_globalColorPickerTextDraw[0], 2);
        TextDrawLetterSize(m_globalColorPickerTextDraw[0], 0.0, 17.01);
        TextDrawTextSize(m_globalColorPickerTextDraw[0], 126.0, 126.0);

        // Create the cancel-button.
        new const Float: offsetButtonX = 86.5;
        new const Float: offsetButtonY = 310.0;

        m_globalColorPickerTextDraw[1] = TextDrawCreate(/** offset x **/ offsetButtonX, /** offset y **/ offsetButtonY, "Cancel");
        TextDrawUseBox(m_globalColorPickerTextDraw[1], 1);
        TextDrawBoxColor(m_globalColorPickerTextDraw[1], Color::LightRedBackground); /* transparent red */
        TextDrawFont(m_globalColorPickerTextDraw[1], 3);
        TextDrawColor(m_globalColorPickerTextDraw[1], 0xFFFFFFFF); /* white text */
        TextDrawSetShadow(m_globalColorPickerTextDraw[1], 0); /* no text shadow */
        TextDrawAlignment(m_globalColorPickerTextDraw[1], 2);
        TextDrawLetterSize(m_globalColorPickerTextDraw[1], 0.35, 1.35);
        TextDrawTextSize(m_globalColorPickerTextDraw[1], 10.0, 44.0);
        TextDrawSetSelectable(m_globalColorPickerTextDraw[1], 1);

        // Create 7 * 7 grid for the colored cells.
        new const Float: offsetCellX = 32.0;
        new const Float: offsetCellY = 154.0;

        for (new rowIndex = 0; rowIndex < ColorPickerRowCount; ++rowIndex) {
            for (new columnIndex = 0; columnIndex < ColorPickerColumnCount; ++columnIndex) {
                new textdrawIndex = (rowIndex * ColorPickerRowCount) + columnIndex;

                m_localColorPickerTextDraw[textdrawIndex] = TextDrawCreate(/** offset x **/
                    offsetCellX + 18.0 * columnIndex, /** offset y **/ offsetCellY + 22.0 * rowIndex, "_");
                TextDrawUseBox(m_localColorPickerTextDraw[textdrawIndex], 1);
                TextDrawAlignment(m_localColorPickerTextDraw[textdrawIndex], 2);
                TextDrawLetterSize(m_localColorPickerTextDraw[textdrawIndex], 0.0, 1.485);
                TextDrawTextSize(m_localColorPickerTextDraw[textdrawIndex], 11.0, 11.0);
                TextDrawSetSelectable(m_localColorPickerTextDraw[textdrawIndex], 1);
            }
        }
    }

    /**
     * Using this function will show the color picker to the player who invoked it. The colors
     * depend on the requested page. A target has to be specified for the picked color's result,
     * and optionally an additional extraId can be send along.
     *
     * @param playerId Id of the player who is using the color picker.
     * @param page Number of the page the players wants to view.
     * @param target The feature for which a color picker has to be shown.
     * @param extraId Additional data to pass on to the feature upon completion.
     */
    public showColorPicker(playerId, ColorPickerResultTarget: target, extraId = -1) {
        new color;

        // Hold target and extraId to be used in the OnPlayerClickTextDraw callback.
        m_colorPickerTarget[playerId] = target;
        m_colorPickerExtraId[playerId] = extraId;

        // Show global textdraws: background and cancel button.
        for (new globalIndex = 0; globalIndex < 2; globalIndex++)
            TextDrawShowForPlayer(playerId, m_globalColorPickerTextDraw[globalIndex]);

        // Show local textdraws: 7 * 7 = 49 colored cells.
        for (new cellIndex = 0; cellIndex < ColorPickerGridSize; ++cellIndex) {
            color = this->colorForColorPickerCell(cellIndex);
            TextDrawBoxColor(m_localColorPickerTextDraw[cellIndex], color);

            // For administrators, we'll color the first box with their special color. This way, they
            // can always fall back on their status color.
            if (cellIndex == 0 && m_colorPickerTarget[playerId] != GangColor) {
                if (Player(playerId)->isAdministrator() == true)
                    TextDrawBoxColor(m_localColorPickerTextDraw[cellIndex], Color::AdministratorColor);
            }

            TextDrawShowForPlayer(playerId, m_localColorPickerTextDraw[cellIndex]);
        }

        SelectTextDraw(playerId, Color::White);
        return 1;
    }

    /**
     * Method useable to hide an active color picker for a player.
     *
     * @param playerId Id of the player who is using the color picker.
     */
    private hideColorPicker(playerId) {
        for (new globalIndex = 0; globalIndex < 2; globalIndex++)
            TextDrawHideForPlayer(playerId, m_globalColorPickerTextDraw[globalIndex]);

        for (new innerCellIndex = 0; innerCellIndex < ColorPickerGridSize; ++innerCellIndex)
            TextDrawHideForPlayer(playerId, m_localColorPickerTextDraw[innerCellIndex]);

        CancelSelectTextDraw(playerId);

        return 1;
    }

    /**
     * Invoked when the player clicks on one of the color textdraws. The color changing is being
     * handled in this function, assuming the clicked-on textdraw is owned by the color picker.
     *
     * @param playerId Id of the player who is using the color picker.
     * @param clickedId Id of the textdraw which the player selected.
     */
    @list(OnPlayerClickTextDraw)
    public onPlayerClickTextDraw(playerId, Text: clickedId) {
        // A fix for the CancelSelectTextDraw loop which calls this function with INVALID_TEXT_DRAW.
        if (clickedId == Text: INVALID_TEXT_DRAW)
            return 1;

        // Check if the 'cancel' button has been clicked.
        if (m_globalColorPickerTextDraw[1] == clickedId) {
            this->hideColorPicker(playerId);

            return 1;
        }

        // Check which cell has been clicked and change the target's color.
        for (new cellIndex = 0; cellIndex < ColorPickerGridSize; ++cellIndex) {
            if (m_localColorPickerTextDraw[cellIndex] != clickedId)
                continue;

            this->hideColorPicker(playerId);

            // Take care of the actual color changing.
            new color = this->colorForColorPickerCell(cellIndex), extraId = m_colorPickerExtraId[playerId],
                message[128];

            // Set the correct color when a crew member picks their special color.
            if (cellIndex == 0 && m_colorPickerTarget[playerId] != GangColor) {
                if (Player(playerId)->isAdministrator() == true)
                    color = Color::AdministratorColor;
            }

            switch (m_colorPickerTarget[playerId]) {
                case GangColor: {
                    // TODO: Move this to Gang::OnColorChanged or something similar.
                    Gang(extraId)->setColor(color);

                    format(message, sizeof(message), "%s (Id:%d) has changed the colour of the gang you're part of.",
                        Player(playerId)->nicknameString(), playerId);
                    Gang(extraId)->sendMessageToMembers(Color::Information, message);

                    SendClientMessage(playerId, Color::Success, "You have successfully changed the colour of your gang!");
                }

                case PlayerColor: {
                    // TODO: Move all of this to Player::OnColorChanged.
                    if (Player(playerId)->isAdministrator() == false)
                        GivePlayerMoney(playerId, -10000000);

                    ColorManager->setPlayerCustomColor(playerId, color);

                    SendClientMessage(playerId, Color::Success, "Your colour has been changed!");
                }
            }

            return 1;
        }

        // The clicked on textdraw is not owned by the color picker.
        return 0;
    }
};
