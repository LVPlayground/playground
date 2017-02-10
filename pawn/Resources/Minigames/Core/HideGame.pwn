// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/********************************************************************************
*                                                                               *
*  Las Venturas Playground - Hide and Seek minigame                             *
*                                                                               *
*  This minigame is quite fun. Crew members can start this minigame, giving     *
*  everyone 30 seconds to signup. The seeker gets to see the entire map while   *
*  the rest has x minutes to search for a place to hide. Once hidden, the       *
*  seeker spawns and they search everyone. If the seeker is close to a hidden   *
*  player, that player gets frozen and a pickup gets spawned above their head   *
*  If the seeker sees them, they runs into the pickup and the player loses.     *
*  This continues untill everyone is found.                                     *
*                                                                               *
*  @copyright Copyright (c) 2006-2010 Las Venturas Playground                   *
*  @author    Matthias van Eeghem                                               *
*  @package   Minigames                                                         *
*  @version   $Id: HideGame.pwn 5123 2015-09-04 23:06:44Z Xanland $         *
*                                                                               *
********************************************************************************/

// States of the minigames
#define HS_STATE_NONE       0
#define HS_STATE_SIGNING_UP 1
#define HS_STATE_PLAYING    2

// Drop out reasons
#define HS_THROWNOUT_LEAVING    0
#define HS_THROWNOUT_GOTFOUND   1
#define HS_THROWNOUT_DISCONNECT 2
#define HS_THROWNOUT_INTERIOR   3
#define HS_THROWNOUT_DIED       4
#define HS_THROWNOUT_PUNCHING   5

// Other global defines.
#define HS_MINIMUM_PLAYERS  3
#define HS_VIRTUAL_WORLD    1355
#define LOCATIONS_AVAILABLE 19

new Float:aLocationCoordinates[LOCATIONS_AVAILABLE][3] =
{
    // X-Coord, Y-Coord, Z-Coord, interior as float.
    // First menu
    { -2640.362, 1405.1399, 906.46090 },        // Jizzy's Pleasure Dome
    { 2221.7842,-1150.8457, 1025.7969 },        // Jeffersons Motel
    { 2236.0139, 1677.4365, 1008.3594 },        // Caligulaz Casino
    { 1271.6637, -775.4266, 1091.9063 },        // Madd doggs mansion.
    { 2567.5200, -1294.590, 1063.2500 },        // Big Smokes Crack Denn
    { 235.5203,  149.4350,  1003.0300 },        // Las Venturas Police Departement
    { 380.2473,  173.4957,  1008.3828 },        // Main bank
    { 2008.1202, 1018.2942, 994.46880 },        // 4 Dragons
    // Second menu
    { 214.0211,  1868.1299, 13.140600 },        // Area 69
    { 2125.0742, -2276.071, 20.671875 },        // Russian Mafia Depot
    { -1449.269, -1588.883, 101.75130 },        // xBlueXFoxx's Summer Hideout
    { 2526.9000, -1667.600, 15.160000 },        // Grove Street
    { 1125.4304, -2037.401, 69.530288 },        // LVP Monument
    { -1400.236, 504.20092, 3.0390625 },        // Titanic for starters
    { 331.04228, 2591.5881, 17.462382 },        // Mayday!
    { 198.35183, -107.5945, 1.5503835 },        // Blueberry Square
    // Third menu
    { 2002.1793, 1544.4141, 13.585930 },        // LVP Thriller
    { 199.94100, 99.004000, 3.9840000 },        // Peru2600 kingdom
    { -82.56, -3.62, 3.117}                     // FiXeRs Sheep Farm
};

new aLocationInfo[LOCATIONS_AVAILABLE][3] =
{
    // max players, weather, interior

    // First menu
    {  8, -1, 3 },       // Jizzy's Pleasure Dome
    { -1, -1, 15 },      // Jeffersons Motel
    { -1, -1, 1 },       // Caligulaz Casino
    { -1, -1, 5 },       // Madd doggs mansion.
    { -1, -1, 2 },       // Big Smokes Crack Denn
    { -1, -1, 3 },       // Las Venturas Police Departement
    { -1, -1, 3 },       // Main bank
    { 10, -1, 10 },      // 4 Dragons
    // Second menu
    { -1, -1, 0 },       // Area 69
    {  6, -1, 0 },       // Russian Mafia Depot
    { 10, -1, 0 },       // xBlueXFoxx' Summer Hideout
    {  8, -1, 0 },       // Grove Street
    { -1, -1, 0 },       // LVP Monument
    { 10, -1, 0 },       // Titanic for starters
    { -1, -1, 0 },       // Mayday!
    {  4, -1, 0 },       // Blueberry Square
    // Third menu
    { -1, 16, 0 },       // LVP Thriller
    { -1, -1, 0 },       // Peru2600's Kingdom
    { -1, 9, 0}          // FiXeR's Sheep Farm
};

new aLocationName[LOCATIONS_AVAILABLE][128] =
{
    // The names of the locations.
    { "Jizzy's Pleasure Dome" },
    { "Jeffersons Motel" },
    { "Caligulaz Casino" },
    { "Madd Doggs Mansion" },
    { "Big Smokes' Crack Palace" },
    { "Las Venturas Police Station" },
    { "Las Venturas Main Bank" },
    { "4 Dragons Casino" },
    { "Area 69" },
    { "Russian Mafia Depot" },
    { "xBlueXFoxx's Summer Hideout" },
    { "Grove Street" },
    { "LVP Monument" },
    { "Titanic for starters" },
    { "Mayday!"},
    { "Blueberry Square"},
    { "LVP Thriller" },
    { "Peru2600's Kingdom"},
    { "FiXeR's Sheep Farm"}
};

new iHideGameState;
new Menu:mLocationMenu1;
new Menu:mLocationMenu2;
new Menu:mLocationMenu3;
new aHidePlayerState[MAX_PLAYERS];
new iSeekerPlayer;
new iHideGameSignups = 0;
new iHideGameTotalSignups = 0;
new iFrozenCount = 60;
new iFrozenCountDown;
new iHideStartTimer;
new iHideSecondCountDown;
new bHideFrozen[MAX_PLAYERS];
new iHidePlayerPunches[MAX_PLAYERS];
new iMapRunning;

forward CHideGame__Start( iLocation );
forward CHideGame__UnfreezeSeeker();
forward CHideGame__SecondTimer();

// Function: CHideGame__Initialize
// This function is called in OnGameModeInit, initializing our shizzle.
CHideGame__Initialize()
{
    // Reset some variables here.
    CHideGame__ResetVariables();

    // Create the menu.
    CHideGame__CreateMenus();

    // Create the maps needed
    CHideGame__CreateMaps();
}

