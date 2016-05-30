// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/*
---------------------------------------------------------------------------------
|          Las Venturas Playground 2.90 -- Casino Robbery Minigame              |
|-------------------------------------------------------------------------------|
|      Author: Tomos Jenkins - tomozj                                           |
|                                                                               |
|In this minigame, players must be either the robbers or the guards.            |
|                                                                               |
|* The Robbers                                                                  |
|They must infiltrate the casino via either the air or the ground, and must     |
|escape with money. This would earn the robbers a lot of money, if they succeed.|
|                                                                               |
|* The Guards                                                                   |
|They must protect the casino from being infiltrated and robbed, by any means   |
|neccessary. If the casino guards can stop the robbers from breaking in for a   |
|set period of time, then they win, and are given a 'bonus' for their hard work.|
---------------------------------------------------------------------------------
*/

// Defines
#define ROBBERY_TIMELIMIT 420   // How long we have to rob the casino - 8 min
#define ROBBERY_TEAMATTACK 0    // id for the attack team
#define ROBBERY_TEAMDEFEND 1    // ^^ defend ^^
#define ROBSTATUS_NONE 0        // status: none
#define ROBSTATUS_SIGNUP 1      // status: signup
#define ROBSTATUS_PLAYING 2     // status: playing
// #define MAX_ROBBERY_PHASES 5    // how many phases?
#define ROBBERY_MINPLAYERS 4    // minimum players that can join
#define ROBBERY_MAXPLAYERS 32   // 16 players max can join
#define ROBBERY_SIGNUPTIME 30   // how many seconds players have until the minigame starts
#define ROBBERY_VWORLD 69       // the vworld for this game
#define ROBBERY_STEALAMOUNT teamCount[0]*25  // How muc needs to be stolen
#define ROBBERY_BOMBTIME    10  // how long it'll take for the bomb to explode

// Phases
// [0] - Attackers going into the casino
// [1] - Attackers attempting to breach the back-end
// [2] - Attackers attempting to break open the door
// [3] - Attackers stealing cash
// [4] - Attackers escaping


// Enums..
enum enumCasinoPlayer
{
    status,
    team,
    skin,
    finished
}
enum enumCasino
{
    status,
    phase,
    timer,
    bomb,
    steal,
    winners,
    Text:countdownTD,
    Text:stealTD,
    Text:bombTD,
    Text:mainTD,
    finished,
    end
}

/*enum enumCasinoCars
{
    first,
    last,
    first2,
    last2
}*/

// STATIC Variables -- can only be accessed from this file (create Get<X> functions)
static playerCasinoData[MAX_PLAYERS][enumCasinoPlayer];
static casinoData[enumCasino];
static teamCount[2];
static casinoCars[20];
static casinoSignupCount;
static DynamicObject: vaultObject;
static DynamicObject: doorObject;

// CRobbery__Initialize
// This is run at the start of the game, to get things going.
CRobbery__Initialize()
{
    CRobbery__ResetVars();
    CRobbery__CreateTDs();
}

// CRobbery__ResetVars
// Resets all of the variables to their default values.
CRobbery__ResetVars()
{
    for(new i=0; i<2; i++)
        teamCount[i] = 0;

    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
        CRobbery__ResetPlayerVars(i);

    casinoSignupCount = 0;
    casinoData[status] = ROBSTATUS_NONE;
    casinoData[phase] = 0;
    casinoData[timer] = 0;
    for(new i=0; i<20; i++)
    {
        casinoCars[i] = -1;
    }
    casinoData[bomb] = -1;
    casinoData[steal] = 0; // amount stolen aye
    casinoData[winners] = -1; // default winners :)
    casinoData[finished] = 0;
    casinoData[end] = 0;

    TextDrawHideForAll(casinoData[countdownTD]);
    TextDrawHideForAll(casinoData[stealTD]);
    TextDrawHideForAll(casinoData[bombTD]);
    TextDrawHideForAll(casinoData[mainTD]);
//  if(casinoData[countdownTD] != Text:0)
//  {
//      TextDrawHideForAll(casinoData[countdownTD]);
//      TextDrawDestroy(casinoData[countdownTD]);
//      casinoData[countdownTD] = Text:0;
//  }
//  if(casinoData[stealTD] != Text:0)
//  {
        TextDrawHideForAll(casinoData[stealTD]);
//      TextDrawDestroy(casinoData[stealTD]);
//      casinoData[stealTD] = Text:0;
//  }
//  if(casinoData[bombTD] != Text:0)
//   {
//  TextDrawHideForAll(casinoData[bombTD]);
    //  TextDrawDestroy(casinoData[bombTD]);
    //  casinoData[bombTD] = Text:0;
//  }
//  if(casinoData[mainTD] != Text:0)
//  {
//      TextDrawHideForAll(casinoData[mainTD]);
     //   TextDrawDestroy(casinoData[mainTD]);
//      casinoData[mainTD] = Text:0;
//  }
}


// CRobbery__HidePlayerTextDraws
// This is called from CRobbery__PlayerExit and appropriately hides
// all the textdraws showing for the player.
CRobbery__HidePlayerTextDraws(playerid)
{
    TextDrawHideForPlayer(playerid, casinoData[countdownTD]);
    TextDrawHideForPlayer(playerid, casinoData[stealTD]);
    TextDrawHideForPlayer(playerid, casinoData[bombTD]);
    TextDrawHideForPlayer(playerid, casinoData[mainTD]);
}

// CRobbery__ResetPlayerVars
// Clears player data arrays for a player
CRobbery__ResetPlayerVars(i)
{
    ResetPlayerGameStateVariables(i);

    playerCasinoData[i][status] = ROBSTATUS_NONE;
    playerCasinoData[i][team] = -1;
    playerCasinoData[i][skin] = 1;
    playerCasinoData[i][finished] = 0;
}

