// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * This is the manager for the CallCommands, offering a base for the phone call system of LVP.
 *
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 */
class CallManager {
    // Track if the player is currently participating in a phonecall or not.
    new bool: m_isCalling[MAX_PLAYERS];

    // Hold the Id of the player the caller is calling.
    new m_isCallingId[MAX_PLAYERS];

    // Record the UNIX timestamp when a call starts.
    new m_phoneCallTimestamp[MAX_PLAYERS];

    /**
     * Return true if the player is currently busy with a phone call.
     *
     * @return boolean True if already participating in a phone call, false if not.
     */
    public inline bool: isCalling(playerId) {
        return (m_isCalling[playerId]);
    }

    /**
     * Return the Id of the player that is currently being ringed up, or -1 if nothing is happening.
     *
     * @return integer The Id of the callee or -1.
     */
    public inline isCallingId(playerId) {
        return (m_isCallingId[playerId]);
    }

    /**
     * Triggered from OnPlayerText, if two players are calling we have to send messages only between them.
     *
     * @param callerId Id of the calling player sending a message.
     * @param calleeId Id of the called player receiving a message.
     * @param message Message to be send.
     */
    public onPhoneMessage(callerId, calleeId, message[]) {
        new notice[256];
        format(notice, sizeof(notice), "{DC143C}[Phone] {33CCFF}%s: {FFFFFF}%s",
            Player(callerId)->nicknameString(), message);
        SendClientMessage(callerId, Color::Information, notice);
        SendClientMessage(calleeId, Color::Information, notice);

        // Time to send out the message and notify admins ingame and on IRC.
        format(notice, sizeof(notice), "*  PHONE: %s (Id:%d) to %s (Id:%d): %s",
            Player(callerId)->nicknameString(), callerId, Player(calleeId)->nicknameString(), calleeId, message);

        for (new player = 0; player <= PlayerManager->highestPlayerId(); player++) {
            if (Player(player)->isConnected() == false || Player(player)->isAdministrator() == false)
                continue; /* either not connected or not an administrator */

            if (player == callerId || player == calleeId)
                continue; /* let's not spam the sender or receiver twice */

            if (MessageLevelsManager->getPlayerMessageLevel(player) < 1)
                continue; /* crew member doesn't want to read player phone calls */

            SendClientMessage(player, Color::HighlightBlue, notice);
        }

        format(notice, sizeof(notice), "%s %d %s %d %s", Player(callerId)->nicknameString(),
            callerId, Player(calleeId)->nicknameString(), calleeId, message);
        IRC->broadcast(PhoneIrcMessage, notice);

        return 1;
    }

    /**
     * A phone call has been initiated, time to expand it. We put a phone object in the caller's
     * right hand, and force him into the 'use cellphone' special action. Then the caller and callee
     * are informed about the phone call event.
     *
     * @param callerId Id of the calling player initiating the phone call.
     * @param calleeId Id of the called player.
     */
    public makePhoneCall(callerId, calleeId) {
        m_isCalling[callerId] = true;
        m_isCallingId[callerId] = calleeId;
        m_phoneCallTimestamp[callerId] = Time->currentTime();

        SetPlayerSpecialAction(callerId, 11);
        SetPlayerAttachedObject(callerId, 3, 330, 6);

        new notice[160];
        format(notice, sizeof(notice),
            "You've got an incoming call from {FFFFFF}%s{33AA33}, use {FFFFFF}\"/answer\"{33AA33} to pick up, or {FFFFFF}\"/hangup\"{33AA33} to decline.",
            Player(callerId)->nicknameString());
        SendClientMessage(calleeId, Color::ActionRequired, notice);

        SendClientMessage(callerId, Color::Success, "The phone is ringing...");

        return 1;
    }

    /**
     * If the callee accepts the phone call, we force the player into a cell phone holding position
     * and put a phone object in his/her right hand. Both the caller and callee are informed that the
     * conversation has started.
     *
     * @param callerId Id of the calling player.
     * @param calleeId Id of the called player picking up the phone.
     */
    public pickupPhone(callerId, calleeId) {
        m_isCalling[calleeId] = true;
        m_isCallingId[calleeId] = callerId;

        SetPlayerSpecialAction(calleeId, 11);
        SetPlayerAttachedObject(calleeId, 3, 330, 6);

        new notice[136];
        format(notice, sizeof(notice),
            "You're now on the phone with {FFFFFF}%s{33AA33}, use {FFFFFF}\"/hangup\"{33AA33} to end the conversation.",
            Player(callerId)->nicknameString());
        SendClientMessage(calleeId, Color::Success, notice);

        format(notice, sizeof(notice),
            "You're now on the phone with {FFFFFF}%s{33AA33}, use {FFFFFF}\"/hangup\"{33AA33} to end the conversation.",
            Player(calleeId)->nicknameString());
        SendClientMessage(callerId, Color::Success, notice);

        return 1;
    }

