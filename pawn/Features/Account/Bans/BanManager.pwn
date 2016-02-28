// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * A callback used by the Ban Manager to receive information about whether a player is currently
 * banned. If this gets invoked by the MySQL plugin and has rows, then we know there's something fishy.
 *
 * @param resultId Id of the database result set containing the ban's information.
 * @param playerId Id of the player who we fired this request for.
 */
forward OnBanVerificationCompleted(resultId, playerId);
public OnBanVerificationCompleted(resultId, playerId) {
    BanManager->onVerificationComplete(playerId, resultId);
    DatabaseResult(resultId)->free();
}

/**
 * Kicks the player from the server after a delay set by the caller. This is necessary because of
 * another one of SA-MP's silly "security" features, which may mean that we end up not showing some
 * messages to the users.
 */
forward DelayedKick(playerId);
public DelayedKick(playerId) {
    Player(playerId)->onDisconnect(); // block all their input.
    Kick(playerId); // valid Kick() usage.
}

/**
 * Administrators have the ability to disallow a player to play on Las Venturas Playground for a
 * certain amount of time, which is known as being banned from the server. The Ban Manager will
 * verify whether a player is allowed to play on the server when they join it. Furthermore, it also
 * is the interface for adding log messages to a user's persistent profile data.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class BanManager {
    // If an administrator does not specify how long a ban should last for, what is the default
    // duration we should apply to the ban? Specify this in number of days.
    public const DefaultBanDuration = 3;

    // The query we use to verify whether a player can play on LVP.
    new m_verifyQuery;

    // The query used for creating a new entry in the logs table.
    new m_createEntryQuery;

    // Maintain a boolean indicating whether the player was banned automatically.
    new bool: m_automaticallyBanned[MAX_PLAYERS];

    /**
     * Create prepared statements for the queries which will be used for the Ban Manager when the
     * gamemode starts up. This saves us from doing the processing later on. Note that we don't
     * consider the nickname as a means of identifying a banned player at this time.
     */
    public __construct() {
        // Date format [%W, %M %D] = Thursday, August 8th
        // Date format [%W, %M %D at %h:%i %p] = Thursday, August 8th, at 01:25 AM
        m_verifyQuery = Database->prepare("SELECT " ...
                                          "    DATE_FORMAT(log_date, '%W, %M %D') AS ban_start_date, " ...
                                          "    DATE_FORMAT(ban_expiration_date, '%W, %M %D at %h:%i %p GMT') AS ban_end_date, " ...
                                          "    IF(ban_expiration_date = '0000-00-00 00:00:00', 0, 1) AS ban_has_end_date, " ...
                                          "    user_nickname, description " ...
                                          "FROM " ...
                                          "    logs " ...
                                          "WHERE " ...
                                          "    log_type = 'ban' AND " ...
                                          "    ban_expiration_date > NOW() AND " ...
                                          "    ((subject_user_id <> 0 AND subject_user_id = ?) OR " ...
                                          "     (ban_ip_range_start <= INET_ATON(?) AND ban_ip_range_end >= INET_ATON(?))) " ...
                                          "ORDER BY " ...
                                          "    log_date DESC " ...
                                          "LIMIT " ...
                                          "    1", "iss");

        // The query used for creating a new entry in the logs table.
        m_createEntryQuery = Database->prepare("INSERT INTO " ...
                                               "    logs " ...
                                               "    (log_date, log_type, ban_ip_range_start, ban_ip_range_end, ban_expiration_date, user_nickname, user_id, subject_nickname, subject_user_id, description) " ...
                                               "VALUES " ...
                                               "    (NOW(), ?, INET_ATON(?), INET_ATON(?), FROM_UNIXTIME(?), ?, ?, ?, ?, ?)", "sssisisis");
    }

    /**
     * Marks the player as not having been automatically banned when they connect to the server. If
     * we don't do this, then their leaving won't be announced properly.
     *
     * @param playerId Id of the player who has left Las Venturas Playground.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect(playerId) {
        m_automaticallyBanned[playerId] = false;
    }

    /**
     * Verify whether the player is allowed to play on Las Venturas Playground after their account
     * information is available. This is necessary because we also have the ability to ban players
     * based on their user Id. This method won't be called for non-player characters.
     *
     * @param playerId Id of the player to verify for whether they are allowed to play.
     * @param userId Id of the player's user account, or 0 if they're unregistered.
     */
    public verifyPlayerAllowedToPlay(playerId, userId) {
        new ipAddress[16];
        format(ipAddress, sizeof(ipAddress), Player(playerId)->ipAddressString());

        Database->execute(m_verifyQuery, "OnBanVerificationCompleted", playerId, userId, ipAddress, ipAddress);
    }

    /**
     * This method will be fired when we received information about whether a player has an active,
     * meaning they are not permitted to play on Las Venturas Playground at this time. Tell them,
     * and make sure we remove them from the server in due time. If the result set has no rows at
     * all, then the player is *not* banned from the server.
     *
     * @param playerId Id of the player who we fired this request for.
     * @param resultId Id of the database result set containing the ban's information.
     */
    public onVerificationComplete(playerId, resultId) {
        if (Player(playerId)->isConnected() == false)
            return; // the player doesn't seem to be connected anymore.

        if (DatabaseResult(resultId)->count() != 1 || !DatabaseResult(resultId)->next()) {
            Announcements->announcePlayerConnected(playerId);
            return; // we couldn't fetch useful information from the database.
        }

        new message[128], administratorNickname[24], buffer[64];
        DatabaseResult(resultId)->readString("user_nickname", administratorNickname);
        if (strlen(administratorNickname) == 0)
            format(administratorNickname, sizeof(administratorNickname), "an administrator");

        SendClientMessage(playerId, Color::Error, "You are currently banned on Las Venturas Playground.");

        DatabaseResult(resultId)->readString("ban_start_date", buffer);
        format(message, sizeof(message), "You were banned by {33CCFF}%s{FFFFFF} on {33CCFF}%s{FFFFFF}. The reason",
            administratorNickname, buffer);
        SendClientMessage(playerId, Color::Information, message);

        DatabaseResult(resultId)->readString("description", buffer);
        format(message, sizeof(message), "as was given by the administrator is: {33CCFF}%s", buffer);
        SendClientMessage(playerId, Color::Information, message);

        new bool: automaticallyExpires = DatabaseResult(resultId)->readInteger("ban_has_end_date") == 1;
        if (automaticallyExpires == true) {
            // We have a date at which the ban will automatically expire, so inform the player of
            // this date. It's been appropriately formatted already as part of the MySQL query.
            DatabaseResult(resultId)->readString("ban_end_date", buffer);
            format(message, sizeof(message), "Your ban is set to expire on {33CCFF}%s{FFFFFF}.", buffer);
            SendClientMessage(playerId, Color::Information, message);
        }

        SendClientMessage(playerId, Color::Information, ""); // spacing.
        SendClientMessage(playerId, Color::Information, "You may appeal this ban on our forums (http://forum.sa-mp.nl) or on our IRC channel,");
        SendClientMessage(playerId, Color::Information, "available through http://www.sa-mp.nl/irc.html");

        m_automaticallyBanned[playerId] = true;

        // The Player class has the functionality required to actually kick this player.
        Player(playerId)->scheduleKick();
    }

    /**
     * Creates a new entry in the database's "logs" table with the details as specified. This method
     * is not meant to be called directly from other systems -- they should be using the recordBan,
     * recordKick and recordLog methods instead.
     *
     * @param type The type of log to record, should be one of {ban, kick, log}.
     * @param administratorId Id of the administrator who's creating this database entry.
     * @param playerId Id of the player who this database entry is about.
     * @param description Description of the entry, why is it being created?
     * @param banIpAddress IP address in case this entry is a ban (optional).
     * @param banExpirationTime UNIX timestamp at which the ban should expire (optional).
     */
    private createDatabaseEntry(type[], administratorId, playerId, description[], banIpAddress[] = "0", banExpirationTime = 0) {
        new administratorNickname[24] = "LVP", administratorUserId;
        if (administratorId != Player::InvalidId && Player(administratorId)->isConnected() == true) {
            if (UndercoverAdministrator(administratorId)->isUndercoverAdministrator() == false) {
                GetPlayerName(administratorId, administratorNickname, sizeof(administratorNickname));
                administratorUserId = Account(administratorId)->userId();
            } else {
                UndercoverAdministrator(administratorId)->getOriginalUsername(administratorNickname, sizeof(administratorNickname));
                administratorUserId = UndercoverAdministrator(administratorId)->getOriginalUserId();
            }
        }

        new playerNickname[24], playerUserId;
        if (playerId == Player::InvalidId || Player(playerId)->isConnected() == false)
            return; // logs must be tied to a player.

        GetPlayerName(playerId, playerNickname, sizeof(playerNickname));
        playerUserId = Account(playerId)->userId();

        if (banExpirationTime == 0)
            banExpirationTime = Time->currentTime();

        // m_createEntryQuery parameters: log_type (s), ban_ip_range_start (s), ban_ip_range_end (s),
        // ban_expiration_date (s), user_nickname (s), user_id (i), subject_nickname (s), subject_id (i), description (s)
        Database->execute(m_createEntryQuery, "", -1, type, banIpAddress, banIpAddress, banExpirationTime, \
            administratorNickname, administratorUserId, playerNickname, playerUserId, description);
    }

    /**
     * Records a kick entry in the database for the given player. Kicks may be automated by features
     * so the administratorId field may be set to Player::InvalidId, but the playerId id required.
     *
     * @param playerId Id of the player who to record a kick for.
     * @param administratorId Id of the administrator, if any, who initiated the kick.
     * @param reason The reason for which the player is being kicked.
     */
    public recordKickEntry(playerId, administratorId, reason[]) {
        new banIpAddress[16];
        format(banIpAddress, sizeof(banIpAddress), Player(playerId)->ipAddressString());

        this->createDatabaseEntry("kick", administratorId, playerId, reason, banIpAddress);
    }

    /**
     * Records a ban entry for the given player. The player argument is the one being banned, the
     * administratorId argument the admin who banned them (or Player::InvalidId in case the ban was
     * automated) and the reason a description of *why* they are being banned. The duration parameter
     * is optional, but can be used to have this ban automatically expire.
     *
     * @param playerId Id of the player who has been banned from Las Venturas Playground.
     * @param administratorId Id of the administrator, if any, who banned the player.
     * @param reason The reason as to why the player is being banned.
     * @param duration The duration of the ban in number of seconds.
     */
    public recordBanEntry(playerId, administratorId, reason[], duration) {
        if (administratorId != Player::InvalidId && Player(playerId)->isConnected() == false)
            return; // the player in question isn't connected to the server.

        new banIpAddress[16], expirationTime = Time->currentTime() + duration;
        format(banIpAddress, sizeof(banIpAddress), Player(playerId)->ipAddressString());

        this->createDatabaseEntry("ban", administratorId, playerId, reason, banIpAddress, expirationTime);
    }

    /**
     * Returns a boolean indicating whether this player has been automatically banned by the Ban
     * Manager. If so, we may not want to display an announcement for their leaving.
     *
     * @param playerId Id of the player to check this for.
     */
    public bool: wasAutomaticallyBanned(playerId) {
        return (m_automaticallyBanned[playerId]);
    }
};
