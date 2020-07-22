// Copyright 2006-2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Dialog telling the player that their account has been locked to require use of SAMPCAC, and they
 * have to enable it before being able to play on the server.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class RequireSampcacDialog <playerId (MAX_PLAYERS)> {
    // What is the dialog Id that will be used for this dialog?
    public const DialogId = @counter(OnDialogResponse);

    /**
     * Show the dialog which informs the user that they have to enable SAMPCAC in order to be able
     * to play. This cannot be dismissed - acknowledging the dialog will disconnect them.
     */
    public show() {
        new message[256];
        format(message, sizeof(message),
            "Your account requires use of SAMPCAC in order to play on Las Venturas\n" ...
                "Playground. Please enable the anticheat and reconnect to the server.");

        ShowPlayerDialog(playerId,
                         RequireSampcacDialog::DialogId,
                         DIALOG_STYLE_MSGBOX,
                         "You must enable SAMPCAC to play here!",
                         message, "Disconnect", "");
    }

    /**
     * Disconnects the player from the server as they have dismissed the dialog.
     *
     * @param button The button which was clicked, see the DialogButton enumeration.
     * @param listItem Index of the selected item in the list, which starts at zero.
     * @param inputText The text which was inserted, if any.
     * @return integer Were we able to correctly handle this callback?
     */
    @switch(OnDialogResponse, RequireSampcacDialog::DialogId)
    public onResponse(DialogButton: button, listItem, inputText[]) {
        Kick(playerId);

        #pragma unused button, listItem, inputText
        return 1;
    }
};