// CRobbery__Build
// Builds the minigame's stuff depending on which phase we're currently at.
CRobbery__Build(phaseid)
{
    new casinoHunter;

    if(phaseid == 0) {
        // Currently, the attackers are going to the casino.

        // Plenty of cars - no arguing.
        casinoCars[0] = VehicleManager->createVehicle(560, 955.6042, 1753.7191, 8.3528, 268.0238, 3, 3); // sultan 1
        casinoCars[1] = VehicleManager->createVehicle(560, 956.1913, 1745.8688, 8.3534, 267.2648, 3, 3); // sultan 2
        casinoCars[2] = VehicleManager->createVehicle(560, 956.3608, 1736.9227, 8.3535, 267.7867, 3, 3); // sultan 3
        casinoCars[3] = VehicleManager->createVehicle(487, 976.7729, 1740.3782, 8.8248,  90.1625, 3, 3); // maverick 1
        casinoCars[4] = VehicleManager->createVehicle(487, 977.5529, 1728.1740, 8.8496,  92.6783, 3, 3); // maverick 2
        casinoCars[5] = VehicleManager->createVehicle(487, 956.9579, 1721.7053, 8.8256, 303.8264, 3, 3); // maverick 3

        for(new i=0; i<6; i++) {
            // foreach car, we assign to the robbery virtual world
            SetVehicleVirtualWorld(casinoCars[i], ROBBERY_VWORLD);
        }

        CRobbery__TeamMsg(ROBBERY_TEAMATTACK, Color::Green, "Enter the casino via either the roof or main entrance to begin.");
        CRobbery__TeamMsg(ROBBERY_TEAMDEFEND, Color::Green, "Stop the attackers from stealing the cash, by any means necessary. They're coming!");

        // We destroy first in case it wasn't destroyed properly last time.
        if(IsValidDynamicObject(vaultObject)) DestroyDynamicObject(vaultObject);

        vaultObject = CreateDynamicObject(2634, 2144.1, 1627.1, 994.2, 0.0, 0.0, 180.0);

        if(!IsValidDynamicObject(doorObject))
            doorObject = CreateDynamicObject(10671, 2148.90, 1604.82, 998.96, 90.00, 90.00, 0.00);

        for (new i = 0; i <= PlayerManager->highestPlayerId(); i++) {
            if(CRobbery__GetPlayerStatus(i) == ROBSTATUS_PLAYING) {
                if(CRobbery__GetPlayerTeam(i) == ROBBERY_TEAMATTACK) {
                    // They need to see the casino entrance
                    SetPlayerCheckpoint(i, 2190.6699, 1676.0261, 11.3616, 5.0);
                }
            }
        }

    } else if(phaseid == 1) {
        // The attackers are going for the back-end

        vaultObject = CreateDynamicObject(2634, 2144.1, 1627.1, 994.2, 0.0, 0.0, 180.0);

        CRobbery__TeamMsg(ROBBERY_TEAMDEFEND, Color::Green, "The attackers have entered the casino.");

        for (new i = 0; i <= PlayerManager->highestPlayerId(); i++) {
            if(CRobbery__GetPlayerStatus(i) == ROBSTATUS_PLAYING) {
                if(CRobbery__GetPlayerTeam(i) == ROBBERY_TEAMATTACK) {
                    // They need to see the back-end entrance
                    SetPlayerCheckpoint(i, 2147.7671, 1604.7980, 1006.1707, 2.0);
                }
            }
        }

    } else if(phaseid == 2) {
        // The attackers are going for the vault door

        vaultObject = CreateDynamicObject(2634, 2144.1, 1627.1, 994.2, 0.0, 0.0, 180.0);

        CRobbery__TeamMsg(ROBBERY_TEAMATTACK, Color::Green, "Press F in front of the casino door to arm the bomb in order to open the vault door.");

        for (new i = 0; i <= PlayerManager->highestPlayerId(); i++) {
            if(CRobbery__GetPlayerStatus(i) == ROBSTATUS_PLAYING) {
                if(CRobbery__GetPlayerTeam(i) == ROBBERY_TEAMATTACK) {
                    // They need to see the vault entrance
                    SetPlayerCheckpoint(i, 2144.3140,1626.1134,993.6882, 1.0);
                }
            }
        }


    } else if(phaseid == 3) {
        // The attackers are stealing the cash

        CreateExplosion(2144.2112, 1626.8358, 993.7640, 0, 5.0);
        vaultObject = CreateDynamicObject(2634, 2144.1, 1627.1, 994.2, 0.0, 0.0, 180.0);
        MoveDynamicObject(vaultObject, 2146.1, 1627.1, 994.2, 0.4);

        PlaySoundForPlayersInRange(3401, 250, 2146.1, 1627.1, 994.2);

        CRobbery__TeamMsg(ROBBERY_TEAMATTACK, Color::Green, "Run into the vault to get the cash. The more players you use, the faster this will be.");


    } else {
        // The attackers are escaping
        casinoCars[6]  = VehicleManager->createVehicle(411, 2364.5642, 1655.7797, 10.5451,  92.0988, 3, 3); // infernus car park 1
        casinoCars[7]  = VehicleManager->createVehicle(411, 2363.6465, 1659.3851, 10.5474,  87.9270, 3, 3); // infernus car park 2
        casinoCars[8]  = VehicleManager->createVehicle(411, 2371.3623, 1676.9955, 10.5474, 357.4462, 3, 3); // infernus car park 3
        casinoCars[9]  = VehicleManager->createVehicle(411, 2381.4033, 1676.5944, 10.5474, 358.3474, 3, 3); // infernus car park 4
        casinoCars[10] = VehicleManager->createVehicle(560, 2126.5605, 1718.1333, 10.4568,  69.8276, 3, 3); // sultan escape 1
        casinoCars[11] = VehicleManager->createVehicle(560, 2134.7888, 1714.6840, 10.4536,  66.1833, 3, 3); // sultan escape 2
        casinoCars[12] = VehicleManager->createVehicle(560, 2142.6501, 1710.2723, 10.4575,  58.1864, 3, 3); // sultan escape 3
        casinoCars[13] = VehicleManager->createVehicle(560, 2151.5085, 1703.6650, 10.4553,  51.5191, 3, 3); // sultan escape 4
        casinoCars[14] = VehicleManager->createVehicle(560, 2322.4556, 1758.4263, 10.4494,   0.8114, 3, 3); // sultan escape back 1
        casinoCars[15] = VehicleManager->createVehicle(560, 2332.2986, 1759.8260, 10.4483, 358.5738, 3, 3); // sultan escape back 2
        casinoCars[16] = VehicleManager->createVehicle(560, 2332.0334, 1751.0597, 10.4498, 358.1865, 3, 3); // sultan escape back 3
        casinoCars[17] = VehicleManager->createVehicle(560, 2322.2375, 1726.7031, 10.4512,   0.3891, 3, 3); // sultan escape back 4
        casinoCars[18] = VehicleManager->createVehicle(425, 2140.3970, 1727.1718, 20.5673,  70.9695, 1, 1); // Hunter 1

        casinoHunter = casinoCars[18];

        // We wanna lock the doors for the attackers -- the defenders are supposed
        // to use this to totally rape!! :+
        for (new i = 0; i <= PlayerManager->highestPlayerId(); i++) {
            if(CRobbery__GetPlayerStatus(i) == ROBSTATUS_PLAYING) {
                if(CRobbery__GetPlayerTeam(i) == ROBBERY_TEAMDEFEND) {
                    // Playing the minigame, and is defending - doors unlocked;
                    SetVehicleParamsForPlayer(casinoHunter, i, 0, 0);
                    continue;
                } else {
                    // Playing the minigame, and is attacking - doors locked;
                    SetVehicleParamsForPlayer(casinoHunter, i, 0, 1);
                    continue;
                }
            }
        }

        for(new i=6; i<19; i++) {
            // We assign the cars to a virtual world
            SetVehicleVirtualWorld(casinoCars[i], ROBBERY_VWORLD);
        }

        CRobbery__TeamMsg(ROBBERY_TEAMATTACK, Color::Green, "Escape to the base where you started. There are escape vehicles in front, or");
        CRobbery__TeamMsg(ROBBERY_TEAMATTACK, Color::Green, "you may parachute off the roof in order to access many vehicles stored at the");
        CRobbery__TeamMsg(ROBBERY_TEAMATTACK, Color::Green, "rear of the building. Be fast - the defenders will be chasing you to the end!");

        for (new i = 0; i <= PlayerManager->highestPlayerId(); i++) {
            if(CRobbery__GetPlayerStatus(i) == ROBSTATUS_PLAYING) {
                if(CRobbery__GetPlayerTeam(i) == ROBBERY_TEAMATTACK) {
                    // They need to see the vault entrance
                    SetPlayerCheckpoint(i, 952.5846,1727.0299,8.6484, 10.0);
                }
            }
        }

    }
}
// CRobbery__CreateTDs
// Called from OnGameModeInit, creates the textdraws
CRobbery__CreateTDs()
{
    casinoData[countdownTD] = TextDrawCreate(24,311, "Loading...");
    TextDrawAlignment(casinoData[countdownTD],0);
    TextDrawBackgroundColor(casinoData[countdownTD],0x000000ff);
    TextDrawFont(casinoData[countdownTD],2);
    TextDrawLetterSize(casinoData[countdownTD],0.399999,1.599999);
    TextDrawColor(casinoData[countdownTD],0xffffffff);
    TextDrawSetProportional(casinoData[countdownTD],1);
    TextDrawSetShadow(casinoData[countdownTD],1);


    casinoData[bombTD] = TextDrawCreate(24.000000,290.000000, "Loading...");
    TextDrawAlignment(casinoData[bombTD],0);
    TextDrawBackgroundColor(casinoData[bombTD],0x000000ff);
    TextDrawFont(casinoData[bombTD],2);
    TextDrawLetterSize(casinoData[bombTD],0.399999,1.599999);
    TextDrawColor(casinoData[bombTD],0xffffffff);
    TextDrawSetProportional(casinoData[bombTD],1);
    TextDrawSetShadow(casinoData[bombTD],1);

    casinoData[stealTD] = TextDrawCreate(24.000000,285.000000,"Loading...");
    TextDrawAlignment(casinoData[stealTD],0);
    TextDrawBackgroundColor(casinoData[stealTD],0x000000ff);
    TextDrawFont(casinoData[stealTD],2);
    TextDrawLetterSize(casinoData[stealTD],0.399999,1.599999);
    TextDrawColor(casinoData[stealTD],0xffffffff);
    TextDrawSetProportional(casinoData[stealTD],1);
    TextDrawSetShadow(casinoData[stealTD],1);


    casinoData[mainTD] = TextDrawCreate(129.000000,414.000000,"Loading...");
    TextDrawAlignment(casinoData[mainTD],0);
    TextDrawBackgroundColor(casinoData[mainTD],0x000000ff);
    TextDrawFont(casinoData[mainTD],3);
    TextDrawLetterSize(casinoData[mainTD],0.599999,1.500000);
    TextDrawColor(casinoData[mainTD],0xffffffff);
    TextDrawSetOutline(casinoData[mainTD],1);
    TextDrawSetProportional(casinoData[mainTD],1);
    TextDrawSetShadow(casinoData[mainTD],1);
}

