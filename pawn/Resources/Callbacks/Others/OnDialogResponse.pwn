// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

stock deprecated_OnDialogResponse(playerid, dialogid, response, listitem, inputtext[]) {
    switch (dialogid) {
        case DIALOG_DRIVEBY: {
            if (response) {
                new message[128], lameKill[12], lamerId = Drivebyer[playerid];

                if (HeliKill[playerid] == 1)
                    format(lameKill, sizeof(lameKill), "heli-kill");
                else
                    format(lameKill, sizeof(lameKill), "drive-by");

                if (Player(lamerId)->isConnected() == false) {
                    format(message, sizeof(message), "The %s'er has left the game.", lameKill);
                    SendClientMessage(playerid, Color::Error, message);

                    Drivebyer[playerid] = -1;
                    HeliKill[playerid] = 0;
                    return 1;
                }

                switch (listitem) {
                    case 0:
                        format(message, sizeof(message), "%s has forgiven you for your %s.",
                            Player(playerid)->nicknameString(), lameKill);

                    case 1: {
                        format(message, sizeof(message), "Your money has been stolen by %s as punishment of a %s.",
                            Player(playerid)->nicknameString(), lameKill);

                        new money = GetPlayerMoney(lamerId);
                        GivePlayerMoney(playerid, money);
                        ResetPlayerMoney(lamerId);
                    }

                    case 2: {
                        if (JailController->isPlayerJailed(lamerId) == true) {
                            format(message, sizeof(message), "The %s'er is currently jailed, please make another choice.", lameKill);
                            SendClientMessage(playerid, Color::Error, message);

                            ShowPlayerDialog(playerid, DIALOG_DRIVEBY, DIALOG_STYLE_LIST, "Revenge!", "Forgive\nSteal their money\nDetonate them\nThrow them in the air\nRespawn their vehicle\nHalve their health\nRemove their weapons", "Punish", "");
                            TogglePlayerControllable(playerid, false);
                            return 1;
                        }

                        format(message, sizeof(message), "You have been detonated by %s as punishment of a %s.",
                            Player(playerid)->nicknameString(), lameKill);

                        new Float: pos[3];
                        SetPlayerHealth(lamerId, 0);
                        validKillerId[lamerId] = playerid;
                        validReasonId[lamerId] = WEAPON_EXPLOSION;

                        GetPlayerPos(lamerId, pos[0], pos[1], pos[2]);
                        CreateExplosion(pos[0], pos[1], pos[2], 1, 1);
                    }

                    case 3: {
                        format(message, sizeof(message), "You have been thrown into the air by %s as punishment of a %s.",
                            Player(playerid)->nicknameString(), lameKill);

                        new Float: pos[3];
                        GetPlayerPos(lamerId, pos[0], pos[1], pos[2]);

                        if (IsPlayerInAnyVehicle(lamerId)) {
                            new vehicleId = GetPlayerVehicleID(lamerId);
                            RemovePlayerFromVehicle(lamerId);
                            SetVehicleToRespawn(vehicleId);
                        }

                        SetPlayerPos(lamerId, pos[0], pos[1], pos[2] + 400);

                        PlayerHandOfGod[lamerId] = 1;
                        ResetPlayerWeapons(lamerId);
                    }

                    case 4: {
                        if (IsPlayerInAnyVehicle(lamerId)) {
                            format(message, sizeof(message), "Your vehicle has been respawned by %s as punishment of a %s.",
                                Player(playerid)->nicknameString(), lameKill);

                            new vehicleId = GetPlayerVehicleID(lamerId);
                            RemovePlayerFromVehicle(lamerId);
                            SetVehicleToRespawn(vehicleId);
                        } else {
                            format(message, sizeof(message), "The %s'er is not in a vehicle, make another choice.", lameKill);
                            SendClientMessage(playerid, Color::Error, message);

                            ShowPlayerDialog(playerid, DIALOG_DRIVEBY, DIALOG_STYLE_LIST, "Revenge!", "Forgive\nSteal their money\nDetonate them\nThrow them in the air\nRespawn their vehicle\nHalve their health\nRemove their weapons", "Punish", "");
                            TogglePlayerControllable(playerid, false);
                            return 1;
                        }
                    }

                    case 5: {
                        format(message, sizeof(message), "Your health has been halved by %s as punishment of a %s.",
                            Player(playerid)->nicknameString(), lameKill);

                        new Float: health;
                        GetPlayerHealth(lamerId, health);
                        SetPlayerHealth(lamerId, 0.5 * health);
                    }

                    case 6: {
                        format(message, sizeof(message), "Your weapons have been removed by %s as punishment of a %s.",
                            Player(playerid)->nicknameString(), lameKill);
                        ResetPlayerWeapons(lamerId);
                    }
                }

                SendClientMessage(lamerId, Color::Error, message);
                SendClientMessage(playerid, Color::Success, "Done!");

                Drivebyer[playerid] = -1;
                HeliKill[playerid] = 0;
            }

            TogglePlayerControllable(playerid, true);
            return 1;
        }

        case DIALOG_MINIGAMES: {
            if (response) {
                switch (listitem) {
                    case 0: CDerby__ShowMainDialog(playerid);
                    case 1: ShowDeathmatchDialog(playerid);
#if Feature::DisableRaces == 0
                    case 2: CRace__ShowPlayerDialog(playerid);
#endif
                    case 3: CRobbery__MenuActivate(playerid);
                    case 4: CBrief__MenuActivate(playerid);
                    case 5: CShell__MenuActivate(playerid);
                    case 6: CLyse__MenuActivate(playerid);
                    case 7: CWWTW__MenuActivate(playerid);
                    case 8: rwMenuActivate(playerid);
#if Feature::DisableHay == 0
                    case 9: hayMenuActivate(playerid);
#endif
                    case 10: OnWaterFightCmdText(playerid);
                }
            }
            return 1;
        }

        case DIALOG_GYM_FIGHT: {
            if (response) {
                switch (listitem) {
                    case 0: SetPlayerFightingStyle(playerid, FIGHT_STYLE_BOXING);
                    case 1: SetPlayerFightingStyle(playerid, FIGHT_STYLE_KUNGFU);
                    case 2: SetPlayerFightingStyle(playerid, FIGHT_STYLE_KNEEHEAD);
                }
                SendClientMessage(playerid, Color::Success, "Fighting skills accquired!");
            }
            return 1;
        }

#if Feature::EnableFightClub == 0
        case DIALOG_FIGHTCLUB: {
            if (response) {
                if (CFightClub__HasPlayerInvited(playerid))
                    return SendClientMessage(playerid, Color::Error, "You've already invited someone, use '/fight cancel' first.");

                new matchId = CFightClub__GetEmptyMatch();
                if (matchId < 0)
                    return SendClientMessage(playerid, Color::Error, "The FightClub is currently full.");

                if (GetPlayerMoney(playerid) < FC_MONEY) {
                    new string[128];
                    format(string, sizeof(string), "Inviting a player to a duel costs $%s.", formatPrice(FC_MONEY));
                    SendClientMessage(playerid, Color::Error, string);
                    CFightClub__ResetPlayerFCInfo(playerid);
                    return 1;
                }

                Matches[matchId][status] = FC_STATUS_ACTIVE;
                PlayerMatch[playerid] = matchId;
                CFightClub__ShowDialog(playerid, DIALOG_FIGHTCLUB_DUEL_PLACE);
                return 1;
            }

            else if (!response) {
                if (!CFightClub__CountMatches(FC_STATUS_FIGHTING)) {
                    CFightClub__ResetPlayerFCInfo(playerid);
                    SendClientMessage(playerid, Color::Error, "There are currently no matches running.");
                    return 1;
                }

                CFightClub__ShowDialog(playerid, DIALOG_FIGHTCLUB_WATCH);
                return 1;
            }
        }

        case DIALOG_FIGHTCLUB_WATCH: {
            if (response) {
                if (!CFightClub__CountMatches(FC_STATUS_FIGHTING)) {
                    CFightClub__ResetPlayerFCInfo(playerid);
                    SendClientMessage(playerid, Color::Error, "Sorry, there are no matches running anymore.");
                    return 1;
                }

                new matchId = strval(inputtext[0]);
                if (Matches[matchId][status] != FC_STATUS_FIGHTING) {
                    CFightClub__ResetPlayerFCInfo(playerid);
                    SendClientMessage(playerid, Color::Error, "Sorry, this match isn't running anymore.");
                    return 1;
                }

                TogglePlayerControllable(playerid, true);
                CFightClub__WatchMatch(playerid, matchId);
                FightClubDialog[playerid] = 0;
                return 1;
            }

            else if (!response) {
                CFightClub__ResetPlayerFCInfo(playerid);
                return 1;
            }
        }

        case DIALOG_FIGHTCLUB_DUEL_PLACE: {
            new matchId = PlayerMatch[playerid];

            if (response) {
                new locationId = CFightClub__GetDialogLocation(listitem);
                Matches[matchId][location] = locationId;
                CFightClub__ShowDialog(playerid, DIALOG_FIGHTCLUB_DUEL_WEAPONS_1);
                return 1;
            }

            else if(!response) {
                CFightClub__ResetPlayerFCInfo(playerid);
                return 1;
            }
        }

        case DIALOG_FIGHTCLUB_DUEL_WEAPONS_1: {
            if (response) {
                new matchId = PlayerMatch[playerid];
                switch (listitem) {
                    case 0: { Matches[matchId][gun1] = 9; } // Chainsaw
                    case 1: { Matches[matchId][gun1] = 23; } // Silenced 9mm
                    case 2: { Matches[matchId][gun1] = 24; } // Desert Eagle
                    case 3: { Matches[matchId][gun1] = 25; } // Shotgun
                    case 4: { Matches[matchId][gun1] = 26; } // Sawnoff Shotgun
                    case 5: { Matches[matchId][gun1] = 27; } // Combat Shotgun
                    case 6: { Matches[matchId][gun1] = 28; } // Micro SMG
                    case 7: { Matches[matchId][gun1] = 29; } // MP5
                    case 8: { Matches[matchId][gun1] = 30; } // AK-47
                    case 9: { Matches[matchId][gun1] = 31; } // M4
                    case 10: { Matches[matchId][gun1] = 32; } // Tec-9
                    case 11: { Matches[matchId][gun1] = 33; } // Country Rifle
                    case 12: { Matches[matchId][gun1] = 34; } // Sniper Rifle
                    case 13: { Matches[matchId][gun1] = 35; } // Rocket Launcher
                    case 14: { Matches[matchId][gun1] = 37; } // Flamethrower
                    case 15: { Matches[matchId][gun1] = 38; } // Minigun
                }

                CFightClub__ShowDialog(playerid, DIALOG_FIGHTCLUB_DUEL_WEAPONS_2);
                return 1;
            }

            else if (!response) {
                CFightClub__ShowDialog(playerid, DIALOG_FIGHTCLUB_DUEL_PLACE);
                return 1;
            }
        }

        case DIALOG_FIGHTCLUB_DUEL_WEAPONS_2: {
            if (response) {
                new matchId = PlayerMatch[playerid];
                Matches[matchId][gun2] = CFightClub__GetPickedWeapon(listitem);

                CFightClub__ShowDialog(playerid, DIALOG_FIGHTCLUB_DUEL_WEAPONS_3);
                return 1;
            }

            else if (!response) {
                CFightClub__ShowDialog(playerid, DIALOG_FIGHTCLUB_DUEL_PLACE);
                return 1;
            }
        }

        case DIALOG_FIGHTCLUB_DUEL_WEAPONS_3: {
            if (response) {
                new matchId = PlayerMatch[playerid];
                Matches[matchId][gun3] = CFightClub__GetPickedWeapon(listitem);

                CFightClub__ShowDialog(playerid, DIALOG_FIGHTCLUB_DUEL_WEAPONS_4);
                return 1;
            }

            else if (!response) {
                CFightClub__ShowDialog(playerid, DIALOG_FIGHTCLUB_DUEL_PLACE);
                return 1;
            }
        }

        case DIALOG_FIGHTCLUB_DUEL_WEAPONS_4: {
            if (response) {
                new matchId = PlayerMatch[playerid];
                Matches[matchId][gun4] = CFightClub__GetPickedWeapon(listitem);

                CFightClub__ShowDialog(playerid, DIALOG_FIGHTCLUB_DUEL_WEAPONS_5);
                return 1;
            }

            else if (!response) {
                CFightClub__ShowDialog(playerid, DIALOG_FIGHTCLUB_DUEL_PLACE);
                return 1;
            }
        }

        case DIALOG_FIGHTCLUB_DUEL_WEAPONS_5: {
            if (response) {
                new matchId = PlayerMatch[playerid];
                Matches[matchId][gun5] = CFightClub__GetPickedWeapon(listitem);

                CFightClub__ShowDialog(playerid, DIALOG_FIGHTCLUB_DUEL_ROUNDS);
                return 1;
            }

            else if (!response) {
                CFightClub__ShowDialog(playerid, DIALOG_FIGHTCLUB_DUEL_PLACE);
                return 1;
            }
        }

        case DIALOG_FIGHTCLUB_DUEL_ROUNDS: {
            if (response) {
                new matchId = PlayerMatch[playerid];
                new nRounds = strval(inputtext);

                if (nRounds < 1 || nRounds < FC_MIN_ROUNDS || nRounds > FC_MAX_ROUNDS) {
                    new string[128];
                    format(string, sizeof(string), "That's not a valid round. Range: %d - %d", FC_MIN_ROUNDS, FC_MAX_ROUNDS);
                    SendClientMessage(playerid, Color::Error, string);
                    return CFightClub__ShowDialog(playerid, DIALOG_FIGHTCLUB_DUEL_ROUNDS);
                }
                Matches[matchId][rounds] = nRounds;

                CFightClub__ShowDialog(playerid, DIALOG_FIGHTCLUB_DUEL_INVITE);
                return 1;
            }

            else if (!response) {
                CFightClub__ShowDialog(playerid, DIALOG_FIGHTCLUB_DUEL_WEAPONS_5);
                return 1;
            }
        }

        case DIALOG_FIGHTCLUB_DUEL_INVITE: {
            if (response) {
                if (!strlen(inputtext)) {
                    CFightClub__ShowDialog(playerid, DIALOG_FIGHTCLUB_DUEL_INVITE);
                    SendClientMessage(playerid, COLOR_RED, "You didn't enter anything.");
                    return 1;
                }

                new inviteId = SelectPlayer(inputtext);

                if (Player(inviteId)->isConnected() == false || Player(inviteId)->isNonPlayerCharacter() == true
                    || playerid == inviteId) {
                    CFightClub__ShowDialog(playerid, DIALOG_FIGHTCLUB_DUEL_INVITE);
                    SendClientMessage(playerid, Color::Error, "Invalid player chosen!");
                    return 1;
                }

                if (CFightClub__IsPlayerFighting(inviteId)) {
                    CFightClub__ShowDialog(playerid, DIALOG_FIGHTCLUB_DUEL_INVITE);
                    SendClientMessage(playerid, Color::Error, "This player is already fighting.");
                    return 1;
                }

                if (IsPlayerInMinigame(inviteId)) {
                    CFightClub__ShowDialog(playerid, DIALOG_FIGHTCLUB_DUEL_INVITE);
                    SendClientMessage(playerid, Color::Error, "This player is currently in a minigame.");
                    return 1;
                }

                TogglePlayerControllable(playerid, true);
                CFightClub__OnInvite(playerid, inviteId);
                Instrumentation->recordActivity(FightClubInviteActivity);

                SendClientMessage(playerid, Color::Error, "Use '/fight cancel' to cancel your invitation.");
                return 1;
            }
            else if (!response) {
                new matchId = PlayerMatch[playerid];
                CFightClub__ResetMatch(matchId);
                CFightClub__ResetPlayerFCInfo(playerid);
                return 1;
            }
        }
#endif

        case DIALOG_COMMANDS_LIST: {
            if (!response)
                return 1;

            switch(listitem) {
                case 0: ShowPlayerDialog(playerid, DIALOG_COMMANDS_MAIN, DIALOG_STYLE_MSGBOX, "Main commands", "@ (message)\r\n/help\r\n/stats\r\n/nos\r\n/getstats\r\n/showmessage\r\n/world\r\n/my\r\n/minigames\r\n/leave\r\n/jump\r\n/cd", "Back", "Exit");
                case 1: ShowPlayerDialog(playerid, DIALOG_COMMANDS_COMMUNICATION, DIALOG_STYLE_MSGBOX, "Communication commands", "@ (contact crew)\r\n# (VIP-chat)\r\n! (Gang-chat)\r\n/me\r\n/pm\r\n/r(eply)\r\n/ircpm\r\n/call\r\n/answer\r\n/hangup\r\n/ignore\r\n/unignore\r\n/ignored", "Continue", "Exit");
                case 2: ShowPlayerDialog(playerid, DIALOG_COMMANDS_TELEPORTATION, DIALOG_STYLE_MSGBOX, "Teleportation commands", "/taxi\r\n/locations\r\n/tp\r\n/ctp\r\n/dive\r\n/locate\r\n/tune\r\n/world\r\n/tow\r\n/cardive", "Continue", "Exit");
                case 3: ShowPlayerDialog(playerid, DIALOG_COMMANDS_FIGHTING, DIALOG_STYLE_MSGBOX, "Fighting commands", "/bounties\r\n/hitman\r\n/fight\r\n/gangs", "Continue", "Exit");
                case 4: ShowPlayerDialog(playerid, DIALOG_COMMANDS_MONEY, DIALOG_STYLE_MSGBOX, "Money commands", "/help 2\r\n/properties\r\n/buy\r\n/sell\r\n/export\r\n/bank\r\n/withdraw\r\n/balance", "Continue", "Exit");
            }
            return 1;
        }

        case DIALOG_COMMANDS_MAIN: {
            if (response)
                ShowPlayerDialog(playerid, DIALOG_COMMANDS_LIST, DIALOG_STYLE_LIST, "Choose the category!", "Main\r\nCommunication\r\nTeleportation\r\nFighting\r\nMoney", "Select", "Exit");
            return 1;
        }

        case DIALOG_COMMANDS_COMMUNICATION: {
            if (response)
                ShowPlayerDialog(playerid, DIALOG_COMMANDS_LIST, DIALOG_STYLE_LIST, "Choose the category!", "Main\r\nCommunication\r\nTeleportation\r\nFighting\r\nMoney", "Select", "Exit");
            return 1;
        }

        case DIALOG_COMMANDS_TELEPORTATION: {
            if (response)
                ShowPlayerDialog(playerid, DIALOG_COMMANDS_LIST, DIALOG_STYLE_LIST, "Choose the category!", "Main\r\nCommunication\r\nTeleportation\r\nFighting\r\nMoney", "Select", "Exit");
            return 1;
        }

        case DIALOG_COMMANDS_FIGHTING: {
            if (response)
                ShowPlayerDialog(playerid, DIALOG_COMMANDS_LIST, DIALOG_STYLE_LIST, "Choose the category!", "Main\r\nCommunication\r\nTeleportation\r\nFighting\r\nMoney", "Select", "Exit");
            return 1;
        }

        case DIALOG_COMMANDS_MONEY: {
            if (response)
                ShowPlayerDialog(playerid, DIALOG_COMMANDS_LIST, DIALOG_STYLE_LIST, "Choose the category!", "Main\r\nCommunication\r\nTeleportation\r\nFighting\r\nMoney", "Select", "Exit");
            return 1;
        }

#if Feature::DisableRaces == 0
        case DIALOG_RACE_MAIN .. DIALOG_RACE_SUB: {
            CRace__OnDialogResponse(playerid, dialogid, response, listitem);
            return 1;
        }
#endif

        case DIALOG_JUMPS_LIST: {
            if (response)
                OnJumpDialogResponse(playerid, listitem);
            return 1;
        }

#if Feature::DisableRaces == 0
        case DIALOG_WORLD_RACE_START: {
            CRace__OnDialogResponse(playerid, dialogid, response, listitem);
            return 1;
        }
#endif

        case DIALOG_DERBY_MAIN: {
            if (response) {
                new params[6];
                format(params, sizeof(params), "%d", listitem);
                CDerby__OnCommand(playerid, params);
            }
            return 1;
        }

        case DIALOG_JUMP_RACES: {
            if (response)
                OnMapZoneJumpDialogResponse(playerid, listitem);
            return 1;
        }

        case DIALOG_TELES_MAIN: {
            if (!response)
                return 1;

            if (listitem == 0) {
                new jumpList[512];
                for (new jumpId; jumpId < g_MapCount; jumpId++)
                    format(jumpList, sizeof(jumpList), "%s%s\r\n", jumpList, Map_Zone[jumpId][Map_Name]);

                ShowPlayerDialog(playerid, DIALOG_JUMPS_LIST, DIALOG_STYLE_LIST, "Choose a jump!", jumpList, "Begin!", "Cancel");
                return 1;
            }

            if (listitem == 1) {
                ShowPlayerDialog(playerid, DIALOG_TELES_TUNE_SHOPS, DIALOG_STYLE_LIST, "Tune shops", "Wheel Arch Angels (San Fierro)\r\nLoco Low Co (Los Santos)\r\n", "Select", "Cancel");
                return 1;
            }

            if (listitem == 2) {
                ShowTaxiDialog(playerid);
                return 1;
            }

#if Feature::DisableRaces == 0
            if (listitem == 3) {
                CRace__ShowPlayerDialog(playerid);
                return 1;
            }
#endif

            if (listitem == 4) {
                CDerby__ShowMainDialog(playerid);
                return 1;
            }

            if (listitem == 5) {
                ShowDeathmatchDialog(playerid);
                return 1;
            }

            if (listitem == 6) {
                ShowPlayerDialog(playerid, DIALOG_MINIGAMES, DIALOG_STYLE_LIST, "Choose your minigame!", "Derby\nDeathmatch\nRace\nRobbery\nBriefcase\nRivershell\nLYSE\nWWTW\nRWTW\nHaystack\nWaterfight", "Play!", "Cancel");
                return 1;
            }
        }

        case DIALOG_TELES_TUNE_SHOPS: {
            if (!response) {
                ShowPlayerDialog(playerid, DIALOG_TELES_MAIN, DIALOG_STYLE_LIST, "LVP Teles", "Jumps\r\nTune shops\r\nTaxi Destinations\r\nRaces\r\nDerbies\r\nMini-Games", "Select", "Close");
                return 1;
            }

            new string[4];
            format(string, sizeof(string), "%d", listitem + 1);
            return lvp_tune(playerid, string);
        }

        case DIALOG_TAXI_LOCATIONS: {
            if (!response)
                return 1;

            new string[4];
            format(string, sizeof(string), "%d", listitem);
            return lvp_taxi(playerid, string);
        }

        case DIALOG_MINIGAME_DM: {
            if (!response)
                return 1;

            if (GetPlayerMoney(playerid) < 2500) {
                SendClientMessage(playerid, Color::Error, "You have to pay $2.500 to signup for this minigame!");
                return 1;
            }

            switch (listitem) {
                case 0: MiniGamesSignup(playerid, STATUS_BATFIGHT);
                case 1: MiniGamesSignup(playerid, STATUS_CHAINSAW);
                case 2: MiniGamesSignup(playerid, STATUS_DILDO);
                case 3: MiniGamesSignup(playerid, STATUS_KNOCKOUT);
                case 4: MiniGamesSignup(playerid, STATUS_GRENADE);
                case 5: MiniGamesSignup(playerid, STATUS_ROCKET);
                case 6: MiniGamesSignup(playerid, STATUS_SNIPER);
                case 7: MiniGamesSignup(playerid, STATUS_MINIGUN);
                case 8: MiniGamesSignup(playerid, STATUS_SHIPTDM);
                case 9: MiniGamesSignup(playerid, STATUS_SAWNOFF);
                case 10: MiniGamesSignup(playerid, STATUS_WALKWEAPON);
                case 11: MiniGamesSignup(playerid, STATUS_RANDOMDM);
                case 12: MiniGamesSignup(playerid, STATUS_ISLANDDM);
            }

            return 1;
        }

        case DIALOG_TOW_COMMAND: {
            if (response) {
                if (Player(playerid)->isAdministrator() == false)
                    GivePlayerMoney(playerid, -45000);

                TowPlayer(playerid, listitem);
            }
            return 1;
        }
    }

    return 1;
}