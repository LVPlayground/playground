// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Players are only allowed to be logged in to their account once on the server. If they are online
 * multiple times, they'll have to reconnect or decide to play as a guest.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class MultipleSessionDialog <playerId (MAX_PLAYERS)> {
    // What is the dialog Id that will be used for this dialog?
    public const DialogId = @counter(OnDialogResponse);

    /**
     * Show the dialog which informs the user that they either can play as a guest, or have to leave
     * the server as they're not allowed to play with the nickname they connected with.
     */
    public show(otherPlayerId) {
        new message[256];
        format(message, sizeof(message),
            "You're already logged in to your account as {FF0000}%s{FFFFFF}. Please\n" ...
                "close your other session before rejoining the server. You have the\n" ...
                "option to play as a guest by clicking on \"{40FF40}Play{FFFFFF}\",\n" ...
                "or leave Las Venturas Playground by clicking on \"{40FF40}Leave{FFFFFF}\".",
            Player(otherPlayerId)->nicknameString());


        ShowPlayerDialog(playerId,
                         MultipleSessionDialog::DialogId,
                         DIALOG_STYLE_MSGBOX,
                         "You are already online on the server!",
                         message, "Play", "Leave");
    }

    /**
     * Depending on the action as chosen by the player, either log them in as a guest allowing them
     * to start playing, or kick them from the server if they decided to leave.
     *
     * @param button The button which was clicked, see the DialogButton enumeration.
     * @param listItem Index of the selected item in the list, which starts at zero.
     * @param inputText The text which was inserted, if any.
     * @return integer Were we able to correctly handle this callback?
     */
    @switch(OnDialogResponse, MultipleSessionDialog::DialogId)
    public onResponse(DialogButton: button, listItem, inputText[]) {
        if (button == LeftButton) { // "Play"
            Account(playerId)->changeNicknameAndPlayAsGuest();
            return 1;
        }

        #pragma unused listItem, inputText
        return 1;
    }
};