// CRobbery__UpdateTDs
// Updates all of the textdraws in use by the minigame. Destroys all, and then
// it goes ahead and re-creates them. To be called every second!
CRobbery__UpdateTDs()
{

    // We now go ahead and stop if the minigame isn't running. This avoids any
    // textdraws showing when not in the minigame.
    if(CRobbery__GetStatus() != ROBSTATUS_PLAYING)
        return 0;

    // --------- //
    // Countdown //
    // --------- //

    new strr[64];
    format(strr, 64, "Time remaining: %s", ConvertTime(casinoData[timer]));


    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        if(CRobbery__GetPlayerStatus(i) == ROBSTATUS_PLAYING)
        {
            TextDrawShowForPlayer(i,casinoData[countdownTD]);
        }
    }

    TextDrawSetString(casinoData[countdownTD], strr);

    // ---- //
    // Bomb //
    // ---- //



    if(casinoData[bomb] > 0)
    {

        new str[64];
        format(str, 64, "Bomb countdown: %s", ConvertTime(casinoData[bomb]));

        TextDrawSetString(casinoData[bombTD], str);

        for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
        {
            if(!Player(i)->isConnected())
                continue;

            if(CRobbery__GetPlayerStatus(i) != ROBSTATUS_PLAYING)
                continue;

            TextDrawShowForPlayer(i,casinoData[bombTD]);
        }

    }

    if(casinoData[bomb] <= 1)
    {
        for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
        {
            if(!Player(i)->isConnected())
                continue;

            if(CRobbery__GetPlayerStatus(i) != ROBSTATUS_PLAYING)
                continue;

            TextDrawHideForPlayer(i,casinoData[bombTD]);
        }

    }

    if(CRobbery__GetPhase() == 3)
    {
        // Attackers -> Stealing Cash [Extra TD]

        // ----- //
        // Steal //
        // ----- //
/*      if(casinoData[stealTD] != Text:0)
        {
            TextDrawDestroy(casinoData[stealTD]);
            casinoData[stealTD] = Text:0;
        }*/

        new str[64];
        format(str, 64, "Amount stolen: %d / %d", casinoData[steal], ROBBERY_STEALAMOUNT);

        for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
        {
            if(CRobbery__GetPlayerStatus(i) == ROBSTATUS_PLAYING && CRobbery__GetPhase() == 3)
            {
                TextDrawShowForPlayer(i,casinoData[stealTD]);
            }
        }
        TextDrawSetString(casinoData[stealTD], str);
    }
    return 1;
}

