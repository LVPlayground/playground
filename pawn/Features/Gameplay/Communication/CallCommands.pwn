// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * GTA San Andreas offers players a mainchat to collectivly chat with each other. The downside of
 * such a chat is that it isn't private. LVP offers players a way to avoid this by offering several
 * phonecall commands. The /call command allows people to start a phone call conversation with
 * another player, overriding their normal chatting capabilities.
 *
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 */
class CallCommands {
    /**
     * Different from /pm is the /call command, a way to establish a direct connection to another player.
     * Players can answer the phone when somebody is calling them, or just ignore the call. Muted
     * players shouldn't be able to call anyone. It's not possible to establish a connection with
     * a player when the caller or that player is participating in a different call.
     * 
     * @param playerId Id of the player who typed the command.
     * @param player Id or name of the player who needs to be ringed up.
     * @command /call [player]
     */
    @command("call")
    public onCallCommand(playerId, params[]) {
        if (Command->parameterCount(params) != 1) {
            SendClientMessage(playerId, Color::Information, "Usage: /call [player]");
            return 1;
        }

        if (IsPlayerInMinigame(playerId)) {
            SendClientMessage(playerId, Color::Error, "You're currently playing a minigame and cannot use the phone.");
            return 1;
        }

        if (CallManager->isCalling(playerId) == true || GetPlayerSpecialAction(playerId) == 11) {
            SendClientMessage(playerId, Color::Error, "You're currently talking on the phone, use \"/hangup\" first.");
            return 1;
        }

        if (MuteManager->isMuted(playerId) == true) {
            SendClientMessage(playerId, Color::Error, "You're currently muted and cannot use the phone.");
            return 1;
        }

        new callerId = Command->playerParameter(params, 0, playerId);
        if (callerId == Player::InvalidId)
            return 1;
        else if (playerId == callerId) {
            SendClientMessage(playerId, Color::Error, "You can't call yourself.");
            return 1;
        }

        if (Player(callerId)->isNonPlayerCharacter() == true) {
            SendClientMessage(playerId, Color::Error, "You can't call a NPC.");
            return 1;
        }

        if (CallManager->isCalling(callerId) == true || GetPlayerSpecialAction(callerId) == 11) {
            SendClientMessage(playerId, Color::Error,
                "The number you've dialed is currently in use, please try again later.");
            return 1;
        }

        CallManager->makePhoneCall(playerId, callerId);

        return 1;
    }

    /**
     * When you get ringed up by somebody else, /answer is the way to pick up the phone. This should
     * only be possible if someone is really calling you.
     * 
     * @param playerId Id of the player who typed the command.
     * @param params Any further text that the player passed to the command. Unused.
     * @command /answer
     */
    @command("answer")
    public onAnswerCommand(playerId, params[]) {
        new callerId = Player::InvalidId;
        for (new player = 0; player <= PlayerManager->highestPlayerId(); player++) {
            if (!CallManager->isCalling(player))
                continue;

            if (CallManager->isCallingId(player) != playerId)
                continue;

            if (PlayerSyncedData(player)->isolated())
                continue;

            callerId = player;
        }

        if (callerId == Player::InvalidId) {
            SendClientMessage(playerId, Color::Error, "Nobody is ringing you up...");
            return 1;
        }

        CallManager->pickupPhone(callerId, playerId);

        return 1;
        #pragma unused params
    }

    /**
     * When you feel like ending an active phone call, /hangup is the way to go. This command should
     * ofcourse only be issued when a call is active.
     * 
     * @param playerId Id of the player who typed the command.
     * @param params Any further text that the player passed to the command. Unused.
     * @command /hangup
     */
    @command("hangup")
    public onHangupCommand(playerId, params[]) {
        new callerId = Player::InvalidId;
        for (new player = 0; player <= PlayerManager->highestPlayerId(); player++) {
            if (CallManager->isCallingId(player) == playerId) {
                callerId = player;
            }
        }

        if (callerId == Player::InvalidId) {
            SendClientMessage(playerId, Color::Error, "You aren't in an active phone conversation...");
            return 1;
        }

        // Check if our callee is declining the call, or ending an active conversation.
        if (CallManager->isCalling(playerId) == true)
            CallManager->hangupPhone(callerId, playerId, 3); /* the callee used /hangup to decline the call */
        else
            CallManager->hangupPhone(callerId, playerId, 0); /* an active phone call ended by /hangup */

        return 1;
        #pragma unused params
    }
};
