// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/*******************************************************************************
*           Las Venturas Playground 2.90 - interiorhandler.pwn                 *
*   This file contains interior names, functions, and the                      *
*   OnPlayerInteriorChange callback.                                           *
********************************************************************************/

new iTimeEnteredGym[MAX_PLAYERS];

CheckGymEntry(playerid)
{
    if(iTimeEnteredGym[playerid] == 0)
        return;

    if(Time->currentTime() - iTimeEnteredGym[playerid] > 3)
    {
        if(IsPlayerInRangeOfPoint(playerid, 60, 774.9375, -62.2125, 1000.7184))
        {
            if(!n_PlayerInGym[playerid])
            {
                OnPlayerEnterGym(playerid);
                SendClientMessage(playerid, COLOR_PINK, "* Welcome to the gym.");
                n_PlayerInGym[playerid] = 1;
            }
        }
    }
}

UpdateInteriorGodMode() {
    for (new playerId = 0; playerId <= PlayerManager->highestPlayerId(); playerId++) {
        if (!Player(playerId)->isConnected() || Player(playerId)->isNonPlayerCharacter())
            continue;

        if (IsPlayerInMinigame(playerId) || LegacyIsPlayerInVipRoom(playerId))
            continue;

        new const currentInterior = GetPlayerInterior(playerId);
        new const currentTeam = GetPlayerTeam(playerId);

        if (currentInterior > 0 && currentInterior != 7) {
            if (currentTeam != currentInterior)
                SetPlayerTeam(playerId, currentInterior);
        } else if (currentInterior == 0) {
            if (currentTeam != NO_TEAM)
                SetPlayerTeam(playerId, NO_TEAM);
        }
    }
}

enum intinfo {
    intid,
    Float: minx,
    Float: maxx,
    Float: miny,
    Float: maxy,
    intname[40]
}

