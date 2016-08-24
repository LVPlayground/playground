// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

#include Resources/Minigames/Deathmatch/batfight.pwn
#include Resources/Minigames/Deathmatch/chainsaw_massacre.pwn
#include Resources/Minigames/Deathmatch/dildo_spanking.pwn
#include Resources/Minigames/Deathmatch/knockout.pwn
#include Resources/Minigames/Deathmatch/grenade.pwn
#include Resources/Minigames/Deathmatch/rocket.pwn
#include Resources/Minigames/Deathmatch/sniper.pwn
#include Resources/Minigames/Deathmatch/minigun.pwn
#include Resources/Minigames/Deathmatch/ShipTDM.pwn
#include Resources/Minigames/Deathmatch/sawnoff.pwn
#include Resources/Minigames/Deathmatch/walkweapon.pwn
#include Resources/Minigames/Deathmatch/RandomDeathmatch.pwn
#include Resources/Minigames/Deathmatch/IslandDM.pwn

ShowDeathmatchDialog(playerId) {
    ShowPlayerDialog(playerId, DIALOG_MINIGAME_DM, DIALOG_STYLE_LIST, "Deathmatch Minigames",
        "Bat Fight\nHidden Massacre\nDildo Spanking\nFist Fight Knockout\nGrenade Wars\nRocket Wars\nSniper Madness\nMinigun Madness\nShip TDM\nSawnoff Fights\nWalkweapon Fights\nRandom DM\nIsland DM",
        "Select", "Cancel");
}

// This function will set up contestants for a DeathMatch minigame by resetting various variables
// and starting the minigame.
forward DeathmatchStartFunc();
public DeathmatchStartFunc() {
    new notice[256];

    // If no sign-ups: reset the minigameType variables. If there are any sign-ups, check if the
    // amount of sign-ups is enough, and start the minigame if possible.
    if (MinigameTypeInfo[Players] == 0) {
        MinigameTypeInfo[Progress] = 0;
        MinigameTypeInfo[CurrentMinigame] = STATUS_NONE;
    } else {
        if (MinigameTypeInfo[Players] > 1) 
            MinigameTypeInfo[Progress] = 2;

        for (new contestant = 0; contestant <= PlayerManager->highestPlayerId(); ++contestant) {
            if (Player(contestant)->isConnected() == false)
                continue;

            // Is the contestant signed up for the same minigame?
            if (PlayerInfo[contestant][PlayerStatus] == MinigameTypeInfo[CurrentMinigame]) {
                // Only one sign-up won't do, bail out.
                if (MinigameTypeInfo[Players] == 1) {
                    format(notice, sizeof(notice), "Not enough players have signed up for %s. You have been refunded.",
                        ReturnMinigameName(MinigameTypeInfo[CurrentMinigame])) ;
                    ShowBoxForPlayer(contestant, notice);

                    PlayerLigtUitMiniGame(contestant, LONELY);
                }

                // Enough sign-ups, do some magic for every contestant.
                else if (MinigameTypeInfo[Players] > 1) {
                    ClearPlayerMenus(contestant);
                    RemovePlayerFromVehicle(contestant);

                    GetPlayerPos(contestant, PlayerInfo[contestant][BackPos][0],
                        PlayerInfo[contestant][BackPos][1], PlayerInfo[contestant][BackPos][2]);

                    if (GetPlayerInterior(contestant) != 0) {
                        PlayerInfo[contestant][BackPos][0] = 2024.8190;
                        PlayerInfo[contestant][BackPos][1] = 1917.9425;
                        PlayerInfo[contestant][BackPos][2] = 12.3386;
                    }
                    SetPlayerInterior(contestant, 0);

                    SavePlayerGuns(contestant);
                    SetPlayerHealth(contestant, 100);
                    SetPlayerArmour(contestant, 0);

                    // Let's call the specific minigame handler here.
                    switch(MinigameTypeInfo[CurrentMinigame]) {
                        case STATUS_BATFIGHT:   SetPlayerUpForBatfight(contestant);
                        case STATUS_CHAINSAW:   SetPlayerUpForChainsawMassacre(contestant);
                        case STATUS_DILDO:      SetPlayerUpForDildoSpanking(contestant);
                        case STATUS_KNOCKOUT:   SetPlayerUpForKnockout(contestant);
                        case STATUS_GRENADE:    SetPlayerUpForGrenadeParty(contestant);
                        case STATUS_ROCKET:     SetPlayerUpForRocket(contestant);
                        case STATUS_SNIPER:     SetPlayerUpForSniper(contestant);
                        case STATUS_MINIGUN:    SetPlayerUpForMinigun(contestant);
                        case STATUS_SHIPTDM:    SetupPlayerForShipTDM(contestant);
                        case STATUS_SAWNOFF:    SetPlayerUpForSawnoff(contestant);
                        case STATUS_WALKWEAPON: SetPlayerUpForWalkWeapon(contestant);
                        case STATUS_RANDOMDM:   SetPlayerUpForRandomDeathmatch(contestant);
                        case STATUS_ISLANDDM:   SetupPlayerForIslandDM(contestant);
                    }

                    ClearPlayerMenus(contestant);

                    if (MinigameTypeInfo[CurrentMinigame] != STATUS_ISLANDDM)
                        GameTextForPlayer(contestant, "~g~Go for it!!", 3000, 5);
                }
            }
        }
    }
}