// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * The Player class will encapsulate various bits of information about the player's current state.
 * This is unrelated to their account, statistics or stored data, and thus should be looked at as
 * a place to store flags, state and lower level connection information.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class Player <playerId (MAX_PLAYERS)> {
    // The Id that will be used as return values when no player could be selected.
    public const InvalidId = INVALID_PLAYER_ID;

    // How many hours does a player need to have been in-game before they're considered a regular?
    public const RegularHours = 50;

    // ---- MEMBER VARIABLES FOR EACH PLAYER -------------------------------------------------------

    // What are the flags that apply to the current player?
    new m_flags;

    // What kind of access does this player have?
    new PlayerAccessLevel: m_level;

    // Store their nickname in a string, as we could be needing this a lot.
    new m_nickname[MAX_PLAYER_NAME+1];

    // When did this player connect to the server? Useful for measuring in-game time.
    new m_connectionTime;

    // What's the IP address the player connected with? We save this becaue of a SA:MP bug which
    // occurs when GetPlayerIp is called OnPlayerDisconnect.
    new m_ipAddress[16];

    // ---- PRIVATE INLINE CONVENIENCE METHODS -----------------------------------------------------

    // Convenience method to enable a flag on the player.
    private inline enableFlag(PlayerFlags: flag) {
        Cell->setBitValue(m_flags, flag, 1);
    }

    // Public version of enableFlag(). ONLY TO BE USED FOR TESTING.
    public inline enableFlagForTests(PlayerFlags: flag) {
        Cell->setBitValue(m_flags, flag, 1);
    }

    // Convenience method to disable a flag on the player.
    private inline disableFlag(PlayerFlags: flag) {
        Cell->setBitValue(m_flags, flag, 0);
    }

    // Public version of disableFlag(). ONLY TO BE USED FOR TESTING.
    public inline disableFlagForTests(PlayerFlags: flag) {
        Cell->setBitValue(m_flags, flag, 0);
    }

    // Convenience method to toggle a flag on the player.
    private inline toggleFlag(PlayerFlags: flag, enabled) {
        Cell->setBitValue(m_flags, flag, enabled);
    }

    // Public version of toggleFlag(). ONLY TO BE USED FOR TESTING.
    public inline toggleFlagForTests(PlayerFlags: flag, enabled) {
        Cell->setBitValue(m_flags, flag, enabled);
    }

    // Convenience method to determine whether a flag has been enabled.
    private inline hasFlag(PlayerFlags: flag) {
        return (Cell->getBitValue(m_flags, flag) == 1);
    }

    // ---- EVENT HANDLERS -------------------------------------------------------------------------

    /**
     * Called right after the player connects. We'll mark them as being connected and check whether
     * they're a Non Player Character, and if so, flag them as such too.
     */
    public onConnect() {
        m_flags = 0;
        m_level = PlayerLevel;
        m_connectionTime = Time->currentTime();

        this->enableFlag(IsConnectedPlayerFlag);
        if (IsPlayerNPC(playerId))
            this->enableFlag(IsNonPlayerCharacterFlag);

        PlayerState(playerId)->updateState(NormalPlayerState);
        PlayerActivity(playerId)->silentSet(PlayerActivityNone);

        GetPlayerName(playerId, m_nickname, sizeof(m_nickname));
        GetPlayerIp(playerId, m_ipAddress, sizeof(m_ipAddress));

        PlayerSyncedData(playerId)->reset();
    }

    /**
     * Because of a bug in San Andreas: Multiplayer, it's possible that IsPlayerNPC return true
     * when checking in OnPlayerConnect for connections to a local server. This will be corrected
     * later on, so we verify this status in the OnPlayerRequestClass callback.
     */
    public verifyNonPlayerCharacter() {
        if (this->hasFlag(IsNonPlayerCharacterFlag) && IsPlayerNPC(playerId) == 0) {
            this->disableFlag(IsNonPlayerCharacterFlag);

            Annotation::ExpandList<OnIndentifiedHuman>(playerId);
        }
    }

    /**
     * Called as the last method when a player disconnects. This is where we'll reset their entire
     * state, to make sure that the rest of the gamemode is aware of this.
     */
    public onDisconnect() {
        printf("Pawn PRC: %s", PlayerSyncedData(playerId)->preferredRadioChannel());

        m_flags = 0;
        m_level = PlayerLevel;
        m_nickname[0] = 0;
        m_connectionTime = 0;
        m_ipAddress[0] = 0;

        PlayerState(playerId)->updateState(DisconnectedPlayerState);
        PlayerSyncedData(playerId)->reset();
    }

    // ---- FUNCTIONAL METHODS ---------------------------------------------------------------------

    /**
     * Bans a player from Las Venturas Playground with a given reason, and optionally the Id of the
     * administrator who banned them and the duration of the ban in seconds. The player will not be
     * able to join the server until the ban has been lifted.
     *
     * @param reason The reason for this ban, limited to 128 characters of text.
     * @param administratorId Id of the administrator who banned the player (optional).
     * @param duration Duration of the ban, given in days (optional).
     */
    public ban(reason[], administratorId = Player::InvalidId, duration = 3) {
        BanManager->recordBanEntry(playerId, administratorId, reason, duration * 86400);

        new administratorNickname[24] = "an administrator";
        if (Player(administratorId)->isConnected() && UndercoverAdministrator(administratorId)->isUndercoverAdministrator() == false)
            GetPlayerName(administratorId, administratorNickname, sizeof(administratorNickname));

        for (new row = 1; row <= 20; row++)
            SendClientMessage(playerId, 0, "\n");

        SendClientMessage(playerId, Color::Warning, "You have been banned from Las Venturas Playground!");

        new message[128];
        format(message, sizeof(message), "You were banned by {33CCFF}%s{FFFFFF} for the following reason:", administratorNickname);
        SendClientMessage(playerId, Color::Information, message);
        SendClientMessage(playerId, Color::GangChat, reason);

        SendClientMessage(playerId, Color::Information, ""); // spacing.

        format(message, sizeof(message), "For a duration of: {33CCFF}%d days{FFFFFF}.", duration);
        SendClientMessage(playerId, Color::Information, message);

        // TODO: Do date magic to show an accurate unban date & time.

        SendClientMessage(playerId, Color::Information, ""); // spacing.

        SendClientMessage(playerId, Color::Information, "You may appeal this ban on our forums (http://forum.sa-mp.nl) or on our IRC channel,");
        SendClientMessage(playerId, Color::Information, "available through www.sa-mp.nl/chat");

        // Schedule for the player to be kicked from the server.
        this->scheduleKick();
    }

    /**
     * Kicks a player from the server. The player will be kicked from the server immediately, but
     * will have the ability to immediately rejoin as well.
     *
     * @param reason The reason why this player is being kicked, limited to 128 characters of text.
     * @param administratorId Id of the administrator who kicked the player (optional).
     */
    public kick(reason[], administratorId = Player::InvalidId) {
        BanManager->recordKickEntry(playerId, administratorId, reason);

        new administratorNickname[24] = "an administrator";
        if (Player(administratorId)->isConnected() && UndercoverAdministrator(administratorId)->isUndercoverAdministrator() == false)
            GetPlayerName(administratorId, administratorNickname, sizeof(administratorNickname));

        SendClientMessage(playerId, Color::Error, "You have been kicked from Las Venturas Playground.");
        new message[128];
        format(message, sizeof(message), "You were kicked by {33CCFF}%s{FFFFFF} for the following reason:", administratorNickname);
        SendClientMessage(playerId, Color::Information, message);
        SendClientMessage(playerId, Color::GangChat, reason);

        // Schedule for the player to be kicked from the server.
        this->scheduleKick();
    }

    /**
     * Because we usually show a message before actually kicking the player, we need to schedule
     * their kick about a second in the future. This is due to a SA-MP bug which immediately closes
     * the server-sided connection when the Kick() method get called, even if there still are
     * other, in-flight undelivered messages.
     */
    public scheduleKick() {
        TogglePlayerControllable(playerId, false);
        ShowPlayerDialog(playerId, -1, 0, "", "", "", ""); // close all open dialogs.

        SetTimerEx("DelayedKick", 750, 0, "i", playerId);
    }

    // ---- GETTERS FOR NORMAL DATA MEMBERS --------------------------------------------------------

    /**
     * Retrieve the nickname of this player by making a copy of it to the buffer, with a maximum of
     * bufferSize characters (should be sizeof(buffer)).
     *
     * @param buffer Buffer to store this player's nickname in.
     * @param bufferSize Maximum number of characters to store the name in.
     */
    public nickname(buffer[], bufferSize) {
        memcpy(buffer, m_nickname, 0, strlen(m_nickname) * 4, bufferSize);
        buffer[min(strlen(m_nickname), bufferSize - 1)] = 0;
    }

    /**
     * Retrieve the nickname of this player as a string for direct usage. This should strictly be
     * used for reading. If there's any chance you'll be editing this value, use nickname()!
     *
     * @return string String buffer containing the player's nickname.
     */
    public inline nicknameString() {
        return m_nickname;
    }

    /**
     * Retrieve the level of this player. There are four major levels, each of which comes with
     * additional commands and possibilities. Higher levels may also imply exceptions on limits.
     *
     * @return PlayerLevel The authorization level the player has.
     */
    public inline PlayerAccessLevel: level() {
        return m_level;
    }

    /**
     * Returns whether this player is a regular player on Las Venturas Playground, which will be
     * decided by the amount of hours they've spent on the server.
     *
     * @return boolean Is this player a regular on the server?
     */
    public inline bool: isRegular() {
        return (GetPlayerIngameHours(playerId) >= Player::RegularHours);
    }

    /**
     * Returns a unix timestamp with the time when this player connected to Las Venturas Playground.
     * This can be used to determine how long they have been in game.
     *
     * @return integer Time when the player connected to the server.
     */
    public inline connectionTime() {
        return (m_connectionTime);
    }

    /**
     * Retrieve the Ip address of this player as a string for direct usage. This should strictly be
     * used for reading.
     *
     * @return string String buffer containing the player's Ip address.
     */
    public inline ipAddressString() {
        return m_ipAddress;
    }

    // ---- SETTERS FOR NORMAL DATA MEMBERS --------------------------------------------------------

    /**
     * Change the player's nickname to the given value. This will also adjust the internal buffers,
     * making sure that player search features will continue to work correctly.
     *
     * @param nickname The new nickname this player should have.
     * @return boolean Were we able to change this player's nickname?
     */
    public bool: setNickname(nickname[]) {
        if (SetPlayerName(playerId, nickname) == 0)
            return false;

        GetPlayerName(playerId, m_nickname, sizeof(m_nickname));
        return true;
    }

    /**
     * Change the player's level with the one as indicated. This should generally only be set by the
     * Account system, but can also be used for temporary administrators.
     *
     * Mutations to a player's levle will be broadcasted to JavaScript as well.
     *
     * @param level The level this player should be updated to.
     */
    public setLevel(PlayerAccessLevel: level) {
        CallRemoteFunction("OnPlayerLevelChange", "ii", playerId, _: level);
        m_level = level;
    }

    // ---- GETTERS FOR IMMUTABLE FLAGS ------------------------------------------------------------

    /**
     * Is this player connected to Las Venturas Playground? Prefer this over IsPlayerConnected, as
     * it's significantly faster. Additional bound checking may be added later.
     *
     * @todo Fix the PreCompiler to properly insert playerId when inlining this.
     * @return boolean Is this player connected to Las Venturas Playground?
     */
    public bool: isConnected() {
        return playerId >= 0 && playerId < MAX_PLAYERS && this->hasFlag(IsConnectedPlayerFlag);
    }

    /**
     * Returns whether this player is a Non Player Character. Most features should be unavailable to
     * them, and events should be forwarded to the NonPlayerCharacterManager.
     *
     * @todo Fix the PreCompiler to properly insert playerId when inlining this.
     * @return boolean Is this player a Non Player Character (NPC)?
     */
    public bool: isNonPlayerCharacter() {
        return this->hasFlag(IsNonPlayerCharacterFlag);
    }

    // ---- GETTERS FOR MUTABLE FLAGS --------------------------------------------------------------

    /**
     * Determine whether the player is using a nickname that has been registered on Las Venturas
     * Playground. This is required for certain features.
     *
     * @return boolean Is the player using a nickname that has been registered?
     */
    public bool: isRegistered() {
        return this->hasFlag(IsRegisteredFlag);
    }

    /**
     * Before registered players are allowed to play on the server, they have to identify themselves
     * by entering their password. This method returns whether they've done so.
     *
     * @return boolean Has the player logged in to an account registered on Las Venturas Playground?
     */
    public bool: isLoggedIn() {
        return this->hasFlag(IsLoggedInFlag);
    }

    /**
     * Returns whether the player is in dynamic (skin choosing) or fixed (single-skin) class
     * selection. Other functionality will be unavailable when this is the case.
     *
     * @return boolean Is the player currently in class selection?
     */
    public bool: isInClassSelection() {
        return this->hasFlag(InClassSelectionFlag);
    }

    /**
     * Developers can get access to certain bits of diagnostic information that others don't need
     * access to. As such, it's important that we can identify them.
     *
     * @return boolean Is this player a Developer of LVP?
     */
    public bool: isDeveloper() {
        return this->hasFlag(IsDeveloperFlag);
    }

    /**
     * Returns whether this player is a Very Important Player, which implies that they've donated to
     * Las Venturas Playground and thereby have access to a number of extra features.
     *
     * @return boolean Is this player a VIP member?
     */
    public bool: isVip() {
        return this->hasFlag(IsVeryImportantPlayer);
    }

    /**
     * Returns whether this player has administrator rights on Las Venturas Playground.
     *
     * @return boolean Is this player an Administrator on the server?
     */
    public inline bool: isAdministrator() {
        return (m_level >= AdministratorLevel);
    }

    /**
     * Returns whether this player is a Management Member of Las Venturas Playground.
     *
     * @return boolean Is this player a Management member?
     */
    public inline bool: isManagement() {
        return (m_level == ManagementLevel);
    }

    // ---- SETTERS FOR MUTABLE FLAGS --------------------------------------------------------------

    /**
     * Set whether the player is using a nickname that has been registered on Las Venturas
     * Playground. This flag should only be set by the Account classes.
     *
     * @param registered Has an account been found associated with the player's nickname?
     */
    public setIsRegistered(bool: registered) {
        this->toggleFlag(IsRegisteredFlag, registered);
    }

    /**
     * Set whether the player has logged in to any account. Usually this will be the account which
     * is associated with the nickname they joined with, but administrators could log in to other
     * accounts as well. Only the Account classes should update this value.
     *
     * @param loggedIn Has the player logged in to an Account found in the database?
     */
    public setIsLoggedIn(bool: loggedIn) {
        this->toggleFlag(IsLoggedInFlag, loggedIn);
    }

    /**
     * Set whether the player is currently in class selection. This also includes the concept of
     * a "fixed" class selection, which occurs when we already know the skin they want to play with.
     * This property should only be updated by the Spawn Manager.
     *
     * @param inClassSelection Is the player currently viewing class selection?
     */
    public setIsInClassSelection(bool: inClassSelection) {
        this->toggleFlag(InClassSelectionFlag, inClassSelection);
    }

    /**
     * Update whether this player is a Very Important Player. The method is declared as private as
     * there is only one place where we allow usage of this: the Account classes.
     *
     * @param vip Is this player a VIP member?
     */
    public setIsVip(bool: vip) {
        this->toggleFlag(IsVeryImportantPlayer, vip);
    }

    /**
     * Set whether this player is a developer of Las Venturas Playground. This will enable them to
     * access certain kinds of diagnostic information other's don't need to access.
     *
     * @param developer Is this player a developer of LVP?
     */
    public setIsDeveloper(bool: developer) {
        this->toggleFlag(IsDeveloperFlag, developer);
    }
};

forward LVP_IsPlayerAdmin(playerId);
forward LVP_BanPlayer(playerId, reason[]);

/**
 * Publicly exposed API for checking the admin access level of a player.
 *
 * @param playerId Id of the player to check the admin access level for.
 * @param boolean Is the player an admin?
 */
public LVP_IsPlayerAdmin(playerId) {
    if (Player(playerId)->isConnected() == false || Player(playerId)->isNonPlayerCharacter() == true)
        return 0;

    return _: Player(playerId)->isAdministrator();
}

/**
 * Publicly exposed API for banning a player, useful for filterscripts.
 *
 * @param playerId Id of the player who is to be banned.
 */
public LVP_BanPlayer(playerId, reason[]) {
    if (Player(playerId)->isConnected() == false || Player(playerId)->isNonPlayerCharacter() == true
        || Player(playerId)->isAdministrator() == true)
        return 0;

    Player(playerId)->ban(reason);
    return 1;
}

forward OnPlayerLevelChange(playerid, newlevel);
public OnPlayerLevelChange(playerid, newlevel) {}

// Include the test-suite for the Player class.
#include "Entities/Players/Player.tests.pwn"
