// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/********************************************************************************
*               Las Venturas Playground 2.91 - FightClub Handler 2              *
*                                                                               *
*   The new FightClub handler will allow:                                       *
*   * MultiFight (several matches at once)                                      *
*   * Locations (different 'arenas')                                            *
*   * More rounds than usual                                                    *
*   And more to allow players to challenge eachothers in their own way.         *
*                                                                               *
*   Author: Mattias Kristiansson (iou)                                          *
*   Small code snippets from Wesleys FC (to save stats, achievements etc)       *
*                                                                               *
********************************************************************************/

/*

Original Author: Mattias Kristiansson (iou)

*/

#define FC_BASE_WORLD           7840 // + matchid whenever used = match world
#define FC_COUNTDOWN            5
#define FC_COUNTDOWN_SOUND      1058

#define FC_STATUS_NONE          0
#define FC_STATUS_INVITED       1  // not used for Matches[][status]
#define FC_STATUS_WAITING       2  // not used for Matches[][status]
#define FC_STATUS_ACTIVE        3
#define FC_STATUS_FIGHTING      4

#define FC_MAX_MATCHES          30

#define FC_MAX_ROUNDS           10
#define FC_MIN_ROUNDS           1

#define FC_MAX_BETMONEY         2000000
#define FC_MIN_BETMONEY         100

#define FC_LV                   0
#define FC_LV_TH                2
#define FC_SF                   4
#define FC_DESERT               6
#define FC_WAREHOUSE            8
#define FC_PURE_WW_1            10
#define FC_PURE_WW_2            12
#define FC_COD6                 14

#define FC_MAX_LOCATIONS        8
#define FC_MIN_LOCATIONS        1

#define FC_WEAPON_NONE          0
#define FC_WEAPON_AMMO          999999

#define FC_MSG_MATCHES          2
#define FC_MSG_HELP             3

new FightClubDialogEnabled;
new PlayerMatch[MAX_PLAYERS] = {-1, ...};
new IsPlayerWatchingFC[MAX_PLAYERS];
new FightClubDialog[MAX_PLAYERS];
new n_FightClubKills[MAX_PLAYERS];
new n_FightClubDeaths[MAX_PLAYERS];

enum eMatchInfo {
    status,
    player1,
    player2,
    location,
    fcworld,
    rounds,
    score1,
    score2,
    spectators,
    countdown,
    gun1,
    gun2,
    gun3,
    gun4,
    gun5
};

enum eSpecData {
    specmatch,
    specplayer
};


new Matches[FC_MAX_MATCHES][eMatchInfo];
new aSpecInfo[MAX_PLAYERS][eSpecData];

static Float:Locations [16] [4] =
{
    //   X          Y         Z      Angle
    {2067.3228, 2156.1738, 10.8203, 313.4314}, // LV - Pos 1
    {2097.0544, 2184.1289, 10.8203, 133.4314}, // LV - Pos 2
    {2006.7477, 2358.8279, 23.8469, 91.2623}, // LV Train Hard - Pos 1
    {1948.1409, 2357.6860, 23.8469, 269.8640}, // LV Train Hard - Pos 2
    {-2211.7896, 878.3370, 69.7473, 221.0391}, // SF - Pos 1
    {-2174.0793, 835.3663, 69.7360, 41.3328}, // SF - Pos 2
    {-554.7606, 2593.7271, 65.8368, 89.6767}, // Desert - Pos 1
    {-598.8733, 2594.1477, 65.8368, 269.2184}, // Desert - Pos 2
    {1361.5864, 3.8577, 1000.9219, 225.5206}, // Warehouse - Pos 1
    {1417.6846, -47.3819, 1000.9293, 47.4829}, // Warehouse - Pos 2
    {197.0584, -321.0002, 1.5724, 77.2008}, // Pure WW Style [1] - Pos 1
    {-109.3714, -333.7637, 1.4297, 277.5022}, // Pure WW Style [1] - Pos 2
    {-1405.7018, 9.2859, 5.7475, 179.0307}, // Pure WW Style [2] - Pos 1
    {-1405.5732, -238.9052, 6.0000, 3.0500}, // Pure WW Style [2] - Pos 2
    {-2497.7043, 2445.5835, 16.9185, 266.5217}, // COD 6 Style - Pos 1
    {-2329.1736, 2420.9177, 7.1404, 86.7564} // COD 6 Style - Pos 2

};

static Interiors[16][1] =
{
    {0}, // LV - Pos 1
    {0}, // LV - Pos 2
    {0}, // LV Train Hard - Pos 1
    {0}, // LV Train Hard - Pos 2
    {0}, // SF - Pos 1
    {0}, // SF - Pos 2
    {0}, // Desert - Pos 1
    {0}, // Desert - Pos 2
    {1}, // Warehouse - Pos 1
    {1}, // Warehouse - Pos 2
    {0}, // Pure WW Style [1] - Pos 1
    {0}, // Pure WW Style [1] - Pos 2
    {0}, // Pure WW Style [2] - Pos 1
    {0}, // Pure WW Style [2] - Pos 2
    {0}, // COD 6 Style - Pos 1
    {0} // COD 6 Style - Pos 2

};

static Float:Boundries[16][4] =
{
    // Those without comments are faked due to Locations Pos 2
    {2110.8208, 2055.1360, 2200.4045, 2144.6980}, // LV
    {20000.0000, -20000.0000, 20000.0000, -20000.0000},
    {2010.7488, 1945.2775, 2382.9104, 2332.0005}, // LV Train Hard
    {20000.0000, -20000.0000, 20000.0000, -20000.0000},
    {20000.0000, -20000.0000, 20000.0000, 828.2277}, // SF
    {20000.0000, -20000.0000, 20000.0000, -20000.0000},
    {-549.8424, -602.6250, 2612.5344, 2574.6992}, // Desert
    {20000.0000, -20000.0000, 20000.0000, -20000.0000},
    {20000.0000, -20000.0000, 20000.0000, -20000.0000}, // Warehouse
    {20000.0000, -20000.0000, 20000.0000, -20000.0000},
    {197.8479, -236.6895, -214.3247, -395.5458}, // Pure WW Style [1]
    {20000.0000, -20000.0000, 20000.0000, -20000.0000},
    {20000.0000, -20000.0000, 28.4080, -262.8820}, // Pure WW Style [2]
    {20000.0000, -20000.0000, 20000.0000, -20000.0000},
    {-2324.0210, -2507.0334, 2534.9707, 2341.5710}, // COD 6 Style
    {20000.0000, -20000.0000, 20000.0000, -20000.0000}

};

new FightClubStartText[15][30] =
{
    {"Kill him!!"},
    {"Blast his ass!!"},
    {"Humiliate him!!"},
    {"Kickass!!"},
    {"GOOO!!"},
    {"Drop him!!"},
    {"Slaughter!!"},
    {"Murder!!"},
    {"Kill him!"},
    {"Get him!"},
    {"Waste his ass!!"},
    {"Smash him!!"},
    {"Smoke him!!"},
    {"RAGE!!"},
    {"Show him who's boss!!"}
};

new FightClubKillMsg[8][20] =
{
    {"smoked"},
    {"slaughtered"},
    {"dropped"},
    {"smashed"},
    {"wasted"},
    {"humiliated"},
    {"terminated"},
    {"nailed"}
};

new FightClubWeaponString1[600];
new FightClubWeaponString2[600];
new FightClubLocationString[500];

