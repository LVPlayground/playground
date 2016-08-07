// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

#define FINISH     0
#define ONFOOT     1
#define KILLED     2
#define TOOSLOW    3
#define DISCONNECT 4
#define LONELY     5
#define LEFT       6
#define SIGNOUT    7

enum minigameInfo {
    CurrentMinigame,
    Progress,
    Players
}

new MinigameTypeInfo[minigameInfo];

// Resets the minigame status in case one of the games reached an inconsistent state. Will verify
// that it indeed is safe to reset the status by asserting that no players are engaged in a minigame
// and will return a boolean indicating whether the state was reset.
bool: ResetMinigameStatus() {
    for (new playerId = 0; playerId <= PlayerManager->highestPlayerId(); ++playerId) {
        if (!Player(playerId)->isConnected() || Player(playerId)->isNonPlayerCharacter())
            continue;

        if (IsPlayerInMinigame(playerId))
            return false;
    }

    MinigameTypeInfo[CurrentMinigame] = STATUS_NONE;
    MinigameTypeInfo[Progress] = 0;
    MinigameTypeInfo[Players] = 0;
    return true;
}

// Alright somebody has executed a minigame command (e.g. /sniper, /minigun). Let's see!
MiniGamesSignup(playerId, minigame) {
    new notice[256], minigameMaxPlayers = ReturnMinigameMaxPlayers(minigame);

    new const price = GetEconomyValue(MinigameParticipation);

    // Check if the player executing the commands is actually available for such an event.
    if (IsPlayerStatusMinigame(playerId) || !IsPlayerMinigameFree(playerId)) {
        SendClientMessage(playerId, Color::Error, "You have already signed up for a different minigame!");
        return 1;
    }

    // Is there already a minigame in sign-up phase? Inform our player.
    else if (minigame != MinigameTypeInfo[CurrentMinigame] && MinigameTypeInfo[CurrentMinigame] != STATUS_NONE
        && MinigameTypeInfo[Progress] == 1) {
        format(notice, sizeof(notice), "Sign-up for the %s has already started! Type %s to join.",
            ReturnMinigameName(MinigameTypeInfo[CurrentMinigame]),
            ReturnMinigameCmd(MinigameTypeInfo[CurrentMinigame]));

        SendClientMessage(playerId, Color::Error, notice);
        SendClientMessage(playerId, Color::Error, "Only one minigame of the same kind can run at the same time.");
        return 1;   
    }

    // Damn, he missed his chance... Hang in there!
    else if (minigame != MinigameTypeInfo[CurrentMinigame] && MinigameTypeInfo[CurrentMinigame] != STATUS_NONE
        && MinigameTypeInfo[Progress] > 1) {
        format(notice, sizeof(notice), "There already is a %s in progress. Please wait until it's over, and try again!",
            ReturnMinigameName(MinigameTypeInfo[CurrentMinigame]));

        SendClientMessage(playerId, Color::Error, notice);
        SendClientMessage(playerId, Color::Error, "Only one minigame of the same kind can run at the same time.");
        return 1;   
    }

    // Heyhey, every bit of fun is worth a penny :)
    else if (GetPlayerMoney(playerId) < price) {
        format(notice, sizeof(notice), "You have to pay $%s to sign-up for this minigame!", formatPrice(price));
        SendClientMessage(playerId, Color::Error, notice);
        return 1;
    }

    // Wohoo, the player is able to sign-up! Let's see if we either have to kick off the whole thing
    // or just put the player in line of awaiting fellow contestants. Or, the minigame might've
    // already started...
    else {
        // 1) Kick the damn thing off!
        if (MinigameTypeInfo[Progress] == 0) {
            MinigameTypeInfo[Progress] = 1;
            MinigameTypeInfo[CurrentMinigame] = minigame;
            MinigameTypeInfo[Players] = 1;

            PlayerInfo[playerId][PlayerStatus] = minigame;
            g_VirtualWorld[playerId] = GetPlayerVirtualWorld(playerId);
            TakeRegulatedMoney(playerId, MinigameParticipation);

            // Set a timer for the DeathmatchStartFunc which will take care of actually checking
            // the amount of sign-ups, the preparation of the players for the minigame, and so on.
            DeathmatchTimer = SetTimer("DeathmatchStartFunc", 20000, 0);

            format(notice, sizeof(notice), "%s (Id:%d) has signed up for %s.", Player(playerId)->nicknameString(),
                playerId, ReturnMinigameCmd(minigame));
            Admin(playerId, notice);

            Responses->respondMinigameSignedUp(playerId, DeathmatchMinigame, ReturnMinigameName(minigame), 20);

            format(notice, sizeof(notice), "~r~~h~%s~w~ has signed up for ~y~%s~w~ (~p~%s~w~)",
                Player(playerId)->nicknameString(), ReturnMinigameName(minigame), ReturnMinigameCmd(minigame));
            NewsController->show(notice);

            Announcements->announceMinigameSignup(DeathmatchMinigame, ReturnMinigameName(minigame),
                ReturnMinigameCmd(minigame), price, playerId);

            format(notice, sizeof(notice), "~y~%s~w~ is now signing up!~n~Want to join? ~r~%s~w~!", ReturnMinigameName(minigame),
                ReturnMinigameCmd(minigame));
            GameTextForAllEx(notice, 5000, 5);
        }

        // 2) It's already kicking ass. Sign the player up.
        else if (MinigameTypeInfo[Progress] == 1) {
            if (MinigameTypeInfo[Players] < minigameMaxPlayers) {
                MinigameTypeInfo[Players]++;

                PlayerInfo[playerId][PlayerStatus] = minigame;
                TakeRegulatedMoney(playerId, MinigameParticipation);

                g_VirtualWorld[playerId] = GetPlayerVirtualWorld(playerId);

                format(notice, sizeof(notice), "%s (Id:%d) has signed up for %s.", Player(playerId)->nicknameString(),
                    playerId, ReturnMinigameCmd(minigame));
                Admin(playerId, notice);

                Responses->respondMinigameSignedUp(playerId, DeathmatchMinigame, ReturnMinigameName(minigame), 15);

                format(notice, sizeof(notice), "~r~~h~%s~w~ has signed up for ~y~%s~w~ (~p~%s~w~)",
                    Player(playerId)->nicknameString(), ReturnMinigameName(minigame), ReturnMinigameCmd(minigame));
                NewsController->show(notice);
            }

            if (MinigameTypeInfo[Players] == minigameMaxPlayers) {
                KillTimer(DeathmatchTimer);
                DeathmatchStartFunc();
            }
        }

        // Seems like it's in progress. Won't take long though!
        else if (MinigameTypeInfo[Progress] > 1) {
            format(notice, sizeof(notice), "The %s is already in progress. Please wait until it's over.",
                ReturnMinigameName(minigame));
            SendClientMessage(playerId, Color::Error, notice);
        }
    }

    return 1;
}

