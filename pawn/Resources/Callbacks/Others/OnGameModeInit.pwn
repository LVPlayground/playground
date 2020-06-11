// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/*******************************************************************************
*       Las Venturas Playground 2.90  - OnGameModeInit.pwn                    *
*       This file manages everything that needs to take place on               *
*       A gamemode startup, such as setting weather, the mode name,            *
*       loading gang bases, ATM's, etc etc. This file has been cleaned         *
*       up, indented, and commented by Jay.                                    *
*                                                                              *
*******************************************************************************/

// Keep track of whether the main() method has finished executing.
new bool: g_mainFinishedExecuting = false;

public OnGameModeInit() {
    // Block until the main() method has finished executing completely. Race conditions can occur in
    // which certain information or classes are not yet initialized when we don't do this. Pawn
    // initialization happens on a different thread than normal script execution.
    if (g_mainFinishedExecuting == false) {
        SetTimer("OnGameModeInit", 0, 0);
        return 1;
    }

    // Part of Driver.
    SetTimer("UpdateVehicleTrailerStatus", 1000, 1);

    // Initalize the Las Venturas Playground handlers - Note that the Gang base
    // handler is loaded at the end of the callback due to a textdraw issue.

// *************************************************************************************************

#if Feature::EnableServerSideWeaponConfig == 1

    SetCbugAllowed(true);
    SetDamageSounds(0, 0);
    SetVehiclePassengerDamage(true);
    SetVehicleUnoccupiedDamage(false);

#endif

    SetTimer("CExport__NewWantedVehicle", 10000, 0);  // Initialise exports ten seconds from now

    CChase__Initialize();           // Chase
    CDrink__Initialize();           // Drink
    CBomb__Initialize();            // Bomb shop
    CRobbery__Initialize();         // Robbery
    CShell__CheckStatus();          // Rivershell

    CDerby__Init();                 // Derby handler
#if Feature::DisableFights == 0
    CWWTW__Initialize();            // Walkies Weapons Team War
#endif
    CExport__CreateMap();           // Export
    CHideGame__Initialize();        // Hide & Seek
#if Feature::DisableFights == 0
    rwResetData(true);              // RWTW
#endif
    InitHotAirBalloon();
    BagCash__Initialize();

#if Feature::DisableFights == 0
    CFightClub__Initialize();       // FightClub handler
#endif

    CLyse__Initialize();

    // Set the gamemode text in accordance to the version:
    new GameModeText[128];
    format(GameModeText, 32, "LVP %d.%d Freeroam Deathmatch", Version::Major, Version::Minor);
    SetGameModeText (GameModeText);

    // Basic settings - Prices, time, running animations, etc.

    EnableStuntBonusForAll(0);              // Disable all stunt bonuses, as this conflicts with the anti-moneycheat.
    ShowPlayerMarkers(1);                    // Shows the player markers.
    ShowNameTags(1);                         // Shows the player nametags.
    AllowInteriorWeapons(0);                    // Enables the usage of interior weapons.
    LoadMaps();                                 // Loads the mapped areas.
    SetMapIcons();                              // Map icons - Interface/functions.pwn
    InitSpawnPos();                             // Format the spawn position arrays - see Elements/Player/SpawnPos.pwn

    DisableInteriorEnterExits();                // We handle interior entrances ourselves.
    UsePlayerPedAnims();                        // Enables CJ running on all peds.

    // Chainsaw pickup
    CreatePickup(341,3,2095.8220,1284.8751,10.8203);

    // Pool Cues in bar
    CreatePickup(338,2,508.5461,-83.6139,998.9609);
    CreatePickup(338,2,489.9265,-80.3315,999.6263);

    // VIP ROOM PICKUPS:
    CreatePickup(1242,2,   2140.7185,2386.1357,12.8184); // armour
    CreatePickup(321,2,    2136.7739,2384.5930,12.8232); // dildo
    CreatePickup(325,2,    2134.8176,2386.8611,12.8232); // flowers
    CreatePickup(350,2,    2144.1833,2385.1716,10.8203); // sawnoff
    CreatePickup(353,2,    2144.0657,2390.3877,11.8304); // MP5
    CreatePickup(348,2,    2139.3857,2393.6660,10.8203); // desert eagle
    CreatePickup(1240,2,   2136.3499,2394.8228,10.8203); // health
    CreatePickup(342,2,    2144.3044,2395.6790,11.8304); // grenades
    CreatePickup(326,2,    2143.4937,2394.3469,10.8203); // cane
    CreatePickup(372,2,    2143.4253,2402.0815,10.8203); // micro uzi
    CreatePickup(356,2,    2143.4800,2404.9910,10.8211); // m4
    CreatePickup(325,2,    2143.6147,2418.7561,11.0752); // flowers
    // EoF VIP room pickups

    CreatePickup(371, 15, 1710.3359,1614.3585,10.1191, -1 );  // Parachute
    CreatePickup(371, 15, 1964.4523,1917.0341,130.9375, -1 ); // Parachute
    CreatePickup(371, 15, 2055.7258,2395.8589,150.4766, -1 ); // Parachute
    CreatePickup(371, 15, 2265.0120,1672.3837,94.9219, -1);  // Parachute
    CreatePickup(371, 15, 2265.9739,1623.4060,94.9219, -1);  // Parachute
    CreatePickup(371, 15, 1535.5153,-1361.6178,329.6245, -1 ); // Parachute
    CreatePickup(371, 15, 1535.9606,-1345.3348,329.6245, -1 ); // Parachute
    CreatePickup(371, 15, 1553.6597,-1345.2400,329.6245, -1 ); // Parachute
    CreatePickup(371, 15, 1553.4500,-1361.1300,329.4677, -1 ); // Parachute
    CreatePickup(633, 1, 1544.8704,-1353.5054,329.4740, -1 ); // yay
    CreatePickup( 350, 2, 1459.3282, 2790.0601, 10.8203  );
    CreatePickup( 342, 2, 1459.3282, 2785.0601, 10.8203  );
    CreatePickup( 1242, 2, 2075.0144, 2151.1394, 19.1455 ); // FC_Armor - 15/12
    CreatePickup(372,2,-2664.8376,1448.8052,7.1016 );
    CreatePickup(372,2,-2097.8689,1141.1003,52.6753 );
    CreatePickup(352,2,-1667.5295,1401.8842,9.8047 );
    CreatePickup(352,2,-2027.8195,-2551.9875,30.6250 );
    CreatePickup(325,2,-2807.5823,1187.7839,20.6526 );
    CreatePickup(325,2,-2687.8142,722.2857,32.2508 );
    CreatePickup(325,2,-2431.2141,993.0415,45.3016 );
    CreatePickup(325,2,-1793.3477,510.0178,27.3283 );
    CreatePickup(325,2,-2579.0012,-16.9129,8.0781 );
    CreatePickup(325,2,-1954.7710,-749.8298,35.8909 );
    CreatePickup(325,2,-2180.2034,-2425.0066,30.6250 );
    CreatePickup(348,2,-1870.0856,-1608.0374,21.7641) ;
    CreatePickup(346,2,-2214.8301,-40.7038,35.3203 );
    CreatePickup(348,2,-2213.5242,113.0263,35.3203 );
    CreatePickup(371,2,-2237.7300,-1711.5620,480.8730, -1 );
    CreatePickup(366,2,-1624.3873,-2693.4438,48.7427 );
    CreatePickup(1242,2,-2082.9619,-2339.0798,30.6250 );
    CreatePickup(1242,2,-2291.7400,-1589.7646,479.3270 );
    CreatePickup(1242,2,-1389.8468,-360.2007,6.0000 );
    CreatePickup(1242,2,-2625.2793,-191.1426,7.2031 );
    CreatePickup(1242,2,-2284.9148,-24.1857,35.3125 );
    CreatePickup(1242,2,-1864.6273,111.4731,15.1172 );
    CreatePickup(1242,2,-2512.9956,761.0992,35.1719 );
    CreatePickup(1242,2,-2919.9424,980.5508,5.9741 );
    CreatePickup(1242,2,-1495.4761,1278.3402,7.1797 );

    CreatePickup(1241, 3, 1680.3677,1757.0861,10.8277);

    g_iShipIcon = CreatePickup(1239, 2, 2021.8129, 1545.2087, 10.8231 );    // info icon
    g_TrainPickup_0 = CreatePickup(1239,3, 2855.7217,1290.7852,11.3906 );    // Train icon 0
    g_TrainPickup_1 = CreatePickup(1239,3, 1707.7102,-1949.6313,13.9554 );   // Train icon 1
    g_TrainPickup_2 = CreatePickup(1239,3, 820.2381,-1359.5684,-0.6700 );    // Train icon 2
    g_TrainPickup_3 = CreatePickup(1239,3, -1955.5629,137.6131,27.4579 );    // Train icon 3
    g_TrainPickup_4 = CreatePickup(1239,3, 1433.0952,2625.9695,11.3926 );    // Train icon 4

#if Feature::DisableFights == 0
    //===== FightClub ======
    FCPickup = CreatePickup(1239, 3, 2104.4856,2189.9902,14.4965 ); // For info
    FCDPickup = CreatePickup(1254, 1, 2080.5310,2151.2712,19.1455 ); // For dialog (duel or watch)
    //======================
#endif

    g_CrushIcon = CreatePickup(1239,3,1058.1198,1784.7554,10.8203);

    Vip = CreatePickup(1274,20,2127.6060,2376.1909,10.8203); // VIP Pickup
    VipExit = CreatePickup(1274, 20, 2127.0554,2382.4592,10.9919); // Vip Exit Pickup

    // Airport flight pickups:
    g_AirportPickup[0] = CreatePickup(1239,1,1696.3019,1451.4441,10.7620); // las venturas
    g_AirportPickup[1] = CreatePickup(1239,1,-1408.9749,-307.3280,14.1411); // San fierro
    g_AirportPickup[2] = CreatePickup(1239,1,1685.2478,-2331.6377,13.5469); // Los santos
    g_AirportPickup[3] = CreatePickup(1239,1,-794.91,491.12,1376.19); // Liberty city
    // other general pickups.
    new iIndex, iSize;
    for (iIndex = 0, iSize = sizeof(gHealthPickups ); iIndex < iSize; iIndex++)
    {
            CreatePickup(1240, 2,
            gHealthPickups[iIndex][PickupX],
            gHealthPickups[iIndex][PickupY],
            gHealthPickups[iIndex][PickupZ] );
    }
    for (iIndex = 0, iSize = sizeof(gArmorPickups ); iIndex < iSize; iIndex++)
    {
        CreatePickup(1242, 2,
            gArmorPickups[iIndex][PickupX],
            gArmorPickups[iIndex][PickupY],
            gArmorPickups[iIndex][PickupZ] );
    }


    // Set some required variables:
    CTaxi__Initialize();

    CDrink__BuildMenus();

    // Build ONLY the AirportMenu
    #include Interface/menus.pwn

    // Objects
    #include Resources/Maps/main.pwn

    // Bombshop, countdown bomb Handlers/bombshop.pwn
    CBomb__CreateTextdraws();

    // Rivershell
    new str[256];
    format(str,256,"~b~Blue team: 0~n~~n~~g~Green team: 0");
    Rivershell = TextDrawCreate(501,100,str);
    TextDrawAlignment(Rivershell,0);
    TextDrawBackgroundColor(Rivershell,0x000000ff);
    TextDrawFont(Rivershell,1);
    TextDrawLetterSize(Rivershell,0.399999,1.200000);
    TextDrawColor(Rivershell,0xffffffff);
    TextDrawSetOutline(Rivershell,1);
    TextDrawSetProportional(Rivershell,1);
    TextDrawSetShadow(Rivershell,1);

    EchoMessage("init", "", "");

    Annotation::ExpandList<OnGameModeInit>();

    return 1;
}