CFightClub__Initialize()
{
    for(new i = 0; i < FC_MAX_MATCHES; i++)
    {
        CFightClub__ResetMatch(i);

        // Pure WW Style 1 Objects
        CreateDynamicObject(14407, 152.50456237793, -301.35971069336, 3.7457480430603, 0, 0, 270.01834106445, FC_BASE_WORLD + i);
        CreateDynamicObject(3578, 152.62545776367, -290.42077636719, 4.2542400360107, 0, 0, 0, FC_BASE_WORLD + i);
        CreateDynamicObject(3578, 144.25561523438, -253.95495605469, 0.78166842460632, 0, 0, 91.2490234375, FC_BASE_WORLD + i);
        CreateDynamicObject(5152, -39.158683776855, -270.28680419922, 9.4419393539429, 358.09020996094, 342.72277832031, 357.37145996094, FC_BASE_WORLD + i);
        CreateDynamicObject(5152, -42.447265625, -270.1708984375, 6.5531687736511, 358.08837890625, 342.71850585938, 357.36877441406, FC_BASE_WORLD + i);
        CreateDynamicObject(5152, -31.110847473145, -270.30068969727, 11.280303001404, 358.19793701172, 25.831970214844, 0.1029052734375, FC_BASE_WORLD + i);
        CreateDynamicObject(5152, -35.454406738281, -270.30838012695, 11.050507545471, 358.06958007813, 15.684387207031, 359.76916503906, FC_BASE_WORLD + i);
        CreateDynamicObject(1410, 5.5323553085327, -271.62255859375, 10.908774375916, 272.47979736328, 0.001068115234375, 319.44613647461, FC_BASE_WORLD + i);
        CreateDynamicObject(1410, 8.4803476333618, -275.02740478516, 10.908774375916, 272.47741699219, 0, 302.96850585938, FC_BASE_WORLD + i);
        CreateDynamicObject(1410, 10.898412704468, -278.79922485352, 10.908774375916, 272.4719543457, 0, 302.96447753906, FC_BASE_WORLD + i);
        CreateDynamicObject(1410, 13.783603668213, -281.77062988281, 10.908774375916, 272.4719543457, 0, 323.24200439453, FC_BASE_WORLD + i);
        CreateDynamicObject(1410, 17.541584014893, -283.9953918457, 11.942853927612, 294.19860839844, 275.51257324219, 250.68572998047, FC_BASE_WORLD + i);
        CreateDynamicObject(1410, 19.06036567688, -284.62347412109, 12.63224029541, 292.93746948242, 275.85162353516, 250.99395751953, FC_BASE_WORLD + i);
        CreateDynamicObject(5153, 113.28427124023, -291.61953735352, 13.76117515564, 359.037109375, 40.56201171875, 0.8240966796875, FC_BASE_WORLD + i);
        CreateDynamicObject(5153, 117.30284881592, -291.46932983398, 12.037709236145, 359.26104736328, 54.502044677734, 1.0325012207031, FC_BASE_WORLD + i);
        CreateDynamicObject(5153, 121.06818389893, -291.72564697266, 10.773834228516, 351.88763427734, 37.186218261719, 358.50317382813, FC_BASE_WORLD + i);
        CreateDynamicObject(5153, 124.98854827881, -291.79266357422, 9.8546524047852, 353.08605957031, 47.338409423828, 359.83178710938, FC_BASE_WORLD + i);
        CreateDynamicObject(10245, -3.018853187561, -267.05709838867, 14.743412971497, 0, 0, 224.39514160156, FC_BASE_WORLD + i);
        CreateDynamicObject(1431, -9.8723373413086, -262.91159057617, 20.478448867798, 0, 354.93060302734, 78.574890136719, FC_BASE_WORLD + i);
        CreateDynamicObject(1431, -9.626859664917, -260.59707641602, 20.708246231079, 0, 354.93060302734, 81.10888671875, FC_BASE_WORLD + i);
        CreateDynamicObject(18260, 35.007392883301, -257.22653198242, 14.046514511108, 0, 358.73266601563, 74.77294921875, FC_BASE_WORLD + i);
        CreateDynamicObject(1410, 18.724588394165, -267.02600097656, 14.585501670837, 274.53405761719, 302.98400878906, 320.80407714844, FC_BASE_WORLD + i);
        CreateDynamicObject(1410, 22.370246887207, -265.02001953125, 14.355706214905, 275.63946533203, 64.091461181641, 101.99740600586, FC_BASE_WORLD + i);
        CreateDynamicObject(1410, 25.807567596436, -262.25259399414, 13.436524391174, 287.90692138672, 82.330535888672, 119.96279907227, FC_BASE_WORLD + i);
        CreateDynamicObject(1410, 110.07769775391, -256.92535400391, 4.7042970657349, 285.26654052734, 94.884796142578, 60.83935546875, FC_BASE_WORLD + i);
        CreateDynamicObject(1410, 106.51461029053, -254.40199279785, 5.9681720733643, 285.26531982422, 94.884155273438, 60.835205078125, FC_BASE_WORLD + i);
        CreateDynamicObject(1410, 104.79105377197, -253.05537414551, 6.7724561691284, 291.5791015625, 93.366394042969, 59.389801025391, FC_BASE_WORLD + i);
        CreateDynamicObject(5152, 93.699905395508, -255.5640411377, 6.9106664657593, 0, 24.07958984375, 325.78186035156, FC_BASE_WORLD + i);
        CreateDynamicObject(5152, 94.80924987793, -253.81857299805, 6.9106664657593, 0, 24.076538085938, 325.77758789063, FC_BASE_WORLD + i);
        CreateDynamicObject(5152, 96.003387451172, -252.27311706543, 6.9106664657593, 0, 24.076538085938, 325.77758789063, FC_BASE_WORLD + i);
        CreateDynamicObject(5152, 97.197723388672, -250.72721862793, 6.9106664657593, 0, 24.076538085938, 325.77758789063, FC_BASE_WORLD + i);
        CreateDynamicObject(5152, 98.251495361328, -249.36311340332, 6.9106664657593, 0, 24.076538085938, 325.77758789063, FC_BASE_WORLD + i);
        CreateDynamicObject(5152, 99.164642333984, -248.18064880371, 6.9106664657593, 0, 24.076538085938, 325.77758789063, FC_BASE_WORLD + i);
        CreateDynamicObject(5152, 100.22096252441, -246.96694946289, 6.9106664657593, 0, 24.076538085938, 325.77758789063, FC_BASE_WORLD + i);
        CreateDynamicObject(5152, 101.12661743164, -245.92730712891, 6.9106664657593, 0, 24.076538085938, 325.77758789063, FC_BASE_WORLD + i);
        CreateDynamicObject(5152, 102.15521240234, -244.39624023438, 6.9106664657593, 0, 24.076538085938, 325.77758789063, FC_BASE_WORLD + i);
        CreateDynamicObject(5152, 102.8077545166, -243.44374084473, 6.9106664657593, 0, 24.076538085938, 325.77758789063, FC_BASE_WORLD + i);
        CreateDynamicObject(1431, 89.779335021973, -252.96067810059, 7.8138694763184, 0, 0, 269.25109863281, FC_BASE_WORLD + i);
        CreateDynamicObject(1431, 91.119514465332, -254.59269714355, 7.8138694763184, 0, 0, 322.47598266602, FC_BASE_WORLD + i);
        CreateDynamicObject(1431, 90.607070922852, -250.85354614258, 7.8138694763184, 0, 0, 229.95962524414, FC_BASE_WORLD + i);
        CreateDynamicObject(2359, 90.830513000488, -251.25358581543, 7.476541519165, 0, 358.73266601563, 48.159149169922, FC_BASE_WORLD + i);
        CreateDynamicObject(1685, 103.58653259277, -290.78530883789, 14.881804466248, 344.79187011719, 0, 356.19799804688, FC_BASE_WORLD + i);
        CreateDynamicObject(1685, 96.320991516113, -284.01516723633, 13.273236274719, 344.78942871094, 0, 356.19323730469, FC_BASE_WORLD + i);
        CreateDynamicObject(1685, 96.465881347656, -282.29711914063, 12.813645362854, 344.78942871094, 0, 356.19323730469, FC_BASE_WORLD + i);
        CreateDynamicObject(1685, 61.292003631592, -280.81579589844, 12.813645362854, 344.78942871094, 0, 356.19323730469, FC_BASE_WORLD + i);
        CreateDynamicObject(1685, 61.737838745117, -282.53259277344, 13.158338546753, 344.78942871094, 0, 356.19323730469, FC_BASE_WORLD + i);
        CreateDynamicObject(1685, 72.071502685547, -290.85632324219, 14.996702194214, 344.78942871094, 0, 356.19323730469, FC_BASE_WORLD + i);
        CreateDynamicObject(1685, 72.153800964355, -289.13381958008, 14.422213554382, 344.78942871094, 0, 356.19323730469, FC_BASE_WORLD + i);
        CreateDynamicObject(1685, 27.878076553345, -286.5016784668, 14.077520370483, 344.78942871094, 0, 356.19323730469, FC_BASE_WORLD + i);
        CreateDynamicObject(1685, 27.677764892578, -288.09716796875, 14.537111282349, 344.78942871094, 0, 356.19323730469, FC_BASE_WORLD + i);
        CreateDynamicObject(1685, 32.330093383789, -279.89199829102, 12.583849906921, 344.78942871094, 0, 356.19323730469, FC_BASE_WORLD + i);
        CreateDynamicObject(1685, 51.384620666504, -290.68640136719, 14.766906738281, 344.78942871094, 0, 356.19323730469, FC_BASE_WORLD + i);
        CreateDynamicObject(1685, 51.907737731934, -287.86114501953, 14.077520370483, 344.78942871094, 0, 356.19323730469, FC_BASE_WORLD + i);
        CreateDynamicObject(1685, -10.181264877319, -252.97354125977, 22.183309555054, 7.6040649414063, 0, 0, FC_BASE_WORLD + i);
        CreateDynamicObject(1685, -9.9551610946655, -254.59741210938, 21.838613510132, 7.6040649414063, 0, 358.73266601563, FC_BASE_WORLD + i);
        CreateDynamicObject(1685, 92.172172546387, -249.28144836426, 8.0162563323975, 0, 0, 0, FC_BASE_WORLD + i);
        CreateDynamicObject(1685, 94.09220123291, -247.37701416016, 8.0162563323975, 0, 0, 0, FC_BASE_WORLD + i);
        //CreateDynamicObject(modelid, Float:x, Float:y, Float:z, Float:rx, Float:ry, Float:rz, FC_BASE_WORLD + i);
    }


    FightClubWeaponString1 = // Weaponstring for Weapon Dialog 1
    "Chainsaw\n\
    Silenced 9mm\n\
    Desert Eagle\n\
    Shotgun\n\
    Sawn-off Shotgun\n\
    Combat Shotgun\n\
    Micro SMG (Uzi)\n\
    MP5\n\
    AK-47\n\
    M4 Carbine\n\
    Tec-9\n\
    Country Rifle\n\
    Sniper Rifle\n\
    Rocket Launcher\n\
    Flamethrower\n\
    Minigun";

    FightClubWeaponString2 = // Weaponstring for Weapon Dialog 2-5
    "> None <\n\
    Chainsaw\n\
    Silenced 9mm\n\
    Desert Eagle\n\
    Shotgun\n\
    Sawn-off Shotgun\n\
    Combat Shotgun\n\
    Micro SMG (Uzi)\n\
    MP5\n\
    AK-47\n\
    M4 Carbine\n\
    Tec-9\n\
    Country Rifle\n\
    Sniper Rifle\n\
    Rocket Launcher\n\
    Flamethrower\n\
    Minigun";

    FightClubLocationString = // Location string for Location Dialog
    "LV FightClub\n\
    LV Train Hard\n\
    SF FightClub\n\
    Desert FightClub\n\
    Warehouse\n\
    Pure WW Style 1\n\
    Pure WW Style 2\n\
    Call Of Duty: Modern Warfare 2";

    return 1;
}
//==============================================
//------------ ON~ FUNCTIONS   --------------
//==============================================
CFightClub__OnCommand(playerid, params[]) {
    if (DamageManager(playerid)->isPlayerFighting() == true) {
        ShowBoxForPlayer(playerid, "You were recently in a gunfight, thus this is inaccessible.");
        return 1;
    }

    if (GetPlayerInterior(playerid) != 0 && IsPlayerWatchingFC[playerid] == 0) {
        ShowBoxForPlayer(playerid, "You can't use this command while being in an interior!");
        return 1;
    }

    if (!strlen(params))
        return SendClientMessage(playerid, Color::Information,
            "Usage: /fight [accept/cancel/deny/help/invite/matches/stopwatch/switch/watch]");

    if (strcmp(params, "invite", true, 6) == 0) {

        if(IsPlayerInAnyVehicle(playerid))
            return SendClientMessage(playerid, Color::Error, "You can't bring up the fight dialog while you're in a car!");

        deprecated_OnDialogResponse(playerid, DIALOG_FIGHTCLUB, 1, -1, "");
        return 1;
    }

    else if (strcmp(params, "accept", true, 6) == 0) {
        if (CFightClub__HasPlayerInvited(playerid))
            return SendClientMessage(playerid, Color::Error, "You've invited someone, type '/fight cancel' before accepting.");

        if (!CFightClub__IsPlayerInAnyMatch(playerid))
            return SendClientMessage(playerid, Color::Error, "You've not been invited to any match!");

        new matchId = Command->integerParameter(params, 1);
        if (Command->parameterCount(params) < 2)
            return SendClientMessage(playerid, Color::Information, "Usage: /fight accept [matchId]");

        if (matchId < 0 || matchId >= FC_MAX_MATCHES) {
            SendClientMessage(playerid, Color::Error, "Invalid matchId!");
            return 0;
        }            

        if (Matches[matchId][player2] != playerid || Matches[matchId][player2] == -1) {
            SendClientMessage(playerid, Color::Error, "Invalid matchId!");
            return 1;
        }

        PlayerMatch[playerid] = matchId;
        for (new i = 0; i < FC_MAX_MATCHES; i++) {
            if (i == matchId)
                continue;
            else if(Matches[i][player2] == playerid)
                CFightClub__TerminateInvitation(i);
        }

        new string[128];
        format(string, sizeof(string), "A fight between ~r~~h~%s~w~ and ~r~~h~%s~w~ has started! ~r~~h~(/fight watch %d)",
            PlayerName(Matches[matchId][player1]), PlayerName(Matches[matchId][player2]), matchId);
        NewsController->show(string);

        format(string, sizeof(string), "A fight between %s (Id:%d) and %s (Id:%d) has started!",
            PlayerName(Matches[matchId][player1]), Matches[matchId][player1], PlayerName(Matches[matchId][player2]), Matches[matchId][player2]);
        AddEcho(string);

        Matches[matchId][status] = FC_STATUS_FIGHTING;
        CFightClub__StartMatch(matchId);
        Instrumentation->recordActivity(FightClubAcceptActivity);

        return 1;
    }

    else if (strcmp(params, "deny", true, 4) == 0) {
        if (!CFightClub__IsPlayerInAnyMatch(playerid))
            return SendClientMessage(playerid, Color::Error, "You've not been invited to any match!");

        new matchId = Command->integerParameter(params, 1);
        if (Command->parameterCount(params) < 2)
            return SendClientMessage(playerid, Color::Information, "Usage: /fight deny [matchId]");

        if (Matches[matchId][player2] != playerid)
            return SendClientMessage(playerid, Color::Error, "Invalid matchId!");

        CFightClub__DenyMatch(matchId);
        Instrumentation->recordActivity(FightClubDenyActivity);

        return 1;
    }

    else if (strcmp(params, "cancel", true, 6) == 0) {
        new matchId = PlayerMatch[playerid];
        CFightClub__CancelMatch(matchId);

        return 1;
    }

    else if (strcmp(params, "watch", true, 5) == 0) {
        new matchId = Command->integerParameter(params, 1);

        if (Command->parameterCount(params) < 2 || matchId == -1)
            return SendClientMessage(playerid, Color::Information, "Usage: /fight watch [matchId]");

        if (matchId < 0 || matchId >= FC_MAX_MATCHES)
            return SendClientMessage(playerid, Color::Error, "Invalid matchId!");

        if (!CFightClub__CountMatches(FC_STATUS_FIGHTING))
            return SendClientMessage(playerid, Color::Error, "There are currently no matches running.");

        if (Matches[matchId][status] != FC_STATUS_FIGHTING)
            return SendClientMessage(playerid, Color::Error, "This match isn't running.");

        Instrumentation->recordActivity(FightClubWatchActivity);
        CFightClub__WatchMatch(playerid, matchId);

        return 1;
    }

    else if (strcmp(params, "stopwatch", true, 9) == 0) {
        if (!IsPlayerWatchingFC[playerid])
            return SendClientMessage(playerid, Color::Error, "You're not watching any match.");

        CFightClub__StopWatch(playerid);
        return 1;
    }

    else if (strcmp(params, "switch", true, 6) == 0) {
        if (!IsPlayerWatchingFC[playerid])
            return SendClientMessage(playerid, Color::Red, "* You're not watching any match.");

        new matchId = aSpecInfo[playerid][specmatch];
        new ispecplayer = aSpecInfo[playerid][specplayer];

        new iPlayer1 = Matches[matchId][player1];
        new iPlayer2 = Matches[matchId][player2];

        if (ispecplayer == iPlayer1) {
            aSpecInfo[playerid][specplayer] = iPlayer2;
            PlayerSpectatePlayer(playerid, aSpecInfo[playerid][specplayer]);
        } else if (ispecplayer == iPlayer2) {
            aSpecInfo[playerid][specplayer] = iPlayer1;
            PlayerSpectatePlayer(playerid, aSpecInfo[playerid][specplayer]);
        } else {
            CFightClub__StopWatch(playerid);
            SendClientMessage(playerid, Color::Red, "Oops, something went horribly wrong.");
        }
        return 1;
    }

    else if (strcmp(params, "matches", true, 7) == 0) {
        CFightClub__ShowFCMessage(playerid, FC_MSG_MATCHES);
        return 1;
    }

    else if (strcmp(params, "help", true, 4) == 0) {
        CFightClub__ShowFCMessage(playerid, FC_MSG_HELP);
        return 1;
    }

    else SendClientMessage(playerid, Color::Information, "Usage: /fight [accept/cancel/deny/help/invite/matches/stopwatch/switch/watch]");
    return 1;
}

