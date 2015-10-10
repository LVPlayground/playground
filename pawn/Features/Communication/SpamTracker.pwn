// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Tracks and prevents spam in the server's chat box. The implementation is covered by a series of
 * tests in SpamTrackerTest.pwn.
 *
 * The tracker works on a series of heuristics to determine whether a player is spamming. The
 * following heuristics are currently implemented:
 *
 *     - Empty messages will be considered as spam. It shouldn't be possible to send such messages
 *       in either case.
 *
 *     - Messages longer than 255 characters will be considered as spam. It shouldn't be possible to
 *       send such messages in either case.
 *
 *     - Repeating a message more than once is considered spam. After doing so, the player can
 *       repeat the given message again once per 10 seconds.
 *
 *     - Sending more than 5 messages per 10 seconds is considered spam.
 *
 * Note that players of level moderator and up are exempt from the spam policies, although sanity
 * checks (i.e. message length checks) will still be done.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class SpamTracker {
    // Maximum length of an incoming chat message. Longer messages will be ignored.
    public const MAX_MESSAGE_LENGTH = 255;

    // Maximum number of times that a message may be repeated.
    public const MAX_REPEAT_COUNT = 2;

    // Number of seconds to consider a single chat interval.
    public const INTERVAL_DURATION = 10;

    // Maximum number of messages that may be send during a single chat interval.
    public const INTERVAL_MAX_MESSAGES = 5;

    // Size of the history buffer to maintain for the interval tracking.
    public const INTERVAL_HISTORY_SIZE = SpamTracker::INTERVAL_MAX_MESSAGES + 1;

    // The last message send to a specific player.
    new m_lastMessage[MAX_PLAYERS][SpamTracker::MAX_MESSAGE_LENGTH];

    // The number of times the last message has been repeated by the player.
    new m_lastMessageRepeatCounter[MAX_PLAYERS];

    // Timestamps containing the message history for each of the players. Entries will be stored in
    // descending order (latest message first).
    new m_messageHistory[MAX_PLAYERS][SpamTracker::INTERVAL_HISTORY_SIZE];

    // Whether the next message for the player has to be blocked. The reason must be documented with
    // the code that actually sets this property.
    new bool: m_blockNextMessage[MAX_PLAYERS];

    // To be called when |playerid| says |message|. No distinction will be made between public chat
    // messages, group chat messages and private messages to other players.
    public record(playerId, message[]) {
        new length = strlen(message);
        if (length == 0 || length >= SpamTracker::MAX_MESSAGE_LENGTH) {
            if (!is_running_test())
                printf("[SpamTracker] Warning: Message from player %d ignored due to its length.", playerId);

            m_blockNextMessage[playerId] = true;
            return;
        }

        if (Player(playerId)->isModerator())
            return;

        for (new index = SpamTracker::INTERVAL_HISTORY_SIZE - 1; index > 0; --index)
            m_messageHistory[playerId][index] = m_messageHistory[playerId][index - 1];

        m_messageHistory[playerId][0] = Time->currentTime();

        if (strlen(m_lastMessage[playerId]) > 0) {
            if (strcmp(m_lastMessage[playerId], message, true) == 0) {
                m_lastMessageRepeatCounter[playerId]++;
                return;
            }
        }

        format(m_lastMessage[playerId], sizeof(m_lastMessage[]), "%s", message);
    }

    // Returns whether |playerId| has been spamming.
    public bool: isSpamming(playerId) {
        if (m_blockNextMessage[playerId]) {
            m_blockNextMessage[playerId] = false;
            return true;
        }

        if (m_lastMessageRepeatCounter[playerId] >= SpamTracker::MAX_REPEAT_COUNT)
            return true;

        new intervalStart = Time->currentTime() - SpamTracker::INTERVAL_DURATION,
            intervalCount = 0;

        for (new index = 0; index < SpamTracker::INTERVAL_HISTORY_SIZE; ++index) {
            if (m_messageHistory[playerId][index] >= intervalStart)
                intervalCount++;
        }

        return intervalCount > SpamTracker::INTERVAL_MAX_MESSAGES;
    }

    // Called once per ten seconds. Resets |m_lastMessageRepeatCounter| back to zero for each player
    // allowing them to repeat themselves once more. This works because |m_lastMessage| will still
    // be set to the repetative message, meaning it'll immediately start counting again.
    @list(TenSecondTimer)
    public onTenSecondTimerTick() {
        for (new playerId = 0; playerId < MAX_PLAYERS; ++playerId) {
            if (m_lastMessageRepeatCounter[playerId] > 0)
                m_lastMessageRepeatCounter[playerId] = 0;
        }
    }

    // Resets the recorded data for |playerId| back to its original status.
    @list(OnPlayerConnect)
    public resetPlayer(playerId) {
        m_lastMessage[playerId][0] = '\0';
        m_lastMessageRepeatCounter[playerId] = 0;
        m_blockNextMessage[playerId] = false;

        for (new index = 0; index < SpamTracker::INTERVAL_HISTORY_SIZE; ++index)
            m_messageHistory[playerId][index] = 0;
    }

    // Resets the recorded data for all players back to their original status.
    public reset() {
        for (new playerId = 0; playerId < MAX_PLAYERS; ++playerId)
            this->resetPlayer(playerId);
    }
};

// Include the SpamTracker test suite.
#include "Features/Communication/SpamTrackerTest.pwn"