// Function: CHideGame__CreateMaps
// This function creates the maps required to play this correctly.
CHideGame__CreateMaps()
{
    // Peru2600's kingdom by bluefox
    CreateDynamicObject(8620,215.42675781,149.96777344,24.53649712,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(exclbrsign01_lvs) (1)
    CreateDynamicObject(8881,301.77673340,104.13495636,69.55528259,0.00000000,0.00000000,207.00000000, HS_VIRTUAL_WORLD ); //object(excalibur02_lvs) (2)
    CreateDynamicObject(4576,278.00000000,253.00000000,0.00000000,0.00000000,0.00000000,179.99450684, HS_VIRTUAL_WORLD ); //object(lan2newbuild1) (1)
    CreateDynamicObject(4576,154.54693604,104.00000000,5.00000000,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(lan2newbuild1) (2)
    CreateDynamicObject(4576,219.12452698,51.41082764,20.98999977,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(lan2newbuild1) (3)
    CreateDynamicObject(4576,269.00000000,156.00000000,4.00000000,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD ); //object(lan2newbuild1) (5)
    CreateDynamicObject(8881,214.56542969,16.95703125,93.23540497,0.00000000,0.00000000,117.99316406, HS_VIRTUAL_WORLD ); //object(excalibur02_lvs) (3)
    CreateDynamicObject(4576,161.68847656,156.69238281,3.62229156,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(lan2newbuild1) (6)
    CreateDynamicObject(14407,217.69709778,81.36422729,5.65999985,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(carter-stairs01) (1)
    CreateDynamicObject(14410,157.03623962,58.00000000,4.59999990,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(carter-stairs03) (2)
    CreateDynamicObject(1724,218.05688477,63.83621597,11.18750000,0.00000000,0.00000000,180.00000000, HS_VIRTUAL_WORLD ); //object(mrk_seating1b) (1)
    CreateDynamicObject(8648,250.29862976,62.79642487,9.79423141,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(shbbyhswall04_lvs) (1)
    CreateDynamicObject(8648,180.69544983,63.29442978,9.68959045,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(shbbyhswall04_lvs) (2)
    CreateDynamicObject(8648,235.62597656,77.26171875,9.69456768,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(shbbyhswall04_lvs) (3)
    CreateDynamicObject(8648,200.37207031,77.40820312,9.69456768,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD ); //object(shbbyhswall04_lvs) (4)
    CreateDynamicObject(8648,192.98593140,77.56738281,9.69456768,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD ); //object(shbbyhswall04_lvs) (5)
    CreateDynamicObject(7922,260.68902588,103.33551788,3.87760401,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(vgwstnewall6905) (1)
    CreateDynamicObject(7922,260.58456421,99.30944824,3.93238783,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(vgwstnewall6905) (2)
    CreateDynamicObject(7922,260.71612549,97.14297485,3.96240616,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(vgwstnewall6905) (3)
    CreateDynamicObject(7922,260.53625488,92.91162109,4.01978064,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(vgwstnewall6905) (4)
    CreateDynamicObject(7922,260.66964722,90.88931274,4.04783201,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(vgwstnewall6905) (5)
    CreateDynamicObject(7922,260.64035034,86.36190796,4.10968971,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(vgwstnewall6905) (6)
    CreateDynamicObject(8659,251.36160278,90.26446533,3.63954353,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(shbbyhswall11_lvs) (1)
    CreateDynamicObject(8659,251.32118225,90.23907471,5.64148998,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(shbbyhswall11_lvs) (2)
    CreateDynamicObject(7922,260.77374268,84.16581726,4.14011860,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(vgwstnewall6905) (7)
    CreateDynamicObject(7922,260.67352295,80.05712128,4.19604445,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(vgwstnewall6905) (8)
    CreateDynamicObject(7922,260.81466675,77.88155365,4.22621441,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(vgwstnewall6905) (9)
    CreateDynamicObject(7922,260.59875488,73.55337524,3.99893808,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(vgwstnewall6905) (10)
    CreateDynamicObject(7922,260.77777100,71.45946503,3.99893808,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(vgwstnewall6905) (11)
    CreateDynamicObject(7922,260.78576660,66.97209167,3.55744171,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(vgwstnewall6905) (12)
    CreateDynamicObject(7922,252.70971680,71.32107544,4.16092300,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD ); //object(vgwstnewall6905) (13)
    CreateDynamicObject(7922,252.63085938,67.04882812,3.74502277,0.00000000,0.00000000,179.99450684, HS_VIRTUAL_WORLD ); //object(vgwstnewall6905) (14)
    CreateDynamicObject(7922,252.60435486,73.46810913,4.26303577,0.00000000,0.00000000,179.99450684, HS_VIRTUAL_WORLD ); //object(vgwstnewall6905) (15)
    CreateDynamicObject(7922,252.55139160,79.85011292,4.17556858,0.00000000,0.00000000,179.99450684, HS_VIRTUAL_WORLD ); //object(vgwstnewall6905) (16)
    CreateDynamicObject(7922,252.57156372,91.23951721,4.02768373,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD ); //object(vgwstnewall6905) (17)
    CreateDynamicObject(7922,252.67968750,77.64746094,4.20607138,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD ); //object(vgwstnewall6905) (18)
    CreateDynamicObject(7922,252.36578369,86.53576660,4.08356571,0.00000000,0.00000000,179.99450684, HS_VIRTUAL_WORLD ); //object(vgwstnewall6905) (19)
    CreateDynamicObject(7922,252.50292969,84.33398438,4.11407995,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD ); //object(vgwstnewall6905) (20)
    CreateDynamicObject(7922,252.44345093,99.81676483,3.90823174,0.00000000,0.00000000,179.99450684, HS_VIRTUAL_WORLD ); //object(vgwstnewall6905) (21)
    CreateDynamicObject(7922,252.56629944,97.64478302,3.93880367,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD ); //object(vgwstnewall6905) (22)
    CreateDynamicObject(7922,150.43714905,58.08666229,12.67869473,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD ); //object(vgwstnewall6905) (23)
    CreateDynamicObject(7922,252.44238281,93.42285156,3.99692678,0.00000000,0.00000000,179.99450684, HS_VIRTUAL_WORLD ); //object(vgwstnewall6905) (24)
    CreateDynamicObject(8659,251.31445312,90.26953125,7.64343643,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(shbbyhswall11_lvs) (4)
    CreateDynamicObject(8210,257.33526611,76.95404053,5.93260670,90.00000000,180.00000000,269.99996948, HS_VIRTUAL_WORLD ); //object(vgsselecfence12) (1)
    CreateDynamicObject(8210,254.45698547,76.73091125,5.92739964,90.00000000,179.99450684,269.99450684, HS_VIRTUAL_WORLD ); //object(vgsselecfence12) (2)
    CreateDynamicObject(14843,259.97875977,94.89710999,3.83244562,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(int_policea01) (1)
    CreateDynamicObject(14843,253.52235413,95.05585480,3.81956863,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(int_policea01) (2)
    CreateDynamicObject(14843,260.06817627,75.68608093,4.09553814,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(int_policea01) (3)
    CreateDynamicObject(659,222.44943237,99.40788269,2.89062500,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(pinetree01) (1)
    CreateDynamicObject(659,222.78808594,92.55468750,2.89062500,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(pinetree01) (2)
    CreateDynamicObject(659,222.33839417,107.25533295,2.89062500,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(pinetree01) (3)
    CreateDynamicObject(659,222.71203613,114.94317627,2.86885643,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(pinetree01) (4)
    CreateDynamicObject(659,223.06407166,122.12851715,2.75542831,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(pinetree01) (5)
    CreateDynamicObject(659,213.39263916,121.12303925,2.89062881,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(pinetree01) (6)
    CreateDynamicObject(659,213.53825378,113.76241302,2.89062500,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(pinetree01) (7)
    CreateDynamicObject(659,213.56356812,107.46383667,2.89062500,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(pinetree01) (8)
    CreateDynamicObject(659,214.22584534,99.58742523,2.89062500,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(pinetree01) (9)
    CreateDynamicObject(659,214.46755981,93.15680695,2.89062119,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(pinetree01) (10)
    CreateDynamicObject(659,214.18641663,81.07148743,2.89062500,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(pinetree01) (11)
    CreateDynamicObject(659,223.37754822,80.13792419,2.89062500,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(pinetree01) (12)
    CreateDynamicObject(737,213.14292908,69.42627716,9.00000000,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(aw_streettree3) (1)
    CreateDynamicObject(737,222.47558594,69.10644531,9.00000000,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(aw_streettree3) (2)
    CreateDynamicObject(633,214.99517822,76.03448486,9.43818092,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(veg_palmkb10) (1)
    CreateDynamicObject(633,221.27047729,75.93852997,9.43813419,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(veg_palmkb10) (2)
    CreateDynamicObject(647,209.32321167,83.62649536,4.72254086,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(new_bushsm) (1)
    CreateDynamicObject(647,211.80392456,95.93802643,4.72254086,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(new_bushsm) (2)
    CreateDynamicObject(647,210.81178284,104.78884888,4.72254086,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(new_bushsm) (3)
    CreateDynamicObject(647,211.34637451,117.57199860,4.72254086,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(new_bushsm) (4)
    CreateDynamicObject(647,226.19496155,117.61299133,4.57586956,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(new_bushsm) (5)
    CreateDynamicObject(647,225.50936890,108.95211792,4.65140152,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(new_bushsm) (6)
    CreateDynamicObject(647,210.14010620,110.26379395,4.72254086,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(new_bushsm) (7)
    CreateDynamicObject(647,224.83068848,102.93586731,4.71015549,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(new_bushsm) (8)
    CreateDynamicObject(647,224.90182495,96.05248260,4.72254086,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(new_bushsm) (9)
    CreateDynamicObject(647,225.27172852,87.56725311,4.72254086,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(new_bushsm) (10)
    CreateDynamicObject(870,220.57324219,148.85351562,7.30470228,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(veg_pflowers2wee) (1)
    CreateDynamicObject(870,223.17263794,122.26043701,2.97974324,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(veg_pflowers2wee) (2)
    CreateDynamicObject(870,213.57545471,121.47516632,3.13274693,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(veg_pflowers2wee) (3)
    CreateDynamicObject(870,222.59162903,114.86589813,3.11520171,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(veg_pflowers2wee) (4)
    CreateDynamicObject(870,213.58633423,113.89746857,3.13274693,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(veg_pflowers2wee) (5)
    CreateDynamicObject(870,222.15087891,107.24907684,3.13274693,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(veg_pflowers2wee) (6)
    CreateDynamicObject(870,213.73472595,107.64262390,3.13274693,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(veg_pflowers2wee) (7)
    CreateDynamicObject(870,222.29139709,99.59925842,3.13274693,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(veg_pflowers2wee) (8)
    CreateDynamicObject(870,214.26356506,99.70705414,3.13274693,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(veg_pflowers2wee) (9)
    CreateDynamicObject(870,222.65585327,92.83401489,3.13274693,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(veg_pflowers2wee) (10)
    CreateDynamicObject(870,214.54895020,93.33650970,3.13274693,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(veg_pflowers2wee) (11)
    CreateDynamicObject(6356,203.38562012,105.77148438,13.65999985,0.00000000,0.00000000,330.00000000, HS_VIRTUAL_WORLD ); //object(sunset06_law2) (1)
    CreateDynamicObject(12857,216.31640625,138.39160156,0.60000002,0.00000000,0.00000000,3.99902344, HS_VIRTUAL_WORLD ); //object(ce_bridge02) (1)
    CreateDynamicObject(6356,226.13418579,120.25223541,13.62847424,0.00000000,0.00000000,329.99633789, HS_VIRTUAL_WORLD ); //object(sunset06_law2) (2)
    CreateDynamicObject(6356,247.48242188,80.37207031,13.77999973,0.00000000,0.00000000,329.99633789, HS_VIRTUAL_WORLD ); //object(sunset06_law2) (3)
    CreateDynamicObject(6356,254.49276733,106.48227692,13.77999973,0.00000000,0.00000000,329.99633789, HS_VIRTUAL_WORLD ); //object(sunset06_law2) (4)
    CreateDynamicObject(6356,248.45631409,133.25567627,13.77999973,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sunset06_law2) (5)
    CreateDynamicObject(6356,200.83856201,129.10299683,13.50000000,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sunset06_law2) (6)
    CreateDynamicObject(6356,221.96191406,90.59472656,13.77999973,0.00000000,0.00000000,329.99633789, HS_VIRTUAL_WORLD ); //object(sunset06_law2) (7)
    CreateDynamicObject(12857,218.55674744,96.95632172,0.69999999,0.00000000,0.00000000,2.00000000, HS_VIRTUAL_WORLD ); //object(ce_bridge02) (2)
    CreateDynamicObject(4576,118.80913544,128.65736389,9.49484253,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(lan2newbuild1) (7)
    CreateDynamicObject(4576,187.00000000,30.00000000,32.00000000,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(lan2newbuild1) (8)
    CreateDynamicObject(4576,72.28782654,68.95005798,34.15185165,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(lan2newbuild1) (9)
    CreateDynamicObject(14815,139.84944153,59.32268143,9.56999969,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(whhouse_main) (2)
    CreateDynamicObject(14410,217.71875000,67.66601562,8.00000000,0.00000000,0.00000000,179.99450684, HS_VIRTUAL_WORLD ); //object(carter-stairs03) (3)
    CreateDynamicObject(7922,252.53710938,103.80371094,3.85325575,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD ); //object(vgwstnewall6905) (25)
    CreateDynamicObject(2572,141.67660522,53.55253220,7.79612923,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(hotel_single_2) (1)
    CreateDynamicObject(2290,132.54611206,52.67222595,7.78874969,0.00000000,0.00000000,89.00000000, HS_VIRTUAL_WORLD ); //object(swk_couch_1) (1)
    CreateDynamicObject(2239,137.77696228,57.49308777,7.79612923,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(cj_mlight16) (1)
    CreateDynamicObject(1813,134.96566772,52.74573517,7.78874969,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(coffee_low_5) (1)
    CreateDynamicObject(2084,138.08004761,52.66971207,7.79612923,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(med_cabinet_1) (1)
    CreateDynamicObject(14828,127.12538147,68.29922485,9.18305683,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(lm_strip2priv) (1)
    CreateDynamicObject(14805,143.48114014,52.08953094,8.67550278,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(bdupsnew_int) (1)
    CreateDynamicObject(2778,137.44894409,55.20872498,7.79612923,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD ); //object(cj_coin_op_1) (1)
    CreateDynamicObject(2681,137.44793701,56.19450760,7.79612923,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD ); //object(cj_coin_op) (1)
    CreateDynamicObject(16151,130.65063477,54.24784851,7.79612923,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(ufo_bar) (1)
    CreateDynamicObject(1518,131.04687500,63.48632812,7.91956615,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(dyn_tv_2) (1)
    CreateDynamicObject(1786,138.37551880,53.29632187,8.72181129,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD ); //object(swank_tv_4) (1)
    CreateDynamicObject(1828,134.84980774,66.25511169,7.78874969,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(man_sdr_rug) (1)
    CreateDynamicObject(1828,128.80073547,67.25828552,7.78821945,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(man_sdr_rug) (2)
    CreateDynamicObject(2013,132.44303894,67.59078217,7.78874969,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(kit_cab_sink) (1)
    CreateDynamicObject(2017,132.48187256,66.64952087,7.78874969,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(kit_cab_cookr) (1)
    CreateDynamicObject(2127,132.77764893,64.62907410,7.78874969,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(cj_k1_fridge_unit) (1)
    CreateDynamicObject(2361,137.25561523,64.83551025,7.78874969,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(cj_ice_fridge_1) (1)
    CreateDynamicObject(2297,140.18028259,49.10994339,7.78874969,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(tv_unit_2) (1)
    CreateDynamicObject(744,258.19195557,139.86849976,3.07552624,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_scrub_rock4) (1)
    CreateDynamicObject(745,252.73797607,140.85931396,3.04573822,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_scrub_rock5) (1)
    CreateDynamicObject(746,260.19595337,136.41531372,3.00000000,0.00000000,0.00000000,180.00000000, HS_VIRTUAL_WORLD ); //object(sm_scrub_rock2) (1)
    CreateDynamicObject(747,258.73269653,134.42335510,3.06672668,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_scrub_rock3) (1)
    CreateDynamicObject(647,254.13505554,134.84443665,4.87262440,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(new_bushsm) (11)
    CreateDynamicObject(678,213.28941345,86.88901520,2.95142746,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_des_agave2) (1)
    CreateDynamicObject(728,213.95773315,89.28256226,3.10624981,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(tree_hipoly06) (1)
    CreateDynamicObject(14402,127.40039062,65.97167969,12.01352215,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(flower-bush09) (1)
    CreateDynamicObject(14402,130.37051392,62.89625549,8.59188747,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(flower-bush09) (2)
    CreateDynamicObject(1360,126.29154205,63.39261246,8.56024075,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(cj_bush_prop3) (1)
    CreateDynamicObject(1360,130.50195312,61.33789062,8.56077099,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(cj_bush_prop3) (2)
    CreateDynamicObject(1360,125.02539062,60.29785156,8.56815052,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(cj_bush_prop3) (3)
    CreateDynamicObject(8881,162.00000000,122.00000000,24.00000000,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(excalibur02_lvs) (4)
    CreateDynamicObject(745,256.82568359,130.73970032,3.04745674,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_scrub_rock5) (2)
    CreateDynamicObject(746,250.47692871,134.94354248,4.22216892,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_scrub_rock2) (2)
    CreateDynamicObject(879,209.87387085,82.58391571,4.00000000,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(p_rubble04bcol) (1)
    CreateDynamicObject(746,210.06665039,89.90625000,4.14478588,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_scrub_rock2) (3)
    CreateDynamicObject(744,200.84558105,87.96884155,2.88421249,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_scrub_rock4) (2)
    CreateDynamicObject(4681,188.07304382,189.15968323,0.00000000,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(ladtbuild6_lan2) (1)
    CreateDynamicObject(4681,241.62324524,192.83013916,0.00000000,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(ladtbuild6_lan2) (2)
    CreateDynamicObject(12857,214.84277344,177.20605469,0.60000002,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(ce_bridge02) (1)
    CreateDynamicObject(12857,214.61003113,215.97053528,0.60000002,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(ce_bridge02) (1)
    CreateDynamicObject(5428,184.00000000,271.18945312,3.35386658,0.00000000,0.00000000,179.99450684, HS_VIRTUAL_WORLD ); //object(laejeffers10) (1)
    CreateDynamicObject(5428,242.75000000,270.18945312,3.35386658,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(laejeffers10) (2)
    CreateDynamicObject(4576,272.96972656,101.00878906,4.58508301,0.00000000,0.00000000,179.99450684, HS_VIRTUAL_WORLD ); //object(lan2newbuild1) (1)
    CreateDynamicObject(4576,131.07914734,301.33520508,0.00000000,0.00000000,0.00000000,179.99450684, HS_VIRTUAL_WORLD ); //object(lan2newbuild1) (1)
    CreateDynamicObject(4576,183.60253906,330.80761719,0.00000000,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(lan2newbuild1) (6)
    CreateDynamicObject(4576,255.70895386,330.88580322,0.00000000,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(lan2newbuild1) (6)
    CreateDynamicObject(4576,131.01269531,251.06152344,0.00000000,0.00000000,0.00000000,179.99450684, HS_VIRTUAL_WORLD ); //object(lan2newbuild1) (1)
    CreateDynamicObject(4576,278.57250977,300.31060791,0.00000000,0.00000000,0.00000000,179.99450684, HS_VIRTUAL_WORLD ); //object(lan2newbuild1) (1)
    CreateDynamicObject(5812,197.09558105,216.19824219,-9.67795086,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(grasspatchlawn) (1)
    CreateDynamicObject(5812,212.79003906,166.03906250,-9.59578037,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(grasspatchlawn) (2)
    CreateDynamicObject(5812,221.68510437,208.48567200,-9.53246307,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(grasspatchlawn) (3)
    CreateDynamicObject(6236,260.81082153,218.60348511,-1.50000000,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(canal_floor3) (1)
    CreateDynamicObject(6236,169.56671143,215.95608521,-1.50000000,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(canal_floor3) (2)
    CreateDynamicObject(12857,221.44560242,165.65077209,0.60000002,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(ce_bridge02) (1)
    CreateDynamicObject(12857,206.72059631,165.47433472,0.60000002,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(ce_bridge02) (1)
    CreateDynamicObject(12857,207.54199219,194.69575500,0.60000002,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(ce_bridge02) (1)
    CreateDynamicObject(12857,223.23414612,194.82638550,0.60000002,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(ce_bridge02) (1)
    CreateDynamicObject(12857,206.46005249,216.22789001,0.60000002,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(ce_bridge02) (1)
    CreateDynamicObject(12857,222.54013062,216.75996399,0.60000002,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(ce_bridge02) (1)
    CreateDynamicObject(2985,219.34539795,64.43516541,11.18750000,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(minigun_base) (1)
    CreateDynamicObject(2985,215.90921021,64.39753723,11.18750000,0.00000000,0.00000000,180.00000000, HS_VIRTUAL_WORLD ); //object(minigun_base) (2)
    CreateDynamicObject(7861,233.76710510,245.68188477,6.66199732,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(vgnhseing8283) (1)
    CreateDynamicObject(7861,163.92491150,245.48770142,6.67850113,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(vgnhseing8283) (2)
    CreateDynamicObject(14467,206.79228210,223.29081726,5.74004269,0.00000000,0.00000000,180.00000000, HS_VIRTUAL_WORLD ); //object(carter_statue) (1)
    CreateDynamicObject(14467,222.43171692,223.67974854,5.74004269,0.00000000,0.00000000,179.99450684, HS_VIRTUAL_WORLD ); //object(carter_statue) (2)
    CreateDynamicObject(987,159.23954773,231.65754700,8.76737022,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(elecfence_bar) (1)
    CreateDynamicObject(987,191.53222656,231.58105469,8.76737022,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(elecfence_bar) (2)
    CreateDynamicObject(987,179.67187500,231.56250000,8.76737022,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(elecfence_bar) (3)
    CreateDynamicObject(987,167.75195312,231.59277344,8.76737022,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(elecfence_bar) (4)
    CreateDynamicObject(987,263.58102417,232.15286255,8.75086689,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(elecfence_bar) (5)
    CreateDynamicObject(987,227.81738281,232.01855469,8.75086689,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(elecfence_bar) (6)
    CreateDynamicObject(987,239.70605469,231.97167969,8.75086689,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(elecfence_bar) (7)
    CreateDynamicObject(987,251.64062500,232.19531250,8.75086689,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(elecfence_bar) (8)
    CreateDynamicObject(987,201.84231567,230.84246826,3.17752457,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD ); //object(elecfence_bar) (9)
    CreateDynamicObject(987,227.83496094,224.49023438,3.00624990,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(elecfence_bar) (10)
    CreateDynamicObject(3819,195.66508484,300.50128174,4.14792538,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(bleacher_sfsx) (2)
    CreateDynamicObject(3819,187.01562500,300.47024536,4.16678667,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(bleacher_sfsx) (3)
    CreateDynamicObject(3819,204.30305481,300.37567139,4.15430164,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(bleacher_sfsx) (4)
    CreateDynamicObject(3819,212.90713501,300.46701050,4.09853172,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(bleacher_sfsx) (5)
    CreateDynamicObject(3819,221.46804810,300.48876953,4.09381247,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(bleacher_sfsx) (6)
    CreateDynamicObject(3819,230.23165894,300.48986816,4.09381247,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(bleacher_sfsx) (7)
    CreateDynamicObject(3819,239.00379944,300.54461670,4.09381247,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(bleacher_sfsx) (8)
    CreateDynamicObject(3819,247.53022766,300.53561401,4.09381247,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(bleacher_sfsx) (9)
    CreateDynamicObject(3819,256.07785034,300.52218628,4.09381247,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(bleacher_sfsx) (10)
    CreateDynamicObject(3819,178.20581055,300.55718994,4.07003975,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(bleacher_sfsx) (12)
    CreateDynamicObject(3819,169.34817505,300.25143433,4.07746172,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(bleacher_sfsx) (13)
    CreateDynamicObject(6356,161.65118408,291.76388550,13.46876240,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sunset06_law2) (8)
    CreateDynamicObject(17071,204.56455994,272.42691040,6.00000000,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(cunt_rockgp2_25) (1)
    CreateDynamicObject(816,214.93692017,275.73785400,3.33547306,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(p_rubble03) (1)
    CreateDynamicObject(746,219.00930786,271.12268066,3.00000000,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_scrub_rock2) (4)
    CreateDynamicObject(617,227.63050842,272.08413696,4.50229549,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(veg_treeb1) (1)
    CreateDynamicObject(615,166.37342834,249.02493286,3.09605408,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(veg_tree3) (1)
    CreateDynamicObject(661,162.62995911,297.04241943,2.71003056,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(pinetree07) (1)
    CreateDynamicObject(688,240.74586487,276.72546387,3.20758152,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_fir_scabg) (1)
    CreateDynamicObject(688,183.70996094,274.54589844,3.71609688,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_fir_scabg) (2)
    CreateDynamicObject(688,198.06445312,280.91406250,3.13588905,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_fir_scabg) (3)
    CreateDynamicObject(688,222.08586121,279.90969849,3.20181370,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_fir_scabg) (4)
    CreateDynamicObject(698,250.96542358,261.60653687,3.12137222,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_firtbshg) (1)
    CreateDynamicObject(12918,228.78721619,269.36227417,4.52069855,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sw_haypile05) (1)
    CreateDynamicObject(12918,187.67793274,267.42068481,3.48310471,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sw_haypile05) (2)
    CreateDynamicObject(8881,200.53073120,344.19500732,70.64260864,0.00000000,0.00000000,300.00000000, HS_VIRTUAL_WORLD ); //object(excalibur02_lvs) (3)
    CreateDynamicObject(8881,135.01402283,324.01550293,65.25234985,0.00000000,0.00000000,299.99816895, HS_VIRTUAL_WORLD ); //object(excalibur02_lvs) (3)
    CreateDynamicObject(8881,262.59552002,345.41305542,65.98288727,0.00000000,0.00000000,299.99816895, HS_VIRTUAL_WORLD ); //object(excalibur02_lvs) (3)
    CreateDynamicObject(880,175.17100525,263.78030396,4.00000000,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(p_rubble0bcol) (1)
    CreateDynamicObject(880,187.08984375,275.88671875,4.00000000,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(p_rubble0bcol) (2)
    CreateDynamicObject(879,179.52896118,276.90264893,3.00000000,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(p_rubble04bcol) (2)

    // LVP Thriller by Mikey
    CreateDynamicObject(829,2036.11535645,1513.68176270,10.37181187,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(dead_tree_3) (1)
    CreateDynamicObject(833,2034.63964844,1516.84277344,10.30792999,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(dead_tree_6) (1)
    CreateDynamicObject(845,2051.32836914,1517.40161133,10.69455719,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(dead_tree_17) (1)
    CreateDynamicObject(846,2021.76098633,1543.67761230,10.41635323,0.00000000,0.00000000,18.00000000, HS_VIRTUAL_WORLD ); //object(dead_tree_18) (2)
    CreateDynamicObject(843,2023.07666016,1537.73083496,10.67340088,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(dead_tree_15) (1)
    CreateDynamicObject(848,2032.08740234,1551.40136719,10.97616673,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(dead_tree_20) (1)
    CreateDynamicObject(844,2034.47985840,1549.51916504,10.95266247,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(dead_tree_16) (1)
    CreateDynamicObject(840,2030.30261230,1548.68041992,11.81081390,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(dead_tree_12) (1)
    CreateDynamicObject(831,2046.33483887,1559.54699707,10.77543545,0.00000000,0.00000000,316.00000000, HS_VIRTUAL_WORLD ); //object(dead_tree_5) (1)
    CreateDynamicObject(846,2050.17285156,1563.43920898,10.06791592,0.00000000,0.00000000,318.00000000, HS_VIRTUAL_WORLD ); //object(dead_tree_18) (3)
    CreateDynamicObject(835,2057.59594727,1524.82629395,12.57732010,0.00000000,0.00000000,84.00000000, HS_VIRTUAL_WORLD ); //object(dead_tree_8) (1)
    CreateDynamicObject(3593,2049.32690430,1556.02319336,10.38204288,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(la_fuckcar2) (1)
    CreateDynamicObject(3594,2038.15380859,1518.18469238,10.30305195,0.00000000,0.00000000,180.00000000, HS_VIRTUAL_WORLD ); //object(la_fuckcar1) (1)
    CreateDynamicObject(1219,2027.58911133,1525.66845703,10.18323517,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(palette) (2)
    CreateDynamicObject(1219,2027.68652344,1528.38659668,10.18323517,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(palette) (3)
    CreateDynamicObject(1349,2000.01354980,1538.20483398,13.15632248,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(cj_shtrolly) (1)
    CreateDynamicObject(1349,2001.06066895,1538.23437500,13.15632248,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(cj_shtrolly) (2)
    CreateDynamicObject(1349,2002.12182617,1538.24926758,13.15632248,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(cj_shtrolly) (3)
    CreateDynamicObject(1345,2030.07128906,1534.61926270,10.59044838,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(cj_dumpster) (1)
    CreateDynamicObject(3271,2011.97143555,1574.60803223,6.20312500,0.00000000,0.00000000,165.00000000, HS_VIRTUAL_WORLD ); //object(bonyrd_block3_) (1)
    CreateDynamicObject(18451,2024.94030762,1544.39160156,10.33273888,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(cs_oldcarjmp) (2)
    CreateDynamicObject(3927,2047.88781738,1558.06811523,12.27318287,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(d_sign01) (1)
    CreateDynamicObject(8209,2060.51049805,1555.34484863,15.77290154,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD ); //object(vgsselecfence11) (2)
    CreateDynamicObject(8209,2010.41943359,1505.72106934,15.77290154,0.00000000,0.00000000,180.00000000, HS_VIRTUAL_WORLD ); //object(vgsselecfence11) (3)
    CreateDynamicObject(8209,2010.41943359,1505.72106934,9.30415154,0.00000000,0.00000000,180.00000000, HS_VIRTUAL_WORLD ); //object(vgsselecfence11) (4)
    CreateDynamicObject(8209,2010.71887207,1688.51916504,17.07290077,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(vgsselecfence11) (5)
    CreateDynamicObject(8209,2010.71887207,1688.51916504,9.30415154,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(vgsselecfence11) (6)
    CreateDynamicObject(8210,1960.68786621,1534.01843262,9.30415154,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(vgsselecfence12) (2)
    CreateDynamicObject(8210,1960.68786621,1534.01843262,17.02901459,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(vgsselecfence12) (3)
    CreateDynamicObject(16502,1981.00915527,1574.38110352,19.57212067,0.00000000,0.00000000,180.00000000, HS_VIRTUAL_WORLD ); //object(cn2_jetty1) (1)
    CreateDynamicObject(16502,1991.04785156,1574.64904785,15.68708038,0.00000000,340.00000000,182.00000000, HS_VIRTUAL_WORLD ); //object(cn2_jetty1) (2)
    CreateDynamicObject(1450,2035.63623047,1521.04724121,10.42057896,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(dyn_crate_3) (1)
    CreateDynamicObject(8210,2060.51049805,1632.87438965,15.77290154,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD ); //object(vgsselecfence12) (4)
    CreateDynamicObject(8210,2060.51049805,1661.10949707,15.77290154,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD ); //object(vgsselecfence12) (5)
    CreateDynamicObject(12937,2029.96594238,1512.92907715,13.07477093,0.00000000,0.00000000,180.00000000, HS_VIRTUAL_WORLD ); //object(ce_catshack) (1)
    CreateDynamicObject(12991,2056.51562500,1531.56323242,9.67965984,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sw_shack02) (1)
    CreateDynamicObject(17068,2000.10375977,1512.31921387,9.61414528,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD ); //object(xjetty01) (2)
    CreateDynamicObject(17068,1978.17968750,1512.56787109,9.61414528,0.00000000,0.00000000,269.00000000, HS_VIRTUAL_WORLD ); //object(xjetty01) (3)
    CreateDynamicObject(12990,1969.71411133,1528.55212402,9.56649971,0.00000000,355.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sw_jetty) (1)
    CreateDynamicObject(12990,1969.65722656,1554.87609863,8.56649971,4.50000000,0.00000000,180.00000000, HS_VIRTUAL_WORLD ); //object(sw_jetty) (2)
    CreateDynamicObject(1637,1973.88806152,1558.28479004,10.76109409,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(od_pat_hutb) (1)
    CreateDynamicObject(1637,1966.61816406,1557.84289551,10.75377560,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(od_pat_hutb) (2)
    CreateDynamicObject(8209,2060.51049805,1555.34484863,12.77290154,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD ); //object(vgsselecfence11) (7)
    CreateDynamicObject(8210,2060.51049805,1632.87438965,12.77290154,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD ); //object(vgsselecfence12) (9)
    CreateDynamicObject(8210,2060.51049805,1661.10949707,12.77290154,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD ); //object(vgsselecfence12) (10)
    CreateDynamicObject(8210,1960.68786621,1567.36535645,24.87446404,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(vgsselecfence12) (11)
    CreateDynamicObject(8210,1961.14526367,1689.35742188,24.87446404,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(vgsselecfence12) (12)
    CreateDynamicObject(8210,1961.14526367,1689.35742188,16.77290154,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(vgsselecfence12) (13)
    CreateDynamicObject(8210,1961.14526367,1689.35742188,8.75770473,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(vgsselecfence12) (14)
    CreateDynamicObject(8209,2010.71887207,1688.51916504,24.87446404,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(vgsselecfence11) (8)
    CreateDynamicObject(12857,1971.19580078,1683.80114746,19.18562889,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(ce_bridge02) (1)
    CreateDynamicObject(12857,1991.45922852,1683.68310547,-4.03903961,270.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD ); //object(ce_bridge02) (2)
    CreateDynamicObject(3250,2051.16650391,1578.33178711,9.67187500,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD ); //object(des_westrn9_) (1)
    CreateDynamicObject(3253,2037.84619141,1596.55651855,9.82031250,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(des_westrn11_) (1)
    CreateDynamicObject(3246,2039.03845215,1605.11816406,9.67187500,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(des_westrn7_) (1)
    CreateDynamicObject(3594,2042.55859375,1600.25805664,10.30305195,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(la_fuckcar1) (2)
    CreateDynamicObject(3593,2050.92358398,1586.18688965,10.38204288,0.00000000,0.00000000,23.00000000, HS_VIRTUAL_WORLD ); //object(la_fuckcar2) (2)
    CreateDynamicObject(845,2043.82995605,1582.74230957,10.19455719,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(dead_tree_17) (2)
    CreateDynamicObject(843,2044.87536621,1601.51757812,10.52496338,0.00000000,0.00000000,100.00000000, HS_VIRTUAL_WORLD ); //object(dead_tree_15) (2)
    CreateDynamicObject(18568,2039.80541992,1608.33605957,10.46088219,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(cs_logs05) (1)
    CreateDynamicObject(2936,2042.27062988,1608.84069824,10.56033516,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(kmb_rock) (1)
    CreateDynamicObject(749,2047.63793945,1573.51782227,9.67187500,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_scrb_column3) (1)
    CreateDynamicObject(758,2054.76318359,1571.70446777,9.67187500,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_scrub_rock6) (1)
    CreateDynamicObject(745,2055.96630859,1526.99279785,9.67187500,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_scrub_rock5) (1)
    CreateDynamicObject(11502,2041.35388184,1669.18969727,9.67187309,0.00000000,0.00000000,180.00000000, HS_VIRTUAL_WORLD ); //object(des_weebarn1_) (1)
    CreateDynamicObject(840,2037.45117188,1663.11328125,10.66237640,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(dead_tree_12) (2)
    CreateDynamicObject(3594,2039.98522949,1669.99853516,10.30305195,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(la_fuckcar1) (3)
    CreateDynamicObject(747,2037.28552246,1669.80017090,9.82031250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_scrub_rock3) (1)
    CreateDynamicObject(751,2041.78991699,1666.49438477,9.67187500,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_scrb_column1) (1)
    CreateDynamicObject(758,2046.70141602,1674.87585449,9.67187500,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_scrub_rock6) (2)
    CreateDynamicObject(879,2057.21826172,1647.32055664,10.63448429,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(p_rubble04bcol) (1)
    CreateDynamicObject(1528,2001.12561035,1524.74340820,14.60279942,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD ); //object(tag_seville) (1)
    CreateDynamicObject(3409,2037.90856934,1609.78613281,9.67187500,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(grassplant) (1)
    CreateDynamicObject(3092,2058.31079102,1528.94946289,10.64396477,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(dead_tied_cop) (2)
    CreateDynamicObject(2096,2054.91357422,1530.36486816,9.67965984,0.00000000,0.00000000,94.00000000, HS_VIRTUAL_WORLD ); //object(cj_rockingchair) (2)
    CreateDynamicObject(2905,2056.07275391,1529.39404297,9.77110863,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(kmb_deadleg) (1)
    CreateDynamicObject(2971,2037.84790039,1660.69873047,9.67187500,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(k_smashboxes) (1)
    CreateDynamicObject(744,2037.49182129,1592.34484863,9.67187500,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_scrub_rock4) (1)
    CreateDynamicObject(745,2036.03039551,1588.84985352,9.82031345,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_scrub_rock5) (2)
    CreateDynamicObject(17941,2046.02795410,1630.88195801,10.76832485,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(stormd_filld) (1)
    CreateDynamicObject(748,2053.30078125,1625.22326660,9.49522877,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_scrb_grp1) (1)
    CreateDynamicObject(746,2052.35742188,1628.68811035,9.87455750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_scrub_rock2) (2)
    CreateDynamicObject(848,2051.83911133,1626.40686035,10.82772923,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(dead_tree_20) (2)
    CreateDynamicObject(845,2045.19104004,1623.53649902,10.19455719,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(dead_tree_17) (3)
    CreateDynamicObject(840,2047.33496094,1665.02441406,10.86393452,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(dead_tree_12) (3)
    CreateDynamicObject(746,2046.58398438,1661.74511719,9.77455711,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_scrub_rock2) (3)
    CreateDynamicObject(3418,2052.07983398,1635.79760742,11.84008408,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(ce_oldhut02) (1)
    CreateDynamicObject(16023,2042.28527832,1663.95678711,10.89058113,0.00000000,0.00000000,92.00000000, HS_VIRTUAL_WORLD ); //object(des_trxingsign02) (1)
    CreateDynamicObject(3264,1964.70019531,1623.15893555,11.86282349,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(privatesign3) (1)
    CreateDynamicObject(3799,1988.05163574,1579.96875000,17.83305740,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(acbox2_sfs) (1)

    // BlueBerry square by Mikey
    CreateDynamicObject(9832,183.75320435,-79.34639740,3.75280714,0.00000000,0.00000000,4.00000000, HS_VIRTUAL_WORLD); //object(parkbridge_sfw) (1)
    CreateDynamicObject(9832,183.02252197,-135.75729370,3.75280714,0.00000000,0.00000000,180.00000000, HS_VIRTUAL_WORLD); //object(parkbridge_sfw) (2)
    CreateDynamicObject(8210,183.26501465,-89.16410828,3.52932429,0.00000000,0.00000000,180.00000000, HS_VIRTUAL_WORLD); //object(vgsselecfence12) (1)
    CreateDynamicObject(8210,183.26501465,-89.16410828,6.34485435,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(vgsselecfence12) (2)
    CreateDynamicObject(8210,187.67457581,-125.88940430,3.67140055,0.00000000,0.00000000,180.00000000, HS_VIRTUAL_WORLD); //object(vgsselecfence12) (3)
    CreateDynamicObject(8210,187.67457581,-125.88940430,6.34485435,0.00000000,0.00000000,180.00000000, HS_VIRTUAL_WORLD); //object(vgsselecfence12) (4)
    CreateDynamicObject(8210,215.59939575,-110.55212402,6.34485435,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD); //object(vgsselecfence12) (5)
    CreateDynamicObject(8210,215.59939575,-110.55212402,3.67915201,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD); //object(vgsselecfence12) (6)
    CreateDynamicObject(8210,187.87109375,-89.16410828,3.67915201,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(vgsselecfence12) (7)
    CreateDynamicObject(8210,187.87109375,-89.16410828,6.34485435,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(vgsselecfence12) (8)
    CreateDynamicObject(8210,152.88838196,-110.55212402,3.66564655,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD); //object(vgsselecfence12) (9)
    CreateDynamicObject(8210,152.88838196,-110.55212402,6.34485435,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD); //object(vgsselecfence12) (10)
    CreateDynamicObject(8210,180.87109375,-89.16410828,6.34485435,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(vgsselecfence12) (11)
    CreateDynamicObject(8210,180.87109375,-89.16410828,3.67915201,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(vgsselecfence12) (12)
    CreateDynamicObject(8210,180.87109375,-125.88940430,3.67915201,0.00000000,0.00000000,180.00000000, HS_VIRTUAL_WORLD); //object(vgsselecfence12) (13)
    CreateDynamicObject(8210,180.87109375,-125.88940430,6.34485435,0.00000000,0.00000000,180.00000000, HS_VIRTUAL_WORLD); //object(vgsselecfence12) (14)

    // Mayday! by Mikey
    CreateDynamicObject(4004,108.11154938,2547.75146484,27.00409126,0.00000000,0.00000000,180.00000000, HS_VIRTUAL_WORLD); //object(lacityhall3_lan) (1)
    CreateDynamicObject(4011,266.67587280,2545.05493164,14.81250191,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD); //object(figfree2_lan) (1)
    CreateDynamicObject(4048,357.12469482,2555.39965820,27.46552849,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(lacityhall4_lan) (1)
    CreateDynamicObject(4112,368.91284180,2612.97045898,25.85649300,0.00000000,0.00000000,6.00000000, HS_VIRTUAL_WORLD); //object(build01_lan) (1)
    CreateDynamicObject(4117,329.38525391,2664.08593750,24.80718994,0.00000000,0.00000000,84.00000000, HS_VIRTUAL_WORLD); //object(figfree3_lan) (1)
    CreateDynamicObject(4123,75.17905426,2580.01660156,26.19011116,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(cityhallblock1_lan) (1)
    CreateDynamicObject(4683,249.13055420,2683.29492188,26.07743073,0.00000000,0.00000000,358.00000000, HS_VIRTUAL_WORLD); //object(ladtbuild2_lan2) (1)
    CreateDynamicObject(4682,183.45822144,2684.54052734,30.04869270,0.00000000,0.00000000,4.00000000, HS_VIRTUAL_WORLD); //object(ladtbuild3_lan2) (1)
    CreateDynamicObject(8210,116.72420502,2630.96044922,18.58540154,0.00000000,0.00000000,44.00000000, HS_VIRTUAL_WORLD); //object(vgsselecfence12) (1)
    CreateDynamicObject(8210,161.21835327,2663.18652344,18.58540154,0.00000000,0.00000000,28.00000000, HS_VIRTUAL_WORLD); //object(vgsselecfence12) (2)

    // Area 69 Map.
    CreateDynamicObject(971,210.85137939,1875.86901855,11.71054268,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD);
    CreateDynamicObject(971,219.77317810,1876.07690430,11.71687698,0.00000000,0.00000000,2.00000000, HS_VIRTUAL_WORLD);
    CreateDynamicObject(974,245.58265686,1862.65234375,20.39999962,100.99996948,0.00000000,42.00000000, HS_VIRTUAL_WORLD); //object(tall_fence) (1)

    // Russian Mafia Depot map, by Mikey
    CreateDynamicObject(982,2727.23022461,-2552.71850586,15.81562138,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD );
    CreateDynamicObject(982,2720.37670898,-2498.47460938,15.81562138,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD );
    CreateDynamicObject(982,2720.43603516,-2509.65039062,15.81562138,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD );
    CreateDynamicObject(975,2720.42187500,-2504.01855469,14.15996933,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD );
    CreateDynamicObject(975,2720.35864258,-2405.27343750,14.13562775,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD );
    CreateDynamicObject(982,2720.43627930,-2394.54077148,16.00991821,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD );
    CreateDynamicObject(982,2720.48437500,-2415.31665039,16.01168060,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD );
    CreateDynamicObject(976,2724.02416992,-2387.38549805,12.63281250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD );
    CreateDynamicObject(976,2724.01416016,-2387.42187500,12.65497684,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD );
    CreateDynamicObject(976,2732.78759766,-2387.37670898,12.63281250,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD );
    CreateDynamicObject(976,2676.64404297,-2332.81909180,12.63281250,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD );
    CreateDynamicObject(976,2676.69433594,-2341.54443359,12.63735771,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD );
    CreateDynamicObject(1228,2676.48095703,-2331.67285156,15.41331577,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD );
    CreateDynamicObject(1228,2676.47241211,-2329.88208008,15.41331577,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD );
    CreateDynamicObject(976,2180.66113281,-2252.55273438,13.72620201,0.00000000,0.00000000,224.00000000, HS_VIRTUAL_WORLD );
    CreateDynamicObject(991,2118.94238281,-2275.24047852,20.88711548,0.00000000,0.00000000,316.00000000, HS_VIRTUAL_WORLD );
    CreateDynamicObject(16776,2208.52856445,-2293.71484375,13.76466942,0.00000000,0.00000000,224.00000000, HS_VIRTUAL_WORLD );
    CreateDynamicObject(1369,2173.88281250,-2248.45043945,12.92561150,0.00000000,0.00000000,44.00000000, HS_VIRTUAL_WORLD );
    CreateDynamicObject(1349,2130.54272461,-2272.36328125,14.35476112,0.00000000,0.00000000,48.00000000, HS_VIRTUAL_WORLD );
    CreateDynamicObject(1344,2134.18627930,-2286.99316406,14.58827782,0.00000000,0.00000000,136.00000000, HS_VIRTUAL_WORLD );
    CreateDynamicObject(1344,2135.99975586,-2288.64721680,14.58827782,0.00000000,0.00000000,140.00000000, HS_VIRTUAL_WORLD );
    CreateDynamicObject(1265,2139.12646484,-2281.78979492,14.24617004,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD );
    CreateDynamicObject(1264,2139.08886719,-2290.48901367,15.28201580,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD );
    CreateDynamicObject(1334,2121.74218750,-2270.45678711,14.89601803,0.00000000,0.00000000,44.00000000, HS_VIRTUAL_WORLD );
    CreateDynamicObject(1299,2127.99902344,-2273.39233398,14.23961830,0.00000000,0.00000000,320.00000000, HS_VIRTUAL_WORLD );
    CreateDynamicObject(1264,2125.53466797,-2272.36669922,14.25565434,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD );
    CreateDynamicObject(1428,2124.74951172,-2271.25708008,15.35142326,0.00000000,0.00000000,318.00000000, HS_VIRTUAL_WORLD );
    CreateDynamicObject(1558,2138.95556641,-2290.81298828,14.35401154,0.00000000,0.00000000,324.00000000, HS_VIRTUAL_WORLD );
    CreateDynamicObject(1264,2138.32470703,-2289.77197266,14.25220394,0.00000000,0.00000000,300.00000000, HS_VIRTUAL_WORLD );
    CreateDynamicObject(1265,2139.46484375,-2289.32983398,14.24910355,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD );
    CreateDynamicObject(8614,2155.12451172,-2244.97167969,14.52199459,0.00000000,0.00000000,225.99572754, HS_VIRTUAL_WORLD );

    // xBlueXFoxx' Summer Hideout, by bluefox.
    CreateDynamicObject(8210,-1444.65112305,-1603.83300781,103.81932068,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(vgsselecfence12)(1)
    CreateDynamicObject(8210,-1471.81347656,-1469.02770996,103.81932068,0.00000000,0.00000000,260.00000000, HS_VIRTUAL_WORLD); //object(vgsselecfence12)(2)
    CreateDynamicObject(8210,-1407.69213867,-1577.92272949,103.81932068,0.00000000,0.00000000,70.00000000, HS_VIRTUAL_WORLD); //object(vgsselecfence12)(3)
    CreateDynamicObject(8210,-1401.76440430,-1524.75231934,103.81932068,0.00000000,0.00000000,97.00000000, HS_VIRTUAL_WORLD); //object(vgsselecfence12)(4)
    CreateDynamicObject(8210,-1408.57910156,-1469.67309570,103.81932068,0.00000000,0.00000000,96.99829102, HS_VIRTUAL_WORLD); //object(vgsselecfence12)(5)
    CreateDynamicObject(8210,-1439.72851562,-1441.79785156,103.81932068,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(vgsselecfence12)(6)
    CreateDynamicObject(8210,-1471.80004883,-1578.69836426,103.81932068,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD); //object(vgsselecfence12)(7)
    CreateDynamicObject(8210,-1474.30810547,-1523.32678223,103.81941223,0.00000000,0.00000000,274.99877930, HS_VIRTUAL_WORLD); //object(vgsselecfence12)(8)
    CreateDynamicObject(14875,-1465.84460449,-1443.27697754,101.45092773,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(kylie_hay1)(1)
    CreateDynamicObject(14875,-1463.64770508,-1443.80590820,101.57556152,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD); //object(kylie_hay1)(3)
    CreateDynamicObject(12917,-1410.08129883,-1451.69921875,99.92201996,0.00000000,0.00000000,280.00000000, HS_VIRTUAL_WORLD); //object(sw_haypile03)(1)
    CreateDynamicObject(1479,-1443.65234375,-1471.83984375,101.00000000,0.00000000,0.00000000,354.99572754, HS_VIRTUAL_WORLD); //object(dyn_gaz_1)(1)
    CreateDynamicObject(1452,-1411.52429199,-1510.39086914,101.74055481,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD); //object(dyn_outhouse)(1)
    CreateDynamicObject(1452,-1411.47277832,-1511.67602539,101.74450684,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD); //object(dyn_outhouse)(2)
    CreateDynamicObject(1452,-1411.40039062,-1513.03271484,101.74863434,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD); //object(dyn_outhouse)(3)
    CreateDynamicObject(1452,-1411.48095703,-1508.91345215,101.73575592,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD); //object(dyn_outhouse)(4)
    CreateDynamicObject(12918,-1420.50170898,-1509.36181641,100.68292236,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sw_haypile05)(1)
    CreateDynamicObject(1457,-1435.52355957,-1485.81018066,102.37281799,0.00000000,0.00000000,279.00000000, HS_VIRTUAL_WORLD); //object(dyn_outhouse_2)(1)
    CreateDynamicObject(14826,-1426.38488770,-1503.10192871,101.43625641,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(int_kbsgarage2)(1)
    CreateDynamicObject(11480,-1460.38269043,-1552.97119141,102.95152283,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(des_nwt_carport)(1)
    CreateDynamicObject(1454,-1458.33837891,-1550.27929688,101.55601501,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(dyn_h_bale2)(1)
    CreateDynamicObject(1454,-1463.06054688,-1549.82849121,101.55601501,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(dyn_h_bale2)(2)
    CreateDynamicObject(1454,-1462.61743164,-1555.51171875,101.55601501,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(dyn_h_bale2)(3)
    CreateDynamicObject(1454,-1458.36035156,-1552.47949219,101.55601501,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(dyn_h_bale2)(4)
    CreateDynamicObject(1454,-1462.91601562,-1552.10839844,101.55601501,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(dyn_h_bale2)(5)
    CreateDynamicObject(1454,-1457.89099121,-1555.42675781,101.55601501,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(dyn_h_bale2)(6)
    CreateDynamicObject(1454,-1459.43066406,-1555.81054688,101.55601501,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD); //object(dyn_h_bale2)(7)
    CreateDynamicObject(1454,-1460.95214844,-1555.73730469,101.55601501,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD); //object(dyn_h_bale2)(8)
    CreateDynamicObject(1454,-1455.84802246,-1555.18908691,101.55601501,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(dyn_h_bale2)(9)
    CreateDynamicObject(731,-1473.43127441,-1500.58386230,100.70735168,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(tree_hipoly09)(7)
    CreateDynamicObject(731,-1473.91394043,-1498.56884766,100.70957947,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(tree_hipoly09)(8)
    CreateDynamicObject(731,-1471.84851074,-1518.77453613,100.72912598,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(tree_hipoly09)(9)
    CreateDynamicObject(731,-1471.87341309,-1521.02465820,100.83967590,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(tree_hipoly09)(10)
    CreateDynamicObject(731,-1473.91357422,-1496.40856934,100.71496582,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(tree_hipoly09)(11)
    CreateDynamicObject(731,-1473.23266602,-1494.50585938,100.71934509,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(tree_hipoly09)(12)
    CreateDynamicObject(731,-1474.60888672,-1502.48474121,100.70445251,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(tree_hipoly09)(13)
    CreateDynamicObject(731,-1471.84423828,-1516.45886230,100.73202515,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(tree_hipoly09)(14)
    CreateDynamicObject(731,-1471.35046387,-1527.66809082,100.91151428,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(tree_hipoly09)(15)
    CreateDynamicObject(731,-1468.02343750,-1578.13574219,100.75781250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(tree_hipoly09)(16)
    CreateDynamicObject(731,-1471.60607910,-1523.43676758,100.72653198,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(tree_hipoly09)(17)
    CreateDynamicObject(731,-1471.51037598,-1525.63732910,101.52505493,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(tree_hipoly09)(18)
    CreateDynamicObject(731,-1471.01879883,-1530.31958008,100.73578644,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(tree_hipoly09)(19)
    CreateDynamicObject(719,-1444.68859863,-1592.38745117,100.75781250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_largefurs07)(1)
    CreateDynamicObject(719,-1422.70214844,-1568.66113281,100.75781250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_largefurs07)(2)
    CreateDynamicObject(719,-1442.30065918,-1524.89123535,100.75781250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_largefurs07)(3)
    CreateDynamicObject(707,-1442.15112305,-1499.64514160,100.75781250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sm_bushvbig)(1)
    CreateDynamicObject(707,-1442.15039062,-1499.64453125,100.75781250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sm_bushvbig)(2)
    CreateDynamicObject(707,-1398.55480957,-1491.77539062,100.84304047,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sm_bushvbig)(3)
    CreateDynamicObject(707,-1391.37719727,-1531.77368164,100.96587372,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sm_bushvbig)(4)
    CreateDynamicObject(707,-1370.46484375,-1510.44555664,101.23333740,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sm_bushvbig)(5)
    CreateDynamicObject(707,-1370.46484375,-1510.44531250,101.23333740,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sm_bushvbig)(6)
    CreateDynamicObject(707,-1425.22924805,-1521.74096680,100.74415588,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sm_bushvbig)(7)
    CreateDynamicObject(697,-1460.19824219,-1463.62109375,100.75781250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sm_fir_tall)(1)
    CreateDynamicObject(697,-1439.83447266,-1479.60827637,100.73687744,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sm_fir_tall)(2)
    CreateDynamicObject(697,-1415.62866211,-1466.87561035,100.63523865,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sm_fir_tall)(3)
    CreateDynamicObject(697,-1398.01855469,-1469.57910156,100.59975433,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sm_fir_tall)(4)
    CreateDynamicObject(690,-1396.76965332,-1453.51831055,100.28125000,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sm_fir_copse2)(1)
    CreateDynamicObject(690,-1444.05664062,-1481.30761719,100.75781250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sm_fir_copse2)(2)
    CreateDynamicObject(837,-1443.11572266,-1559.16247559,101.78166199,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(dead_tree_1)(1)
    CreateDynamicObject(617,-1423.95812988,-1581.86254883,100.75781250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1)(1)
    CreateDynamicObject(617,-1466.65551758,-1567.16784668,100.75781250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1)(2)
    CreateDynamicObject(617,-1450.15039062,-1559.50781250,100.75781250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1)(3)
    CreateDynamicObject(617,-1434.30761719,-1563.94921875,100.75781250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1)(4)
    CreateDynamicObject(617,-1452.38964844,-1595.42773438,100.75781250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1)(5)
    CreateDynamicObject(660,-1436.37231445,-1526.56738281,100.75041199,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(pinetree03)(1)
    CreateDynamicObject(660,-1436.76562500,-1593.83886719,100.75781250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(pinetree03)(2)
    CreateDynamicObject(660,-1434.21875000,-1598.02734375,100.75781250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(pinetree03)(3)
    CreateDynamicObject(660,-1441.69726562,-1598.00195312,100.75781250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(pinetree03)(4)
    CreateDynamicObject(660,-1426.93457031,-1586.23242188,100.75781250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(pinetree03)(5)
    CreateDynamicObject(660,-1426.54882812,-1565.33984375,100.75781250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(pinetree03)(6)
    CreateDynamicObject(660,-1441.45800781,-1565.05175781,100.75781250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(pinetree03)(7)
    CreateDynamicObject(660,-1462.64062500,-1559.53027344,100.75781250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(pinetree03)(8)
    CreateDynamicObject(660,-1445.18286133,-1528.79882812,100.75781250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(pinetree03)(9)
    CreateDynamicObject(660,-1466.73242188,-1543.39843750,100.75781250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(pinetree03)(10)
    CreateDynamicObject(660,-1461.86865234,-1586.72753906,100.75781250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(pinetree03)(11)
    CreateDynamicObject(660,-1414.56286621,-1556.73669434,100.75781250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(pinetree03)(12)
    CreateDynamicObject(660,-1413.49243164,-1575.87377930,100.76002502,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(pinetree03)(13)
    CreateDynamicObject(660,-1409.29003906,-1543.53613281,100.75781250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(pinetree03)(14)
    CreateDynamicObject(660,-1429.24755859,-1472.63854980,100.68550110,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(pinetree03)(10)
    CreateDynamicObject(660,-1446.33105469,-1538.19238281,100.75781250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(pinetree03)(10)
    CreateDynamicObject(660,-1452.97851562,-1471.12207031,100.75781250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(pinetree03)(10)
    CreateDynamicObject(660,-1447.89746094,-1481.68457031,100.75781250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(pinetree03)(10)
    CreateDynamicObject(660,-1458.01660156,-1456.16308594,100.75781250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(pinetree03)(10)
    CreateDynamicObject(660,-1464.74902344,-1472.26367188,100.75781250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(pinetree03)(10)
    CreateDynamicObject(660,-1463.92675781,-1462.07250977,100.75781250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(pinetree03)(10)
    CreateDynamicObject(697,-1442.69189453,-1442.63598633,100.74938965,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sm_fir_tall)(1)
    CreateDynamicObject(697,-1437.78247070,-1443.00000000,100.58026123,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sm_fir_tall)(1)
    CreateDynamicObject(731,-1467.09631348,-1575.53137207,100.75781250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(tree_hipoly09)(16)
    CreateDynamicObject(731,-1468.45556641,-1573.66613770,100.75781250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(tree_hipoly09)(16)
    CreateDynamicObject(731,-1474.62426758,-1504.87353516,100.70153046,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(tree_hipoly09)(13)
    CreateDynamicObject(1454,-1462.31127930,-1557.12536621,101.55601501,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD);

     //object(dyn_h_bale2)(7)
    CreateDynamicObject(660,-1454.84338379,-1461.45861816,100.75781250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(pinetree03)(10)
    CreateDynamicObject(660,-1458.63671875,-1472.77832031,100.75781250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(pinetree03)(10)
    CreateDynamicObject(660,-1454.35742188,-1476.52832031,100.75781250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(pinetree03)(10)
    CreateDynamicObject(660,-1437.59655762,-1588.28979492,100.75781250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(pinetree03)(10)
    CreateDynamicObject(660,-1447.46093750,-1534.38476562,100.75781250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(pinetree03)(10)

    // Grove Street by bluefox
    CreateDynamicObject(1337,2446.02539062,-1675.13281250,12.99655724,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(binnt07_la) (1)
    CreateDynamicObject(8150,2479.00000000,-1722.00000000,17.58540344,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(vgsselecfence04) (1)
    CreateDynamicObject(8150,2540.66503906,-1673.82324219,17.70589828,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD); //object(vgsselecfence04) (2)
    CreateDynamicObject(8150,2502.17871094,-1628.75549316,16.36305237,0.00000000,0.00000000,179.99450684, HS_VIRTUAL_WORLD); //object(vgsselecfence04) (3)
    CreateDynamicObject(8150,2442.86840820,-1666.42395020,15.57967281,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD); //object(vgsselecfence04) (4)
    CreateDynamicObject(8167,2540.64526367,-1714.18347168,13.66127205,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(apgate1_vegs01) (1)
    CreateDynamicObject(987,2540.47656250,-1718.40197754,12.52474308,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD); //object(elecfence_bar) (1)
    CreateDynamicObject(987,2519.97583008,-1722.11315918,12.54687500,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(elecfence_bar) (2)
    CreateDynamicObject(987,2476.25854492,-1721.90002441,12.52439308,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(elecfence_bar) (3)
    CreateDynamicObject(987,2449.00000000,-1705.00000000,17.13342285,0.00000000,0.00000000,91.00000000, HS_VIRTUAL_WORLD); //object(elecfence_bar) (4)
    CreateDynamicObject(987,2540.60009766,-1673.00000000,19.00000000,0.00000000,0.00000000,90.99975586, HS_VIRTUAL_WORLD); //object(elecfence_bar) (5)
    CreateDynamicObject(987,2491.35742188,-1644.90820312,21.06704712,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD); //object(elecfence_bar) (6)
    CreateDynamicObject(987,2479.49218750,-1644.78417969,21.12441444,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(elecfence_bar) (7)
    CreateDynamicObject(987,2479.39965820,-1644.80187988,21.27547646,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD); //object(elecfence_bar) (8)
    CreateDynamicObject(987,2479.33911133,-1638.89453125,21.33609581,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD); //object(elecfence_bar) (9)
    CreateDynamicObject(987,2491.28247070,-1638.99877930,20.62163734,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD); //object(elecfence_bar) (10)
    CreateDynamicObject(987,2497.19995117,-1690.83801270,12.65032673,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(elecfence_bar) (11)

    // LVP monument by bluefox
    CreateDynamicObject(10056,1311.53125000,-2136.82421875,67.36035156,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(tempsf_4_sfe)(1)
    CreateDynamicObject(10056,1311.58325195,-1958.29687500,67.25405884,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(tempsf_4_sfe)(2)
    CreateDynamicObject(10056,1246.83374023,-1937.45861816,67.12832642,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(tempsf_4_sfe)(3)
    CreateDynamicObject(10056,1090.19689941,-1959.48095703,66.85836029,0.00000000,0.00000000,180.00000000, HS_VIRTUAL_WORLD ); //object(tempsf_4_sfe)(5)
    CreateDynamicObject(10056,1151.62780762,-1936.40527344,67.31161499,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(tempsf_4_sfe)(6)
    CreateDynamicObject(10056,1090.19689941,-2111.12182617,67.31161499,0.00000000,0.00000000,180.00000000, HS_VIRTUAL_WORLD ); //object(tempsf_4_sfe)(7)
    CreateDynamicObject(10056,1311.53808594,-2039.22363281,67.36035156,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(tempsf_4_sfe)(8)
    CreateDynamicObject(10056,1259.16784668,-2198.85839844,67.36035156,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD ); //object(tempsf_4_sfe)(9)
    CreateDynamicObject(10056,1210.53625488,-2254.61230469,55.00000000,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(tempsf_4_sfe)(10)
    CreateDynamicObject(10056,1156.86181641,-2283.30102539,56.00000000,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD ); //object(tempsf_4_sfe)(11)
    CreateDynamicObject(10056,1085.27441406,-2244.81762695,57.00000000,0.00000000,0.00000000,180.00000000, HS_VIRTUAL_WORLD ); //object(tempsf_4_sfe)(12)
    CreateDynamicObject(10056,1085.27441406,-2197.73828125,65.00000000,0.00000000,0.00000000,179.99450684, HS_VIRTUAL_WORLD ); //object(tempsf_4_sfe)(13)
    CreateDynamicObject(902,1102.16052246,-2285.09912109,42.46875000,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(starfish)(1)
    CreateDynamicObject(8210,1111.92968750,-2290.27050781,44.74812317,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(vgsselecfence12)(1)
    CreateDynamicObject(8493,878.02203369,-1967.49121094,16.86973572,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(pirtshp01_lvs)(1)
    CreateDynamicObject(5374,1015.95892334,-2028.72521973,22.54751587,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(alphbrk9_las2)(1)
    CreateDynamicObject(7415,1118.82958984,-2035.13854980,81.00000000,0.00000000,0.00000000,215.00000000, HS_VIRTUAL_WORLD ); //object(vgswlcmsign1)(1)
    CreateDynamicObject(8210,1071.74243164,-2036.99426270,64.49615479,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(vgsselecfence12)(3)
    CreateDynamicObject(6148,1066.98144531,-2040.16699219,52.47107697,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(gaz19_law)(1)
    CreateDynamicObject(8210,1071.76892090,-2053.06860352,64.50179291,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(vgsselecfence12)(4)
    CreateDynamicObject(8210,1076.92956543,-2062.39013672,56.00000000,0.00000000,0.00000000,120.00000000, HS_VIRTUAL_WORLD ); //object(vgsselecfence12)(5)
    CreateDynamicObject(8210,1075.36035156,-2015.80371094,52.83914566,0.00000000,0.00000000,66.99462891, HS_VIRTUAL_WORLD ); //object(vgsselecfence12)(6)
    CreateDynamicObject(8397,1156.27185059,-2037.09252930,78.00000000,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(luxorpillar01_lvs)(1)
    CreateDynamicObject(8210,1075.36035156,-2015.80371094,52.83914566,0.00000000,0.00000000,66.99462891, HS_VIRTUAL_WORLD ); //object(vgsselecfence12)(7)
    CreateDynamicObject(8210,1076.77294922,-2008.00000000,60.00000000,90.00000000,179.99450684,70.01098633, HS_VIRTUAL_WORLD ); //object(vgsselecfence12)(8)
    CreateDynamicObject(8210,1271.75781250,-2164.35839844,41.74626923,0.00000000,0.00000000,40.00000000, HS_VIRTUAL_WORLD ); //object(vgsselecfence12)(9)
    CreateDynamicObject(8210,1282.38549805,-2168.74560547,48.00000000,90.00000000,179.99450684,219.99572754, HS_VIRTUAL_WORLD ); //object(vgsselecfence12)(10)
    CreateDynamicObject(8491,1303.92687988,-2037.97314453,115.21922302,0.00000000,0.00000000,130.00000000, HS_VIRTUAL_WORLD ); //object(flamingo04_lvs)(1)
    CreateDynamicObject(16778,1225.81616211,-1949.43933105,108.44863892,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(des_ufosign)(1)
    CreateDynamicObject(16776,1096.07641602,-1981.32067871,108.17867279,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(des_cockbody)(1)
    CreateDynamicObject(14608,1101.80236816,-2090.51196289,110.90293884,0.00000000,0.00000000,220.00000000, HS_VIRTUAL_WORLD ); //object(triad_buddha01)(1)
    CreateDynamicObject(1337,1254.10449219,-2197.98437500,109.18066406,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(binnt07_la)(1)
    CreateDynamicObject(8131,1253.64660645,-2190.30639648,119.37406158,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(vgschurch02_lvs)(1)
    CreateDynamicObject(3524,1181.88317871,-2029.56726074,70.89315033,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(skullpillar01_lvs)(1)
    CreateDynamicObject(3524,1182.08483887,-2044.43957520,70.89315033,0.00000000,0.00000000,180.00000000, HS_VIRTUAL_WORLD ); //object(skullpillar01_lvs)(2)
    CreateDynamicObject(7392,1201.75512695,-2021.82324219,76.00000000,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(vegcandysign1)(1)
    CreateDynamicObject(7073,1202.43041992,-2050.16333008,86.26736450,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(vegascowboy1)(1)
    CreateDynamicObject(684,1165.20227051,-2088.35571289,70.98847961,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_fir_log02)(1)
    CreateDynamicObject(683,1172.37011719,-2097.70336914,67.06117249,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_fir_group)(1)
    CreateDynamicObject(683,1162.66503906,-2102.64941406,68.79478455,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_fir_group)(2)
    CreateDynamicObject(683,1159.77331543,-2091.06567383,69.34809113,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_fir_group)(3)
    CreateDynamicObject(683,1190.08105469,-2095.25634766,64.85028839,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_fir_group)(4)
    CreateDynamicObject(683,1204.22839355,-2090.19775391,65.00170135,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_fir_group)(5)
    CreateDynamicObject(683,1181.89379883,-2088.98681641,66.17048645,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_fir_group)(6)
    CreateDynamicObject(683,1177.89514160,-1986.03979492,64.74868774,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_fir_group)(7)
    CreateDynamicObject(683,1170.58789062,-2085.21289062,67.76237488,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_fir_group)(8)
    CreateDynamicObject(683,1178.52734375,-1995.67968750,68.00781250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_fir_group)(9)
    CreateDynamicObject(683,1198.41479492,-1987.18273926,65.21141052,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_fir_group)(10)
    CreateDynamicObject(683,1169.15136719,-1991.48437500,67.26693726,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_fir_group)(11)
    CreateDynamicObject(683,1159.91894531,-1978.88281250,61.64660645,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_fir_group)(12)
    CreateDynamicObject(689,1188.19506836,-1976.08947754,60.22104645,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_fir_copse1)(2)
    CreateDynamicObject(689,1213.43701172,-1982.39025879,62.92271423,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sm_fir_copse1)(3)
    CreateDynamicObject(647,1223.41711426,-1973.81604004,60.66580963,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(new_bushsm)(1)
    CreateDynamicObject(800,1228.02990723,-1970.12170410,60.71436310,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(genveg_bush07)(1)
    CreateDynamicObject(800,1234.69848633,-1978.29772949,60.69456863,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(genveg_bush07)(2)
    CreateDynamicObject(805,1226.76477051,-1980.52258301,61.36388779,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(genveg_bush11)(1)
    CreateDynamicObject(800,1233.71997070,-1970.86486816,60.14034271,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(genveg_bush07)(3)
    CreateDynamicObject(800,1233.71972656,-1970.86425781,60.14034271,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(genveg_bush07)(4)
    CreateDynamicObject(800,1233.10473633,-1974.50781250,60.79319382,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(genveg_bush07)(5)
    CreateDynamicObject(801,1230.80895996,-1988.24511719,59.60558319,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(genveg_bush01)(1)
    CreateDynamicObject(800,1238.10485840,-1979.98144531,60.67904663,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(genveg_bush07)(6)
    CreateDynamicObject(800,1191.31799316,-1971.13281250,61.71217346,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(genveg_bush07)(7)
    CreateDynamicObject(801,1195.55297852,-1976.73254395,60.33407593,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(genveg_bush01)(2)
    CreateDynamicObject(801,1194.56372070,-1975.26611328,59.64964294,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(genveg_bush01)(3)
    CreateDynamicObject(800,1185.99804688,-1968.84020996,61.04971313,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(genveg_bush07)(8)
    CreateDynamicObject(800,1187.83703613,-1973.79821777,62.96189880,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(genveg_bush07)(9)
    CreateDynamicObject(18565,1152.86425781,-2022.34204102,69.32669830,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(cs_logs03)(1)
    CreateDynamicObject(18566,1158.41113281,-2017.82287598,68.88206482,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(cs_logs02)(1)
    CreateDynamicObject(18609,1162.01672363,-2027.35290527,69.17309570,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(cs_logs06)(1)
    CreateDynamicObject(12918,1121.90454102,-2115.36645508,68.04335022,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sw_haypile05)(1)
    CreateDynamicObject(11499,1122.35656738,-2037.25720215,68.69999695,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD ); //object(des_dinerfenc01)(1)
    CreateDynamicObject(14873,1194.61621094,-2153.69702148,62.04760742,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(kylie_hay)(1)
    CreateDynamicObject(8210,1294.19677734,-1915.84619141,55.82383728,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(vgsselecfence12)(1)
    CreateDynamicObject(8881,1279.52648926,-2172.20410156,76.89751434,0.00000000,0.00000000,180.00000000, HS_VIRTUAL_WORLD ); //object(excalibur02_lvs) (1)
    CreateDynamicObject(5716,1271.28894043,-2039.07897949,71.43545532,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD ); //object(manns01_lawn) (1)
    CreateDynamicObject(2485,1296.25695801,-2141.92016602,54.35156250,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(model_car_1) (1)
    CreateDynamicObject(984,1297.04980469,-2147.32153320,59.14168549,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(fenceshit2) (1)
    CreateDynamicObject(8838,1238.13989258,-2137.18237305,55.20000076,0.00000000,10.00000000,150.00000000, HS_VIRTUAL_WORLD ); //object(vgehshade01_lvs) (1)
    CreateDynamicObject(8210,1278.32031250,-2163.20996094,48.00000000,90.00000000,180.00549316,219.97924805, HS_VIRTUAL_WORLD ); //object(vgsselecfence12)(8)
    CreateDynamicObject(8210,1076.41577148,-2065.65136719,62.00000000,90.00000000,179.99450684,120.00000000, HS_VIRTUAL_WORLD ); //object(vgsselecfence12)(8)

    // Titanic for starters by Mikey
    CreateDynamicObject(8210,-1464.59765625,505.29049683,0.00000000,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD ); //object(vgsselecfence12) (1)
    CreateDynamicObject(8210,-1465.34521484,505.44366455,5.14240408,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD ); //object(vgsselecfence12) (2)
    CreateDynamicObject(8210,-1420.21496582,515.34228516,12.11665154,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(vgsselecfence12) (3)
    CreateDynamicObject(974,-1366.28955078,514.36718750,12.96524048,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(tall_fence) (1)
    CreateDynamicObject(974,-1334.94665527,487.69177246,12.96524048,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(tall_fence) (2)
    CreateDynamicObject(974,-1324.43701172,514.50152588,12.95858383,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(tall_fence) (3)
    CreateDynamicObject(974,-1348.29162598,499.35293579,20.23493385,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(tall_fence) (6)
    CreateDynamicObject(1323,-1297.94335938,489.07803345,11.67968750,0.00000000,0.00000000,180.00000000, HS_VIRTUAL_WORLD ); //object(ws_roadwarning_03) (1)
    CreateDynamicObject(2588,-1294.70898438,493.23437500,11.86415100,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(sex_3) (1)
    CreateDynamicObject(7909,-1456.93188477,514.77423096,5.37033558,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(vgwestbillbrd10) (1)
    CreateDynamicObject(7910,-1439.94543457,514.27630615,5.37033558,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD ); //object(vgwestbillbrd11) (1)
    CreateDynamicObject(974,-1377.34667969,490.89062500,8.31680298,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD ); //object(tall_fence) (4)

    // FiXeR's Sheep Farm by xBluexFoxx

    CreateDynamicObject(8148,-18.80701065,118.14262390,5.21062708,0.00000000,0.00000000,60.00000000, HS_VIRTUAL_WORLD); //object(vgsselecfence02) (1)
    CreateDynamicObject(8148,-155.81542969,-27.49316406,5.21821451,0.00000000,0.00000000,339.99938965, HS_VIRTUAL_WORLD); //object(vgsselecfence02) (2)
    CreateDynamicObject(8148,-115.52343750,82.54394531,5.21821451,0.00000000,0.00000000,339.99938965, HS_VIRTUAL_WORLD); //object(vgsselecfence02) (3)
    CreateDynamicObject(8148,-109.78553009,-125.36099243,5.21821451,0.00000000,0.00000000,70.00000000, HS_VIRTUAL_WORLD); //object(vgsselecfence02) (4)
    CreateDynamicObject(8148,14.95800781,12.52734375,5.21821451,0.00000000,0.00000000,339.99938965, HS_VIRTUAL_WORLD); //object(vgsselecfence02) (5)
    CreateDynamicObject(8148,-17.14257812,-74.60156250,5.21821451,0.00000000,0.00000000,339.99938965, HS_VIRTUAL_WORLD); //object(vgsselecfence02) (6)
    CreateDynamicObject(617,36.86581421,83.94297791,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (1)
    CreateDynamicObject(617,19.78158569,84.39736938,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (2)
    CreateDynamicObject(617,21.12005615,89.77580261,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (3)
    CreateDynamicObject(617,25.29855347,77.25472260,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (4)
    CreateDynamicObject(617,34.87311554,78.74736023,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (5)
    CreateDynamicObject(617,35.77846527,75.62570953,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (6)
    CreateDynamicObject(617,29.83901978,86.72827911,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (7)
    CreateDynamicObject(617,-4.86940765,92.44931030,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (8)
    CreateDynamicObject(617,11.50262451,82.96851349,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (9)
    CreateDynamicObject(617,10.45898438,94.05468750,2.11718559,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (10)
    CreateDynamicObject(617,-43.82714081,120.59739685,2.11719131,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (11)
    CreateDynamicObject(617,-10.95929337,139.54071045,2.01910782,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (12)
    CreateDynamicObject(617,16.23944855,121.87477112,1.90611267,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (13)
    CreateDynamicObject(617,-13.88417816,14.59175110,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (14)
    CreateDynamicObject(617,-13.78038406,22.98904419,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (15)
    CreateDynamicObject(617,-24.21089172,43.29769897,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (16)
    CreateDynamicObject(617,-2.54700470,31.91988373,2.10964966,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (17)
    CreateDynamicObject(617,6.20674133,18.64385605,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (18)
    CreateDynamicObject(617,-79.74771881,31.47329712,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (19)
    CreateDynamicObject(617,-129.63958740,-9.05260086,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (20)
    CreateDynamicObject(617,-140.03099060,-36.57809448,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (21)
    CreateDynamicObject(617,-117.22908020,-2.37237167,2.10939407,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (22)
    CreateDynamicObject(617,-162.83390808,-94.71243286,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (23)
    CreateDynamicObject(617,-131.68583679,-17.33161163,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (24)
    CreateDynamicObject(617,-124.80175781,-24.79199219,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (25)
    CreateDynamicObject(617,-143.12988281,-64.92871094,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (26)
    CreateDynamicObject(617,-133.43066406,-72.28808594,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (27)
    CreateDynamicObject(617,-142.60742188,-75.67578125,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (28)
    CreateDynamicObject(617,-153.12011719,-73.26660156,2.10939789,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (29)
    CreateDynamicObject(617,-158.27636719,-84.33593750,2.10939789,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (30)
    CreateDynamicObject(617,-156.52832031,-99.38769531,2.10939789,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (31)
    CreateDynamicObject(617,-144.05401611,-25.70674515,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (32)
    CreateDynamicObject(617,-160.99218750,-69.52050781,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (33)
    CreateDynamicObject(617,-65.63573456,-73.62593079,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (34)
    CreateDynamicObject(617,-95.31933594,-82.77148438,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (35)
    CreateDynamicObject(617,-121.34732819,-54.66466522,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (36)
    CreateDynamicObject(617,-105.52343750,-68.04296875,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (37)
    CreateDynamicObject(617,-131.67285156,-59.88183594,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (38)
    CreateDynamicObject(617,-107.27626038,58.07948303,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (39)
    CreateDynamicObject(617,-112.13378906,39.64746094,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (40)
    CreateDynamicObject(617,-112.19238281,13.33593750,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (41)
    CreateDynamicObject(617,-121.27148438,20.95703125,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (42)
    CreateDynamicObject(617,-106.53515625,28.61914062,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (43)
    CreateDynamicObject(617,-120.21679688,32.01660156,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (44)
    CreateDynamicObject(671,-106.86605835,-29.40931511,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sm_bushytree) (1)
    CreateDynamicObject(671,-137.81311035,-53.23184204,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sm_bushytree) (2)
    CreateDynamicObject(671,-134.32046509,-63.05351639,2.11718726,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sm_bushytree) (3)
    CreateDynamicObject(671,-136.41716003,-29.40640259,2.11718774,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sm_bushytree) (4)
    CreateDynamicObject(671,-127.27539062,-37.02539062,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sm_bushytree) (5)
    CreateDynamicObject(671,-99.39062500,-20.22949219,2.10939789,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sm_bushytree) (6)
    CreateDynamicObject(671,-103.97167969,-45.25195312,3.43611145,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sm_bushytree) (7)
    CreateDynamicObject(671,-114.64257812,-40.29003906,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sm_bushytree) (8)
    CreateDynamicObject(671,-56.79697800,27.39505768,2.10939598,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sm_bushytree) (9)
    CreateDynamicObject(671,-71.18164062,-11.50195312,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sm_bushytree) (10)
    CreateDynamicObject(671,-74.07233429,-6.02569962,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sm_bushytree) (11)
    CreateDynamicObject(671,-91.39453125,-15.68847656,2.10939598,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sm_bushytree) (12)
    CreateDynamicObject(671,-61.15911865,28.90131378,2.10939503,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sm_bushytree) (13)
    CreateDynamicObject(671,-49.46027374,77.05903625,2.10960197,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sm_bushytree) (14)
    CreateDynamicObject(671,-44.33789062,61.19726562,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sm_bushytree) (15)
    CreateDynamicObject(671,-48.73535156,60.98046875,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sm_bushytree) (16)
    CreateDynamicObject(671,-32.19921875,55.25585938,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sm_bushytree) (17)
    CreateDynamicObject(671,-27.44140625,76.68261719,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sm_bushytree) (18)
    CreateDynamicObject(671,-39.50097656,73.88671875,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sm_bushytree) (19)
    CreateDynamicObject(671,-28.94824219,67.81250000,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sm_bushytree) (20)
    CreateDynamicObject(713,-62.89981461,133.30314636,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_bevtree1) (1)
    CreateDynamicObject(713,-42.18554688,-8.61132812,2.10939789,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_bevtree1) (2)
    CreateDynamicObject(713,-112.79199219,-26.48730469,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_bevtree1) (3)
    CreateDynamicObject(713,-151.54687500,-79.07910156,2.10939407,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_bevtree1) (4)
    CreateDynamicObject(713,-128.11425781,36.38085938,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_bevtree1) (5)
    CreateDynamicObject(713,-30.50097656,35.34472656,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_bevtree1) (6)
    CreateDynamicObject(617,-40.39648438,17.92285156,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_treeb1) (45)
    CreateDynamicObject(713,-62.87418365,11.38792419,2.10939789,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_bevtree1) (7)
    CreateDynamicObject(713,-81.45030975,126.57632446,2.11718702,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_bevtree1) (8)
    CreateDynamicObject(776,-129.12724304,-107.05070496,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(hazelweetree_hi) (1)
    CreateDynamicObject(3252,-33.64136505,-11.91267395,2.10939503,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(des_oldwattwr_) (1)
    CreateDynamicObject(14873,-82.20085144,40.14004517,2.93603849,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(kylie_hay) (1)
    CreateDynamicObject(14873,-50.50390625,-15.20214844,2.93603849,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(kylie_hay) (2)
    CreateDynamicObject(14873,-57.61621094,-21.57324219,2.93603849,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(kylie_hay) (3)
    CreateDynamicObject(17039,-38.90682983,-0.22013855,2.10939598,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(cuntw_weebarn1_) (1)
    CreateDynamicObject(17039,14.92675781,69.85449219,2.11718559,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(cuntw_weebarn1_) (2)
    CreateDynamicObject(17298,-51.53363800,-123.00867462,7.00000000,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sjmoldbarn03) (1)
    CreateDynamicObject(12918,-73.01919556,7.50273514,2.11718750,0.00000000,0.00000000,70.00000000, HS_VIRTUAL_WORLD); //object(sw_haypile05) (1)
    CreateDynamicObject(12918,-83.28462982,-8.82099152,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sw_haypile05) (2)
    CreateDynamicObject(3092,9.76744843,65.80287170,3.07395411,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(dead_tied_cop) (1)
    CreateDynamicObject(3092,11.15234375,65.82714844,3.07395411,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(dead_tied_cop) (2)
    CreateDynamicObject(3035,9.96257401,69.19266510,2.87978506,0.00000000,0.00000000,90.00000000, HS_VIRTUAL_WORLD); //object(tmp_bin) (1)
    CreateDynamicObject(2907,11.70286942,67.61747742,2.26968527,0.00000000,0.00000000,43.00000000, HS_VIRTUAL_WORLD); //object(kmb_deadtorso) (1)
    CreateDynamicObject(2908,11.70031738,70.75677490,2.19460773,0.00000000,0.00000000,152.00000000, HS_VIRTUAL_WORLD); //object(kmb_deadhead) (1)
    CreateDynamicObject(2906,9.88285828,67.00244904,2.18366265,0.00000000,0.00000000,123.00000000, HS_VIRTUAL_WORLD); //object(kmb_deadarm) (1)
    CreateDynamicObject(2905,11.41310883,69.85816193,2.20863581,0.00000000,0.00000000,63.00000000, HS_VIRTUAL_WORLD); //object(kmb_deadleg) (1)
    CreateDynamicObject(2907,10.27343750,70.83007812,2.27722311,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(kmb_deadtorso) (2)
    CreateDynamicObject(2908,11.69921875,68.55371094,2.18706989,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(kmb_deadhead) (2)
    CreateDynamicObject(2906,12.68164062,71.57324219,2.19120049,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(kmb_deadarm) (2)
    CreateDynamicObject(2905,13.55468750,67.80566406,2.20109797,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(kmb_deadleg) (2)
    CreateDynamicObject(2905,10.67523956,71.88537598,2.20863581,0.00000000,0.00000000,123.00000000, HS_VIRTUAL_WORLD); //object(kmb_deadleg) (3)
    CreateDynamicObject(2906,13.41137695,68.84852600,2.19120049,0.00000000,0.00000000,234.00000000, HS_VIRTUAL_WORLD); //object(kmb_deadarm) (3)
    CreateDynamicObject(1450,11.82205963,73.63647461,2.71745396,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(dyn_crate_3) (1)
    CreateDynamicObject(3092,19.35021210,66.03533936,3.08149195,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(dead_tied_cop) (3)
    CreateDynamicObject(1442,19.78396606,67.10363770,2.71567082,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(dyn_firebin0) (1)
    CreateDynamicObject(1440,19.38468933,72.53221893,2.63630342,0.00000000,0.00000000,293.00000000, HS_VIRTUAL_WORLD); //object(dyn_box_pile_3) (1)
    CreateDynamicObject(1415,20.14007568,69.17792511,2.11718750,0.00000000,0.00000000,270.00000000, HS_VIRTUAL_WORLD); //object(dyn_dumpster) (1)
    CreateDynamicObject(12957,3.77655029,53.33954620,2.99540472,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sw_pickupwreck01) (1)
    CreateDynamicObject(2907,19.89550209,69.09208679,2.59999990,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(kmb_deadtorso) (3)
    CreateDynamicObject(13591,26.99192810,67.06372070,2.40000010,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(kickcar28) (1)
    CreateDynamicObject(1369,13.80323792,72.53559875,2.73906112,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(cj_wheelchair1) (1)
    CreateDynamicObject(2985,11.67309570,70.47140503,2.11718750,0.00000000,0.00000000,250.00000000, HS_VIRTUAL_WORLD); //object(minigun_base) (1)
    CreateDynamicObject(2907,9.77938080,68.01834869,2.26968527,0.00000000,0.00000000,342.00000000, HS_VIRTUAL_WORLD); //object(kmb_deadtorso) (4)
    CreateDynamicObject(2908,10.34659576,65.70582581,2.18706989,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(kmb_deadhead) (3)
    CreateDynamicObject(341,10.64708710,73.21485138,2.36718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(1)
    CreateDynamicObject(341,10.64648438,73.21484375,2.36718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(2)
    CreateDynamicObject(341,18.15802002,71.82659149,2.36718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(3)
    CreateDynamicObject(691,-74.14501190,105.54284668,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sm_veg_tree4_big) (1)
    CreateDynamicObject(691,-83.14941406,75.22167969,2.10960197,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sm_veg_tree4_big) (2)
    CreateDynamicObject(691,-93.79589844,93.00195312,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sm_veg_tree4_big) (3)
    CreateDynamicObject(691,-87.77929688,110.27636719,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(sm_veg_tree4_big) (4)
    CreateDynamicObject(713,23.21386719,80.02246094,2.11719131,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_bevtree1) (9)
    CreateDynamicObject(713,-45.63694000,116.54629517,2.11718798,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_bevtree1) (10)
    CreateDynamicObject(713,-25.36103821,85.19395447,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_bevtree1) (11)
    CreateDynamicObject(713,-97.14852142,-115.80251312,2.11718750,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(veg_bevtree1) (12)
    CreateDynamicObject(7415,-29.52814484,-38.88877869,2.00000000,30.00000000,90.00000000,280.00000000, HS_VIRTUAL_WORLD); //object(vgswlcmsign1) (1)
    CreateDynamicObject(3461,-81.16589355,12.61717987,3.69219899,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(tikitorch01_lvs) (1)
    CreateDynamicObject(3461,-88.74055481,-7.68271255,3.68440747,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(tikitorch01_lvs) (2)
    CreateDynamicObject(3461,-71.45410156,-1.38574219,3.68440747,0.00000000,0.00000000,0.00000000, HS_VIRTUAL_WORLD); //object(tikitorch01_lvs) (3)
}

// Function: CHideGame__CreateMenu
// This function creates the menu.
CHideGame__CreateMenus()
{
    new sInteriorRow[20];

    // Create the first menu.
    mLocationMenu1 = CreateMenu( "~y~Hide and Seek:", 2, 0.0, 200.0, 270.0, 250.0);
    SetMenuColumnHeader( mLocationMenu1, 0, "~p~Please choose a location" );

    for(new i = 0; i < 8; i++)
    {
        // Loop through all locations and add them to the menu.
        format(sInteriorRow, sizeof(sInteriorRow), "Interior: %d", aLocationInfo[i][2]);
        AddMenuItem(mLocationMenu1, 0, aLocationName[i]);
        AddMenuItem(mLocationMenu1, 1, sInteriorRow);
    }

    AddMenuItem(mLocationMenu1, 0, ">> Page 2");
    AddMenuItem(mLocationMenu1, 1, " ");

    // =============================================== //
    // Second menu.

    mLocationMenu2 = CreateMenu( "~y~Hide and Seek:", 2, 0.0, 200.0, 270.0, 250.0);
    SetMenuColumnHeader( mLocationMenu2, 0, "~p~Please choose a location" );

    for(new i = 8; i < 16; i++)
    {
        // Loop through all locations and add them to the menu.
        format(sInteriorRow, sizeof(sInteriorRow), "Interior: %d", aLocationInfo[i][2]);
        AddMenuItem(mLocationMenu2, 0, aLocationName[i]);
        AddMenuItem(mLocationMenu2, 1, sInteriorRow);
    }

    AddMenuItem(mLocationMenu2, 0, ">> Page 3");
    AddMenuItem(mLocationMenu2, 1, " ");

    // =============================================== //
    // Third menu.

    mLocationMenu3 = CreateMenu( "~y~Hide and Seek:", 2, 0.0, 200.0, 270.0, 250.0);
    SetMenuColumnHeader( mLocationMenu3, 0, "~p~Please choose a location" );

    for(new i = 16; i < LOCATIONS_AVAILABLE; i++)
    {
        // Loop through all locations and add them to the menu.
        format(sInteriorRow, sizeof(sInteriorRow), "Interior: %d", aLocationInfo[i][2]);
        AddMenuItem(mLocationMenu3, 0, aLocationName[i]);
        AddMenuItem(mLocationMenu3, 1, sInteriorRow);
    }

    AddMenuItem(mLocationMenu3, 0, ">> Page 1");
    AddMenuItem(mLocationMenu3, 1, " ");
}

// Function: CHideGame__onStartCommand
// This function is called in OnPlayerCommandText, when somebody types /has.
CHideGame__onStartCommand( iPlayerID, params[] )
{
    if (iHideGameState == HS_STATE_NONE)
    {
        new seekerId = iPlayerID;

        // Administrators can choose another player to be the seeker.
        if (Player(iPlayerID)->isAdministrator() && Command->parameterCount(params) > 0) {
            seekerId = Command->playerParameter(params, 0, iPlayerID);
            if (seekerId == INVALID_PLAYER_ID)
                return 1;  // an error will have been shown by Command::playerParameter().
        }

        // Send the player a nice message and show him the menu.
        SendClientMessage( iPlayerID, Color::Green, "* Please choose a location for the Hide&Seek minigame.");
        ShowMenuForPlayer( mLocationMenu1, iPlayerID );
        g_PlayerMenu[iPlayerID] = true;

        // Set some variables.
        iSeekerPlayer = seekerId;

        // Freeze them.
        TogglePlayerControllable( iPlayerID, false );

    } else if (iHideGameState == HS_STATE_SIGNING_UP) {
        CHideGame__onJoinCommand( iPlayerID, params );

    } else if (iHideGameState == HS_STATE_PLAYING) {
        SendClientMessage( iPlayerID,  Color::Red, "* Error: this minigame is already in progress.");

    } else {
        SendClientMessage( iPlayerID,  Color::Red, "* [Hide&Seek]: Something is completely fucked up.");
    }

    return 1;
}

// Function: CHideGame__onFindCommand
// This function is called in OnPlayerCommandText, when somebody types /find
CHideGame__onFindCommand( iPlayerID, params[] )
{
    if (CHideGame__GetState() != HS_STATE_PLAYING )
        return SendClientMessage( iPlayerID,  Color::Red, "* Error: this minigame isn't in progress.");

    if (iPlayerID != iSeekerPlayer)
        return SendClientMessage( iPlayerID, Color::Red, "* Error: You have to be the seeker to use this command!");

    if (!strlen(params))
        return SendClientMessage( iPlayerID, Color::White, "* Usage: /find [playerid]");

    new iFoundPlayer = Command->playerParameter(params, 0, iPlayerID);
    if (iFoundPlayer == INVALID_PLAYER_ID)
        return 1;  // Command::playerParameter() will have displayed an error message.

    if(CHideGame__GetPlayerState(iFoundPlayer) != HS_STATE_PLAYING)
        return SendClientMessage( iPlayerID,  Color::Red, "* Error: That player isn't in the H&S minigame.");

    if(iSeekerPlayer == iFoundPlayer)
        return SendClientMessage( iPlayerID, Color::Red, "* Error: What are you trying to do here?!");

    if(iFrozenCount != 0)
        return SendClientMessage( iPlayerID, Color::Red, "* Error: Wait for the countdown to finish first!");

    // Get the players position.
    new Float:fHideX, Float:fHideY, Float:fHideZ;
    GetPlayerPos( iFoundPlayer, fHideX, fHideY, fHideZ );

    // Get the distance between the two players.
    new Float:fDistance = GetDistance( iSeekerPlayer, fHideX, fHideY, fHideZ );
    if( fDistance > 5.0)
        return SendClientMessage( iPlayerID,  Color::Red, "* Error: You're not close to that player!");

    CHideGame__ThrowOut( iFoundPlayer, HS_THROWNOUT_GOTFOUND );
    return 1;
}

// Function: CHideGame__onJoinCommand
// This function is called in CHideGame__onStartCommand
CHideGame__onJoinCommand( iPlayerID, params[] )
{
    // Error checking comes here.
    if (CHideGame__GetState() == HS_STATE_NONE)
        return SendClientMessage(iPlayerID, Color::Red, "* Error: this minigame isn't signing up right now, only admins can start it.");

    if (CHideGame__GetPlayerState(iPlayerID) == HS_STATE_PLAYING)
        return SendClientMessage(iPlayerID, Color::Red, "* Error: you're playing already, silly!");

    if (CHideGame__GetPlayerState(iPlayerID) == HS_STATE_SIGNING_UP)
        return SendClientMessage(iPlayerID, Color::Red, "* Error: you've already been signed up for this minigame.");

    new const price = GetEconomyValue(MinigameParticipation);

    if (GetPlayerMoney( iPlayerID ) < price) {
        new message[128];
        format(message, sizeof(message), "* Error: You need $%s to sign up for Hide and Seek!", formatPrice(price));

        return SendClientMessage(iPlayerID, Color::Red, message);
    }

    if (GetPlayerInterior(iPlayerID) != 0)
        return SendClientMessage( iPlayerID, Color::Red, "* Error: Go outside first.");

    if (iHideGameSignups >= aLocationInfo[iMapRunning] [0] && aLocationInfo[iMapRunning][0] != -1)
        return SendClientMessage( iPlayerID, Color::Red, "* Error: Too many players have signed up for this map already.");

    // Okay, they may sign up.
    aHidePlayerState[ iPlayerID ] = HS_STATE_SIGNING_UP;
    SendClientMessage( iPlayerID, Color::Green, "* You've succesfully signed up for the Hide and Seek minigame.");

    // Take their moneys :D
    TakeRegulatedMoney(iPlayerID, MinigameParticipation);
    iHideGameSignups++;

    iHideGameState = HS_STATE_SIGNING_UP;

    new sAdminMsg[128];
    format(sAdminMsg, sizeof(sAdminMsg), "%s (Id:%d) has signed up for /has.", PlayerName( iPlayerID ), iPlayerID );
    Admin(iPlayerID, sAdminMsg);

    format(sAdminMsg, sizeof(sAdminMsg), "~r~~h~%s~w~ has signed up for ~y~Hide 'n Seek~w~ (~p~/has~w~)", Player(iPlayerID)->nicknameString());
    NewsController->show(sAdminMsg);

    #pragma unused params
    return 1;
}

// Function: CHideGame__onLeaveCommand
// This function is called in OnPlayerCommandText, when somebody types /leave.
CHideGame__onLeaveCommand( iPlayerID )
{
    // They have only signed up, just sign them out again!
    if(CHideGame__GetPlayerState( iPlayerID ) == HS_STATE_SIGNING_UP)
    {
        aHidePlayerState[ iPlayerID ] = HS_STATE_NONE;

        // Give them their money back.
        GiveRegulatedMoney(iPlayerID, MinigameParticipation);
        iHideGameSignups--;

        // If the seeker leaves, the minigame is over.
        if(iSeekerPlayer == iPlayerID)
        {
            new notice[128];
            format(notice, sizeof(notice), "~y~Hide and Seek~w~ has finished: ~r~~h~The Seeker~w~ left the minigame!");
            NewsController->show(notice);
            CHideGame__ResetVariables();
        }
    }
    else  // They're playing :/
    {
        CHideGame__ThrowOut( iPlayerID, HS_THROWNOUT_LEAVING );
    }
}

// Function: CHideGame__onInteriorChange
// Called when someone leaves the interior.
CHideGame__onInteriorChange( iPlayerID, iOldInteriorID )
{
    if(CHideGame__GetPlayerState(iPlayerID) != HS_STATE_PLAYING)
        return 0;

    new Float:fDistance = GetDistance( iPlayerID,  aLocationCoordinates[ iMapRunning ] [ 0 ], aLocationCoordinates[ iMapRunning ] [ 1 ], aLocationCoordinates[ iMapRunning ] [ 2 ] );

    // Make sure the minigame has started already, otherwise we throw them out @ start.
    if(iOldInteriorID != 0 && fDistance < 100) {
        CHideGame__ThrowOut( iPlayerID, HS_THROWNOUT_INTERIOR );
        return 1;
    }

    return 0;
}

// Function: CHideGame__onPlayerSpawn
// Called when someone spawns in the minigame.
CHideGame__onPlayerSpawn( iPlayerID )
{
    new Float:fDistance = GetDistance( iPlayerID,  aLocationCoordinates[ iMapRunning ] [ 0 ], aLocationCoordinates[ iMapRunning ] [ 1 ], aLocationCoordinates[ iMapRunning ] [ 2 ] );

    if(fDistance > 50.0)
    {
        SetPlayerPos( iPlayerID, aLocationCoordinates[ iMapRunning ] [ 0 ], aLocationCoordinates[ iMapRunning ] [ 1 ], aLocationCoordinates[ iMapRunning ] [ 2 ] );
    }
}

// Function: CHideGame__onPlayerPunch
// Called when someone punches!
CHideGame__onPlayerPunch( iPlayerID )
{
    // This prevents the annoying hitting in the H&S minigame.
    if(iHidePlayerPunches[ iPlayerID ] > 5)
    {
        SendClientMessage( iPlayerID, Color::Red, "* You were warned for punching. You've been automatically thrown out of the minigame.");
        CHideGame__ThrowOut( iPlayerID, HS_THROWNOUT_PUNCHING );
    }
    else
    {
        iHidePlayerPunches[ iPlayerID ] ++;
        SendClientMessage( iPlayerID, Color::Red, "* Stop punching in the H&S minigame or you'll be kicked out.");
    }
    return 1;
}

// Function: CHideGame__onPlayerDeath
// Called when someone dies in the minigame
CHideGame__onPlayerDeath( iPlayerID )
{
    CHideGame__ThrowOut( iPlayerID, HS_THROWNOUT_DIED );
}

// Function: CHideGame__onPlayerDisconnect
// Called when someone disconnects.
CHideGame__onPlayerDisconnect( iPlayerID )
{
    if(CHideGame__GetPlayerState(iPlayerID) == HS_STATE_SIGNING_UP)
    {
        aHidePlayerState[ iPlayerID ] = HS_STATE_NONE;
        iHideGameSignups--;

        if(iSeekerPlayer == iPlayerID)
        {
            new notice[128];
            format(notice, sizeof(notice), "~y~Hide and Seek~w~ has finished: ~r~~h~The Seeker~w~ left the minigame!");
            NewsController->show(notice);
            CHideGame__ResetVariables();
        }
    }

    else if(CHideGame__GetPlayerState(iPlayerID) == HS_STATE_PLAYING)
    {
        CHideGame__ThrowOut( iPlayerID, HS_THROWNOUT_DISCONNECT );
    }
}

// Function: CHideGame__ThrowOut
// This function handles the process of a player leaving the minigame under any circumstance.
CHideGame__ThrowOut( iPlayerID, iReason )
{
    // The seeker has left the minigame, it should be stopped.
    if(iPlayerID == iSeekerPlayer)
    {
        for (new hiderId = 0; hiderId <= PlayerManager->highestPlayerId(); hiderId++) {
            if (Player(hiderId)->isConnected() == false || Player(hiderId)->isNonPlayerCharacter() == true)
                continue;

            // Spawn everyone who signed up, and inform them.
            if(CHideGame__GetPlayerState(hiderId) != HS_STATE_PLAYING)
                continue;

            ColorManager->releasePlayerMinigameColor(hiderId);

            // Load their old position.
            CHideGame__LoadPos(hiderId);
            // Reset the minigame data.
        }

        // Send them a message.
        new notice[128];
        format(notice, sizeof(notice), "~y~Hide and Seek~w~ has finished: ~r~~h~The Seeker~w~ left the minigame!");
        NewsController->show(notice);
        CHideGame__ResetVariables();
    }
    else
    {
        new sMessage[128];
        iHideGameSignups--;

        new sReason[50];
        switch( iReason )
        {
            case 0: sReason = "Leaving";
            case 1: sReason = "Got found";
            case 2: sReason = "Left the server";
            case 3: sReason = "Left the interior";
            case 4: sReason = "Died";
            case 5: sReason = "Constant punching";
        }

        format(sMessage, sizeof(sMessage), "~y~Hide and Seek~w~ update: ~r~~h~%s~w~ left the minigame (%s)!", Player(iPlayerID)->nicknameString(), sReason);
        NewsController->show(sMessage);

        ColorManager->releasePlayerMinigameColor(iPlayerID);

        for (new forPlayerId = 0; forPlayerId <= PlayerManager->highestPlayerId(); ++forPlayerId) {
            if (Player(forPlayerId)->isConnected() == false)
                continue;

            ShowPlayerNameTagForPlayer(forPlayerId, iPlayerID, 1);
        }

        CHideGame__LoadPos( iPlayerID );
        CHideGame__ResetPlayerVariables( iPlayerID );

        // Bail out if there aren't exactly two players left.
        if (iHideGameSignups != 2)
            return;

        new iWinner = -1;

        for (new playerId = 0; playerId <= PlayerManager->highestPlayerId(); playerId++) {
            if (Player(playerId)->isConnected() == false || Player(playerId)->isNonPlayerCharacter() == true)
                continue;

            // Spawn everyone who signed up, and inform them.
            if(CHideGame__GetPlayerState(playerId) != HS_STATE_PLAYING)
                continue;

            if(iSeekerPlayer == playerId)
                continue;

            // We get the winner.
            iWinner = playerId;
            ColorManager->releasePlayerMinigameColor(iWinner);

            for (new forPlayerId = 0; forPlayerId <= PlayerManager->highestPlayerId(); ++forPlayerId) {
                if (Player(forPlayerId)->isConnected() == false || Player(playerId)->isNonPlayerCharacter() == true)
                    continue;

                ShowPlayerNameTagForPlayer(forPlayerId, iWinner, 1);
            }

            CHideGame__LoadPos( iWinner );
            break;
        }

        ColorManager->releasePlayerMinigameColor(iSeekerPlayer);

        CHideGame__LoadPos( iSeekerPlayer );

        format(sMessage, sizeof(sMessage), "~y~Hide and Seek~w~ has finished: ~r~~h~%s~w~ has won the minigame!", Player(iWinner)->nicknameString());
        NewsController->show(sMessage);

        CHideGame__ResetVariables();

        format(sMessage, sizeof(sMessage), "You've won the Hide&Seek minigame and you've received $%s!",
            formatPrice(GetEconomyValue(MinigameVictory, iHideGameTotalSignups)));

        SendClientMessage( iWinner, Color::Green, sMessage);
        GiveRegulatedMoney(iWinner, MinigameVictory, iHideGameTotalSignups);

        // Increase the amount of minigames the player has won
        WonMinigame[ iWinner ]++;
    }
}

// Function: CHideGame__onMenuSelection
// This function is called in OnPlayerMenuSelectedRow, if someone selects something of the location menu.
CHideGame__onMenuSelection( iPlayerID, iRow )
{
    if(GetPlayerMenu( iPlayerID ) != mLocationMenu1 && GetPlayerMenu( iPlayerID ) != mLocationMenu2 && GetPlayerMenu( iPlayerID ) != mLocationMenu3) return 0;

    if(iHideGameState > HS_STATE_NONE)
    {
        SendClientMessage( iPlayerID, Color::Red, "* Error: The minigame is already processing the signup or playing.");
        TogglePlayerControllable( iPlayerID, true );
        return 1;
    }

    // Get the correct location of the menu.
    new iLocation = -1;

    if(GetPlayerMenu( iPlayerID ) == mLocationMenu1)
    {
        iLocation = iRow;

        if(iRow == 8)
        {
            HideMenuForPlayer( mLocationMenu1, iPlayerID );
            ShowMenuForPlayer( mLocationMenu2, iPlayerID );
            g_PlayerMenu[iPlayerID] = true;
        }
        else
        {
            CHideGame__startSignup( iPlayerID, iLocation );
        }
    }
    else if(GetPlayerMenu( iPlayerID ) == mLocationMenu2)
    {
        iLocation = iRow + 8;

        if(iRow == 8)
        {
            HideMenuForPlayer( mLocationMenu2, iPlayerID );
            ShowMenuForPlayer( mLocationMenu3, iPlayerID );
            g_PlayerMenu[iPlayerID] = true;
        }
        else
        {
            CHideGame__startSignup( iPlayerID, iLocation );
        }
    }

    else if(GetPlayerMenu( iPlayerID ) == mLocationMenu3)
    {
        iLocation = iRow + 16;

        if(iRow == 3)
        {
            HideMenuForPlayer( mLocationMenu3, iPlayerID );
            ShowMenuForPlayer( mLocationMenu1, iPlayerID );
            g_PlayerMenu[iPlayerID] = true;
        }
        else
        {
            CHideGame__startSignup( iPlayerID, iLocation );
        }
    }
    return 1;
}

// Function: CHideGame__startSignup
// Starts the signing up of the minigame.
CHideGame__startSignup( iPlayerID, iLocation )
{
    new sMessage[128];

    // Inform everyone!
    SendClientMessageToAllEx(COLOR_YELLOW, "* The Hide & Seek minigame is now signing up! Use /has to join. This minigame will start in 20 seconds.");
    format(sMessage, sizeof(sMessage), "* The searching location is %s, and %s (Id:%d) will seek.", aLocationName[ iLocation ], PlayerName( iSeekerPlayer ), iSeekerPlayer );
    SendClientMessageToAllEx(COLOR_YELLOW, sMessage);
    SendClientMessage( iSeekerPlayer, COLOR_LIGHTBLUE, "* You were chosen as Seeker for the H&S minigame, use /leave if you don't wish to signup.");

    iMapRunning = iLocation;

    // Hm, better unfreeze him.
    TogglePlayerControllable( iPlayerID, true );
    aHidePlayerState[ iSeekerPlayer ] = HS_STATE_SIGNING_UP;
    iHideGameSignups++;

    // Signing up.
    iHideGameState = HS_STATE_SIGNING_UP;

    // And set the start timer.
    iHideStartTimer = SetTimer("CHideGame__Start", 20000, false);
}

// Function: CHideGame__ResetVariables
// This function resets all variables.
CHideGame__ResetVariables()
{
    // Resets all basic variables.
    iHideGameState = HS_STATE_NONE;
    iSeekerPlayer = INVALID_PLAYER_ID;
    iHideGameSignups = 0;
    iFrozenCount = 60;
    iMapRunning = -1;

    // Reset the per-player information.
    for (new playerId = 0; playerId < MAX_PLAYERS; ++playerId) {
        aHidePlayerState[playerId] = HS_STATE_NONE;
        bHideFrozen[playerId] = 0;
        iHidePlayerPunches[playerId] = 0;
    }

    // Kill the timers if any are running.
    KillTimer(iHideStartTimer);
    KillTimer(iFrozenCountDown);
    KillTimer(iHideSecondCountDown);

    iFrozenCountDown = -1;
    iHideStartTimer = -1;
    iHideSecondCountDown = -1;
}

// Function: CHideGame__onExitedMenu
// Called when someone exists the menu.
CHideGame__onExitedMenu( iPlayerID )
{
    // They exited the menu, reset the data.
    if(GetPlayerMenu( iPlayerID ) == mLocationMenu1 || GetPlayerMenu( iPlayerID ) == mLocationMenu2)
    {
        CHideGame__ResetVariables();
    }
    return 1;
}

// Function: CHideGame__ResetVariables
// This function resets all variables.
CHideGame__ResetPlayerVariables( iPlayerID )
{
    aHidePlayerState[ iPlayerID ] = HS_STATE_NONE;
    bHideFrozen[ iPlayerID ] = 0;
    iHidePlayerPunches[ iPlayerID ] = 0;
    TogglePlayerControllable( iPlayerID, true );
}

// Function: CHideGame__GetState
// Returns the player state in the Hide&Seek minigame.
CHideGame__GetPlayerState( iPlayerID )
{
    return aHidePlayerState[ iPlayerID ];
}

// Function: CHideGame__GetState
// Returns the state of the minigame.
CHideGame__GetState()
{
    return iHideGameState;
}

// Function: CHideGame__Start
// The actual starting of the minigame comes here, kewl stuff. This is public since it's being called by a timer.
public CHideGame__Start()
{
    if(iHideGameSignups < HS_MINIMUM_PLAYERS)
    {
        // Not enough signups, cancel the minigame.
        SendClientMessageToAllEx(COLOR_ORANGE, "*** There weren't enough signups for Hide&Seek!");
        CHideGame__ResetVariables();
    }
    else
    {
        // Game has started!
        iHideGameState = HS_STATE_PLAYING;

        iHideGameTotalSignups = iHideGameSignups;

        for (new playerId = 0; playerId <= PlayerManager->highestPlayerId(); playerId++) {
            if (Player(playerId)->isConnected() == false || Player(playerId)->isNonPlayerCharacter() == true)
                continue;

            // Spawn everyone who signed up, and inform them.
            if(iSeekerPlayer == playerId) continue;
            if(CHideGame__GetPlayerState(playerId) != HS_STATE_SIGNING_UP) continue;

            // Save their data.
            CHideGame__SavePos(playerId);

            for (new forPlayerId = 0; forPlayerId <= PlayerManager->highestPlayerId(); ++forPlayerId) {
                if (Player(forPlayerId)->isConnected() == false)
                    continue;

                ShowPlayerNameTagForPlayer(forPlayerId, playerId, 0);
            }

            // Set the position.
            aHidePlayerState[playerId] = HS_STATE_PLAYING;
            SetPlayerInterior(playerId, aLocationInfo[ iMapRunning ] [ 2 ]);
            SetPlayerPos(playerId, aLocationCoordinates[ iMapRunning ] [ 0 ], aLocationCoordinates[ iMapRunning ] [ 1 ], aLocationCoordinates[ iMapRunning ] [ 2 ] );
            SendClientMessage(playerId, COLOR_LIGHTBLUE, "* You have 60 seconds to find yourself a hiding place! What are you waiting for? Go!");

            ColorManager->setPlayerMinigameColor(playerId, 0xFFFFFF00);

            SetPlayerVirtualWorld(playerId, HS_VIRTUAL_WORLD );
            if( aLocationInfo[ iMapRunning ] [ 1 ] != -1 )
            {
                SetPlayerWeather(playerId, aLocationInfo[ iMapRunning ] [ 1 ] );
            }

            // Reset their weapons
            ResetPlayerWeapons(playerId);
        }

        // Save the seekers position.
        CHideGame__SavePos( iSeekerPlayer );

        // Set the seekers position too.
        SetPlayerInterior( iSeekerPlayer, aLocationInfo[ iMapRunning ][ 2 ] );
        SetPlayerPos( iSeekerPlayer, aLocationCoordinates[ iMapRunning ] [ 0 ], aLocationCoordinates[ iMapRunning ] [ 1 ], aLocationCoordinates[ iMapRunning ] [ 2 ] );

        ColorManager->setPlayerMinigameColor(iSeekerPlayer, Color::Red);

        SetPlayerVirtualWorld( iSeekerPlayer, HS_VIRTUAL_WORLD );

        if( aLocationInfo[ iMapRunning ] [ 1 ] != -1 )
        {
            SetPlayerWeather( iSeekerPlayer, aLocationInfo[ iMapRunning ] [ 1 ] );
        }

        // Reset their weapons
        ResetPlayerWeapons( iSeekerPlayer );

        // Set their var to playing.
        aHidePlayerState[ iSeekerPlayer ] = HS_STATE_PLAYING;

        // Freeze them and inform them what the heck is going on.
        SendClientMessage( iSeekerPlayer, COLOR_LIGHTBLUE, "*** You'll be frozen for 60 seconds, after which you can start searching.");
        SendClientMessage( iSeekerPlayer, COLOR_LIGHTBLUE, "*** Use /find [player] to throw someone out of the minigame.");
        TogglePlayerControllable( iSeekerPlayer, false );
        iFrozenCountDown = SetTimer("CHideGame__UnfreezeSeeker", 1000, true);
        iHideSecondCountDown = SetTimer("CHideGame__SecondTimer", 1100, true);
    }
    return 1;
}

// Function: CHideGame__UnfreezeSeeker
// This is being called every second for 30 secs after the starting of the minigame.
public CHideGame__UnfreezeSeeker()
{
    // Decrease the var.
    iFrozenCount--;

    // Inform them with a nice message.
    new sMessage[50];
    format(sMessage, sizeof(sMessage), "~w~Time left: ~r~%d", iFrozenCount);

    // Right, the countdown is @ zero.
    if(iFrozenCount == 0)
    {
        // Kill the repeating timer
        KillTimer(iFrozenCountDown);
        iFrozenCountDown = false;

        GameTextForPlayer(iSeekerPlayer, "~g~Go go go!", 950, 6 );
        // Unfreeze the seeker
        TogglePlayerControllable( iSeekerPlayer, true );

        // And the rest gets informed.
        for (new playerId = 0; playerId <= PlayerManager->highestPlayerId(); playerId++) {
            if (Player(playerId)->isConnected() == false || Player(playerId)->isNonPlayerCharacter() == true)
                continue;

            if(CHideGame__GetPlayerState(playerId) != HS_STATE_PLAYING) continue;
            if(iSeekerPlayer == playerId) continue;

            GameTextForPlayer(playerId, "~g~Game started!", 950, 6 );
        }
    }
    // Timer still running
    else
    {
        if(iFrozenCount < 0) return 0;

        // If they're still running, show them how much time they've got left.
        for (new playerId = 0; playerId <= PlayerManager->highestPlayerId(); playerId++) {
            if (Player(playerId)->isConnected() == false || Player(playerId)->isNonPlayerCharacter() == true)
                continue;

            if(CHideGame__GetPlayerState(playerId) != HS_STATE_PLAYING) continue;

            GameTextForPlayer(playerId, sMessage, 950, 6);
        }
    }
    return 1;
}

// Function: CHideGame__SecondTimer
// This is called every second, processing everything that happens.
public CHideGame__SecondTimer()
{
    for (new iPlayerID = 0; iPlayerID <= PlayerManager->highestPlayerId(); iPlayerID++)
    {
        if(!Player(iPlayerID)->isConnected()) continue;
        if(CHideGame__GetPlayerState(iPlayerID) != HS_STATE_PLAYING) continue;
        if(Player(iPlayerID)->isNonPlayerCharacter()) continue;

        // "Godmode"
        SetPlayerHealth( iPlayerID, 100.0 );
        SetPlayerArmour( iPlayerID, 0.0 );

        if(iPlayerID == iSeekerPlayer) continue;

        // Get the players position.
        new Float:fHideX, Float:fHideY, Float:fHideZ;
        GetPlayerPos( iPlayerID, fHideX, fHideY, fHideZ );

        // Get the distance between the two players.
        new Float:fDistance = GetDistance(iSeekerPlayer, fHideX, fHideY, fHideZ);

        // They're frozen.
        if(bHideFrozen[ iPlayerID ] == 1)
        {
            // The seeker hasn't found him, unfreeze them again.
            if( fDistance > 8.0)
            {
                TogglePlayerControllable( iPlayerID, true );
                bHideFrozen[ iPlayerID ] = false;
            }
        }
        // They're not frozen.
        else
        {
            // The seeker is near them, we should freeze them.
            if( fDistance < 8.0 && iFrozenCount == 0)
            {
                TogglePlayerControllable( iPlayerID, false );
                bHideFrozen[ iPlayerID ] = true;
            }
        }
    }
}

// Function: CHideGame__SavePos
// This function saves the position of the player when they signs up for the minigame.
CHideGame__SavePos(playerid)
{
    SavePlayerGameState(playerid);
}

// Function: CHideGame__LoadPos
// This function loads everything again.
CHideGame__LoadPos(playerid)
{
    LoadPlayerGameState(playerid);
}

CHideGame__SeekerId() { return iSeekerPlayer; }