// CRobbery__DestroyAll
// Destroys absoloutely everything created by the minigame
CRobbery__DestroyAll()
{
    // We destroy the cars if they're existing in the minigame.
    CRobbery__UpdateTDs();


    if(IsValidDynamicObject(vaultObject)) DestroyDynamicObject(vaultObject);
    DestroyDynamicObject(doorObject);

    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++) {
        if(CRobbery__GetPlayerStatus(i) == ROBSTATUS_PLAYING) {
            if(CRobbery__GetPlayerTeam(i) == ROBBERY_TEAMATTACK) {
                // They need to see the casino entrance
                DisablePlayerCheckpoint(i);
            }
        }
    }

}

// Returns whether |playerId| is currently playing the robbery minigame.
bool: CRobbery__IsPlaying(playerId) {
    return playerCasinoData[playerId][status] == ROBSTATUS_PLAYING;
}


// CRobbery__OnInteriorChange
// When a player changes interior, we know about it.
CRobbery__OnInteriorChange(playerid, newinterior)
{
    if(CRobbery__GetPlayerStatus(playerid) != ROBSTATUS_PLAYING)
    {
        return 0;
    }


    if(newinterior != 0 && CRobbery__GetPlayerTeam(playerid) != ROBBERY_TEAMATTACK)
    {
        // they're entering.
        if(CRobbery__GetPhase() == 0)
        {
            // Phase needs updating!
            casinoData[phase] = 1;
            CRobbery__PhaseChange();
            return 1;
        }
    }

    return 1;
}

// CRobbery__OnCPEnter
// When a player enters a checkpoint, this is called
CRobbery__OnCPEnter(playerid)
{
    if(CRobbery__GetPlayerStatus(playerid) == ROBSTATUS_PLAYING)
    {
        if(GetPlayerInterior(playerid) == 0 && CRobbery__GetPhase() == 0)
        {
            // They're outside -- tell them to get in
            SendClientMessage(playerid, Color::Green, "Enter the casino.");
        }
        if(CRobbery__GetPlayerTeam(playerid) == ROBBERY_TEAMATTACK && CRobbery__GetPhase() == 2)
        {
            // They're @ vault, we tell them what to do
            GameTextForPlayer(playerid, "~r~Press ~y~F~r~ to arm bomb", 3000, 5);
        }
        DisablePlayerCheckpoint(playerid);
        return 1;
    }
    return 0;
}

// CRobbery__PhaseChange
// When a phase is changed, call this!
// we also handle the main textdraw from here.
CRobbery__PhaseChange(iIgnoreBuild=0)
{
    CRobbery__DestroyAll();

    if(!iIgnoreBuild)
        CRobbery__Build(CRobbery__GetPhase());


/*  if(casinoData[mainTD] != Text:0)
    {
        TextDrawDestroy(casinoData[mainTD]);
        casinoData[mainTD] = Text:0;
    }*/


    // ------ //
    // Autres //
    // ------ //

    if(CRobbery__GetPhase() == 0)
    {
     // Attackers -> Casino
        for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
        {
            if(CRobbery__GetPlayerStatus(i) == ROBSTATUS_PLAYING && CRobbery__GetPlayerTeam(i) == ROBBERY_TEAMATTACK)
            {
                TextDrawShowForPlayer(i, casinoData[mainTD]);
            }
        }

        TextDrawSetString(casinoData[mainTD], "~w~Kill the casino guards and breach the ~r~casino~w~.");

    } else if(CRobbery__GetPhase() == 1)
    {
        for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
        {
            if(CRobbery__GetPlayerStatus(i) == ROBSTATUS_PLAYING && CRobbery__GetPlayerTeam(i) == ROBBERY_TEAMATTACK)
            {
                TextDrawShowForPlayer(i, casinoData[mainTD]);
            }
        }
        TextDrawSetString(casinoData[mainTD], "~w~Get into the ~r~casino back-end~w~.");
    } else if(CRobbery__GetPhase() == 2)
    {
     // Attackers -> Opening Vault [Extra TD]

        for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
        {
            if(CRobbery__GetPlayerStatus(i) == ROBSTATUS_PLAYING && CRobbery__GetPlayerTeam(i) == ROBBERY_TEAMATTACK)
            {
                TextDrawShowForPlayer(i, casinoData[mainTD]);
            }
        }
        TextDrawSetString(casinoData[mainTD], "~w~Get into the ~r~casino vault~w~.");

    } else if(CRobbery__GetPhase() == 4)
    {
        for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
        {
            if(CRobbery__GetPlayerStatus(i) == ROBSTATUS_PLAYING && CRobbery__GetPlayerTeam(i) == ROBBERY_TEAMATTACK)
            {
                TextDrawShowForPlayer(i, casinoData[mainTD]);
            }
        }
        TextDrawSetString(casinoData[mainTD], "~w~Escape to your ~r~base~w~.");
    }

    // If they're going into the back-end or breaking open the vault door, don't
    // reset their position! That's just annoying.
    if(CRobbery__GetPhase() >= 0 || CRobbery__GetPhase() <= 3) return;

    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        if(CRobbery__GetPlayerStatus(i) == ROBSTATUS_PLAYING)
        {
            // This person is playing.
            CRobbery__SpawnPosition(i);
        }
    }

    return;
}