CFightClub__OnInvite(playerid, inviteid)
{
    new matchid = PlayerMatch[playerid];
    new string[128], ShowWeaponsString[256], ShowWeaponsString2[300];
    new fcWeapon[5][50];

    PlayerMatch[playerid] = matchid; // We don't set the inviteid's playermatch until accept

    Matches[matchid][status] = FC_STATUS_ACTIVE;

    Matches[matchid][player1] = playerid;
    Matches[matchid][player2] = inviteid;
    Matches[matchid][fcworld] = FC_BASE_WORLD + matchid;

    format(string, sizeof(string), "You've successfully invited %s to the FightClub (Match id: %d).", PlayerName(inviteid), matchid);
    SendClientMessage(playerid, Color::Green, string);
    format(string, sizeof(string), "You've been invited by %s to the FightClub. (Rounds: %d | Location: %s)", PlayerName(playerid), Matches[matchid][rounds], CFightClub__GetLocationName(Matches[matchid][location]));
    SendClientMessage(inviteid, COLOR_YELLOW, string);

    if(Matches[matchid][gun1] != FC_WEAPON_NONE) GetWeaponName(Matches[matchid][gun1], fcWeapon[0], 50);
    if(Matches[matchid][gun2] != FC_WEAPON_NONE) GetWeaponName(Matches[matchid][gun2], fcWeapon[1], 50);
    if(Matches[matchid][gun3] != FC_WEAPON_NONE) GetWeaponName(Matches[matchid][gun3], fcWeapon[2], 50);
    if(Matches[matchid][gun4] != FC_WEAPON_NONE) GetWeaponName(Matches[matchid][gun4], fcWeapon[3], 50);
    if(Matches[matchid][gun5] != FC_WEAPON_NONE) GetWeaponName(Matches[matchid][gun5], fcWeapon[4], 50);

    for(new i = 0; i < 5; i++)
    {
        if(strlen(fcWeapon[i]) > 0 && strlen(ShowWeaponsString) < 1) format(ShowWeaponsString, sizeof(ShowWeaponsString), "%s", fcWeapon[i]);
        else if(strlen(fcWeapon[i]) > 0 && strlen(ShowWeaponsString) > 0) format(ShowWeaponsString, sizeof(ShowWeaponsString), "%s, %s", ShowWeaponsString, fcWeapon[i]);
    }

    format(ShowWeaponsString2, sizeof(ShowWeaponsString2), "Weapons: %s", ShowWeaponsString);
    SendClientMessage(inviteid, Color::Green, ShowWeaponsString2);

    format(string, sizeof(string), "  Use '/fight accept %d' to accept or '/fight deny %d' to deny.", matchid, matchid);
    SendClientMessage(inviteid, COLOR_YELLOW, string);

    TakeRegulatedMoney(playerid, MinigameParticipation);
    return 1;
}

