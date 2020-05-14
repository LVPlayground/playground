// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * This is the manager for the PrivateMessagingCommands, offering a base for the private message
 * system of Las Venturas Playground.
 *
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 */
class PrivateMessagingManager {
    // Save the Id of the last message sender for every player.
    new m_lastPrivateMessageSenderId[MAX_PLAYERS];

    // Save the name of the last message sender for every player.
    new m_lastPrivateMessageSenderName[MAX_PLAYERS][25];

    /**
     * Return the Id of the player who send the last PM to this player, or return -1 if he/she hasn't
     * received one before.
     *
     * @param playerId Id of the player to get the most recent sender Id for.
     * @return integer Id or -1.
     */
    public inline lastPrivateMessageSenderId(playerId) {
        return (m_lastPrivateMessageSenderId[playerId]);
    }

    /**
     * Return the name of the player who send the last PM to this player.
     *
     * @param playerId Id of the player to get the most recent sender name for.
     * @return string Name of the player.
     */
    public inline lastPrivateMessageSenderName(playerId) {
        return (m_lastPrivateMessageSenderName[playerId]);
    }

    /**
     * Sets the name who the player has last send or received a message from to the passed in string.
     *
     * @param playerId Id of the player to update the most recent sender name for.
     * @param name The name of the most recent sender.
     */
    public setLastPrivateMessageSenderName(playerId, name[]) {
        strncpy(m_lastPrivateMessageSenderName[playerId], name, sizeof(m_lastPrivateMessageSenderName[]));
    }

    /**
     * Send a private message from one player to another directly, without anyone else (except for
     * the crew), reading it. Muted players or possible spammers are blocked, several checks are done
     * to inform the player when his message receiver is busy with something.
     *
     * @param senderId Id of the player who is sending the message.
     * @param sender Name of the player who is sending the message.
     * @param receiverId Id of the player who the message needs to be send to.
     * @param receiver Name of the player who the message needs to be send to.
     * @param message The message to be send.
     */
    public sendPrivateMessage(senderId, sender[], receiverId, receiver[], message[]) {
        // Store sender for our receiver, so we can check later if our sender is still online if
        // the receiver uses /r.
        format(m_lastPrivateMessageSenderName[receiverId], 25, "%s", sender);
        m_lastPrivateMessageSenderId[receiverId] = senderId;

        // Store the receiver for our sender, so he can use /r to chat along.
        format(m_lastPrivateMessageSenderName[senderId], 25, "%s", receiver);
        m_lastPrivateMessageSenderId[senderId] = receiverId;

        new notice[256];
        if (IsPlayerInMinigame(receiverId)) {
            format(notice, sizeof(notice), "%s is currently playing a minigame, and might not respond for a while!",
                receiver);
            SendClientMessage(senderId, Color::Information, notice);
        }

        if (DamageManager(receiverId)->isPlayerFighting() == true) {
            format(notice, sizeof(notice), "%s is currently fighting, and might not respond for a while!",
                receiver);
            SendClientMessage(senderId, Color::Information, notice);
        }

        // Time to send out the message and notify admins ingame and on IRC.
        format(notice, sizeof(notice), "*  PM: %s (Id:%d) to %s (Id:%d): %s", sender, senderId,
            receiver, receiverId, message);

        for (new player = 0; player <= PlayerManager->highestPlayerId(); ++player) {
            if (Player(player)->isConnected() == false || Player(player)->isAdministrator() == false)
                continue; /* either not connected or not an administrator */

            if (player == receiverId || player == senderId)
                continue; /* let's not spam the sender or receiver twice */

            if (MessageLevelsManager->getPlayerMessageLevel(player) < 1)
                continue; /* crew member doesn't want to read player PMs */

            SendClientMessage(player, Color::PlayerStatistics, notice);
        }

        // Show the message to the sender.
        format(notice, sizeof(notice), "{FCF545}PM to [%d] %s: {FFFFFF}%s", receiverId, receiver, message);
        SendClientMessage(senderId, Color::White, notice);

        if (!PlayerSyncedData(senderId)->isolated()) {
            // Show the sender the result.
            format(notice, sizeof(notice), "{FFDC18}PM from [%d] %s: {FFFFFF}%s", senderId, sender, message);
            SendClientMessage(receiverId, Color::White, notice);

            // Play a sound for the receiver to indicate they received a message.
            PlayerPlaySound(receiverId, 1058, 0.0, 0.0, 0.0);

            // Only show the /r or /reply message to people who haven't played on LVP a lot yet.
            if (Player(receiverId)->isRegular() == false)
                SendClientMessage(receiverId, Color::ConnectionMessage, "* Use {A9C4E4}/r {CCCCCC}or {A9C4E4}/reply {CCCCCC}to quickly reply to the message.");
        }

        // Broadcast message on IRC.
        format(notice, sizeof(notice), "%s %d %s %d %s", sender, senderId, receiver, receiverId, message);
        EchoMessage("chat-private", "sdsdz", notice);

        return 1;
    }

    /**
     * Send a private message from one player to another directly, without anyone else (except for
     * the crew), reading it. Muted players or possible spammers are blocked, several checks are done
     * to inform the player when his message receiver is busy with something.
     *
     * @param senderId Id of the player who is sending the message.
     * @param sender Name of the player who is sending the message.
     * @param receiver Name of the user who the message needs to be send to.
     * @param message The message to be send.
     */
    public sendPrivateIrcMessage(senderId, sender[], receiver[], message[]) {
        // Store the receiver for our sender, so he can use /r to chat along.
        format(m_lastPrivateMessageSenderName[senderId], 25, "%s", receiver);
        m_lastPrivateMessageSenderId[senderId] = Player::InvalidId;

        new const bool: isIsolated = PlayerSyncedData(senderId)->isolated();

        // Time to send out the message and notify admins ingame and on IRC.
        new notice[256];
        format(notice, sizeof(notice), "*  PM: %s (Id:%d) to %s (IRC): %s", sender, senderId,
            receiver, message);

        for (new player = 0; player <= PlayerManager->highestPlayerId(); ++player) {
            if (isIsolated)
                break;  // We silently drop IRC pms for isolated players

            if (Player(player)->isConnected() == false || Player(player)->isAdministrator() == false)
                continue; /* either not connected or not an administrator */

            if (player == senderId)
                continue; /* let's not spam the sender twice */

            if (MessageLevelsManager->getPlayerMessageLevel(player) < 1)
                continue; /* the administrator does not wish to see this message */

            SendClientMessage(player, Color::HighlightBlue, notice);
        }

        // Show the sender the result.
        format(notice, sizeof(notice), "{FCF545}PM to [IRC] %s: {FFFFFF}%s", receiver, message);
        SendClientMessage(senderId, Color::White, notice);

        if (!isIsolated) {
            // Broadcast message on IRC.
            format(notice, sizeof(notice), "%s %s %d %s", receiver, sender, senderId, message);
            EchoMessage("chat-irc-notice", "ssdz", notice);
        }

        return 1;
    }

    /**
     * Reset the necessary values for every connecting player.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect(playerId) {
        m_lastPrivateMessageSenderId[playerId] = Player::InvalidId;
        m_lastPrivateMessageSenderName[playerId][0] = '\0';

        return 1;
    }
};