    /**
     * The conversation is over, time to clean up both ends. This function has been executed by the
     * caller, so we first reset his/her values. Then the reason is being inspected to perform the
     * appropiate actions.
     *
     * @param callerId Id of the calling player who is hanging up.
     * @param calleeId Id of the called player.
     * @param reason Integer stating the reason of hangup.
     */
    public hangupPhone(callerId, calleeId, reason) {
        m_isCalling[callerId] = false;
        m_isCallingId[callerId] = Player::InvalidId;

        SetPlayerSpecialAction(callerId, 13);
        RemovePlayerAttachedObject(callerId, 3);

        new notice [128];
        if (reason == 0) { /* an active phone call ended by /hangup */
            m_isCalling[calleeId] = false;
            m_isCallingId[calleeId] = Player::InvalidId;
            SetPlayerSpecialAction(calleeId, 13);
            RemovePlayerAttachedObject(calleeId, 3);

            format(notice, sizeof(notice), "The phone conversation with {33AA33}%s{FFFFFF} has ended.",
                Player(callerId)->nicknameString());
            SendClientMessage(calleeId, Color::Information, notice);
            format(notice, sizeof(notice), "The phone conversation has been ended by {33AA33}%s{FFFFFF}.",
                Player(calleeId)->nicknameString());

            SendClientMessage(callerId, Color::Information, notice);
        } else if (reason == 1) { /* an active phone call ended by a disconnect */
            m_isCalling[calleeId] = false;
            m_isCallingId[calleeId] = Player::InvalidId;
            SetPlayerSpecialAction(calleeId, 13);
            RemovePlayerAttachedObject(calleeId, 3);

            format(notice, sizeof(notice), "The phone conversation has ended because {33AA33}%s{FFFFFF} left the server.",
                Player(callerId)->nicknameString());

            SendClientMessage(calleeId, Color::Information, notice);
        } else if (reason == 2) { /* the caller disconnected before the callee answered */
            format(notice, sizeof(notice), "The phone has stopped ringing because caller {33AA33}%s{FFFFFF} left the server.",
                Player(callerId)->nicknameString());

            SendClientMessage(calleeId, Color::Information, notice);
        } else if (reason == 3) { /* the callee used /hangup to decline the call */
            format(notice, sizeof(notice), "You've declined the phone call from {33AA33}%s{FFFFFF}.",
                Player(callerId)->nicknameString());
            SendClientMessage(calleeId, Color::Information, notice);

            format(notice, sizeof(notice), "{33AA33}%s{FFFFFF} has declined your call.", Player(calleeId)->nicknameString());
            SendClientMessage(callerId, Color::Information, notice);
        } else if (reason == 4) { /* the call wasn't answered or declined */
            format(notice, sizeof(notice), "You didn't answer the call from {33AA33}%s{FFFFFF} in time, the phone has stopped ringing.",
                Player(callerId)->nicknameString());
            SendClientMessage(calleeId, Color::Information, notice);

            format(notice, sizeof(notice), "{33AA33}%s{FFFFFF} didn't answer your call in time, the phone has stopped ringing.",
                Player(calleeId)->nicknameString());
            SendClientMessage(callerId, Color::Information, notice);
        }

        return 1;
    }

    /**
     * A check is being executed every second for every player, to check if he/she is currently
     * being ringed up, but didn't pick up yet. If so, after 15 secs. the conversation is terminated.
     *
     * @param playerId Id of the player who we are checking a phone call for.
     */
    @list(SecondTimerPerPlayer)
    public onSecondTimerTick(playerId) {
        if (m_isCalling[playerId] == true) {
            new calleeId = m_isCallingId[playerId];
            if (m_isCalling[calleeId] == false && (Time->currentTime() - m_phoneCallTimestamp[playerId] > 15))
                this->hangupPhone(playerId, calleeId, 4); /* the call wasn't answered or declined */
        }

        return 1;
    }

    /**
     * Reset the necessary values for every disconnecting player, and end the phone call if they
     * were currently participating in one.
     *
     * @param playerId Id of the player who disconnected.
     */
    @list(OnPlayerDisconnect)
    public onPlayerDisconnect(playerId) {
        if (m_isCalling[playerId] == true) {
            new calleeId = m_isCallingId[playerId];
            if (m_isCalling[calleeId] == true)
                this->hangupPhone(playerId, calleeId, 1); /* an active phone call ended by a disconnect */
            else
                this->hangupPhone(playerId, calleeId, 2); /* the caller disconnected before the callee answered */
        }

        return 1;
    }
};