new intval[MAX_INTERIORS][intinfo] =
{
    { 17, -35.0952, -3.3979, -188.7431, -167.9059, "24/7" },
    { 10, -13.1705, 10.8973, -32.5796, -73.7699, "24/7" },
    { 18, -39.2296, -12.9542, -92.6993, -73.7699, "24/7" },
    { 16, -39.1961, -14.0429, -142.2416, -122.4566, "24/7" },
    { 4, -36.9258, -25.8106, -32.1881, -1.8185, "24/7" },
    { 6, -37.4347, -16.2656, -58.9940, -48.4956, "24/7" },

    // Airport's/Aeroplanes
    { 14, -2002.2133, -1718.3214, -65.7420, 114.2523, "Francis International Airport" },
    { 1, -1.4275, 4.0257, 21.5928, 35.7774, "A Shamal" },
    { 9, 310.4739, 321.0128, 971.1845, 1039.4181, "A Andromeda" },

    // Ammunations
    { 1, 283.0005, 301.2157, -42.6472, -1.4354, "Ammunation" },
    { 4, 282.8332, 332.1738, -91.2557, -55.4272, "Ammunation" },
    { 6, 283.0418, 299.4285, -116.2635, -101.6424, "Ammunation" },
    { 7, 267.7444, 318.3778, -145.6805, -124.8552, "Ammunation" },
    { 6, 269.9506, 320.3639, -171.2541, -157.4279, "Ammunation" },

    // Burglary Houses
    { 3, 218.4460, 246.8138, 1185.7623, 1213.8395, "A House" },
    { 2, 216.5522, 235.7148, 1237.0811, 1255.2098, "A House" },
    { 1, 215.3478, 234.8832, 1282.2054, 1294.9760, "A House" },
    { 7, 222.8882, 255.9689, 1016.5048, 1052.1018, "A House" },
    { 15, 282.9257, 307.5086, 1470.0725, 1491.2295, "A House" },
    { 15, 318.4674, 337.6630, 1469.8763, 1492.8041, "A House" },
    { 15, 369.8986, 391.1570, 1450.6768, 1473.9808, "A House" },
    { 15, 354.5016, 381.1810, 1407.1798, 1433.9547, "A House" },
    { 2, 474.3922, 502.8857, 1397.5024, 1424.8313, "A House" },
    { 2, 434.3427, 460.3860, 1393.1072, 1421.1198, "A House" },
    { 5, 224.2079, 250.7603, 1104.4031, 1122.6886, "A House" },
    { 4, 248.2458, 269.4295, 1280.3994, 1297.1023, "A House" },
    { 4, 216.5254, 230.3692, 1139.0764, 1161.1541, "A House" },
    { 10, 17.0703, 37.3015, 1334.6843, 1354.1284, "A House" },
    { 4, -281.3279, -255.0091, 1445.6505, 1464.0410, "A House" },
    { 5, 13.9406, 34.6132, 1395.5353, 1420.3214, "A House" },
    { 5, 133.3888, 155.1858, 1364.83196, 1388.4816, "A House" },
    { 6, 218.2290, 249.8347, 1062.5000, 1088.6488, "A House" },
    { 6, -73.5360, -55.0049, 1345.4100, 1368.8204, "A House" },
    { 15, -302.5614, -277.7969, 1468.1730, 1482.1398, "A House" },
    { 8, -53.8233, -33.4177, 1389.9181, 1414.0795, "A House" },
    { 9, 73.920, 97.4875, 1314.4618, 1347.3900, "A House" },
    { 9, 250.8725, 266.8128, 1233.7965, 1257.9093, "A House" },

    // Business's
    { 3, 1037.3038, 1041.8345, 1.0347, 11.2171, "Blastin' Fools Records" },
    { 12, 442.4903, 458.4054, 505.6406, 517.0414, "The Budget Inn Motel" },
    { 15, 2178.7632, 2255.6553, -1202.9016, -1136.2014, "The Jefferson Motel" },
    { 3, 818.0212, 834.9809, -1.5486, 13.3580, "The Off track Betting" },
    { 3, -117.9237, -97.8847, -29.8268, -6.3720, "The Sex Shop" },
    { 1, 931.3280, 966.7448, 2094.7502, 2179.0835, "The Sindacco Meat Processing Plant" },
    { 6, -2242.0911, -2217.3230, 126.5612, 139.0298, "Zero's RC Shop" },

    // Car Mod Shops
    { 1, 602.3553, 637.2819, -28.5506, 10.2388, "Transfenders" },
    { 2, 608.1679, 625.8292, -83.6601, -68.8194, "Loco Low Co." },
    { 3, 608.0199, 625.3347, -132.7094, -117.6847, "Wheel's Arch Angels" },
    { 1, -2057.7175, -2038.8625, 150.0913, 182.0321, "CJ's Garage" },

    // Casino's
    { 10, 1924.1576, 2020.0708, 967.2367, 1068.4240, "The Four Dragons" },
    { 1, 2134.8252, 2292.7944, 1556.5646, 1714.9104, "Calligula's" },

    // Casino Oditties
    { 10, 1886.0958, 1900.8591, 1010.7878, 1027.1942, "The Janitors Office" },
    { 1, -2173.0259, -2156.4658, 633.6885, 648.6263, "Woozie's Office" },
    { 12, 1116.3666, 1144.5529, -17.0111, 14.3073, "Redsands West Casino" },

    // Clothing Stores
    { 15, 198.4293, 219.9531, -115.1267, -93.4263, "Binco" },
    { 14, 194.9293, 218.6813, -172.8813, -149.9782, "Didier Sachs" },
    { 3, 194.5785, 217.7405, -144.9519, -117.3412, "ProLaps" },
    { 1, 194.774, 217.3534, -54.0761, -30.7443, "SubUrban" },
    { 5, 198.4532, 243.0808, -14.1564, 5.4119, "Victim" },
    { 18, 138.4255, 184.3445, -101.6389, -68.2857, "Zip" },

    // Bars and Clubs
    { 17, 472.5995, 508.7181, -30.7876, 1.0150, "The Dance Club" },
    { 11, 481.7581, 513.3429, -90.4746, -63.5646, "Shithole Bar" },
    { 18, -234.1513, -215.6965, 1392.4974, 1413.4426, "Lil' Probe Inn" },

    // Eateries
    { 4, 432.5477, 461.3923, -93.2540, -77.9551, "Jay's Diner" },
    { 1, 421.2953, 462.4027, -24.0791, -2.8813, "World of Coq" },
    { 1, 648.5388, 696.2054, -479.4601, -447.5847, "The Pump Truck Stop Diner" },

    // Fast Food
    { 10, 360.0641, 384.3123, -79.3703, -54.7400, "Burger Shot" },
    { 9, 357.4411, 382.6818, -16.0313, -1.1104, "Cluckin' Bell" },
    { 5, 361.2697, 382.0142, -139.1448, -110.8535, "Well Stacked Pizza" },
    { 17, 371.0922, 383.7513, -197.2665, -176.7235, "Rusty Brown's Donuts" },

    // Girlfriends
    { 1, 242.6040, 250.9420, 299.1326, 308.5615, "Denise Robinson's Bedroom" },
    { 2, 260.7130, 275.1632, 301.2459, 314.6459, "Katie Zhan's Bedroom" },
    { 3, 273.4854, 294.9203, 303.1938, 311.9318, "Helena Wankstein's Bedroom" },
    { 4, 290.5057, 312.3436, 299.3310, 315.7108, "Michelle Cannes's Bedroom" },
    { 5, 315.3055, 329.5608, 300.6566, 319.1491, "Barbara Schternvart Bedroom" },
    { 6, 337.3706, 350.82888, 293.5629, 312.0173, "Millie Perkins's Bedroom" },

    // Government
    { 17, -963.0861, -937.1068, 1845.0483, 1955.3293, "The Sherman Dam" },
    { 3, 317.4452, 393.2694, 143.0736, 218.9381, "The Planning Department" },

    // Gyms
    { 5, 754.4421, 775.7951, -10.5017, 17.2873, "The Ganton Gym" },
    { 6, 752.4792, 778.8328, -51.4411, -15.6279, "The Cobra Gym" },
    { 7, 755.9409, 777.9979, -84.0618, -56.7409, "Below The Belt Gym" },
    { 5, 1223.2540, 1307.4205, -840.5399, -751.1873, "Madd Dogg's Mansion" },

    // Homies
    { 3, 1520.1871, 1533.7594, -22.5846, 0.9635, "B-Dups Apartment" },
    { 2, 1514.2607, 1529.2543, -57.1333, -39.9799, "B-Dups Crack Pad" },
    { 3, 2484.0408, 2507.7002, -1723.0533, -1681.0842, "Carl's Mums House" },
    { 3, 509.0578, 522.8345, -21.6408, -1.4064, "OG Loc's" },
    { 2, 2445.9775, 2499.0967, -1707.8545, -1683.5922, "Ryder's House" },
    { 1, 2523.0020, 2544.5212, -1700.5044, -1665.8083, "Sweet's House" },
    { 2, 2512.0249, 2584.8528, -1309.0903, -1252.9098, "Big Smokes Crack Palace" },

    // Ill
    { 3, 1198.2898, 1218.5905, -52.8367, -20.5241, "The Big Spread Ranch" },
    { 6, 723.2429, 768.1766, 1432.5469, 1445.0240, "Fanny Batter's Whore House" },
    { 2, 1194.8103, 1226.1428, -18.0913, 30.6912, "The World Class Topless Girls Stripclub" },
    { 3, 929.9674, 976.1741, -19.9913, 9.3195, "The Unnamed Brothel" },
    { 3, 940.3059, 973.8075, -64.5014, -41.2514, "The Tiger Skin Rug Brothel" },
    { 3, -2697.5955, -2629.8840, 1387.2095, 1440.4742, "Jizzy's Pleasure Dome" },

    // Liberty City
    { 1, -950.1764, -687.3923, 407.1057, 570.3076, "Liberty City" },

    // Misc
    { 5, 2317.3586, 2363.4382, -1190.5747, -1166.1172, "Los Vagos Gang House" },
    { 8, 2802.5732, 2830.6768, -1178.5010, -1155.1534, "Colonel Furburgher's House" },
    { 5, 296.9617, 340.9560, 1110.0925, 1138.4672, "The Crack Den" },
    { 1, 1357.7148, 1420.5383, -49.7140, 8.5148, "A Warehouse" },
    { 18, 1247.7485, 1310.9150, -69.8208, 8.3288, "A Warehouse" },
    { 12, 2306.6470, 2342.1313, -1153.7253, -1133.4342, "A Safehouse" },
    { 10, -1138.3977, -966.8146, 1017.8578, 1101.4760, "The RC Battlefield" },

    // Personal Grooming
    { 2, 405.8927, 421.6737, -32.3224, -7.9695, "Old Reece's Hair and Facial Studio" },
    { 3, 415.0480, 425.6317, -92.8154, -72.3608, "Gay Gordo's Barber Shop" },
    { 12, 402.0862, 417.4446, -58.2201, -46.4752, "Mascila's Unisex Hair Salon" },
    { 16, -211.5356, -198.4321, -38.5390, -13.2776, "A Tattoo Parlour" },
    { 17, -210.7206, -194.0416, -30.7664, -2.5236, "Hemlock's Tattoo Parlour" },
    { 3, -211.3637, -193.4146, -53.1130, -37.8452, "A Tattoo Parlour" },

    // Police Departments
    { 6, 207.5004, 277.7479, 61.7018, 93.1880, "The Los Santos Police Department" },
    { 10, 212.2758, 284.0999, 97.0497, 130.4608, "The San Fierro Police Department" },
    { 3, 186.4745, 308.3648, 132.3377, 204.9915, "The Los Vagos Police Department" },

    // Schools
    { 3, 1487.0275, 1503.6758, 1279.1096, 1315.6984, "Cycle School" },
    { 3, -2037.1293, -2020.4810, -139.5002, -98.2041, "Automobile School" },
    { 10, 400.9158, 460.9158, 2533.2849, 2547.9688, "Plane School" }
};

