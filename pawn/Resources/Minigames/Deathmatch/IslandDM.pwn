// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/*
    Las Venturas Playground v2.94.0 - Island DM

    Based off a map by LilBoy, a basic deathmatch minigame
    which uses a very similar handler to that of the ShipTDM
    minigame. Players spawn as two teams and have to take eachother out.

    Author: James "Jay" Wilkinson, LilBoy

*/


#define ISLAND_DM_TEAM_A        0
#define ISLAND_DM_TEAM_B        1

#define ISLAND_DM_TEAM_A_SKIN       165     // FBI guy
#define ISLAND_DM_TEAM_B_SKIN       287     // Army Guy

#define ISLAND_DM_WORLD             114

static  n_IslandDMBalancer;
static  islandDMTeam[MAX_PLAYERS] = {NO_TEAM, ...};

SetupPlayerForIslandDM(playerid)
{
    new n_Team = islandDMSetTeam(playerid);

    SetPlayerTeam(playerid, n_Team);

    SetPlayerVirtualWorld(playerid, ISLAND_DM_WORLD);

    SetPlayerHealth(playerid, 100);
    SetPlayerArmour(playerid, 0);

    GiveWeapon(playerid, 29, 150);
    GiveWeapon(playerid, 31, 400);
    GiveWeapon(playerid, 24, 30);
    GiveWeapon(playerid, 27, 100);
    GiveWeapon(playerid, 4, 1);

    Streamer_Update(playerid);

    new Float:n_TeamASpawn[5][4] = {
        {3823.2871, 606.7947, 12.7618, 82.6381},
        {3807.6184, 622.6293, 9.4788, 87.9883},
        {3793.2708, 608.2750, 5.6234, 101.9357},
        {3819.1621, 638.8225, 7.2213, 150.9258},
        {3785.8794, 644.4258, 4.7372, 102.4329}
    };

    new Float:n_TeamBSpawn[5][4] = {
        {3571.2595, 612.1557, 5.6234, 271.5343},
        {3563.7590, 624.3362, 5.6234, 270.4815},
        {3566.4939, 634.6995, 5.6234, 261.0062},
        {3576.6887, 613.2456, 5.6234, 231.6592},
        {3565.4539, 608.3416, 10.2555, 255.8735}
    };

    new iSpawnPos = random(5);

    if(n_Team == ISLAND_DM_TEAM_A)
    {
        SetPlayerSkinEx(playerid, ISLAND_DM_TEAM_A_SKIN);
        SetPlayerPos(playerid, n_TeamASpawn[iSpawnPos][0], n_TeamASpawn[iSpawnPos][1], n_TeamASpawn[iSpawnPos][2]);
        SetPlayerFacingAngle(playerid, n_TeamASpawn[iSpawnPos][3]);

        SetPlayerGameColor(playerid, Color::MinigameTransparentRed);
    }
    else
    {
        SetPlayerSkinEx(playerid, ISLAND_DM_TEAM_B_SKIN);
        SetPlayerPos(playerid, n_TeamBSpawn[iSpawnPos][0], n_TeamBSpawn[iSpawnPos][1], n_TeamBSpawn[iSpawnPos][2]);
        SetPlayerFacingAngle(playerid, n_TeamBSpawn[iSpawnPos][3]);

        SetPlayerGameColor(playerid, Color::MinigameTransparentBlue);
    }
    Streamer_Update(playerid);
    SetPlayerVisibility(playerid, false);

    // Freeze the player for 4 seconds to give the objects a chance to load.
    TogglePlayerControllable(playerid, 0);

    SetCameraBehindPlayer(playerid);

    GameTextForPlayer(playerid, "~g~Please Wait...~n~~w~Loading Textures", 2000, 4);

    // Todo: Use the main timers and stop being lazy!
    SetTimerEx("Island_Dm_Unfreeze", 2000, 0, "d", playerid);

    ShowBoxForPlayer(playerid, "Your objective is to defeat the other team! Go and kill 'em!");
}