CFightClub__OnSpawn(playerid)
{
    new matchid = PlayerMatch[playerid];
    if(Matches[matchid][status] != FC_STATUS_FIGHTING) return 0; // If match is currently not running, ignore this crap

    CFightClub__StartMatch(matchid);
    return 1;
}

CFightClub__OnDeath(playerid, killerid)
{
    new matchid = PlayerMatch[playerid];

    if(Matches[matchid][status] == FC_STATUS_FIGHTING)
    {
        new string[128];

        new iPlayer1 = Matches[matchid][player1];
        new iPlayer2 = Matches[matchid][player2];

        // DIED
        if(killerid == Player::InvalidId)
        {
            if(iPlayer1 == playerid) Matches[matchid][score2]++;
            else if(iPlayer2 == playerid) Matches[matchid][score1]++;

            new iScore1 = Matches[matchid][score1];
            new iScore2 = Matches[matchid][score2];

            // Here we only set death count because the killer didn't kill anyone
            CFightClub__SetDeathCount(playerid, CFightClub__GetDeathCount(playerid) + 1);

            format(string, sizeof(string), "* For some reason, %s died (probably suicided). Score is now %d-%d.", PlayerName(playerid), iScore1, iScore2);
            SendClientMessage(iPlayer1, Color::Red, string);
            SendClientMessage(iPlayer2, Color::Red, string);
            CFightClub__SendSpecMessage(matchid, string);
        }

        // Player 2 killed Player 1
        else if(iPlayer1 == playerid)
        {
            Matches[matchid][score2]++;

            new iScore1 = Matches[matchid][score1];
            new iScore2 = Matches[matchid][score2];

            // Set deaths/kills
            CFightClub__SetDeathCount(iPlayer1, CFightClub__GetDeathCount(iPlayer1) + 1);
            CFightClub__SetKillCount(iPlayer2, CFightClub__GetKillCount(iPlayer2) + 1);

            new Float:HP, Float:Arm;
            GetPlayerHealth(killerid, HP);
            GetPlayerArmour(killerid, Arm);

            format(string, sizeof(string), "* You got %s by %s (HP: %.1f Arm: %.1f)! Score is now: %d-%d.", FightClubKillMsg[random(7)], PlayerName(killerid), HP, Arm, iScore1, iScore2);
            SendClientMessage(playerid, Color::Red, string);

            format(string, sizeof(string), "* You %s %s with (HP: %.1f Arm: %.1f) left! Score is now: %d-%d.", FightClubKillMsg[random(7)], PlayerName(playerid), HP, Arm, iScore2, iScore1);
            SendClientMessage(killerid, Color::Green, string);

            format(string, sizeof(string), "* %s %s %s with (HP: %.1f Arm: %.1f) left! Score is now: %d-%d.", PlayerName(killerid), FightClubKillMsg[random(7)], PlayerName(playerid), HP, Arm, iScore1, iScore2);
            CFightClub__SendSpecMessage(matchid, string);
        }
        // Player 1 killed Player 2
        else if(iPlayer2 == playerid)
        {
            Matches[matchid][score1]++;

            new iScore1 = Matches[matchid][score1];
            new iScore2 = Matches[matchid][score2];

            // Set deaths/kills
            CFightClub__SetDeathCount(iPlayer2, CFightClub__GetDeathCount(iPlayer2) + 1);
            CFightClub__SetKillCount(iPlayer1, CFightClub__GetKillCount(iPlayer1) + 1);

            new Float:HP, Float:Arm;
            GetPlayerHealth(killerid, HP);
            GetPlayerArmour(killerid, Arm);

            format(string, sizeof(string), "* You got %s by %s (HP: %.1f Arm: %.1f)! Score is now: %d-%d.", FightClubKillMsg[random(7)], PlayerName(killerid), HP, Arm, iScore2, iScore1);
            SendClientMessage(playerid, Color::Red, string);

            format(string, sizeof(string), "* You %s %s with (HP: %.1f Arm: %.1f) left! Score is now: %d-%d.", FightClubKillMsg[random(7)], PlayerName(playerid), HP, Arm, iScore1, iScore2);
            SendClientMessage(killerid, Color::Green, string);

            format(string, sizeof(string), "* %s %s %s with (HP: %.1f Arm: %.1f) left! Score is now: %d-%d.", PlayerName(killerid), FightClubKillMsg[random(7)], PlayerName(playerid), HP, Arm, iScore1, iScore2);
            CFightClub__SendSpecMessage(matchid, string);
        }

        // SOMEONE ELSE KILLED HIM (admin? :@)
        else if(killerid != iPlayer1 && killerid != iPlayer2 && killerid)
        {
            format(string, sizeof(string), "* For some reason, someone else killed %s. Round will now restart.", PlayerName(playerid));
            SendClientMessage(iPlayer1, Color::Red, string);
            SendClientMessage(iPlayer2, Color::Red, string);
            CFightClub__SendSpecMessage(matchid, string);
            return 1; // No need to go any further because the (round) will (restart)
        }

        Matches[matchid][rounds]--;

        if(killerid == Player::InvalidId)
            return 0;

        CAchieve__FightClub(killerid, CFightClub__GetKillCount(killerid));

        if(Matches[matchid][rounds] < 1) // If no more rounds, EndMatch
        {
            Matches[matchid][status] = FC_STATUS_NONE; // Prevent StartMatch on OnSpawn
            CFightClub__EndMatch(matchid, playerid); // EndMatch
        }
    }
    return 1;
}

CFightClub__OnConnect(playerid)
{
    PlayerMatch[playerid] = -1;
    CFightClub__ResetPlayerFCInfo(playerid);
    return 1;
}

// To be called when a player disconnects from the server. Their fight club state will be cleaned up
// if they were somehow engaged with the feature. Note that there is no reason to clean up them
// watching fight club, as that only affects their local status.
CFightClub__OnDisconnect(playerId)
{
    for(new i = 0; i < FC_MAX_MATCHES; i++) {
        new firstPlayer = Matches[i][player1];
        new secondPlayer = Matches[i][player2];

        if (firstPlayer != playerId && secondPlayer != playerId)
            continue;

        // Whether this player was the one starting the match.
        new bool: wasPrimaryPlayer = firstPlayer == playerId;

        // Id of the second player in the match.
        new otherPlayer = firstPlayer != playerId ? firstPlayer : secondPlayer;

        // The match is inactive, yet the player is part of it. This should not happen. The
        // state will be cleaned up as part of the ResetMatch() call later.
        if (Matches[i][status] == FC_STATUS_NONE) {
            // Empty, see comment
        }

        // The match has been created, but has not advanced to the actual fighting state. The
        // invite of the match will be canceled by the ResetMatch() call later.
        else if (Matches[i][status] == FC_STATUS_ACTIVE) {
            new message[128];
            if (wasPrimaryPlayer)
                format(message, sizeof(message), "* %s has withdrawn their invite because they left the server.", PlayerName(playerId));
            else
                format(message, sizeof(message), "* %s cannot accept your invite because they left the server.", PlayerName(playerId));

            SendClientMessage(otherPlayer, Color::Red, message);
        }

        // The match has begun and the players are fighting each other.
        else if (Matches[i][status] == FC_STATUS_FIGHTING) {
            new message[128];

            // Award the prize money when the other player initiated the match.
            if (!wasPrimaryPlayer)
                GiveRegulatedMoney(otherPlayer, MinigameParticipation);

            format(message, sizeof(message), "* The fight has been concluded because %s has left the server.", PlayerName(playerId));
            SendClientMessage(otherPlayer, Color::Red, message);

            // Respawn the other player, now that they won't be part of the fight anymore.
            SpawnPlayer(otherPlayer);

            // Distribute a news message about the fight having ended.
            format(message, sizeof(message), "The fight between ~r~~h~%s~w~ and ~r~~h~%s~w~ ended due to ~r~~h~%s~w~ leaving the server!",
                PlayerName(firstPlayer), PlayerName(secondPlayer), PlayerName(playerId));

            NewsController->show(message);
        }

        CFightClub__ResetMatch(i);

        if (firstPlayer != -1)
            CFightClub__ResetPlayerFCInfo(firstPlayer);
        if (secondPlayer != -1)
            CFightClub__ResetPlayerFCInfo(secondPlayer);
    }
}

