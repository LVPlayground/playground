// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/*****************************************************
       Random Deathmatch - Made for LVP 2.91.19

The player will spawn on a random spawn, with random
weapons. He has to kill all the other players.

    Author: thiaZ (6th April 2010)
            thiaz@t-online.de

******************************************************/
static Float:RandomSpawns[19][4] =
{
    {1476.42, 2835.16, 10.82, 359.84}, {1467.05, 2835.28, 10.82, 359.84},
    {1458.63, 2835.49, 10.82, 359.84}, {1450.07, 2881.24, 10.82, 178.09},
    {1472.43, 2881.16, 10.82, 178.09}, {1505.73, 2881.07, 10.82, 178.09},
    {1531.83, 2881.71, 10.82, 178.09}, {1532.40, 2860.78, 10.82, 86.70},
    {1533.08, 2833.48, 10.82, 89.62}, {1533.21, 2808.60, 10.82, 89.62},
    {1532.73, 2790.91, 10.82, 89.62}, {1502.49, 2806.14, 10.82, 329.50},
    {1481.71, 2813.29, 10.82, 356.26}, {1453.55, 2815.67, 10.82, 0.06},
    {1439.35, 2816.01, 10.82, 0.06}, {1419.54, 2828.01, 10.82, 271.82},
    {1419.98, 2847.58, 10.82, 268.60}, {1419.58, 2871.05, 10.82, 268.60},
    {1419.50, 2880.94, 10.82, 268.60}
};

static Float:WorldBounds[1][4] =
{
    {1540.8296, 1418.2867, 2882.7183, 2788.8674}
};

static RandomWeapons[15][2] =
{
    {31, 32}, {29, 26}, {25, 23}, {22, 27}, {24, 26},
    {25, 28}, {34, 22}, {33, 32}, {16, 24}, {18, 23},
    {29, 26}, {37, 4},  {23, 26}, {31, 28}, {26, 31}
};
//==============================================================================

stock SetPlayerUpForRandomDeathmatch(playerid)
{
    new iRandom = random(sizeof(RandomSpawns));
    SetPlayerPos(playerid, RandomSpawns[iRandom][0], RandomSpawns[iRandom][1], RandomSpawns[iRandom][2]);
    SetPlayerFacingAngle(playerid, RandomSpawns[iRandom][3]);

    ResetPlayerWeapons(playerid);
    iRandom = random(sizeof(RandomWeapons));
    GiveWeapon(playerid, RandomWeapons[iRandom][0], 1337);
    GiveWeapon(playerid, RandomWeapons[iRandom][1], 1337);

    GameTextForPlayer(playerid, "~n~~n~~y~Last man standing:~w~~n~~w~Kill them all! Do not die!", 5000, 3);
    SendClientMessage(playerid, COLOR_WHITE, "* Last man standing! Takeout your enemies. Do not die.");

    SetPlayerVirtualWorld(playerid, 865);
    SetPlayerWorldBounds(playerid, WorldBounds[0][0], WorldBounds[0][1], WorldBounds[0][2], WorldBounds[0][3]);
    return true;
}