// Called when a player signed-up for a minigame, which hasn't started yet, decides to bail out.
MiniGamesSignout(playerId) {
    if (IsPlayerStatusMinigame(playerId)) {
        // In the meantime the game might've started yet, still leave please!
        if (MinigameTypeInfo[Progress] > 1)
            PlayerLigtUitMiniGame(playerId, LEFT);

        // Sign-out and return the sign-up money. If the game is left empty, kill it.
        else if (MinigameTypeInfo[Progress] == 1) {
            GiveRegulatedMoney(playerId, MinigameParticipation);

            MinigameTypeInfo[Players]--;
            PlayerInfo[playerId][PlayerStatus] = STATUS_NONE;

            if (MinigameTypeInfo[Players] == 0)
                MinigameTypeInfo[Progress] = 0;
        }
    }

    return 1;
}

// Called when the player disconnects, gets fixed or uses /leave when signed up.
MinigameLeave(playerId, bool: justDisconnected = false) {
    if (IsPlayerStatusMinigame(playerId, justDisconnected)) {
        if (MinigameTypeInfo[Progress] == 1)
            MiniGamesSignout(playerId); /* minigame hasn't started yet, sign-out please! */
        else if (MinigameTypeInfo[Progress] > 1)
            PlayerLigtUitMiniGame(playerId, LEFT); /* called while the game is in progress, leave! */
        }

    return 1;
}

