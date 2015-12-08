// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Administrators can join the game with another name and then login by a command as an undercover
 * administrator. On that way they can keep an eye in-game while the users think that there is no
 * crew online and think that they can do everything.
 * 
 * Since there is more data need to be saved when an administrator logs in undercover in this class
 * we save extra data besides the normal Account-data. 
 *
 * @author Xander "Xanland" Hoogland <home@xanland.nl>
 */
class UndercoverAdministrator <playerId (MAX_PLAYERS)> {
    // How many times has the user tried to login as an administrator using /modlogin?
    new m_undercoverLoginAttemptCount;

    // Is the player secretly logged in to an administrator account?
    new bool: m_undercoverAdministrator;

    // The name of the player used in the modlogin-command
    new m_originalUsername[MAX_PLAYER_NAME+1];

    // The userId of the undercover administrator.
    new m_userId;

    /**
     * Getter to look how many times an user already attempted to login as undercover administrator.
     *
     * @return integer Amount of attempts to login.
     */
    public inline undercoverLoginAttemptCount() {
        return (m_undercoverLoginAttemptCount);
    }

    /**
     * After a player has connected to the server, we'll want to know whether they're registered and
     * should be logged in automatically. Several settings will be loaded and prepared afterwards.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect() {
        m_undercoverLoginAttemptCount = 0;
        m_undercoverAdministrator = false;
        m_userId = 0;
    }

    /**
     * When an user tries to login as undercover administrator we should be able to increase the
     * amount of attempts with 1.
     */
    public incrementUndercoverLoginAttemptCount() {
        ++m_undercoverLoginAttemptCount;
    }

    /**
     * When a new user joins or an undercover administrator logs out we have to reset the amount
     * of attempts for that playerId.
     */
    public resetUndercoverLoginAttemptCount() {
        m_undercoverLoginAttemptCount = 0;
    }

    /**
     * Check whether the player is logged in using the /modlogin command. If so, they can't use the
     * command again, and won't be included in overviews such as /admins.
     *
     * @return boolean Is this player secretly an administrator?
     */
    public bool: isUndercoverAdministrator() {
        return (m_undercoverAdministrator);
    }

    /**
     * Setter to identify the specific player if he/she is an undercover administrator.
     *
     * @param isUndercoverAdministrator Can the player be recognized as undercover administrator?
     */
    public setIsUndercoverAdministrator(bool: isUndercoverAdministrator) {
        m_undercoverAdministrator = isUndercoverAdministrator;
    }

    /**
     * At a successfull login we save the original username used to login with.
     *
     * @return integer Length of the username of the undercover administrator.
     */
    public getOriginalUsername(buffer[], bufferSize) {
        format(buffer, bufferSize, "%s", m_originalUsername);
        return strlen(m_originalUsername);
    }

    /**
     * At a successfull login we need to save the original username of the user used in the command.
     * With this setter we can set it to the given value.
     *
     * @param originalUsername Original username of the administrator.
     */
    public setOriginalUsername(originalUsername[]) {
        format(m_originalUsername, sizeof(m_originalUsername), "%s", originalUsername);
    }

    /**
     * Retrieve the original userId hooked to the admin's account.
     *
     * @return integer UserId of the undercover administrator.
     */
    public inline getOriginalUserId() {
        return (m_userId);
    }

    /**
     * Save the original userId hooked to the admin's account.
     *
     * @param originalUserId Original userId of the administrator.
     */
    public inline setOriginalUserId(originalUserId) {
        m_userId = originalUserId;
    }
};