//==============================================
//---------------   WATCH  ---------------------
//==============================================
CFightClub__WatchMatch(playerid, matchid)
{
    if(Matches[matchid][status] != FC_STATUS_FIGHTING)
        return SendClientMessage(playerid, Color::Red, "* Sorry, this match isn't running anymore");

    new string[256];
    new iPlayer1 = Matches[matchid][player1];
    new iPlayer2 = Matches[matchid][player2];
    new locid = Matches[matchid][location];
    new vWorld = Matches[matchid][fcworld];
    new Int = Interiors[locid][0];

    if (LegacyIsPlayerInBombShop(playerid))
        RemovePlayerFromBombShop(playerid);

    SetPlayerInterior(playerid, Int); // Interior
    SetPlayerVirtualWorld(playerid, vWorld); // World

    TogglePlayerSpectating(playerid, 1); // Prepare Spectate
    PlayerSpectatePlayer(playerid, iPlayer1); // Start spectate

    // Set vars
    IsPlayerWatchingFC[playerid] = 1;
    aSpecInfo[playerid][specmatch] = matchid;
    aSpecInfo[playerid][specplayer] = iPlayer1;

    // Messages
    format(string, sizeof(string), "* You're now watching %s and %s fight.", PlayerName(iPlayer1), PlayerName(iPlayer2));

    SendClientMessage(playerid, Color::Green, string);
    SendClientMessage(playerid, COLOR_YELLOW, "** Use '/fight switch' to switch between the fighting players.");
    SendClientMessage(playerid, COLOR_YELLOW, "** Use '/fight stopwatch' to stop watching.");
    SendClientMessage(playerid, COLOR_YELLOW, "* Note: Watch another match by simply using '/fight watch [matchid]' again.");
    SendClientMessage(playerid, COLOR_YELLOW, "* Extra Note: If you get bugged, use '/fight switch'.");
    return 1;
}

CFightClub__StopWatch(playerid)
{
    TogglePlayerSpectating(playerid, 0);
    aSpecInfo[playerid][specmatch] = -1;
    aSpecInfo[playerid][specplayer] = -1;

    if(Player(playerid)->isConnected())
    {
        SetPlayerInterior(playerid, 0);
        SetPlayerVirtualWorld(playerid, 0);
        SpawnPlayer(playerid);
        IsPlayerWatchingFC[playerid] = 0;
        TogglePlayerControllable(playerid, true);
    }

    return 1;
}
//==============================================
//---------------  TERMINATE -------------------
//==============================================

CFightClub__TerminateInvitation(matchid)
{
    new iPlayer1 = Matches[matchid][player1];
    new iPlayer2 = Matches[matchid][player2];
    new string[128];

    format(string, sizeof(string), "* Your invitation has been terminated due to %s accepting another.", PlayerName(iPlayer2));
    SendClientMessage(iPlayer1, Color::Red, string);

    // Prevents player2's PlayerMatch being reset on ResetMatch
    Matches[matchid][player1] = -1;
    Matches[matchid][player2] = -1;

    CFightClub__ResetPlayerFCInfo(iPlayer1);

    CFightClub__ResetMatch(matchid);
    return 1;
}

CFightClub__TerminateMatch(matchid)
{
    if(Matches[matchid][status] != FC_STATUS_NONE)
    {
        new iPlayer1 = Matches[matchid][player1];
        new iPlayer2 = Matches[matchid][player2];
        new string[128];
        if(Matches[matchid][status] == FC_STATUS_ACTIVE)
        {
            Matches[matchid][player1] = -1;
            Matches[matchid][player2] = -1;

            PlayerMatch[iPlayer1] = -1;
            CFightClub__ResetPlayerFCInfo(iPlayer1);

            CFightClub__ResetMatch(matchid);

            if(IsPlayerConnected(iPlayer1))
            {
                format(string, sizeof(string), "* An administrator terminated your invitation to %s.", PlayerName(iPlayer2));
                SendClientMessage(iPlayer1, Color::Red, string);
                SpawnPlayer(iPlayer1);
            }
            if(IsPlayerConnected(iPlayer2))
            {
                format(string, sizeof(string), "* An administrator terminated %s's invitation to you.", PlayerName(iPlayer1));
                SendClientMessage(iPlayer2, Color::Red, string);
                SpawnPlayer(iPlayer2);
            }
        }
        else if(Matches[matchid][status] == FC_STATUS_FIGHTING)
        {
            Matches[matchid][player1] = -1;
            Matches[matchid][player2] = -1;

            PlayerMatch[iPlayer1] = -1;
            PlayerMatch[iPlayer2] = -1;
            CFightClub__ResetPlayerFCInfo(iPlayer1);
            CFightClub__ResetPlayerFCInfo(iPlayer2);

            CFightClub__ResetMatch(matchid);

            if(IsPlayerConnected(iPlayer1))
            {
                format(string, sizeof(string), "* An administrator terminated your fight with %s.", PlayerName(iPlayer2));
                SendClientMessage(iPlayer1, Color::Red, string);
                SpawnPlayer(iPlayer1);
            }
            if(IsPlayerConnected(iPlayer2))
            {
                format(string, sizeof(string), "* An administrator terminated your fight with %s.", PlayerName(iPlayer1));
                SendClientMessage(iPlayer2, Color::Red, string);
                SpawnPlayer(iPlayer2);
            }

            // Respawns all spectators (if any)
            for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
            {
                if(IsPlayerWatchingFC[i] && aSpecInfo[i][specmatch] == matchid)
                {
                    SendClientMessage(i, Color::Red, "* The match was reset by an administrator, thus you've stopped watching.");
                    CFightClub__StopWatch(i);
                }
            }
        }
    }
    return 1;
}

CFightClub__TerminateAllMatches()
{
    new iPlayer1, iPlayer2;
    for(new i = 0; i < FC_MAX_MATCHES; i++)
    {
        iPlayer1 = Matches[i][player1];
        iPlayer2 = Matches[i][player2];

        if(Matches[i][status] == FC_STATUS_ACTIVE)
        {
            CFightClub__ResetMatch(i);

            if(iPlayer1 != -1)
            {
                SendClientMessage(iPlayer1, Color::Red, "* The FightClub was reset by an administrator, thus your invitation was canceled.");
                CFightClub__ResetPlayerFCInfo(iPlayer1);
                SpawnPlayer(iPlayer1);
            }
            if(iPlayer2 != -1)
            {
                SendClientMessage(iPlayer2, Color::Red, "* The FightClub was reset, any current invitations you had has been canceled.");
                CFightClub__ResetPlayerFCInfo(iPlayer2);
                SpawnPlayer(iPlayer2);
            }
        }
        else if(Matches[i][status] == FC_STATUS_FIGHTING)
        {
            CFightClub__ResetMatch(i);

            if(iPlayer1 != -1)
            {
                SendClientMessage(iPlayer1, Color::Red, "* The FightClub was reset by an administrator, your fight was terminated.");
                CFightClub__ResetPlayerFCInfo(iPlayer1);
                SpawnPlayer(iPlayer1);
            }
            if(iPlayer2 != -1)
            {
                SendClientMessage(iPlayer2, Color::Red, "* The FightClub was reset by an administrator, your fight was terminated.");
                CFightClub__ResetPlayerFCInfo(iPlayer2);
                SpawnPlayer(iPlayer2);
            }
        }
        else
        {
            CFightClub__ResetMatch(i);
        }
    }

    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {

        if(PlayerMatch[i] > -1)
        {
            CFightClub__ResetPlayerFCInfo(i);

            if(!Player(i)->isConnected())
            {
                continue;
            }
            if(IsPlayerNPC(i))
            {
                continue;
            }

            SpawnPlayer(i);
        }
        else
        {
            CFightClub__ResetPlayerFCInfo(i);
        }

        if(!IsPlayerWatchingFC[i])
        {
            continue;
        }

        SendClientMessage(i, Color::Red, "* The FightClub was reset by an administrator, thus you've stopped watching.");
        CFightClub__StopWatch(i);
    }

    return 1;
}

//==============================================
//------------ ~MATCH FUNCTIONS   --------------
//==============================================

