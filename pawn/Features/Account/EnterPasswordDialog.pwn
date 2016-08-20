// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Spawn a dialog asking the user to enter their password. This will usually be done after they
 * connect to the server. If a player has enabled auto identification and happens to be part of the
 * Staff, then their password may be requested at a later stage in the gamemode.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class EnterPasswordDialog <playerId (MAX_PLAYERS)>
{
    // What is the dialog Id that will be used for the enter password dialogs?
    public const DialogId = @counter(OnDialogResponse);

    // What kind of password request is being made for this user?
    new PasswordRequestType: m_type;

    /**
     * Display the password dialog for the given player. Certain administrative features may require
     * this if the user has used auto login.
     *
     * @param type The type of password request that's being shown for the user.
     * @param invalidPassword Should we include a note that an invalid password was entered?
     * @param loginAttempt The how many-th login attempt are we currently showing?
     */
    public show(PasswordRequestType: type, bool: invalidPassword, loginAttempt)
    {
        m_type = type;

        // Set up the message that will be shown to the user. If this isn't the first attempt,
        // we'll show them an additional line informing them of the number of attempts left.
        new registrationMessage[512], attemptBuffer[64];
        strcat(registrationMessage, "{FFFFFF}The nickname you're using has been registered on {FF0000}www.sa-mp.nl{FFFFFF}\n", sizeof(registrationMessage));
        strcat(registrationMessage, "Please enter your password in the field below and click on \"{40FF40}Login{FFFFFF}\".", sizeof(registrationMessage));

        // Did the player enter an invalid password? If so, modify the message.
        if (invalidPassword == true)
            strcat(registrationMessage, "\n{FF0000}The password you entered is invalid.{FFFFFF} ", sizeof(registrationMessage));
        else if (loginAttempt != 0)
            strcat(registrationMessage, "\n");

        // Append the text indicating how many login attempts are remaining.
        if (loginAttempt > 1 && loginAttempt != Account::MaximumNumberOfLoginAttempts) {
            format(attemptBuffer, sizeof(attemptBuffer), "You have {FF0000}%d{FFFFFF} attempts remaining.", (Account::MaximumNumberOfLoginAttempts + 1) - loginAttempt);
            strcat(registrationMessage, attemptBuffer, sizeof(registrationMessage));
        } else if (loginAttempt == Account::MaximumNumberOfLoginAttempts)
            strcat(registrationMessage, "This is your {FF0000}last{FFFFFF} attempt.", sizeof(registrationMessage));

        // Now show the dialog to the user, with the created message in-place.
        ShowPlayerDialog(playerId,
                         EnterPasswordDialog::DialogId,
                         DIALOG_STYLE_PASSWORD,
                         "Your nickname has been registered!",
                         registrationMessage,
                         "Login",
                         "Cancel");
    }

    /**
     * Once the player enters their password *or* clicks on the cancel button, we'll have a response
     * and need to determine what to do next -- ask for their password again, or verify it against
     * their known user information in the database.
     *
     * @param button The button which was clicked, see the DialogButton enumeration.
     * @param listItem Index of the selected item in the list, which starts at zero.
     * @param inputText The text which was inserted.
     * @return integer Were we able to correctly handle this callback?
     */
    @switch(OnDialogResponse, EnterPasswordDialog::DialogId)
    public onResponse(DialogButton: button, listItem, inputText[]) {
        switch (m_type) {
            case InitialAuthenticationPasswordRequest: {
                Account(playerId)->onPasswordDialogResponse(button == RightButton, inputText);
                return 1;
            }
        }

        // Invalid type supplied for this dialog. We can't handle it...
        #pragma unused listItem
        return 0;
    }
};