// CRobbery__OnCommand
// When someone types /robbery, we join them into the game here.
CRobbery__OnCommand(playerid)
{

    if(CRobbery__GetStatus() == ROBSTATUS_PLAYING) {

        // Already active
        SendClientMessage(playerid, COLOR_RED, "This minigame is currently underway. Please wait, and try again later.");
        return 1;

    } else if(CRobbery__GetPlayerStatus(playerid) == ROBSTATUS_SIGNUP) {

        // Signed up already
        SendClientMessage(playerid, COLOR_RED, "You've already signed up for this minigame!");
        return 1;

    } else if(!IsPlayerMinigameFree(playerid)) {

        // Signed up with a different minigame
        SendClientMessage(playerid,COLOR_RED,"You've already signed up with a different minigame.");
        return 1;

    } else if(casinoSignupCount == ROBBERY_MAXPLAYERS) {
        // Full!
        SendClientMessage(playerid, COLOR_RED, "This minigame is full. Please wait, and try again later.");
        return 1;
    }

    new const price = GetEconomyValue(RobberyParticipation);

    if(GetPlayerMoney(playerid) < price) {
        new message[128];
        format(message, sizeof(message), "You need $%s to sign up for this minigame!", formatPrice(price));

        SendClientMessage(playerid, COLOR_RED, message);
        return 1;
    }

    if(CRobbery__GetStatus() == ROBSTATUS_NONE)
    {
        Announcements->announceMinigameSignup(CasinoRobberyMinigame, "Casino Robbery", "/robbery", 250, playerid);
        GameTextForAllEx("~y~Casino Robbery~w~ is now signing up!~n~Want to join? ~r~/robbery~w~!", 5000, 5);
        casinoData[status] = ROBSTATUS_SIGNUP;
        casinoData[timer] = ROBBERY_SIGNUPTIME;
    }

    new string[128];
    Responses->respondMinigameSignedUp(playerid, CasinoRobberyMinigame, "Casino Robbery", 30);
    format(string, sizeof(string), "~r~~h~%s~w~ has signed up for ~y~Casino Robbery~w~ (~p~/robbery~w~)", Player(playerid)->nicknameString());
    NewsController->show(string);

    format(string, 128, "%s (Id:%d) has signed up for /robbery.", PlayerName(playerid), playerid);
    Admin(playerid, string);

    TakeRegulatedMoney(playerid, RobberyParticipation);
    CRobbery__PlayerJoin(playerid);
    return 1;
}

// CRobbery__MenuActivate
// When someone picks 'robbery' from the /minigames menu.
CRobbery__MenuActivate(playerid)
{
    // Best way of doing it;
    CRobbery__OnCommand(playerid);
}

// CRobbery__OnKey
// When someone hits a key, this is called.
CRobbery__OnKey(playerid, key)
{
    if(CRobbery__GetPlayerStatus(playerid) != ROBSTATUS_PLAYING) return 0;
    if(CRobbery__GetPhase() != 2) return 0;
    if(casinoData[bomb] > -1) return 0;

    if(IsPlayerInRangeOfPoint(playerid, 1.2, 2144.3140, 1626.1134, 993.6882) && CRobbery__GetPlayerTeam(playerid) == ROBBERY_TEAMATTACK)
    {
        if(key == 16)
        {
            // They hit the f key!!!
            casinoData[bomb] = ROBBERY_BOMBTIME;
            new string[128];
            format(string, 128, "* Bomb armed! %d seconds until explosion..", ROBBERY_BOMBTIME);
            CRobbery__TeamMsg(ROBBERY_TEAMATTACK, COLOR_RED, string);
            CRobbery__TeamMsg(ROBBERY_TEAMDEFEND, COLOR_RED, string);

            for (new i = 0; i <= PlayerManager->highestPlayerId(); i++) {
                if(CRobbery__GetPlayerStatus(i) != ROBSTATUS_PLAYING) continue;
                PlayerPlaySound(i, 1057, 0, 0, 0);
            }
        }
    }
    return 1;
}

// CRobbery__OnText
// When someone types something, this is called.
CRobbery__OnText(playerid, text[])
{
    if(CRobbery__GetPlayerStatus(playerid) != ROBSTATUS_PLAYING) {
        // Not taking part..
        return 0;
    }

    if(!strcmp(text[0], "!", true, 1)) {
        // TEAM CHAT YAYA
        new string[256];
        new teamstr[7];
        new teamid = CRobbery__GetPlayerTeam(playerid);
        if(teamid == 0) teamstr = "Attack";
        else teamstr = "Defend";
        format(string, 256, "* [Team %s] %s: %s", teamstr, PlayerName(playerid), text[1]);
        CRobbery__TeamMsg(teamid, COLOR_LIGHTBLUE, string);
        return 1;
    }

    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++) {
        if(CRobbery__GetPlayerStatus(i) == ROBSTATUS_PLAYING)
            SendPlayerMessageToPlayer(i, playerid, text);
    }
    return 1;
}

// CRobbery__Disconnect
// If a player disconnects, then.. yeah.
CRobbery__Disconnect(playerid)
{
    if(CRobbery__GetPlayerStatus(playerid) > ROBSTATUS_NONE)
        CRobbery__PlayerExit(playerid);
}