CFightClub__StartMatch(matchid)
{
    new iPlayer1 = Matches[matchid][player1];
    new iPlayer2 = Matches[matchid][player2];
    new locid = Matches[matchid][location];
    new vWorld = Matches[matchid][fcworld];
    new Int = Interiors[locid][0];

    new Float:X1 = Locations[locid][0];
    new Float:Y1 = Locations[locid][1];
    new Float:Z1 = Locations[locid][2];
    new Float:Angle1 = Locations[locid][3];

    new Float:X2 = Locations[locid+1][0];
    new Float:Y2 = Locations[locid+1][1];
    new Float:Z2 = Locations[locid+1][2];
    new Float:Angle2 = Locations[locid+1][3];

    new Float:Xmax = Boundries[locid][0];
    new Float:Xmin = Boundries[locid][1];
    new Float:Ymax = Boundries[locid][2];
    new Float:Ymin = Boundries[locid][3];

    ClearPlayerMenus(iPlayer1);
    SetPlayerPos(iPlayer1, X1, Y1, Z1); // Pos 1
    SetPlayerFacingAngle(iPlayer1, Angle1); // Angle 1
    SetCameraBehindPlayer(iPlayer1); // Camera behind 1
    SetPlayerInterior(iPlayer1, Int); // Interior
    SetPlayerVirtualWorld(iPlayer1, vWorld); // Virtual World
    SetPlayerWorldBounds(iPlayer1, Xmax, Xmin, Ymax, Ymin); // Boundries
    SetPlayerHealth(iPlayer1, 100); // Health 1
    SetPlayerArmour(iPlayer1, 100); // Armour 1
    ResetPlayerWeapons(iPlayer1); // Reset weapons
    TogglePlayerControllable(iPlayer1, 0); // Unfreeze 1
    FightClubDialog[iPlayer1] = 0; // Enables usage of dialog again

    ClearPlayerMenus(iPlayer2);
    SetPlayerPos(iPlayer2, X2, Y2, Z2); // Pos 2
    SetPlayerFacingAngle(iPlayer2, Angle2); // Angle 2
    SetCameraBehindPlayer(iPlayer2); // Camera behind 2
    SetPlayerInterior(iPlayer2, Int); // Interior
    SetPlayerVirtualWorld(iPlayer2, vWorld); // Virtual World
    SetPlayerWorldBounds(iPlayer2, Xmax, Xmin, Ymax, Ymin); // Boundries
    SetPlayerHealth(iPlayer2, 100); // Health 2
    SetPlayerArmour(iPlayer2, 100); // Armour 2
    ResetPlayerWeapons(iPlayer2); // Reset weapons
    TogglePlayerControllable(iPlayer2, 0); // Unfreeze 2
    FightClubDialog[iPlayer2] = 0; // Enables usage of dialog again

    Matches[matchid][status] = FC_STATUS_FIGHTING; // To be sure status = fighting
    Matches[matchid][countdown] = FC_COUNTDOWN; // Set countdown so it runs on Process()

    CFightClub__GiveMatchWeapons(matchid); // Give weapons to both players in match

    // Below will make a spectating player re-spectate, preventing a cam freeze.
    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        if(aSpecInfo[i][specmatch] == matchid)
        {
            PlayerSpectatePlayer(i, aSpecInfo[i][specplayer]);
        }
    }

    return 1;
}

CFightClub__EndMatch(matchid, deathPlayerId)
{

    new iPlayer1 = Matches[matchid][player1];
    new iPlayer2 = Matches[matchid][player2];
    new iScore1 = Matches[matchid][score1];
    new iScore2 = Matches[matchid][score2];


    new sMessage[256];

    CFightClub__ResetMatch(matchid);

    new const prize = GetEconomyValue(MinigameVictory, 2 /* participants */);

    // First of all calculate the winners / loosers
    // and process the news message
    if (iScore1 > iScore2)
    {
        format (sMessage, sizeof (sMessage), "* You have won the fight against %s! You win $%s!", PlayerName(iPlayer2), formatPrice(prize));
        SendClientMessage (iPlayer1, COLOR_YELLOW, sMessage);
        format (sMessage, sizeof (sMessage), "* You have lost the fight against %s.", PlayerName(iPlayer1));
        SendClientMessage (iPlayer2, Color::Red, sMessage);
        format (sMessage, sizeof (sMessage), "~r~~h~%s~w~ has beaten ~r~~h~%s~w~ in a fight with ~y~%d-%d", PlayerName(iPlayer1), PlayerName(iPlayer2), iScore1, iScore2);

        GiveRegulatedMoney(iPlayer1, MinigameVictory, 2 /* participants */);
    }
    else if (iScore2 > iScore1)
    {
        format (sMessage, sizeof (sMessage), "* You have won the fight against %s! You win $%s!", PlayerName(iPlayer1), formatPrice(prize));
        SendClientMessage (iPlayer2, COLOR_YELLOW, sMessage);
        format (sMessage, sizeof (sMessage), "* You have lost the fight against %s.", PlayerName(iPlayer2));
        SendClientMessage (iPlayer1, Color::Red, sMessage);
        format (sMessage, sizeof (sMessage), "~r~~h~%s~w~ has beaten ~r~~h~%s~w~ in a fight with ~y~%d-%d", PlayerName(iPlayer2), PlayerName(iPlayer1), iScore2, iScore1);

        GiveRegulatedMoney(iPlayer2, MinigameVictory, 2 /* participants */);
    }
    else
    {
        // Impossible unless FC_ROUNDS is on > 3
        format (sMessage, sizeof (sMessage), "* Your fight against %s ended in a draw.", PlayerName(iPlayer2));
        SendClientMessage (iPlayer1, Color::Green, sMessage);
        format (sMessage, sizeof (sMessage), "* Your fight against %s ended in a draw.", PlayerName(iPlayer1));
        SendClientMessage (iPlayer2, Color::Green, sMessage);
        format (sMessage, sizeof (sMessage), "The fight between ~r~~h~%s~w~ and ~r~~h~%s~w~ ended in a draw!", PlayerName(iPlayer1), PlayerName(iPlayer2));
    }

    NewsController->show(sMessage);

    if(IsPlayerConnected(iPlayer1))
    {
        SetPlayerVirtualWorld(iPlayer1, 0);
        SetPlayerInterior(iPlayer1, 0);
        ResetWorldBounds(iPlayer1);

        if (iPlayer1 != deathPlayerId) {
            SetPlayerHealth(iPlayer1, 100);
            SpawnPlayer(iPlayer1);
        }
    }

    if(IsPlayerConnected(iPlayer2))
    {
        SetPlayerVirtualWorld(iPlayer2, 0);
        SetPlayerInterior(iPlayer2, 0);
        ResetWorldBounds(iPlayer2);

        if (iPlayer2 != deathPlayerId) {
            SetPlayerHealth(iPlayer2, 100);
            SpawnPlayer(iPlayer2);
        }
    }

    // Everyone who spectates should stop spectating.
    for (new iPlayerID = 0; iPlayerID <= PlayerManager->highestPlayerId(); iPlayerID++)
    {
        if(!Player(iPlayerID)->isConnected())
        {
            continue;
        }

        if(IsPlayerNPC(iPlayerID))
        {
            continue;
        }

        if(!IsPlayerWatchingFC[iPlayerID])
        {
            continue;
        }

        if(aSpecInfo[iPlayerID][specmatch] != matchid)
        {
            continue;
        }

        CFightClub__StopWatch(iPlayerID);
        SendClientMessage(iPlayerID, Color::Green, "* You've been respawned because the fight has ended.");
    }

    return 1;
}

CFightClub__DenyMatch(matchid)
{
    if(Matches[matchid][status] != FC_STATUS_ACTIVE) return false;

    new iPlayer1 = Matches[matchid][player1];
    new iPlayer2 = Matches[matchid][player2];

    new string[128];

    format(string, sizeof(string), "* %s has denied your invitation.", PlayerName(iPlayer2));
    SendClientMessage(iPlayer1, Color::Red, string);

    format(string, sizeof(string), "* You denied your invitation sent by %s.", PlayerName(iPlayer1));
    SendClientMessage(iPlayer2, Color::Red, string);

    Matches[matchid][player1] = -1;
    Matches[matchid][player2] = -1;

    PlayerMatch[iPlayer1] = -1;
    CFightClub__ResetPlayerFCInfo(iPlayer1);

    CFightClub__ResetMatch(matchid);
    return 1;
}

CFightClub__CancelMatch(matchid)
{
    if(matchid >= FC_MAX_MATCHES || matchid < 0)
    {
        return false;
    }

    if(Matches[matchid][status] == FC_STATUS_NONE)
    {
        return false;
    }

    new iPlayer1 = Matches[matchid][player1];
    new iPlayer2 = Matches[matchid][player2];
    new string[128];

    if(IsPlayerConnected(iPlayer2))
    {
        format(string, sizeof(string), "* You canceled your invitation to %s.", PlayerName(iPlayer2));
        SendClientMessage(iPlayer1, Color::Red, string);
    }

    if(IsPlayerConnected(iPlayer1))
    {
        format(string, sizeof(string), "* %s has canceled his invitation.", PlayerName(iPlayer1));
        SendClientMessage(iPlayer2, Color::Red, string);
    }


    Matches[matchid][player1] = -1;
    Matches[matchid][player2] = -1;

    PlayerMatch[iPlayer1] = -1;
    CFightClub__ResetPlayerFCInfo(iPlayer1);

    CFightClub__ResetMatch(matchid);
    return 1;
}

