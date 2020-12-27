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
        new bool: sampcac = false;

        // Announce this player's connection to other in-game players.
#if Feature::EnableSAMPCAC == 1
        if (CAC_GetStatus(playerId)) {
            sampcac = true;

            format(m_formatBuffer, sizeof(m_formatBuffer), "* %s (Id:%d) has joined {A9C4E4}Las Venturas Playground {A5D6A7}(sampcac){CCCCCC}.",
                Player(playerId)->nicknameString(), playerId);
        } else {
            new version[16];
            GetPlayerVersion(playerId, version, sizeof(version));

            format(m_formatBuffer, sizeof(m_formatBuffer), "* %s (Id:%d) has joined {A9C4E4}Las Venturas Playground{CCCCCC}.",
                Player(playerId)->nicknameString(), playerId);

            // Inform the |playerId| of running an outdated version of SA-MP if they are.
            if (strlen(version) >= 1 && strcmp(version, "0.3.7-R4", true, 8) != 0) {
                SendClientMessage(
                    playerId, Color::Error,
                    "*** You are running an old version of SA-MP, consider updating to the latest version!");
            }
        }
#else
        format(m_formatBuffer, sizeof(m_formatBuffer), "* %s (Id:%d) has joined {A9C4E4}Las Venturas Playground{CCCCCC}.",
            Player(playerId)->nicknameString(), playerId);
#endif

        this->distributeAnnouncement(ConnectionMessageAnnouncement, Color::ConnectionMessage, m_formatBuffer);

        // Announce this player's connection to people watching from IRC.
        format(m_formatBuffer, sizeof(m_formatBuffer), "%d %s", playerId, Player(playerId)->nicknameString());
        if (sampcac)
            EchoMessage("join-sampcac", "ds", m_formatBuffer);
        else
            EchoMessage("join", "ds", m_formatBuffer);
    }

    /**
     * Announces that a player has logged in to Las Venturas Playground.
     *
     * @param playerId Id of the player who logged in.
     */
    public announcePlayerLoggedin(playerId) {
        // Announce that the player logged in
        format(m_formatBuffer, sizeof(m_formatBuffer), "* %s (Id:%d) has logged in to {A9C4E4}Las Venturas Playground{CCCCCC}.",
            Player(playerId)->nicknameString(), playerId);

        this->distributeAnnouncement(ConnectionMessageAnnouncement, Color::ConnectionMessage, m_formatBuffer);

        // Announce the login of the player to the people on IRC
        format(m_formatBuffer, sizeof(m_formatBuffer), "%d %s", playerId, Player(playerId)->nicknameString());
        EchoMessage("login", "ds", m_formatBuffer);
    }

    /**
     * Announces that a player decided to play as guest on Las Venturas Playground.
     *
     * @param playerId Id of the player who decided to play as guest.
     * @param oldPlayerName 
     */
    public announcePlayerGuestPlay(playerId, oldNickname[]) {
        // Announce that the player decided to play as guest in-game
        format(m_formatBuffer, sizeof(m_formatBuffer), "* %s (Id:%d) has decided to play as %s (guest) on {A9C4E4}Las Venturas Playground{CCCCCC}.",
            oldNickname, playerId, Player(playerId)->nicknameString());

        this->distributeAnnouncement(ConnectionMessageAnnouncement, Color::ConnectionMessage, m_formatBuffer);

        // Announce the play as guest to the people on IRC
        format(m_formatBuffer, sizeof(m_formatBuffer), "%d %s %s", playerId, oldNickname, Player(playerId)->nicknameString());
        EchoMessage("guest", "dss", m_formatBuffer);
    }

    /**
     * Announces that a player has left Las Venturas Playground, including the reason. If the reason
     * is that the player was banned, this won't be invoked for BanManager-created bans.
     *
     * @param playerId Id of the player who has disconnected from the server.
     * @param reason The reason why they're disconnecting from the server.
     */
    public announcePlayerDisconnected(playerId, reason) {
        new nameString[MAX_PLAYER_NAME];
        new reasonString[16];
        new reasonText[128];

        GetPlayerName(playerId, nameString, sizeof(nameString));

        switch (reason) {
            case 0 /** timed out **/: {
                format(reasonString, sizeof(reasonString), "timeout");
                format(m_formatBuffer, sizeof(m_formatBuffer), "* %s (Id:%d) has left {A9C4E4}Las Venturas Playground{CCCCCC} (timed out).",
                    nameString, playerId);
            }
            case 2 /** kicked or banned **/: {
                switch (Player(playerId)->kickReason()) {
                    case KickedKickReason: {
                        format(reasonString, sizeof(reasonString), "kicked");
                        format(reasonText, sizeof(reasonText), "%s", Player(playerId)->kickReasonString());
                    }
                    case BannedKickReason: {
                        format(reasonString, sizeof(reasonString), "banned");
                        format(reasonText, sizeof(reasonText), "%s", Player(playerId)->kickReasonString());
                    }
                    case AutoBannedKickReason:
                        format(reasonString, sizeof(reasonString), "banned");

                    case ForceReconnectKickReason:
                        format(reasonString, sizeof(reasonString), "reconnecting");

                    default:
                        format(reasonString, sizeof(reasonString), "kicked");
                }

                if (AreKickReasonsPublic() && reasonText[0]) {
                    format(m_formatBuffer, sizeof(m_formatBuffer), "* %s (Id:%d) has left {A9C4E4}Las Venturas Playground{CCCCCC} (%s): %s",
                        nameString, playerId, reasonString, reasonText);
                } else {
                    format(m_formatBuffer, sizeof(m_formatBuffer), "* %s (Id:%d) has left {A9C4E4}Las Venturas Playground{CCCCCC} (%s).",
                        nameString, playerId, reasonString);
                }
            }
            default: {
                format(reasonString, sizeof(reasonString), "leaving");
                format(m_formatBuffer, sizeof(m_formatBuffer), "* %s (Id:%d) has left {A9C4E4}Las Venturas Playground{CCCCCC}.",
                    nameString, playerId);
            }
        }

        this->distributeAnnouncement(ConnectionMessageAnnouncement, Color::ConnectionMessage, m_formatBuffer);

        // Announce this player's disconnection to people watching from IRC.
        if (AreKickReasonsPublic() && reasonText[0]) {
            format(m_formatBuffer, sizeof(m_formatBuffer), "%d %s %s %s", playerId, nameString, reasonString, reasonText);
            EchoMessage("quit-reason", "dssz", m_formatBuffer);
        } else {
            format(m_formatBuffer, sizeof(m_formatBuffer), "%d %s %s", playerId, nameString, reasonString);
            EchoMessage("quit", "dss", m_formatBuffer);
        }
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