forward Island_Dm_Unfreeze(playerid);

public Island_Dm_Unfreeze(playerid)
{
    TogglePlayerControllable(playerid, 1);
    GameTextForPlayer(playerid, "~w~Use ~b~stealth~w~ to take out the ~r~enemies~w~.", 5000, 5);
}

// Return the number of players in a team.
islandDMGetTeamCount(iTeamID)
{
    new islandTeamCount;

    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        if(!Player(i)->isConnected() || IsPlayerNPC(i))
        {
            continue;
        }

        if(!IsPlayerInMinigame(i))
        {
            continue;
        }

        if(PlayerInfo [i][PlayerStatus] != STATUS_ISLANDDM)
        {
            continue;
        }

        if(islandDMTeam[i] != iTeamID)
        {
            continue;
        }

        islandTeamCount++;
    }
    return islandTeamCount;
}



islandDMSetTeam(playerid)
{
    if(!n_IslandDMBalancer)
    {
        islandDMTeam[playerid] = ISLAND_DM_TEAM_A;
        n_IslandDMBalancer = true;
    }
    else
    {
        n_IslandDMBalancer = false;
        islandDMTeam[playerid] = ISLAND_DM_TEAM_B;

    }
    return islandDMTeam[playerid];
}

islandDMRemovePlayer(playerid)
{
    islandDMTeam[playerid] = NO_TEAM;
    SetPlayerTeam(playerid, NO_TEAM);
    PlayerInfo[playerid][PlayerStatus] = STATUS_NONE;
    SetPlayerVisibility(playerid, true);

    ReleasePlayerGameColor(playerid);

    if(islandDMGetTeamCount(ISLAND_DM_TEAM_A) == 1)
    {
        for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
        {
            if(!Player(i)->isConnected() || IsPlayerNPC(i))
            {
                continue;
            }

            if(!IsPlayerInMinigame(i))
            {
                continue;
            }

            if(PlayerInfo [i][PlayerStatus] != STATUS_ISLANDDM)
            {
                continue;
            }

            SetPlayerVisibility(playerid, true);
            GameTextForPlayer(i, "~g~You win!", 5000, 5);
            GiveRegulatedMoney(i, MinigameVictory, 2 /* participants */);
            islandDMTeam[i] = NO_TEAM;
            SetPlayerTeam(i, NO_TEAM);
            SpawnPlayer(i);
            PlayerInfo [ i ] [ PlayerStatus ] = STATUS_NONE ;

        }
        MinigameTypeInfo[Players] = 0;
        MinigameTypeInfo[Progress] = 0;
        MinigameTypeInfo[CurrentMinigame] = STATUS_NONE;
        SendClientMessageToAll(Color::Information, "* The FBI have won the Island DM!");
    }
    else if (islandDMGetTeamCount(ISLAND_DM_TEAM_B) == 1)
    {

        for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
        {
            if(!Player(i)->isConnected() || IsPlayerNPC(i))
            {
                continue;
            }

            if(!IsPlayerInMinigame(i))
            {
                continue;
            }

            if(PlayerInfo [i][PlayerStatus] != STATUS_ISLANDDM)
            {
                continue;
            }

            SetPlayerVisibility(playerid, true);
            GameTextForPlayer(i, "~g~You win!", 5000, 5);
            GiveRegulatedMoney(i, MinigameVictory, 2 /* participants */);
            islandDMTeam[i] = NO_TEAM;
            SetPlayerTeam(i, NO_TEAM);
            SpawnPlayer(i);
            PlayerInfo [ i ] [ PlayerStatus ] = STATUS_NONE;
        }
        MinigameTypeInfo[Players] = 0;
        MinigameTypeInfo[Progress] = 0;
        MinigameTypeInfo[CurrentMinigame] = STATUS_NONE;
        SendClientMessageToAll(Color::Information, "* The Soldiers have won the Island DM!");
    }
}