//==============================================
//-----------------  RESET  --------------------
//==============================================

CFightClub__ResetMatch(matchid)
{

    new iPlayer1 = Matches[matchid][player1];
    new iPlayer2 = Matches[matchid][player2];

    if(iPlayer1 != -1)
    {
        PlayerMatch[iPlayer1] = -1;
    }
    if(iPlayer2 != -1)
    {
        PlayerMatch[iPlayer2] = -1;
    }

    // Reset specinfo match, if any
    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        if(aSpecInfo[i][specmatch] == matchid)
        {
            CFightClub__StopWatch(i);
        }
    }

    Matches[matchid][status] = FC_STATUS_NONE;
    Matches[matchid][player1] = -1;
    Matches[matchid][player2] = -1;
    Matches[matchid][location] = -1;
    Matches[matchid][fcworld] = FC_BASE_WORLD;
    Matches[matchid][rounds] = 0;
    Matches[matchid][score1] = 0;
    Matches[matchid][score2] = 0;
    Matches[matchid][countdown] = -1;
    Matches[matchid][gun1] = 0;
    Matches[matchid][gun2] = 0;
    Matches[matchid][gun3] = 0;
    Matches[matchid][gun4] = 0;
    Matches[matchid][gun5] = 0;
    return 1;
}


CFightClub__ResetPlayerFCInfo(playerid)
{
    new matchid = PlayerMatch[playerid];
    if(matchid != -1) CFightClub__ResetMatch(matchid);

    FightClubDialog[playerid] = 0;
    PlayerMatch[playerid] = -1;
    TogglePlayerControllable(playerid, 1);
    aSpecInfo[playerid][specmatch] = -1;
    return 1;
}

//==============================================
//----------------  PROCESS  -------------------
//==============================================

CFightClub__Process()
{
    CFightClub__EnableDialog(); // Turns dialog on and off (i.e. adds a little time to walk away from it)

    new iPlayer1;
    new iPlayer2;
    new iCount;
    new iSound;
    new sgText[20];
    new Float:X1, Float:Y1, Float:Z1;
    new Float:X2, Float:Y2, Float:Z2;
    for(new i = 0; i < FC_MAX_MATCHES; i++)
    {
        if(Matches[i][status] == FC_STATUS_FIGHTING)
        {
            iPlayer1 = Matches[i][player1];
            iPlayer2 = Matches[i][player2];
            iCount = Matches[i][countdown];

            if(iCount > -1)
            {
                if (iCount == 6) {  format (sgText, sizeof (sgText), "~r~%d", iCount); iSound = 1058; }
                if (iCount == 5) {  format (sgText, sizeof (sgText), "~r~%d", iCount); iSound = 1058; }
                if (iCount == 4) {  format (sgText, sizeof (sgText), "~r~%d", iCount); iSound = 1058; }
                if (iCount == 3) {  format (sgText, sizeof (sgText), "~y~%d", iCount); iSound = 1058; }
                if (iCount == 2) {  format (sgText, sizeof (sgText), "~y~%d", iCount); iSound = 1058; }
                if (iCount == 1) {  format (sgText, sizeof (sgText), "~g~%d", iCount); iSound = 1058; }
                if (iCount == 0)
                {
                    format (sgText, sizeof (sgText), "~g~%s", FightClubStartText[random(14)]);
                    iSound = 1057;
                    TogglePlayerControllable(iPlayer1, 1);
                    TogglePlayerControllable(iPlayer2, 1);
                }
                GetPlayerPos(iPlayer1, X1, Y1, Z1);
                GetPlayerPos(iPlayer2, X2, Y2, Z2);
                GameTextForPlayer(iPlayer1, sgText, 1100, 6);
                GameTextForPlayer(iPlayer2, sgText, 1100, 6);
                PlayerPlaySound(iPlayer1, iSound, X1, Y1, Z1);
                PlayerPlaySound(iPlayer2, iSound, X2, Y2, Z2);

                Matches[i][countdown]--;
            }
        }
    }
    return 1;
}

//==================================================
//---------------- CommandCheck --------------------
//==================================================

CFightClub__IsWaitCommand(cmdtext[])
{
    new checkcommand[100], checkparam[100];
    Command->stringParameter(cmdtext, 0, checkcommand, sizeof(checkcommand));
    Command->stringParameter(cmdtext, 1, checkparam, sizeof(checkparam));

    if(Command->parameterCount(cmdtext) < 2) return 0;

    // What commands to allow whilst waiting for someone to accept
    if (strcmp(checkcommand, "/fight", true, 6) == 0)
    {
        if(strcmp(checkparam, "cancel", true, 6) == 0 || strcmp(checkparam, "matches", true, 7) == 0 || strcmp(checkparam, "help", true, 4) == 0)
        {
            return 1;
        }
    }
    return 0;
}

CFightClub__IsWatchCommand(cmdtext[])
{
    new checkcommand[100], checkparam[100];
    Command->stringParameter(cmdtext, 0, checkcommand, sizeof(checkcommand));
    Command->stringParameter(cmdtext, 1, checkparam, sizeof(checkparam));

    if(Command->parameterCount(cmdtext) < 2) return 0;

    // What commands to allow whilst watching a fight
    if(strcmp(checkcommand, "/fight", true, 6) == 0)
    {
        if(strcmp(checkparam, "watch", true, 5) == 0 || strcmp(checkparam, "switch", true, 6) == 0 || strcmp(checkparam, "stopwatch", true, 9) == 0 || strcmp(checkparam, "matches", true, 7) == 0 || strcmp(checkparam, "help", true, 4) == 0)
        {
            return 1;
        }
    }
    return 0;
}


//==============================================
//----------------  OTHER  ---------------------
//==============================================

CFightClub__EnableDialog()
{
    if(FightClubDialogEnabled)
    {
        FightClubDialogEnabled = 0;
    }
    else if(!FightClubDialogEnabled)
    {
        FightClubDialogEnabled = 1;
    }
    return 1;
}

CFightClub__GetDialogLocation(locationid)
{
    if(locationid == 0) locationid = FC_LV;
    else if(locationid == 1) locationid = FC_LV_TH;
    else if(locationid == 2) locationid = FC_SF;
    else if(locationid == 3) locationid = FC_DESERT;
    else if(locationid == 4) locationid = FC_WAREHOUSE;
    else if(locationid == 5) locationid = FC_PURE_WW_1;
    else if(locationid == 6) locationid = FC_PURE_WW_2;
    else if(locationid == 7) locationid = FC_COD6;

    return locationid;
}

CFightClub__GetLocationName(locationid)
{
    new FCName[128];
    if(locationid == FC_LV) FCName = "Classic LVP FightClub";
    else if(locationid == FC_LV_TH) FCName = "Train Hard FightClub";
    else if(locationid == FC_SF) FCName = "San Fierro FightClub";
    else if(locationid == FC_DESERT) FCName = "Desert FightClub";
    else if(locationid == FC_WAREHOUSE) FCName = "Warehouse FightClub";
    else if(locationid == FC_PURE_WW_1) FCName = "Pure WW Style 1";
    else if(locationid == FC_PURE_WW_2) FCName = "Pure WW Style 2";
    else if(locationid == FC_COD6) FCName = "COD: MW2 Style";

    return FCName;
}


CFightClub__GetEmptyMatch()
{
    for(new i = 0; i < FC_MAX_MATCHES; i++)
    {
        if(Matches[i][status] == FC_STATUS_NONE) return i;
    }
    return -1;
}

CFightClub__GetWatchList()
{
    new iPlayer1, iPlayer2;
    new strCurrentFights[500];
    new strCheck;
    for(new i = 0; i < FC_MAX_MATCHES; i++)
    {
        if(Matches[i][status] == FC_STATUS_FIGHTING)
        {
            iPlayer1 = Matches[i][player1];
            iPlayer2 = Matches[i][player2];

            if(strCheck == 0)
            {
                format(strCurrentFights, sizeof(strCurrentFights), "%d. %s vs %s. Score: %d-%d.\n", i, PlayerName(iPlayer1), PlayerName(iPlayer2), Matches[i][score1], Matches[i][score2]);
                strCheck = 1;
            }
            else if(strCheck == 1)
            {
                format(strCurrentFights, sizeof(strCurrentFights), "%s%d. %s vs %s. Score: %d-%d.\n", strCurrentFights, i,  PlayerName(iPlayer2), Matches[i][score1], Matches[i][score2]);
            }
        }
    }
    return strCurrentFights;
}

CFightClub__CountMatches(statusid)
{
    new matchCount;
    for(new i = 0; i < FC_MAX_MATCHES; i++)
    {
        if(Matches[i][status] == statusid) matchCount++;
    }
    return matchCount;
}

CFightClub__IsPlayerFighting(playerid)
{
    for(new i = 0; i < FC_MAX_MATCHES; i++)
    {
        if(Matches[i][status] == FC_STATUS_FIGHTING)
        {
            if(Matches[i][player1] == playerid) return 1;
            if(Matches[i][player2] == playerid) return 1;
        }
    }
    return 0;
}

