// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Administrators should have the ability to mute certain players. Reasons for muting can vary
 * from spamming to advertising. We offer two mute variations: permanent and specified mute.
 *
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 */
class MuteManager {
    // Create a member boolean for every player to mark if he/she is muted or not.
    new bool: m_isMuted[MAX_PLAYERS];

    // Keep track of the mute duration of muted players.
    new m_muteDuration[MAX_PLAYERS];

    // Remember when the player was muted in order to unmute him/her on time.
    new m_holdMuteTimestamp[MAX_PLAYERS];

    /**
     * When it's time to mute a player we set him/her as muted, save the duration and timestamp.
     *
     * @param playerId Id of the player who needs to get muted.
     * @param duration Amount of minutes to mute the player, where 0 means permanently.
     * @param silent Whether the |playerId| should NOT be informed of the mute.
     */
    public mutePlayer(playerId, duration, bool: silent = false) {
        m_isMuted[playerId] = true;
        m_muteDuration[playerId] = duration;
        m_holdMuteTimestamp[playerId] = Time->currentTime();

        if (silent)
            return;

        new message[128];
        if (duration == -1) {
            SendClientMessage(playerId, Color::Error, "An administrator has muted you permanently.");
            SendClientMessage(playerId, Color::Error,
                "Please read the /rules. If you have a question use @<message> to contact an administrator.");
        } else {
            format(message, sizeof(message), "An administrator has muted you for %d minute(s).", duration);
            SendClientMessage(playerId, Color::Error, message);
            SendClientMessage(playerId, Color::Error,
                "Please read the /rules. If you have a question use @<message> to contact an administrator.");
        }
    }

    /**
     * To unmute a player we simply reset the member's mute variables.
     *
     * @param playerId Id of the player who needs to get unmuted.
     */
    public unmutePlayer(playerId) {
        m_isMuted[playerId] = false;
        m_muteDuration[playerId] = 0;
        m_holdMuteTimestamp[playerId] = 0;

        SendClientMessage(playerId, Color::Information, "An administrator has unmuted you.");
    }

    /**
     * This is called every second to check a player's mute duration and unmute him/her
     * when he is due to be unmuted.
     */
    @list(SecondTimerPerPlayer)
    public onSecondTimerTick(playerId) {
        if (m_isMuted[playerId] == true && m_muteDuration[playerId] > 0) {
            if (Time->currentTime() - m_holdMuteTimestamp[playerId] > m_muteDuration[playerId] * 60) {
                this->unmutePlayer(playerId);

                SendClientMessage(playerId, Color::Information, "You are now able to chat again!");

                new message[128];
                format(message, sizeof(message), "%s (Id:%d) is now unmuted.",
                    Player(playerId)->nicknameString(), playerId);
                Admin(playerId, message);
            }
        }

        return 1;
    }

    /**
     * Make sure that all information held by this class is reset when a player disconnects from the
     * server, as we don't want new players to be muted when they connect to LVP.
     */
    @list(OnPlayerDisconnect)
    public onPlayerDisconnect(playerId) {
        m_isMuted[playerId] = false;
        m_muteDuration[playerId] = 0;
        m_holdMuteTimestamp[playerId] = 0;
    }

    /**
     * Getter to hold the mute duration of a player when he/she is muted.
     *
     * @return integer Duration in seconds.
     */
    public inline muteDuration(playerId) {
        return ((m_muteDuration[playerId] * 60) - (Time->currentTime() - m_holdMuteTimestamp[playerId]));
    }

    /**
     * A getter to check if a player is muted or not.
     *
     * @return boolean Is player muted?
     */
    public inline bool: isMuted(playerId) {
        return (m_isMuted[playerId]);
    }
};
