// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * The account class curates the most basic information about a player's account, and also manages
 * loading and saving of accounts when the player connects, disconnects or at certain intervals.
 *
 * Verifying and logging in a user is a complicated process, as it's completely asynchronous. Please
 * see the documentation in Features/Account.pwn for how the flow works, including the entry points
 * and class/method calls.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class Account <playerId (MAX_PLAYERS)> {
    // How many times can a player attempt to login before we kick them from the server?
    public const MaximumNumberOfLoginAttempts = 3;

    // How many seconds do we allow between re-logins of the same player? If the player rejoins the
    // server within this period of time, their complete state will be restored.
    const SessionRestoreTimeSeconds = 600;

    // Whether the player has logged in successfully.
    new bool: m_verified;

    // Id of the user account that belongs to this player.
    new m_userId;

    // How many times have we shown the enter password dialog?
    new m_loginAttemptCount;

    /**
     * After a player has connected to the server, we'll want to know whether they're registered and
     * should be logged in automatically. Several settings will be loaded and prepared afterwards.
     *
     * @param playerId Id of the player who has just connected.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect() {
        m_verified = false;
        m_userId = 0;
        m_loginAttemptCount = 0;

        SpawnManager(playerId)->onConnect();
        AccountData(playerId)->reset();

        if (Player(playerId)->isNonPlayerCharacter() == true)
            return; // don't do any processing for NPCs.

        // Fire off a request to see whether they have registered with Las Venturas Playground.
        PlayerRegisteredRequest->createForNickname(playerId, Player(playerId)->nicknameString());
    }

    /**
     * After the database has given us information about whether the player is registered or not, we
     * fire off a request for the Ban Manager to check whether they're allowed to play and, if the
     * player is registered, set their player data up in an appropriate way.
     *
     * @param registered Is the user a registered player on Las Venturas Playground?
     * @param userId Id of the user as they are registered in the database.
     * @param skinId Optional default skin as has been chosen by the registered user.
     * @param enableAutomaticIdentification Should this user be identified automatically?
     */
    public onRegisteredRequestComplete(bool: registered, userId, skinId, bool: enableAutomaticIdentification = false) {
        BanManager->verifyPlayerAllowedToPlay(playerId, userId);
        if (registered == false)
            return;

        Player(playerId)->setIsRegistered(true);
        Player(playerId)->setIsLoggedIn(false);
        m_loginAttemptCount = 0;
        m_userId = userId;

        SpawnManager(playerId)->setSkinId(skinId);
        Annotation::ExpandList<OnPlayerAccountAvailable>(playerId);

        // Proceed to loading their data immediately if automatic identification is enabled.
        if (enableAutomaticIdentification == true) {
            this->identifyPlayerForUserId(userId);
            return;
        }

        // Otherwise create a login dialog asking them to enter their password.
        this->displayPasswordDialog();
    }

    /**
     * Display the password dialog for a user, in which they'll be asked to enter their password
     * before continuing. After a certain number of attempts, as is defined by the constant earlier
     * on in this class, they'll be forced to either leave the server or log in as a guest.
     *
     * @param boolean invalidPassword Has the user entered a wrong password?
     * @todo Differentiate between pre-login dialogs and post-login dialogs.
     */
    public displayPasswordDialog(bool: invalidPassword = false) {
        if (++m_loginAttemptCount > Account::MaximumNumberOfLoginAttempts) {
            ForcedGuestDialog(playerId)->show();
            return;
        }

        EnterPasswordDialog(playerId)->show(InitialAuthenticationPasswordRequest, invalidPassword, m_loginAttemptCount);
    }

    /**
     * After the player entered their password, we need to verify whether the password they entered
     * matches the one stored in the database. As such, fire a VerifyPasswordRequest. If no password
     * was entered, or the dialog was canceled, show an error and try again.
     *
     * Players can try entering their password three times. After the third time, we kick them from
     * the server. Registered players and their nicknames take priority over new players.
     *
     * @param canceled Was the cancel button within the dialog pressed?
     * @param password The password they entered in the dialog.
     */
    public onPasswordDialogResponse(bool: canceled, password[]) {
        if (canceled == true || strlen(password) == 0) {
            AccountRegisteredDialog(playerId)->show();
            return;
        }

        PasswordVerificationRequest->createForPlayer(playerId, m_userId, password);
    }

    /**
     * After the password verification is complete, this method will be called informing us of
     * whether the player's access to the account has been verified. If it has been, identify them,
     * otherwise show the enter password dialog noting the invalid attempt.
     *
     * @param verified Did the player enter the correct password?
     * @param userId Id of the user they were trying to log in as.
     */
    public onPasswordVerificationComplete(bool: verified, userId) {
        if (verified)
            this->identifyPlayerForUserId(userId);
        else
            this->displayPasswordDialog(true);
    }

    /**
     * After we've determined the user Id and can either automatically login, or the right password
     * credentials have been given, we can proceed to loading all information for this user.
     *
     * @param userId Id of the user for which they have to be identified.
     */
    private identifyPlayerForUserId(userId) {
        AccountDataRequest->createForPlayer(playerId, userId);
    }

    /**
     * After identifyPlayerForUserId() identifies the user and requests all important data from the
     * database, we'll want to mark the user as being registered and logged in. Other classes which
     * need access to this data will be invoked by the AccountDataRequest after this.
     */
    public onReceivedAccountData() {
        Player(playerId)->setIsLoggedIn(true);
        m_verified = true;

        Announcements->announcePlayerLoggedin(playerId);

        Instrumentation->recordActivity(PlayerLoginActivity);
        if (Player(playerId)->isVip())
            Instrumentation->recordActivity(PlayerVipLoginActivity);

        Annotation::ExpandList<OnPlayerLogin>(playerId);

        // Broadcast an OnPlayerLogin callback that can be intercepted by other scripts.
        CallRemoteFunction("OnPlayerLogin", "iii", playerId, m_userId, AccountData(playerId)->gangId());

        sprayTagLoadSprayedTags(playerId);
    }

    /**
     * If the player insists on playing, but does not own the account registered to the nickname
     * they are trying to play with, they have the option to enter Las Venturas Playground as a
     * guest. Their nickname will be changed, and they'll be treated as any unregistered player.
     */
    public changeNicknameAndPlayAsGuest() {
        new randomNickname[MAX_PLAYER_NAME+1]
           ,oldNickname[MAX_PLAYER_NAME+1];
        NicknameGenerator->generateForPlayerId(playerId, randomNickname, sizeof(randomNickname));

        // Instrument how many players decide to play as a guest.
        Instrumentation->recordActivity(PlayerLoginAsGuestActivity);

        oldNickname = Player(playerId)->nicknameString();
        Player(playerId)->setNickname(randomNickname);
        Player(playerId)->setIsRegistered(false);
        Player(playerId)->setIsLoggedIn(false);

        m_userId = 0;

        Announcements->announcePlayerGuestPlay(playerId, oldNickname);

        Annotation::ExpandList<OnPlayerGuestLogin>(playerId);

        // Broadcast an OnPlayerGuestLogin callback that can be intercepted by other scripts.
        CallRemoteFunction("OnPlayerGuestLogin", "i", playerId);
    }

    /**
     * Start a mod login request for this player. A login cannot be requested when the player is
     * already logged in to another account (they must be a guest), and a maximum of three mod-login
     * attempts can be made per session in order to avoid brute-forcing passwords.
     *
     * @param username The username the player is trying to mod-login with.
     * @param password The password that supposidly goes with this account.
     */
    public requestModLogin(username[], password[]) {
        if (UndercoverAdministrator(playerId)->undercoverLoginAttemptCount () >= Account::MaximumNumberOfLoginAttempts) {
            SendClientMessage(playerId, Color::Error, "You may no longer use this command due to too many failed attempts.");
            return;
        }

        // Instrument how often moderators and administrators log in to their account using another name.
        Instrumentation->recordActivity(PlayerLoginAsModeratorActivity);

        ModLoginRequest->createForPlayer(playerId, username, password);
    }

    /**
     * When an attempt to log in as a crew member has succeeded, this method will be called and
     * we'll set the player's level to be the level associated with the account.
     *
     * @param level The player level that should be applied to the player.
     */
    public onSuccessfulModLoginAttempt(PlayerAccessLevel: level, originalUsername[], originalUserId) {
        AccountData(playerId)->applyPlayerLevel(level);
        UndercoverAdministrator(playerId)->setIsUndercoverAdministrator(true);
        UndercoverAdministrator(playerId)->resetUndercoverLoginAttemptCount();
        UndercoverAdministrator(playerId)->setOriginalUsername(originalUsername);
        UndercoverAdministrator(playerId)->setOriginalUserId(originalUserId);

        SendClientMessage(playerId, Color::Information, "You have been granted the access level of your normal account.");

        new notice[128];
        format(notice, sizeof(notice), "%s (Id:%d) has logged in as %s (%s) using /modlogin.",
            Player(playerId)->nicknameString(), playerId, originalUsername,
            (level == ManagementLevel ? "manager" : "administrator"));
        Admin(playerId, notice);

        Annotation::ExpandList<OnPlayerModLogin>(playerId);

        // TODO(Russell): Should this broadcast an event similar to OnPlayerLogin as well?
    }

    /**
     * When an attempt to log in as a crew member failed, this method can be used to inform the
     * player of this. They could re-try, or simply ignore it.
     */
    public onFailedModLoginAttempt() {
        UndercoverAdministrator(playerId)->incrementUndercoverLoginAttemptCount();
        SendClientMessage(playerId, Color::Error, "We were unable to log you in as a member of the Staff because either");
        SendClientMessage(playerId, Color::Error, "your authentication data didn't match, or you're not an administrator.");
    }

    /**
     * Retrieve the user Id of the account that the player is currently playing with. This will 
     * return 0 if the player has not logged in.
     *
     * @return integer Id of the user account associated with this player.
     */
    public userId() {
        return m_verified == true ? m_userId : 0;
    }
};

forward OnPlayerLogin(playerid, userid, gangId);
public OnPlayerLogin(playerid, userid, gangId) {}

forward OnPlayerGuestLogin(playerid);
public OnPlayerGuestLogin(playerid) {}