CFightClub__IsPlayerInAnyMatch(playerid)
{
    for(new i = 0; i < FC_MAX_MATCHES; i++)
    {
        if(Matches[i][player1] == playerid) return 1;
        if(Matches[i][player2] == playerid) return 1;
    }
    return 0;
}

CFightClub__GiveMatchWeapons(matchid)
{
    new iPlayer1 = Matches[matchid][player1];
    new iPlayer2 = Matches[matchid][player2];
    new gGun[5];
    gGun[0] = Matches[matchid][gun1];
    gGun[1] = Matches[matchid][gun2];
    gGun[2] = Matches[matchid][gun3];
    gGun[3] = Matches[matchid][gun4];
    gGun[4] = Matches[matchid][gun5];

    for(new i = 0; i < 5; i++)
    {
        if(gGun[i] != FC_WEAPON_NONE)
        {
            GiveWeapon(iPlayer1, gGun[i], FC_WEAPON_AMMO);
            GiveWeapon(iPlayer2, gGun[i], FC_WEAPON_AMMO);
        }
    }

    return 1;
}

CFightClub__HasPlayerInvited(playerid)
{
    for(new i = 0; i < FC_MAX_MATCHES; i++)
    {
        if(Matches[i][player1] == playerid)
        {
            return 1;
        }
    }
    return 0;
}

CFightClub__GetPlayerStatus(playerid)
{
    for(new i = 0; i < FC_MAX_MATCHES; i++)
    {
        if(Matches[i][status] == FC_STATUS_ACTIVE)
        {
            if(Matches[i][player1] == playerid) return FC_STATUS_WAITING;
            if(Matches[i][player2] == playerid) return FC_STATUS_INVITED;
        }
        if(Matches[i][status] == FC_STATUS_FIGHTING)
        {
            if(Matches[i][player1] == playerid) return FC_STATUS_FIGHTING;
            if(Matches[i][player2] == playerid) return FC_STATUS_FIGHTING;
        }
    }
    return FC_STATUS_NONE;
}

CFightClub__SetDeathCount(playerid, n_Deaths)
{
    n_FightClubDeaths[playerid] = n_Deaths;
}

CFightClub__GetDeathCount(playerid)
{
    return n_FightClubDeaths[playerid];
}

CFightClub__SetKillCount(playerid, n_Kills)
{
    n_FightClubKills[playerid] = n_Kills;
}

CFightClub__GetKillCount(playerid)
{
    return n_FightClubKills[playerid];
}
//==================================================
//==================================================

CFightClub__GetPickedWeapon(listitem)
{
    switch(listitem)
    {
        case 0: { return FC_WEAPON_NONE; } // None
        case 1: { return 9; } // Chainsaw
        case 2: { return 23; } // Silenced 9mm
        case 3: { return 24; } // Desert Eagle
        case 4: { return 25; } // Shotgun
        case 5: { return 26; } // Sawnoff Shotgun
        case 6: { return 27; } // Combat Shotgun
        case 7: { return 28; } // Micro SMG
        case 8: { return 29; } // MP5
        case 9: { return 30; } // AK-47
        case 10: { return 31; } // M4
        case 11: { return 32; } // Tec-9
        case 12: { return 33; } // Country Rifle
        case 13: { return 34; } // Sniper Rifle
        case 14: { return 35; } // Rocket Launcher
        case 15: { return 37; } // Flamethrower
        case 16: { return 38; } // Minigun
    }
    return FC_WEAPON_NONE;
}


//================= DIALOGS ===================

CFightClub__ShowDialog(playerid, dialogid)
{
    if(dialogid == DIALOG_FIGHTCLUB_WATCH)
    {
        ShowPlayerDialog(playerid, DIALOG_FIGHTCLUB_WATCH, DIALOG_STYLE_LIST, "Fight Club Watch", CFightClub__GetWatchList(), "Select", "Cancel"); // Launch watch picker
    }
    else
    {
        switch(dialogid)
        {
            case DIALOG_FIGHTCLUB: { ShowPlayerDialog(playerid, DIALOG_FIGHTCLUB, DIALOG_STYLE_MSGBOX, "Fight Club", "Get started by clicking on one of the buttons below.", "Duel", "Watch"); }
            case DIALOG_FIGHTCLUB_DUEL_PLACE: { ShowPlayerDialog(playerid, DIALOG_FIGHTCLUB_DUEL_PLACE, DIALOG_STYLE_LIST, "Fight Club Duel", FightClubLocationString, "Select", "Cancel"); } // Launch location picker
            case DIALOG_FIGHTCLUB_DUEL_WEAPONS_1: { ShowPlayerDialog(playerid, DIALOG_FIGHTCLUB_DUEL_WEAPONS_1, DIALOG_STYLE_LIST, "Choose Weapon 1-5", FightClubWeaponString1, "Select", "Back"); } // Choose Weapon 1
            case DIALOG_FIGHTCLUB_DUEL_WEAPONS_2: { ShowPlayerDialog(playerid, DIALOG_FIGHTCLUB_DUEL_WEAPONS_2, DIALOG_STYLE_LIST, "Choose Weapon 2-5", FightClubWeaponString2, "Select", "Back"); } // Choose Weapon 2
            case DIALOG_FIGHTCLUB_DUEL_WEAPONS_3: { ShowPlayerDialog(playerid, DIALOG_FIGHTCLUB_DUEL_WEAPONS_3, DIALOG_STYLE_LIST, "Choose Weapon 3-5", FightClubWeaponString2, "Select", "Back"); } // Choose Weapon 3
            case DIALOG_FIGHTCLUB_DUEL_WEAPONS_4: { ShowPlayerDialog(playerid, DIALOG_FIGHTCLUB_DUEL_WEAPONS_4, DIALOG_STYLE_LIST, "Choose Weapon 4-5", FightClubWeaponString2, "Select", "Back"); } // Choose Weapon 4
            case DIALOG_FIGHTCLUB_DUEL_WEAPONS_5: { ShowPlayerDialog(playerid, DIALOG_FIGHTCLUB_DUEL_WEAPONS_5, DIALOG_STYLE_LIST, "Choose Weapon 5-5", FightClubWeaponString2, "Select", "Back"); } // Choose Weapon 5
            case DIALOG_FIGHTCLUB_DUEL_INVITE: { ShowPlayerDialog(playerid, DIALOG_FIGHTCLUB_DUEL_INVITE, DIALOG_STYLE_INPUT, "FightClub Invite", "Type in the name or playerId of the one your challenging.", "Invite!", "Cancel"); } // Invite
            case DIALOG_FIGHTCLUB_DUEL_ROUNDS: // Choose rounds
            {
                new string[128];
                format(string, sizeof(string), "How many rounds? (%d-%d)", FC_MIN_ROUNDS, FC_MAX_ROUNDS);
                ShowPlayerDialog(playerid, DIALOG_FIGHTCLUB_DUEL_ROUNDS, DIALOG_STYLE_INPUT, "FightClub Rounds", string, "Select", "Back");
            }
        }
    }

    FightClubDialog[playerid] = 1;
    return 1;
}

//================= MESSAGES ===================

CFightClub__SendSpecMessage(matchid, const string[])
{
    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        if(!IsPlayerWatchingFC[i]) continue;
        if(aSpecInfo[i][specmatch] == matchid)
        {
            SendClientMessage(i, Color::Green, string);
        }
    }
    return 1;
}

CFightClub__ShowFCMessage(playerid, messageid)
{
    if(messageid == FC_MSG_MATCHES)
    {
        if(!CFightClub__CountMatches(FC_STATUS_FIGHTING)) return SendClientMessage(playerid, Color::Red, "No matches are running at this time.");


        SendClientMessage(playerid, Color::Green, "** Current Matches: **");

        new iPlayer1, iPlayer2;
        new iScore1, iScore2;
        new string[128];
        for(new i = 0; i < FC_MAX_MATCHES; i++)
        {

            if(Matches[i][status] == FC_STATUS_FIGHTING)
            {
                iPlayer1 = Matches[i][player1];
                iPlayer2 = Matches[i][player2];
                iScore1 = Matches[i][score1];
                iScore2 = Matches[i][score2];
                format(string, sizeof(string), "Match %d: %s vs %s: %d-%d.", i, PlayerName(iPlayer1), PlayerName(iPlayer2), iScore1, iScore2);
                SendClientMessage(playerid, COLOR_YELLOW, string);
            }
        }
        return 1;
    }
    if(messageid == FC_MSG_HELP)
    {
        SendClientMessage(playerid, Color::Green, "** FightClub Help **");
        SendClientMessage(playerid, COLOR_YELLOW, "Fight people by typing '/fight invite'");
        SendClientMessage(playerid, COLOR_YELLOW, "Use '/fight watch [matchId]' to watch other players fight.");
        SendClientMessage(playerid, COLOR_YELLOW, "Get matches and matchid by typing '/fight matches'");
        SendClientMessage(playerid, COLOR_YELLOW, "All those functions exists on the Death Skull near /taxi 12 as well.");
        SendClientMessage(playerid, Color::Green, "----------------------------");
        return 1;
    }
    return 1;
}

bool: LegacyIsPlayerWatchingFC(playerId) {
    if (IsPlayerWatchingFC[playerId])
        return true;

    return false;
}