GetPlayerInteriorNr(playerId) {
    new Float: position[3];
    new interior = GetPlayerInterior(playerId);

    GetPlayerPos(playerId, position[0], position[1], position[2]);

    for (new i = 0; i < MAX_INTERIORS; i++) {
        if (interior != intval[i][intid])
            continue;

        if (position[0] < intval[i][minx] || position[0] > intval[i][maxx])
            continue;

        if (position[1] < intval[i][miny] || position[1] > intval[i][maxy])
            continue;

        return i;
    }

    return -1;
}

EnablePlayerInteriorWeapons(playerid,interiorid)
{
    if(!Player(playerid)->isConnected()) return 0;
    g_AllowWeapons[interiorid][playerid] = true;
    return 1;
}

DisablePlayerInteriorWeapons(playerid,interiorid)
{
    if(!Player(playerid)->isConnected()) return 0;
    g_AllowWeapons[interiorid][playerid] = false;
    return 1;
}

ResetPlayerInteriorQuit( iPlayerID )
{
    new timeDiff = Time->currentTime() - playerLastQuitInterior[iPlayerID];
    if(timeDiff == 3 && GetPlayerInterior(iPlayerID) == 0 && LegacyIsPlayerInVipRoom(iPlayerID) == false)
    {
        SetPlayerTeam(iPlayerID, NO_TEAM);
    }
    return 1;
}