// CRobbery__Process
// This is called every second -- our main timer.
CRobbery__Process()
{
    if(CRobbery__GetStatus() == ROBSTATUS_SIGNUP) {
        // Signup period. We lower the timer..
        casinoData[timer]--;
        if(casinoData[timer] == 0) {
            // Time's up!
            if(casinoSignupCount < ROBBERY_MINPLAYERS) {
                // Only one player :(
                for (new i = 0; i <= PlayerManager->highestPlayerId(); i++) {
                    if(CRobbery__GetPlayerStatus(i) == ROBSTATUS_SIGNUP) 
                    {
                        // We must let them know.
                        ShowBoxForPlayer(i, "Not enough players have signed up for Casino Robbery. You have been refunded.");
                        GiveRegulatedMoney(i, RobberyParticipation);
                    }
                }
                CRobbery__ResetVars();
                return;
            } else {
                CRobbery__Start();
            }
        }
    }

    // From here onwards is only whilst the game is running -->
    if(CRobbery__GetStatus() < ROBSTATUS_PLAYING) {
        return;
    }

    CRobbery__UpdateTDs();  // Updates all textdraws used by the minigame..

    // Timer stuff for acutal minigame.
    casinoData[timer]--;
    new notice[128];
    if(casinoData[timer] == 0) {
        // Defenders are winners!
        format(notice, sizeof(notice), "~y~Casino Robbery~w~ has finished: ~b~~h~Defenders~w~ have won!");
        NewsController->show(notice);
        casinoData[winners] = ROBBERY_TEAMDEFEND;
        CRobbery__End();
        return;
    }


    // Stuff which doesn't need to loop through all players.

    if(CRobbery__GetPhase() == 0) {
        // Going to the casino

    } else if(CRobbery__GetPhase() == 1) {
        // Breaching the back end

    } else if(CRobbery__GetPhase() == 2) {
        // Breaking into the vault

        if(casinoData[bomb] > -1) {
            // Bomb armed.
            if(casinoData[bomb] == 0)
            {
                // BOOM!
                casinoData[phase]++;
                CRobbery__PhaseChange();
                CRobbery__TeamMsg(ROBBERY_TEAMATTACK, COLOR_RED, "BOOM!");
                CRobbery__TeamMsg(ROBBERY_TEAMDEFEND, COLOR_RED, "BOOM!");
                casinoData[bomb] = -1; // If we don't do this, then we see '0 seconds'

                if(casinoData[bombTD] != Text:0)
                {
            //      TextDrawDestroy(casinoData[bombTD]);
            //      casinoData[bombTD] = Text:0;
                }
                return;
            }
            casinoData[bomb]--;
            CRobbery__UpdateTDs();
            return;
        }

    } else if(CRobbery__GetPhase() == 3) {
        // Stealing the cash

    } else if(CRobbery__GetPhase() == 4) {
        // Escaping

    }

    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        if(CRobbery__GetPlayerStatus(i) != ROBSTATUS_PLAYING) continue;
        else
        {
            new Float:Rx, Float:Ry, Float:Rz;
            GetPlayerPos(i, Rx, Ry, Rz);

            if(Rx > 2167.2129 && Rx < 2169.1336 && Ry > 1617.4784 && Ry < 1619.6327 && Rz > 999 && Rz < 1002) {
                // Using door to go out.
                SetPlayerPos(i, 2171.4597, 1618.3436, 999.9766);
                SetPlayerFacingAngle(i, 271.6770);

            }

            if(Rx > 2169.1337 && Rx < 2170.2368 && Ry > 1617.5104 && Ry < 1619.6559 && Rz > 999 && Rz < 1002) {
                // Using door to go in.
                SetPlayerPos(i, 2164.5947, 1618.9357, 999.9747);
                SetPlayerFacingAngle(i, 88.7353);

            }

            // Only the attackers..
            if(CRobbery__GetPlayerTeam(i) == ROBBERY_TEAMDEFEND) continue;

            if(CRobbery__GetPhase() == 0) {
                // nothing rly happens here, keep this intact in case.
            } else if(CRobbery__GetPhase() == 1) {
                // they're going for the back end.
                if(Rx > 2143.0161 && Rx < 2149.4712 && Ry > 1596.3927 && Ry < 1604.2245 && Rz > 999) {
                    // They're in.
                    CRobbery__TeamMsg(ROBBERY_TEAMATTACK, Color::Green, "You, the attackers, have breached the casino back-end.");
                    CRobbery__TeamMsg(ROBBERY_TEAMDEFEND, Color::Green, "The attackers have breached the casino back-end. Stop them from getting to the vault!");

                    casinoData[phase]++;
                    CRobbery__PhaseChange();
                    continue;
                }


            } else if(CRobbery__GetPhase() == 2)
            {
                // nothing

            } else if(CRobbery__GetPhase() == 3)
            {
                if(Rx > 2141.2017 && Rx < 2147.1101 && Ry > 1627.7072 && Ry < 1642.5714 && Rz > 950.0 && GetPlayerState(i) == PLAYER_STATE_ONFOOT) {
                    // They're in the vault.
                    casinoData[steal]++;
                    CRobbery__UpdateTDs();
                }

                if(casinoData[steal] >= ROBBERY_STEALAMOUNT)
                {
                    // they've got all they need ;x
                    CRobbery__TeamMsg(ROBBERY_TEAMATTACK, Color::Green, "You've got the cash! Go go go!");
                    CRobbery__TeamMsg(ROBBERY_TEAMDEFEND, Color::Green, "They've got the cash! Kill them!");
                    casinoData[phase]++;
                    CRobbery__PhaseChange();
                    if(casinoData[stealTD] != Text:0)
                    {
                //      TextDrawDestroy(casinoData[stealTD]);
                //      casinoData[stealTD] = Text:0;
                    }
                    continue;
                }
            } else if(CRobbery__GetPhase() == 4) {
                new string[128];
                if(Rx > 947.5884 && Rx < 996.1572 && Ry > 1704.7852 && Ry < 1766.5408) {
                    // We add a player to the 'completed' list
                    if(playerCasinoData[i][finished] == 1) continue; // #care
                    playerCasinoData[i][finished] = 1;
                    casinoData[finished]++;
                    if(casinoData[finished] == teamCount[ROBBERY_TEAMATTACK])
                    {
                        // Win!
                        format(string, sizeof(string), "~y~Casino Robbery~w~ has finished: ~r~~h~Attackers~w~ have won!");
                        NewsController->show(string);
                        casinoData[winners] = ROBBERY_TEAMATTACK;
                        CRobbery__End();
                        return;
                    } else {
                        // We have to simply tell them.
                        format(string, 128, "* %s has reached the base. %d attackers left to go!", PlayerName(i),  teamCount[ROBBERY_TEAMATTACK] - casinoData[finished]);
                        CRobbery__TeamMsg(ROBBERY_TEAMATTACK, COLOR_PINK, string);
                    }
                }
            }
        }
    }
}

// CRobbery__Start
// We start the minigame -- split into teams, set colours etc.
CRobbery__Start()
{
    casinoData[status] = ROBSTATUS_PLAYING;
    casinoData[timer] = ROBBERY_TIMELIMIT;

    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++) {
        if(CRobbery__GetPlayerStatus(i) == ROBSTATUS_SIGNUP)
        {
            // yay
            playerCasinoData[i][status] =   ROBSTATUS_PLAYING;
            playerCasinoData[i][team] =     CRobbery__GenerateTeam();
            playerCasinoData[i][skin] =     CRobbery__RandomSkin(playerCasinoData[i][team]);

            EnablePlayerInteriorWeapons(i, 1); // Allow them to fight inside
            SendClientMessage(i, COLOR_PINK, "* Use the ! prefix to talk to your team.");

            CRobbery__SavePos(i);
            CRobbery__SpawnPosition(i);
            ClearPlayerMenus(i);
        }
    }

    CRobbery__InitializeMarkersForPlayer();

    CRobbery__PhaseChange(true);

    CRobbery__Build(CRobbery__GetPhase());
}

