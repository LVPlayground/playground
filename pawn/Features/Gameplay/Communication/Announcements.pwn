// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * An enumeration containing the different kinds of announcements we can make about players to the
 * other players. Players have the ability to disable each of these messages as part of their profile.
 */
enum AnnouncementType {
    // Announcements about players connecting and disconnecting from the server.
    ConnectionMessageAnnouncement,

    // Announcements about minigames which can be signed up for.
    MinigameSignupAnnouncement,

    // Announcement about a new Property Tycoon having risen.
    PropertyTycoonAnnouncement,
};

/**
 * Several common in-game announcements are grouped in this file so that we can unify the required
 * processing for showing them. Each of these announcements can be disabled by the player, which
 * they can do by modifying their message level.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class Announcements {
    // A class-global buffer in which we can format messages.
    new m_formatBuffer[256];

    /**
     * Determines whether an announcement of a certain type should be shown to a certain player. It
     * checks the message level settings as set in the player's profile.
     *
     * @param announcementType The type of announcement which is being made.
     * @param playerId The player Id to retrieve visibility settings for.
     * @return boolean Whether this announcement should be shown to the player.
     */
    private inline bool: shouldShowAnnouncementTypeToPlayer(AnnouncementType: announcementType, playerId) {
        return (true);
    }

    /**
     * Distributes an announcement of a certain type to all the players who have chosen to retrieve it.
     *
     * @param type The type of message which is being announced.
     * @param color The color in which the message should show up.
     * @param message The message itself which is being distributed.
     * @param excludePlayerId Is there any player who should be excluded from this announcement?
     */
    private distributeAnnouncement(AnnouncementType: type, color, message[], excludePlayerId = Player::InvalidId) {
        for (new playerId = 0; playerId <= PlayerManager->highestPlayerId(); ++playerId) {
            if (Player(playerId)->isConnected() == false)
                continue; // the player is not connected to LVP.

            if (Player(playerId)->isNonPlayerCharacter() == true)
                continue; // the player is a NPC.

            if (excludePlayerId == playerId)
                continue; // this player should be excluded from the announcement.

            if (this->shouldShowAnnouncementTypeToPlayer(type, playerId) == false)
                continue; // the player doesn't want to see this message.

            SendClientMessage(playerId, color, message);
        }

        // TODO(Russell): Remove once shouldShowAnnouncementTypeToPlayer() is implemented.
        #pragma unused type
    }

    /**
     * Announces that a player has connected to Las Venturas Playground.
     *
     * @param playerId Id of the player who connected to the server.
     */
    public announcePlayerConnected(playerId) {
        // Announce this player's connection to other in-game players.
        format(m_formatBuffer, sizeof(m_formatBuffer), "* %s (Id:%d) has joined {A9C4E4}Las Venturas Playground{CCCCCC}.",
            Player(playerId)->nicknameString(), playerId);

        this->distributeAnnouncement(ConnectionMessageAnnouncement, Color::ConnectionMessage, m_formatBuffer);

        // Announce this player's connection to people watching from IRC.
        format(m_formatBuffer, sizeof(m_formatBuffer), "%d %s", playerId, Player(playerId)->nicknameString());
        IRC->broadcast(JoinIrcMessage, m_formatBuffer);

        // Announce the connection of this player to Management members on IRC, including their
        // ID, nickname and their IP address. This is useful in case of flooders.
        new connectionMessage[128];
        format(connectionMessage, sizeof(connectionMessage), "%d %s %s", playerId,
            Player(playerId)->ipAddressString(), Player(playerId)->nicknameString());
        IRC->broadcast(JoinIpIrcMessage, connectionMessage);
    }

    /**
     * Announces that a player has left Las Venturas Playground, including the reason. If the reason
     * is that the player was banned, this won't be invoked for BanManager-created bans.
     *
     * @param playerId Id of the player who has disconnected from the server.
     * @param reason The reason why they're disconnecting from the server.
     */
    public announcePlayerDisconnected(playerId, reason) {
        // Since the player's nickname in the Player class is already emptied before this is executed,
        // we grab the name with help of the GetPlayerName native.
        new playerName[MAX_PLAYER_NAME+1];
        GetPlayerName(playerId, playerName, sizeof(playerName));

        switch (reason) {
            case 0 /** timed out **/:
                format(m_formatBuffer, sizeof(m_formatBuffer), "* %s (Id:%d) has left {A9C4E4}Las Venturas Playground{CCCCCC} (timed out).",
                    Player(playerId)->nicknameString(), playerId);

            case 2 /** kicked or banned **/:
                format(m_formatBuffer, sizeof(m_formatBuffer), "* %s (Id:%d) has left {A9C4E4}Las Venturas Playground{CCCCCC} (kicked).",
                    playerName, playerId);

            default:
                format(m_formatBuffer, sizeof(m_formatBuffer), "* %s (Id:%d) has left {A9C4E4}Las Venturas Playground{CCCCCC}.",
                    Player(playerId)->nicknameString(), playerId);
        }

        this->distributeAnnouncement(ConnectionMessageAnnouncement, Color::ConnectionMessage, m_formatBuffer);

        // Announce this player's disconnection to people watching from IRC.
        format(m_formatBuffer, sizeof(m_formatBuffer), "%d %s %d", playerId, playerName, reason);
        IRC->broadcast(LeaveIrcMessage, m_formatBuffer);
    }

    /**
     * Announces that a minigame is about to start, and is now open for sign-ups from other players.
     * Beyond the minigame's name, we also include the command to type, and the amount of money
     * required in order to sign up.
     *
     * @param type The type of minigame that's being started, to further specialize the message.
     * @param name Name of the minigame which signups have been opened for.
     * @param command Command which players should type in order to participate.
     * @param price The amount of money a player has to pay in order to participate.
     * @param excludePlayerId Is there any player who should be excluded from this announcement?
     */
    public announceMinigameSignup(MinigameType: type, name[], command[], price, excludePlayerId = Player::InvalidId) {
        new colorBuffer[2][Color::TextualColorLength], typeString[12];
        Color->toString(Color::MinigameAnnouncement, colorBuffer[0], sizeof(colorBuffer[]));
        Color->toString(Color::MinigameAnnouncementHighlight, colorBuffer[1], sizeof(colorBuffer[]));

        MinigameTypeToString(type, typeString, sizeof(typeString));

        format(m_formatBuffer, sizeof(m_formatBuffer), "Sign up for the {%s}%s %s{%s}! Type {%s}%s{%s} to join ($%s).",
            colorBuffer[1], name, typeString, colorBuffer[0], colorBuffer[1], command, colorBuffer[0], formatPrice(price));

        this->distributeAnnouncement(MinigameSignupAnnouncement, Color::MinigameAnnouncement, m_formatBuffer, excludePlayerId);
    }

    /**
     * Announces that |playerId| is now the property tycoon, earning |earnings| every payment cycle.
     *
     * @param playerId Id of the player who is the property tycoon.
     * @param earnings Amount of money they receive every payment cycle.
     */
    public announcePropertyTycoon(playerId, earnings) {
        format(m_formatBuffer, sizeof(m_formatBuffer), "* %s (Id:%d) is the Property Tycoon, earning $%s every 3 minutes!",
            Player(playerId)->nicknameString(), playerId, formatPrice(earnings));

        this->distributeAnnouncement(PropertyTycoonAnnouncement, Color::PropertyTycoonAnnouncement, m_formatBuffer, Player::InvalidId);
    }
};
