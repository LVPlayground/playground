// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * Which button in the SA-MP dialog has been clicked on by the player? Considering the values set by
 * the server are rather confusing, we re-implement this as an enumeration.
 */
enum DialogButton {
    LeftButton = 1,
    CenterButton = 1,
    RightButton = 0
};

/**
 * The Dialog class encapsulates features related to showing and clearing dialogs, and routing the
 * responses given by the player to the proper feature handlers.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class Dialog {
    /**
     * Invoking this method will clear the visible dialog on the player's screen.
     *
     * @param playerId Id of the player to clear dialogs for.
     */
    public inline clearForPlayer(playerId) {
        ShowPlayerDialog(playerId, -1, DIALOG_STYLE_MSGBOX, "", "", "ok", "");
    }

    /**
     * Handles the onDialogResponse callback by expanding the invocation switch list that contains
     * all handlers for certain dialogs.
     *
     * @param playerId The Id of the player who responded to a shown dialog.
     * @param dialogId The Id of the dialog that they were responding to.
     * @param response The given response (1 for left button, 0 for right button).
     * @param listItem Index (zero-based) of the item they chose from the list.
     * @param inputText The text entered by the player in the input box.
     * @return boolean Did the gamemode correctly handle the dialog?
     */
    public bool: onDialogResponse(playerId, dialogId, response, listItem, inputText[]) {
        if (Annotation::ExpandSwitch<OnDialogResponse>(dialogId, playerId, DialogButton: response, listItem, inputText) != -1)
            return true;

        return deprecated_OnDialogResponse(playerId, dialogId, response, listItem, inputText) == 1;
    }
};

/**
 * When a player clicks on a dialog, the San Andreas: Multiplayer server will invoke this callback
 * asking it to handle the event. We'll delegate to the Dialog class.
 *
 * @param playerid The Id of the player who responded to a shown dialog.
 * @param dialogid The Id of the dialog that they were responding to.
 * @param response The given response (1 for left button, 0 for right button).
 * @param listitem Index (zero-based) of the item they chose from the list.
 * @param inputtext The text entered by the player in the input box.
 * @return integer Did the gamemode correctly handle the dialog?
 */
public OnDialogResponse(playerid, dialogid, response, listitem, inputtext[]) {
    if (Player(playerid)->isNonPlayerCharacter())
        return 1;

    return Dialog->onDialogResponse(playerid, dialogid, response, listitem, inputtext) ? 1 : 0;
}