// CRobbery__End
// At the end of the minigame, we'll finish things up
CRobbery__End()
{
    casinoData[end] = 1; // CRobbery__PlayerExit uses this
    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        if(CRobbery__GetPlayerStatus(i) != ROBSTATUS_PLAYING) continue;
        if(CRobbery__GetPlayerTeam(i) == casinoData[winners])
        {
            GiveRegulatedMoney(i, RobberyVictory, casinoSignupCount);
        }
        CRobbery__PlayerExit(i);
    }

    for(new i=0; i<20; i++)
    {
        if(casinoCars[i] != -1)
        {
            VehicleManager->destroyVehicle(casinoCars[i]);
            casinoCars[i] = -1;
        }
    }

    CRobbery__DestroyAll();
    CRobbery__ResetVars();
    CRobbery__UpdateTDs();
}

// CRobbery__PlayerJoin
// When someone joins the game via signup..
CRobbery__PlayerJoin(playerid)
{
    casinoSignupCount++;
    playerCasinoData[playerid][status] = ROBSTATUS_SIGNUP;
}

// CRobbery__PlayerExit
// When someone leaves via /leave any time
CRobbery__PlayerExit(playerid)
{
    new iStr[128];


    casinoSignupCount--;
    new casteam = CRobbery__GetPlayerTeam(playerid);

    if(playerCasinoData[playerid][team] != -1)
    {
        teamCount[ casteam ] --;
    }

    // Done the hard stuff! Now, let's give them a refund if they never got to play.
    if(CRobbery__GetStatus() == ROBSTATUS_SIGNUP) {
        GiveRegulatedMoney(playerid, RobberyParticipation);
    } else {
        // Ugh oh. They're playing! Fuck!

        // Restore the marker colors for all players who played in the robbery.
        CRobbery__ReleaseMarkersForPlayer(playerid);

        CRobbery__LoadPos(playerid);
        CRobbery__ResetPlayerVars(playerid);
        SetPlayerTeam(playerid, NO_TEAM);
        DisablePlayerCheckpoint(playerid);
        DisablePlayerInteriorWeapons(playerid, 1); // Disallow them to fight inside

        CRobbery__HidePlayerTextDraws(playerid);

        // TEXTDRAW STUFF!
        CRobbery__UpdateTDs();
        TextDrawHideForPlayer(playerid,casinoData[countdownTD]);
        TextDrawHideForPlayer(playerid,casinoData[bombTD]);
        TextDrawHideForPlayer(playerid,casinoData[stealTD]);
        TextDrawHideForPlayer(playerid,casinoData[mainTD]);
        if(casinoData[end] == 0)
        {
            format(iStr,128,"* %s has left the Casino Robbery.",PlayerName(playerid));
            CRobbery__TeamMsg(ROBBERY_TEAMATTACK, Color::Green, iStr);
            CRobbery__TeamMsg(ROBBERY_TEAMDEFEND, Color::Green, iStr);

            if(teamCount[casteam] == 0)
            {
                // the team is empty! other team wins!
                if(casteam == 0)
                {
                    casinoData[winners] = 1;
                    format(iStr, sizeof(iStr), "~y~Casino Robbery~w~ has finished: ~b~~h~Defenders~w~ have won!");
                    NewsController->show(iStr);
                }
                if(casteam == 1)
                {
                    casinoData[winners] = 0;
                    format(iStr, sizeof(iStr), "~y~Casino Robbery~w~ has finished: ~r~~h~Attackers~w~ have won!");
                    NewsController->show(iStr);
                }

                CRobbery__End();
            }

            if(casinoSignupCount == 1)
            {
                // None left ffs.
                CRobbery__End();
                return;
            }
        }
    }

    CRobbery__ResetPlayerVars(playerid);
    CRobbery__CheckEnd();
    return;
}


// CRobbery__GetStatus
// Returns the status of the minigame
CRobbery__GetStatus()
{
    return casinoData[status];
}

// CRobbery__GetPhase
// Returns the phase of the minigame
CRobbery__GetPhase()
{
    return casinoData[phase];
}

// CRobbery__GetPlayerStatus
// Returns the status of a player in the minigame
CRobbery__GetPlayerStatus(playerid)
{
    return playerCasinoData[playerid][status];
}

// CRobbery__GetPlayerTeam
// Returns the team of a player in the minigame
CRobbery__GetPlayerTeam(playerid)
{
    return playerCasinoData[playerid][team];
}

// CRobbery__TeamMsg
// This sends a message to a team
CRobbery__TeamMsg(teamid, colorHEX, msg[])
{
    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++) {
        if(CRobbery__GetPlayerStatus(i) == ROBSTATUS_PLAYING && CRobbery__GetPlayerTeam(i) == teamid) {
            // They're playing, and on the right team. Lets send it..
            SendClientMessage(i, colorHEX, msg);
        }
    }
}

// CRobbery__RandomSkin
// Picks a skin that the player will be using
CRobbery__RandomSkin(teamid)
{
    new num = random(4);
    new skinreturn = 1;
    if(teamid == ROBBERY_TEAMATTACK) {
        if(num == 0) skinreturn = 82;
        else if(num == 1) skinreturn = 83;
        else if(num == 2) skinreturn = 84;
        else skinreturn = 82;
    } else {
        if(num == 0) skinreturn = 163;
        else if(num == 1) skinreturn = 164;
        else if(num == 2) skinreturn = 165;
        else skinreturn = 166;
    }
    return skinreturn;
}

// CRobbery__GenerateTeam
// Picks a team randomly for the player
CRobbery__GenerateTeam()
{
    // TESTING PURPOSES
    if(casinoSignupCount == 1){ teamCount[ROBBERY_TEAMDEFEND]++; return ROBBERY_TEAMDEFEND; }

    new teamID;
    if(teamCount[ROBBERY_TEAMATTACK] == teamCount[ROBBERY_TEAMDEFEND]) {
        // both equal
        teamID = random(2);
    } else {
        // check which one is bigger
        if(teamCount[ROBBERY_TEAMATTACK] > teamCount[ROBBERY_TEAMDEFEND]) {
            teamID = ROBBERY_TEAMDEFEND;
        } else {
            teamID = ROBBERY_TEAMATTACK;
        }
    }
    teamCount[teamID]++;
    return teamID;
}

