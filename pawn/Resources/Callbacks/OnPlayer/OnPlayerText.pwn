// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Called when the player sends a chat message.
 *
 * @param playerid Id of the player who typed the text.
 * @param text The text the player typed.
 */
public OnPlayerText(playerid, text[]) {
    new message[145];

    if (!strlen(text))
        return 0;

    PlayerIdlePenalty->resetCurrentIdleTime(playerid);

    // A muted player can't chat unless it's the admins he wants to chat with.
    if (MuteManager->isMuted(playerid) && text[0] != '@') {
        if (MuteManager->muteDuration(playerid) == -1)
            SendClientMessage(playerid, Color::Error, "You're permanently muted and won't be able to chat.");
        else {
            new durationText[10];
            Time->formatRemainingTime(MuteManager->muteDuration(playerid), durationText,
                sizeof(durationText), /** force minutes **/ true);
            format(message, sizeof(message), "You're muted for another %s minutes and won't be able to chat.",
                durationText);
            SendClientMessage(playerid, Color::Error, message);
        }

        SendClientMessage(playerid, Color::Error, "Please read the /rules. If you have a question use @<message> to contact an administrator.");
        return 0;
    }

    // Perhaps the player still has to login?
    if (Player(playerid)->isLoggedIn() == false && Player(playerid)->isRegistered() == true && text[0] != '@') {
        SendClientMessage(playerid, Color::Error, "Please login before chatting in the textbox.");
        SendClientMessage(playerid, Color::Error, "Troubles logging in? Contact the crew using @<message>.");
        return 0;
    }

    // Apply the effects of a full server mute.
    if (IsCommunicationMuted() && !Player(playerid)->isAdministrator()) {
        SendClientMessage(playerid, Color::Error, "Sorry, an administrator is making an announcement.");
        return 0;
    }

    if (CRobbery__OnText(playerid, text)) return 0;
    if (CShell__OnText(playerid, text)) return 0;
    if (CLyse__OnText(playerid, text)) return 0;

#if Feature::DisableFights == 0
    if (CWWTW__OnText(playerid, text)) return 0;
#endif

    // Phone calls.
    if (CallManager->isCalling(playerid) == true) {
        new calleeId = CallManager->isCallingId(playerid);
        if (CallManager->isCalling(calleeId) == true)
            CallManager->onPhoneMessage(playerid, calleeId, text);

        return 0;
    }

    new const bool: playerInMainWorld = IsPlayerInMainWorld(playerid);
    new const playerVirtualWorld = GetPlayerVirtualWorld(playerid);

    // Add it to the echo-feed, so it shows up on IRC as well.
    if (playerInMainWorld) {
        format(message, sizeof(message), "%d %s %s", playerid, Player(playerid)->nicknameString(), text);
        EchoMessage("chat", "dsz", message);
    } else {
        format(message, sizeof(message), "%d %d %s %s", playerVirtualWorld, playerid, Player(playerid)->nicknameString(), text);
        EchoMessage("chat-world", "ddsz", message);
    }

    // /q Jokes Not Allowed
    new QuitJokes[2][] = {
        "/q",
        "/quit"
    };

     for (new i = 0; i < sizeof(QuitJokes); i++) {
         if (strfind(text, QuitJokes[i], true) != -1) {
             SendClientMessage(playerid, Color::Error, "Error: Quit jokes are not allowed");
             return 0;
         }
     }

    // Finally: time to send the message to all players.
    for (new subjectId = 0; subjectId <= PlayerManager->highestPlayerId(); subjectId++) {
        if (g_Ignore[subjectId][playerid])
            continue;

        new const bool: subjectInMainWorld = IsPlayerInMainWorld(subjectId);
        new const subjectVirtualWorld = GetPlayerVirtualWorld(subjectId);

        if ((playerInMainWorld && subjectInMainWorld) || playerVirtualWorld == subjectVirtualWorld) {
            format(message, sizeof(message), "{%06x}[%d] %s: {FFFFFF}%s",
                ColorManager->playerColor(playerid) >>> 8, playerid, Player(playerid)->nicknameString(), text);
            SendClientMessage(subjectId, Color::Information, message);
        }

        else if (Player(subjectId)->isAdministrator() && PlayerSettings(subjectId)->isAllVirtualWorldChatEnabled()) {
            format(message, sizeof(message), "{FFFFFF}(World: %d) {%06x}[%d] %s: {FFFFFF}%s",
                GetPlayerVirtualWorld(playerid), ColorManager->playerColor(playerid) >>> 8, playerid,
                Player(playerid)->nicknameString(), text);
            SendClientMessage(subjectId, Color::Information, message);
        }
    }

    return 0;
}
