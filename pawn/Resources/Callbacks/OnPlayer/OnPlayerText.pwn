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

    SpamTracker->record(playerid, text);

    CReaction__OnText(playerid, text);

    // Enforce a typo in "George" (as "Geroge") when this feature has been enabled.
    if (g_enforceGeorgeTypo) {
        new const offset = strfind(text, "George", true);
        new const target[] = "geroge";

        if (offset > -1) {
            for (new i = offset, j = 0; i < offset + 6 /* len(George) */; ++i, ++j) {
                text[i] = text[i] >= 65 && text[i] <= 90 ? toupper(target[j])
                                                         : target[j];
            }
        }
    }

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

    // Block spamming of this user in the various chats.
    if (SpamTracker->isSpamming(playerid)) {
        SendClientMessage(playerid, Color::Error, "Please do not spam on Las Venturas Playground!");
        return 0;
    }

    // Check for CAPS.
    if (g_NoCaps[playerid] == true) {
        for (new i = 0; i < strlen(text); i++)
            text[i] = tolower(text[i]);
    }

    // Crew chat (@).
    if (text[0] == '@' && strlen(text) > 1) {
        new prefix[MAX_PLAYER_NAME];

        if (Account(playerid)->userId() == 31797 /* Luce */)
            format(prefix, sizeof(prefix), "Lady");
        else if (Player(playerid)->isManagement() == true)
            format(prefix, sizeof(prefix), "Manager");
        else if (Player(playerid)->isAdministrator() == true)
            format(prefix, sizeof(prefix), "Admin");
        else
            format(prefix, sizeof(prefix), "Message from");

        format(message, sizeof(message), "* %s %s (Id:%d): %s", prefix,
            Player(playerid)->nicknameString(), playerid, text[1]);

        for (new subjectId = 0; subjectId <= PlayerManager->highestPlayerId(); subjectId++) {
            if (Player(subjectId)->isConnected() == false || Player(subjectId)->isAdministrator() == false)
                continue;

            SendClientMessage(subjectId, Color::AdministratorColor, message);
        }

        if (Player(playerid)->isAdministrator() == false) {
            format(message, sizeof(message), "Your message has been sent to the crew: {FFFFFF}%s", text[1]);
            SendClientMessage(playerid, Color::Success, message);
        }

        format(message, sizeof(message), "[adminmsg] %s %d %s", Player(playerid)->nicknameString(), playerid, text[1]);
        AddEcho(message);

        return 0;
    }

    // Apply the effects of a full server mute.
    if (IsCommunicationMuted() && !Player(playerid)->isAdministrator()) {
        SendClientMessage(playerid, Color::Error, "Sorry, an administrator is making an announcement.");
        return 0;
    }

    // VIP chat (# - requires VIP level).
    if (text[0] == '#' && strlen(text) > 1) {
        VeryImportantPlayersCommands->onVipChatCommand(playerid, text);
        return 0;
    }

    if (CRobbery__OnText(playerid, text)) return 0;
    if (CShell__OnText(playerid, text)) return 0;
    if (CLyse__OnText(playerid, text)) return 0;
    if (CWWTW__OnText(playerid, text)) return 0;

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
        format(message, sizeof(message), "[text] %d %s %s", playerid, Player(playerid)->nicknameString(), text);
    } else {
        format(message, sizeof(message), "[worldchat] %d %d %s %s", playerVirtualWorld,
            playerid, Player(playerid)->nicknameString(), text);
    }

    AddEcho(message);

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
        if (g_Ignore[subjectId][playerid] == true)
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
