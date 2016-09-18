// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * The Visual Interface class curates the most basic interface elements of Las Venturas Playground,
 * i.e. any logos and effects which should be on the player's screen for longer periods of time.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 */
class Interface {
    // Some textdraws that will hold the server name, address and website URL in the top-right corner.
    new Text: m_serverInformation[3] = {Text: INVALID_TEXT_DRAW, ...};

    // A textdraw containing a warning for unregistered players.
    new Text: m_unregisteredWarning = Text: INVALID_TEXT_DRAW;

    // What is the dialogId we'll be using to serve a dialog for our player?
    public const RegisterDialogId = @counter(OnDialogResponse);

    // Create and initialize any text-draws that will be required for the interface later on.
    @list(OnGameModeInit)
    public initialize() {
        m_serverInformation[0] = TextDrawCreate(500.0, 8.0, "Las Venturas Playground");
        TextDrawBackgroundColor(m_serverInformation[0], 255);
        TextDrawFont(m_serverInformation[0], 0);
        TextDrawLetterSize(m_serverInformation[0], 0.34, 1.2);
        TextDrawColor(m_serverInformation[0], Color::PlayerStatistics);
        TextDrawSetOutline(m_serverInformation[0], 1);
        TextDrawSetProportional(m_serverInformation[0], 1);

        m_serverInformation[1] = TextDrawCreate(548.0, 23.0, "play.sa-mp.nl:7777");
        TextDrawBackgroundColor(m_serverInformation[1], 255);
        TextDrawFont(m_serverInformation[1], 1);
        TextDrawLetterSize(m_serverInformation[1], 0.18, 0.899999);
        TextDrawColor(m_serverInformation[1], -1261639425);
        TextDrawSetOutline(m_serverInformation[1], 1);
        TextDrawSetProportional(m_serverInformation[1], 1);
        TextDrawSetSelectable(m_serverInformation[1], 0);

        m_serverInformation[2] = TextDrawCreate(548.0, 33.0, "www.sa-mp.nl");
        TextDrawBackgroundColor(m_serverInformation[2], 255);
        TextDrawFont(m_serverInformation[2], 1);
        TextDrawLetterSize(m_serverInformation[2], 0.18, 0.899999);
        TextDrawColor(m_serverInformation[2], -1261639425);
        TextDrawSetOutline(m_serverInformation[2], 1);
        TextDrawSetProportional(m_serverInformation[2], 1);
        TextDrawSetSelectable(m_serverInformation[2], 0);

        m_unregisteredWarning = TextDrawCreate(316.0, 1.0,
            "Your nickname is UNREGISTERED, your stats and money will NOT be saved! Register now at www.sa-mp.nl (/register)");
        TextDrawAlignment(m_unregisteredWarning, 2);
        TextDrawBackgroundColor(m_unregisteredWarning, 255);
        TextDrawFont(m_unregisteredWarning, 1);
        TextDrawLetterSize(m_unregisteredWarning, 0.16, 0.899999);
        TextDrawColor(m_unregisteredWarning, Color::Information);
        TextDrawSetOutline(m_unregisteredWarning, 0);
        TextDrawSetProportional(m_unregisteredWarning, 1);
        TextDrawSetShadow(m_unregisteredWarning, 0);
        TextDrawUseBox(m_unregisteredWarning, 1);
        TextDrawBoxColor(m_unregisteredWarning, Color::LightRedBackground);
        TextDrawTextSize(m_unregisteredWarning, 0.0, 302.0);
    }

    /**
     * When any new player connects to the server, we want to enable the interface quickly and
     * smoothly. Immediately display all available components.
     *
     * @param playerId Id of the player who is connecting to the server.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect(playerId) {
        for (new textDraw = 0; textDraw < sizeof(m_serverInformation); textDraw++)
            TextDrawShowForPlayer(playerId, m_serverInformation[textDraw]);
    }

    /**
     * Upon spawning, check if the player is registered to show a warning when they aren't.
     *
     * @param playerId Id of the player who is spawning.
     */
    @list(OnPlayerSpawn)
    public onPlayerSpawn(playerId) {
        if (Player(playerId)->isRegistered() == false && UndercoverAdministrator(playerId)->isUndercoverAdministrator() == false)
            TextDrawShowForPlayer(playerId, m_unregisteredWarning);
    }

    /**
     * Upon modlogin, hide the unregistered warning textdraw.
     *
     * @param playerId Id of the player who is logging is as a crew member.
     */
    @list(OnPlayerModLogin)
    public onPlayerModLogin(playerId) {
        TextDrawHideForPlayer(playerId, m_unregisteredWarning);
    }

    /**
     * Upon first spawn of an unregistered player, or upon execution of the /register command, we
     * show a dialog listing all possible benefits to register for, and how to register on LVP.
     *
     * @param playerId Id of the player of who we are issueing this dialog for.
     */
    public issueRegisterDialog(playerId) {
        new dialogMessage[964];
        format(dialogMessage, sizeof(dialogMessage),
            "{FFFFFF}You're currently UNREGISTERED! These are the benefits of registering:\r\n" ...
            "{B4CCE8}- Personal bank: {FF8E02}Your money always saved and available\r\n" ...
            "{B4CCE8}- Statistics: {FF8E02}Many deathmatch and fun statistics tracked and viewable\r\n" ...
            "{B4CCE8}- Info saved upon logout/crash: {FF8E02}Reconnect within 10 minutes and everything is still there\r\n" ...
            "{B4CCE8}- Skin: {FF8E02}Your personal skin saved\r\n" ...
            "{B4CCE8}- Achievements: {FF8E02}Play and earn achievements\r\n" ...
            "{B4CCE8}- Death message: {FF8E02}Show off your own death message when you kill someone\r\n" ...
            "{B4CCE8}- Extra commands: {FF8E02}Some commands are only available for registered players\r\n\n" ...
            "{FFFFFF}HOW TO REGISTER:\r\n" ...
            "{B4CCE8}1. Go to www.sa-mp.nl\r\n" ...
            "{B4CCE8}2. Click Register in the navigation bar\r\n" ...
            "{B4CCE8}3. Fill out the form, make sure the e-mail is valid\r\n" ...
            "{B4CCE8}4. Check your e-mail for the activation mail, click the activation link\r\n" ...
            "{B4CCE8}5. Reconnect with your registered nickname, have fun!");

        ShowPlayerDialog(playerId, Interface::RegisterDialogId, DIALOG_STYLE_MSGBOX,
            "Las Venturas Playground", dialogMessage, "Got it!", "");

        return 1;
    }
};