// Called from OnPlayerStateChange. We'll only apply this to minigames: if the players get killed
// while participating one, force the player to leave... the sore loser.
MinigameStateChange(playerId, newState, oldState) {
    if (IsPlayerStatusMinigame(playerId)) {
        if (newState == PLAYER_STATE_WASTED && MinigameTypeInfo[Progress] > 1) 
            PlayerLigtUitMiniGame(playerId, KILLED);
    }

    return 1;
    #pragma unused oldState
}

// Called when the player has to leave the, already in progress, minigame for any reason.
PlayerLigtUitMiniGame(playerId, reason) {
    new notice[256], minigame = PlayerInfo[playerId][PlayerStatus];

    // Inform the player and the world about the reason of quitting.
    switch (reason) {
        case KILLED: {
            format(notice, sizeof(notice), "~r~You have been killed in the %s", ReturnMinigameName(minigame));
            GameTextForPlayer(playerId, notice, 3000, 5);
        } case LEFT: {
            format(notice, sizeof(notice), "~r~You have left the %s", ReturnMinigameName(minigame));
            GameTextForPlayer(playerId, notice, 3000, 5);
        } case ONFOOT: {
            notice = "~r~You have been disqualified for leaving your vehicle";
            GameTextForPlayer(playerId, notice, 3000, 5);
        } case TOOSLOW: {
            notice = "~r~You have been disqualified because you didn't get in the car";
            GameTextForPlayer(playerId, notice, 3000, 5);
        } case LONELY:
            GiveRegulatedMoney(playerId, MinigameParticipation);
    }

    // Anyway, the player isn't participating anymore, and the playercount for the minigame decreases!
    PlayerInfo[playerId][PlayerStatus] = STATUS_NONE;
    MinigameTypeInfo[Players]--;

    ColorManager->releasePlayerMinigameColor(playerId);

    // We won't have to spawn a non-existing player, a killed player (spawned already) or someone who
    // hasn't been prepared for the minigame. If we spawn a player, be sure to load theri saved guns.
    if (reason != DISCONNECT && reason != KILLED && reason != LONELY) {
        ResetWorldBounds(playerId);
        SpawnPlayer(playerId);

        ResetPlayerWeapons(playerId);
        LoadPlayerGuns(playerId);
    }

    // For any player except the disconnecting ones, we unfreeze them (if they were ever freezed?)
    // and reset their player color.
    if (reason != DISCONNECT && reason != LONELY)
        TogglePlayerControllable(playerId, true);

    // Some special cases regarding islanddm and shiptdm.
    if (minigame == STATUS_ISLANDDM)
        islandDMRemovePlayer(playerId);
    else if (minigame == STATUS_SHIPTDM) {
        StopPlayerForShipTDM(playerId, reason);

        new iHasSendMsg = 0, message[128];
        if (ShipTDM_CheckFinished()) {
            for (new contestant = 0; contestant <= PlayerManager->highestPlayerId(); ++contestant) {
                if (PlayerInfo[contestant][PlayerStatus] == minigame) {
                    StopPlayerForShipTDM(contestant, FINISH);

                    if (ShipTDM_GetTeam(contestant) == 0 && !iHasSendMsg) {
                        format(message, sizeof(message), "~y~Ship Team Deathmatch~w~ has finished: ~r~~h~Da Nang Boys~w~ have won!");
                        NewsController->show(message);
                        iHasSendMsg = 1;
                    } else if (iHasSendMsg == 0){
                        format(message, sizeof(message), "~y~Ship Team Deathmatch~w~ has finished: ~r~~h~Maffia~w~ have won!");
                        NewsController->show(message);
                        iHasSendMsg = 1;
                    }

                    GiveRegulatedMoney(contestant, MinigameVictory, MinigameTypeInfo[Players]);

                    PlayerInfo[contestant][PlayerStatus] = STATUS_NONE;
                    MinigameTypeInfo[Players] = 0;

                    WonMinigame[contestant]++;

                    SpawnPlayer(contestant);
                    ColorManager->releasePlayerMinigameColor(contestant);
                    LoadPlayerGuns(contestant);

                    BonusTime__CheckPlayer(contestant, 0);
                }
            }
        }
    }

    // Alright! Now we're here it's our job to check how many players remain in the minigame. Because,
    // if that's only one... we have a WINNER!
    else {
        if (MinigameTypeInfo[Players] == 1) {
            for (new contestant = 0; contestant <= PlayerManager->highestPlayerId(); ++contestant) {
                if (PlayerInfo[contestant][PlayerStatus] == minigame) {
                    // If the minigame is in progress with only one player left, we reset their
                    // minigame variables, hand out the price money, raise their won minigames statistic
                    // and respawn them!
                    if (MinigameTypeInfo[Progress] > 1) {
                        format(notice, sizeof(notice), "~y~%s~w~ has finished: ~r~~h~%s~w~ has won!",
                            ReturnMinigameName(minigame), Player(contestant)->nicknameString());
                        NewsController->show(notice);

                        GiveRegulatedMoney(contestant, MinigameVictory, MinigameTypeInfo[Players]);

                        PlayerInfo[contestant][PlayerStatus] = STATUS_NONE;
                        MinigameTypeInfo[Players] = 0;

                        WonMinigame[contestant]++;

                        ColorManager->releasePlayerMinigameColor(contestant);
                        ResetWorldBounds(playerId);
                        SpawnPlayer(contestant);
                        LoadPlayerGuns(contestant);

                        BonusTime__CheckPlayer(contestant, 0);
                    }
                }
            }
        }
    }

    // Little reset routine: 0 players mean no minigame.
    if (MinigameTypeInfo[Players] == 0) {
        MinigameTypeInfo[Progress] = 0;
        MinigameTypeInfo[CurrentMinigame] = STATUS_NONE;
    }

    return 1;
}

