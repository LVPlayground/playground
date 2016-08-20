// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * After a certain number of unsuccessful login attempts, we'll force the player to either play as
 * a guest or leave the server. This dialog will give them that option.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class ForcedGuestDialog <playerId (MAX_PLAYERS)> {
    // What is the dialog Id that will be used for this dialog?
    public const DialogId = @counter(OnDialogResponse);

    /**
     * Show the dialog which informs the user that they either can play as a guest, or have to leave
     * the server as they're not allowed to play with the nickname they connected with.
     */
    public show() {
        ShowPlayerDialog(playerId,
                         ForcedGuestDialog::DialogId,
                         DIALOG_STYLE_MSGBOX,
                         "Your nickname has been registered!",
                         "The nickname you're using has been registered on {FF0000}www.sa-mp.nl{FFFFFF}\n" ...
                            "You can now choose to either play as a guest, by clicking on \"{40FF40}Play{FFFFFF}\",\n" ...
                            "or to leave Las Venturas Playground by clicking on \"{40FF40}Leave{FFFFFF}\".",
                         "Play",
                         "Leave");
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
    @switch(OnDialogResponse, ForcedGuestDialog::DialogId)
    public onResponse(DialogButton: button, listItem, inputText[]) {
        if (button == LeftButton) { // "Play"
            Account(playerId)->changeNicknameAndPlayAsGuest();
            return 1;
        }

        #pragma unused listItem, inputText
        return 1;
    }
};
