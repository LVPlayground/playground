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

    if (strlen(text) > 144)
        return 0; /* SendClientMessage won't send messages longer than 144 chars */

    PlayerIdlePenalty->resetCurrentIdleTime(playerid);

    SpamTracker->record(playerid, text);

    CReaction__OnText(playerid, text);

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

    // VIP chat (# - requires VIP level).
    if (text[0] == '#' && strlen(text) > 1) {
        VeryImportantPlayersCommands->onVipChatCommand(playerid, text);
        return 0;
    }

    // Regular chat (; - requires 50 ingame hours).
    if (text[0] == ';' && strlen(text) > 2) { // Length of 2 so only smileys are still displayed to everyone
        format(message, sizeof(message), "** [%d] %s: %s", playerid, Player(playerid)->nicknameString(), text[1]);

        if (gameplayhours[playerid] < Player::RegularHours && Player(playerid)->isAdministrator() == false) {
            format(message, sizeof(message), "Regular chat is only available for registered players whom have been playing for at least %d hours.", Player::RegularHours);
            SendClientMessage(playerid, Color::Error, message);
            return 0;
        }

        for (new subjectId = 0; subjectId <= PlayerManager->highestPlayerId(); subjectId++) {
            if (LegacyIsPlayerIgnored(subjectId, playerid) == true)
                continue;

            if (gameplayhours[subjectId] >= Player::RegularHours || Player(subjectId)->isAdministrator() == true)
                SendClientMessage(subjectId, Color::RegularChat, message);
        }

        format(message, sizeof(message), "[regular] %s %d %s", Player(playerid)->nicknameString(), playerid, text[1]);
        AddEcho(message);

        return 0;
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

    if (CRobbery__OnText(playerid, text)) return 0;
    if (CShell__OnText(playerid, text)) return 0;
    if (CLyse__OnText(playerid, text)) return 0;
    if (CWWTW__OnText(playerid, text)) return 0;

#if Feature::EnableGangSystem == 1

    // Gang chat (! - requires gang membership). To be done after minigames, since some of these
    // have built in team chat using the ! character.
    if (text[0] == '!' && strlen(text) > 1) {
        new gangId = GangPlayer(playerid)->gangId();
        if (gangId == Gang::InvalidId) {
            SendClientMessage(playerid, Color::Error, "You need to be in a gang before you can use gang chat.");
            return 0;
        }

        Gang(gangId)->onChatMessage(playerid, text[1]);
        return 0;
    }

#endif

    // Phone calls.
    if (CallManager->isCalling(playerid) == true) {
        new calleeId = CallManager->isCallingId(playerid);
        if (CallManager->isCalling(calleeId) == true)
            CallManager->onPhoneMessage(playerid, calleeId, text);

        return 0;
    }

    // Add it to the echo-feed, so it shows up on IRC as well.
    if (GetPlayerVirtualWorld(playerid) == World::MainWorld)
        format(message, sizeof(message), "[text] %d %s %s", playerid, Player(playerid)->nicknameString(), text);
    else 
        format(message, sizeof(message), "[worldchat] %d %d %s %s", GetPlayerVirtualWorld(playerid),
            playerid, Player(playerid)->nicknameString(), text);

    AddEcho(message);

    // Finally: time to send the message to all players.
    for (new subjectId = 0; subjectId <= PlayerManager->highestPlayerId(); subjectId++) {
        if (g_Ignore[subjectId][playerid] == true)
            continue;

        if (GetPlayerVirtualWorld(subjectId) == GetPlayerVirtualWorld(playerid)) {
            format(message, sizeof(message), "{%06x}[%d] %s: {FFFFFF}%s",
                ColorManager->playerColor(playerid) >>> 8, playerid, Player(playerid)->nicknameString(), text);
            SendClientMessage(subjectId, Color::Information, message);
        }

        else if (GetPlayerVirtualWorld(subjectId) != GetPlayerVirtualWorld(playerid)
            && PlayerSettings(subjectId)->isAllVirtualWorldChatEnabled() == true
            && Player(subjectId)->isAdministrator() == true) {
            format(message, sizeof(message), "{FFFFFF}(World: %d) {%06x}[%d] %s: {FFFFFF}%s",
                GetPlayerVirtualWorld(playerid), ColorManager->playerColor(playerid) >>> 8, playerid,
                Player(playerid)->nicknameString(), text);
            SendClientMessage(subjectId, Color::Information, message);
        }
    }

    return 0;
}