// A simple function to check for the player's availability regarding minigames.
IsPlayerStatusMinigame(playerId, bool: justDisconnected = false) {
    if (Player(playerId)->isConnected() == true || justDisconnected) {
        if (PlayerInfo[playerId][PlayerStatus] <= 19 && PlayerInfo[playerId][PlayerStatus] != STATUS_NONE)
            return 1 ;
    }
    return 0;
}

IsPlayerMinigameFree(playerId) {
    if (Player(playerId)->isConnected() == false)
        return 0;

    if (IsPlayerInMinigame(playerId))
        return 0;

    if (IsPlayerStatusMinigame(playerId))
        return 0;

    if (g_RivershellPlayer[playerId])
        return 0;

    if (CRobbery__GetPlayerStatus(playerId) > 0)
        return 0;

    if (WWTW_PlayerData[playerId][iStatus] > 0)
        return 0;

    if (isPlayerBrief[playerId])
        return 0;

    if (CDerby__GetPlayerState(playerId) >= 2)
        return 0;

    if (CLyse__GetPlayerState(playerId) >= 1)
        return 0;

    if (CHideGame__GetPlayerState(playerId) > 0)
        return 0;

    if (rwIsPlayerSignedUp(playerId))
        return 0;

    if (waterFightIsPlayerSignedUp(playerId))
        return 0;

#if Feature::DisableHay == 0
    if (hayHasPlayerSignedUp(playerId))
        return 0;
#endif

    return 1;
}