// Initializes the markers of other players so they can't see the other team.
CRobbery__InitializeMarkersForPlayer() {
    for (new contestentId = 0; contestentId <= PlayerManager->highestPlayerId(); ++contestentId) {
        if (playerCasinoData[contestentId][status] != ROBSTATUS_PLAYING)
            continue;

        if (CRobbery__GetPlayerTeam(contestentId) == ROBBERY_TEAMATTACK)
            ColorManager->setPlayerMinigameColor(contestentId, Color::MinigameTransparentRed);

        if (CRobbery__GetPlayerTeam(contestentId) == ROBBERY_TEAMDEFEND)
            ColorManager->setPlayerMinigameColor(contestentId, Color::MinigameTransparentBlue);
    }
}

// Releases the markers of all other players which we previously overrode.
CRobbery__ReleaseMarkersForPlayer(contestentId) {
    if (playerCasinoData[contestentId][status] == ROBSTATUS_PLAYING)
        ColorManager->releasePlayerMinigameColor(contestentId);
}

// CRobbery__SpawnPosition
// This spawns the player at a different position, depending on what phase the game is in
CRobbery__SpawnPosition(playerid)
{
    ResetPlayerWeapons(playerid);

    if(casinoData[end] != 0)
        return 1;

    if(CRobbery__GetPlayerTeam(playerid) == ROBBERY_TEAMATTACK)
    {
        // Attacking. Now check which phase.
        if(CRobbery__GetPhase() == 0) {            // Breaking into casino
            SetPlayerPos(playerid, 969.5732, 1757.4968, 8.6484);

            SetPlayerInterior(playerid, 0);
        } else if(CRobbery__GetPhase() == 1) {     // Going into back end
            SetPlayerPos(playerid, 2235.8469,1676.2413,1008.3594);

            SetPlayerInterior(playerid, 1);
        } else if(CRobbery__GetPhase() == 2) {     // Going into the vault
            SetPlayerPos(playerid, 2144.6516,1603.0404,1006.1677);

            SetPlayerInterior(playerid, 1);
        } else if(CRobbery__GetPhase() == 3) {  // Going into the vault..
            SetPlayerPos(playerid, 2144.6516,1603.0404,1006.1677);

            SetPlayerInterior(playerid, 1);
        } else if(CRobbery__GetPhase() == 4) {      // escaping
            SetPlayerPos(playerid, 2154.6550,1621.1307,993.6882);

            SetPlayerInterior(playerid, 1);
        } else {
            SendClientMessage(playerid, COLOR_RED, "Error setting position..");
        }

        // Other stuff

        ResetPlayerGunData(playerid);

        GiveWeapon(playerid, 29, 999);   // 9mm Dual Colt Pistols
        GiveWeapon(playerid, 17, 2);      // Tear gas
        GiveWeapon(playerid, 34, 20);     // Sniper rifle
        SetPlayerHealth(playerid, 100.0);
        SetPlayerArmour(playerid, 0.0);

    }
    if(CRobbery__GetPlayerTeam(playerid) == ROBBERY_TEAMDEFEND)
    {
        // Defending. Now check which phase.
        if(CRobbery__GetPhase() == 0) {            // Breaking into casino
            SetPlayerPos(playerid, 2144.6516,1603.0404,1006.1677);

            SetPlayerInterior(playerid, 1);
        } else if(CRobbery__GetPhase() == 1) {     // Going into back end
            SetPlayerPos(playerid, 2144.6516,1603.0404,1006.1677);

            SetPlayerInterior(playerid, 1);
        } else if(CRobbery__GetPhase() == 2) {     // Going into the vault
            SetPlayerPos(playerid, 2154.6550,1621.1307,993.6882);

            SetPlayerInterior(playerid, 1);
        } else if(CRobbery__GetPhase() == 3) {  // Going into the vault..
            SetPlayerPos(playerid, 2154.6550,1621.1307,993.6882);

            SetPlayerInterior(playerid, 1);
        } else if(CRobbery__GetPhase() == 4) {      // escaping
            SetPlayerPos(playerid, 2146.6768,1613.6848,1000.9688);

            SetPlayerInterior(playerid, 1);
        } else {
            SendClientMessage(playerid, COLOR_RED, "Error setting position..");
        }

        // Other stuff

        ResetPlayerGunData(playerid);

        GiveWeapon(playerid, 23, 8560);   // Silenced pistol
        GiveWeapon(playerid, 31, 8560);   // M4
        GiveWeapon(playerid, 29, 8560);   // MP5
        GiveWeapon(playerid, 27, 8560);   // Combat shotgun
        GiveWeapon(playerid, 3,  1);      // Night Stick
        SetPlayerHealth(playerid, 100.0);
        SetPlayerArmour(playerid, 100.0);
    }

    // Other stuff
    SetPlayerTeam(playerid, CRobbery__GetPlayerTeam(playerid) + 10);
    SetPlayerSkinEx(playerid, playerCasinoData[playerid][skin]);
    SetPlayerVirtualWorld(playerid, ROBBERY_VWORLD);
    return 1;
}

// CRobbery__Spawn
// Called when someone spawns
CRobbery__Spawn(playerid)
{
    if(CRobbery__GetPlayerStatus(playerid) == ROBSTATUS_PLAYING)
    {
        CRobbery__SpawnPosition(playerid);
        return 1;
    }
    return 0;
}

// CRobbery__SavePos
// Saves the position and weapons of a player when they joined the minigame!
CRobbery__SavePos(playerid)
{
    SavePlayerGameState(playerid);
}

// CRobbery__LoadPos
// Puts the player back to their previous state.
CRobbery__LoadPos(playerid)
{
    // First it's easiest to simply respawn them
    OnPlayerSpawn(playerid);

    LoadPlayerGameState(playerid);
}

// CRobbery__CheckEnd
// Checks if every attacker has reached the base, and if so, ends the minigame
CRobbery__CheckEnd()
{
    // Is the robbery minigame in progress?
    if(CRobbery__GetStatus() != ROBSTATUS_PLAYING)
        return 0; // Nope, so no need to proceed with the check!

    if(casinoData[finished] == teamCount[ROBBERY_TEAMATTACK])
    {
        casinoData[winners] = ROBBERY_TEAMATTACK;
        CRobbery__End();
    }
    return 1;
}

// CRobbery__VehicleDeath
// Gets called OnVehicleDeath, respawns the vehicle and sets the vworld.
CRobbery__VehicleDeath(vehicleid) {
    for(new i=0; i<19; i++) {
        if (vehicleid == casinoCars[i]) {
            SetVehicleToRespawn(vehicleid);
            SetVehicleVirtualWorld(vehicleid, ROBBERY_VWORLD);
        }
    }
}