IsPlayerInMinigame(playerId) {
    if (PlayerActivity(playerId)->isJavaScriptActivity())
        return 1;

    if (IsPlayerStatusMinigame(playerId) && MinigameTypeInfo[Progress] > 1)
        return 1;

    if (IsPlayerInMapZone(playerId))
        return 1;

    if (waterFightIsPlayerPlaying(playerId))
        return 1;

    if (rwIsPlayerSignedUp(playerId) && rwGetState() > 1)
        return 1;

#if Feature::DisableHay == 0
    if (hayHasPlayerSignedUp(playerId) && hayGetState() > 1)
        return 1;
#endif

    if (CLyse__GetPlayerState(playerId) > 1)
        return 1;

    if (CHideGame__GetPlayerState(playerId) == 2)
        return 1;

    if (CDerby__GetPlayerState(playerId) > 2)
        return 1;

    if (isPlayerBrief[playerId] && briefStatus == 2)
        return 1;

    if (g_RivershellPlayer[playerId] && g_RivershellState == 2)
        return 1;

    if (CRobbery__GetPlayerStatus(playerId) > 1)
        return 1;

    if (WWTW_PlayerData[playerId][iStatus] > 1)
        return 1;

#if Feature::DisableFightClub == 0
    if (CFightClub__IsPlayerFighting(playerId))
        return 1;
#endif

    return 0 ;
}

ReturnMinigameName(minigame) {
    new minigameName[256];

    switch (minigame) {
        case STATUS_BATFIGHT:   minigameName = "Bat Fight";
        case STATUS_CHAINSAW:   minigameName = "Hidden Massacre";
        case STATUS_DILDO:      minigameName = "Dildo Spanking";
        case STATUS_KNOCKOUT:   minigameName = "Knockout";
        case STATUS_GRENADE:    minigameName = "Grenade Party";
        case STATUS_ROCKET:     minigameName = "Rocket Party";
        case STATUS_SNIPER:     minigameName = "Sniper Madness";
        case STATUS_MINIGUN:    minigameName = "Minigun Madness";
        case STATUS_SHIPTDM:    minigameName = "Ship Team Deathmatch";
        case STATUS_SAWNOFF:    minigameName = "Sawnoff Fights";
        case STATUS_WALKWEAPON: minigameName = "Walkweapon War";
        case STATUS_RANDOMDM:   minigameName = "Random Deathmatch";
        case STATUS_ISLANDDM:   minigameName = "Island Deathmatch";
    }

    return minigameName;
}

ReturnMinigameCmd(minigame) {
    new command[256];

    switch (minigame) {
        case STATUS_BATFIGHT:   command = "/batfight";
        case STATUS_CHAINSAW:   command = "/massacre";
        case STATUS_DILDO:      command = "/spankme";
        case STATUS_KNOCKOUT:   command = "/knockout";
        case STATUS_GRENADE:    command = "/grenade";
        case STATUS_ROCKET:     command = "/rocket";
        case STATUS_SNIPER:     command = "/sniper";
        case STATUS_MINIGUN:    command = "/minigun";
        case STATUS_SHIPTDM:    command = "/shiptdm";
        case STATUS_SAWNOFF:    command = "/sawnoff";
        case STATUS_WALKWEAPON: command = "/ww";
        case STATUS_RANDOMDM:   command = "/random";
        case STATUS_ISLANDDM:   command = "/islanddm";
    }

    return command;
}

ReturnMinigameMaxPlayers(minigame) {
    new maxPlayers;

    switch (minigame) {
        case STATUS_BATFIGHT:   maxPlayers = 100;
        case STATUS_CHAINSAW:   maxPlayers = 100;
        case STATUS_DILDO:      maxPlayers = 10;
        case STATUS_KNOCKOUT:   maxPlayers = 2;
        case STATUS_GRENADE:    maxPlayers = 100;
        case STATUS_ROCKET:     maxPlayers = 100;
        case STATUS_SNIPER:     maxPlayers = 20;
        case STATUS_MINIGUN:    maxPlayers = 50;
        case STATUS_SHIPTDM:    maxPlayers = 100;
        case STATUS_SAWNOFF:    maxPlayers = 50;
        case STATUS_WALKWEAPON: maxPlayers = 100;
        case STATUS_RANDOMDM:   maxPlayers = 20;
        case STATUS_ISLANDDM:   maxPlayers = 100;
    }

    return maxPlayers;
}