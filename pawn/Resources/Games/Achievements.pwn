// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/* Achievement Handler
This handler will take care of Achievements which can be added in several functions,
such as minigames, reactiontests, killings and deaths and all kinds of stuff
Author: Fireburn
Date: 30/05/2009
Scheduled for: 2.90.23

Information for adding new achievements:
Add a CAchieve__something which get calls to check if a player makes an achievement
Example for reactionachievements CAchieve__ReactionWin
Call this function in the stuff where it should get
Example for reactionachievements add in CReaction__Win in reaction.pwn
Add the thing in CAchieve__Achieved

REMEMBER TO MAKE IT RESET IN CAchieve__OnPlayerConnect
*/

// The #define ACHIEVEMENTS which MUST be increased when new achievement is added
// can be found in defines.pwn

// The numbers of the achievements
#define ACREACTION3     0
#define ACREACTION5     1
#define ACREACTION10    2
#define ACQREACTION5    3
#define ACQREACTION3    4
#define ACREACTION1000  5
#define ACKILLS5        6
#define ACKILLS10       7
#define ACKILLS15       8
#define ACKILLS25       9
#define ACAKILLS3       10
#define ACAKILLS5       11
#define ACDEATHS5       12
#define ACDEATHS10      13
#define ACDEATHS25      14
#define ACHOURS1        15
#define ACHOURS2        16
#define ACHOURS5        17
#define TAX1            18
#define TAX2            19
#define TAX5            20
#define TAX10           21
#define TAX25           22
#define EXP50           23
#define EXP100          24
#define EXP250          25
#define EXP500          26
#define EXP1000         27
#define EXP2500         28
//#define FAST210       29
//#define FAST250       30
//#define FAST300       31
//#define FAST350       32
//#define FAST400       33
//#define FAST500       34
//#define FAST100       35
//#define FAST200       36
//#define FAST333       37
//#define FAST555       38
//#define FAST750       39
//#define FAST1000      40
#define BOMB1           41
//#define JAYS_CAR      42
#define KILLMANAG       43
#define DRUNK           44
#define DRUNKDEAD       45
#define ACREACTION2500  46
#define LAME50          47
#define LAME100         48
#define LAME200         49
#define FC100           50
#define FC200           51
#define FC300           52
#define FC400           53
#define FC500           54
#define DRIFT5000       55
#define DRIFT8000       56
#define DRIFT10000      57
#define DRIFT15000      58
#define DRIFT20000      59
#define DRIFT30000      60
#define SPRAY15         61
#define SPRAY30         62
#define SPRAY60         63
#define SPRAY90         64
#define SPRAY100        65

new sAchievements[TotalAchievements][128] = {
    "Fast Guy (3 reactiontest wins in a row)",
    "Quick Boss (5 reactiontest wins in a row)",
    "Reactiontest King (10 reactiontest wins in a row)",
    "I know how to use a keyboard (win a reactiontest within 5 seconds)",
    "I <3 reactiontests (win a reactiontest within 3 seconds)",
    "Quick Addict (1000 reactiontest wins in total)",
    "Killing Spree (5 kills without dying)",
    "Rampage (10 kills without dying)",
    "Suspected Cheater (15 kills without dying)",
    "Godlike (25 kills without dying)",
    "Fast Killer (make the last 3 kills on the server)",
    "Dominator (make the last 5 kills on the server)",
    "Shit Happens (die 5 times in a row)",
    "Having a Bad Day (die 10 times in a row)",
    "ISUK&FAILTHEMOST (die 25 times in a row)",
    "Are you bored? (Been ingame for 1 hour)",
    "Really, go do something else already. (Been ingame for 2 hours)",
    "Go get a life already! (Been ingame for 5 hours)",
    "Poor Taxpayer (over 1 million tax)",
    "Normal Citizen (over 2 million tax)",
    "Drug Boss (over 5 million tax)",
    "Likely-to-be-robbed (over 10 million tax)",
    "Billionaire (over 25 million tax)",
    "Beginning Exported (50 exports)",
    "Learning Cartrader (100 exports)",
    "Don't you need cars for yourself? (250 exports)",
    "Stop selling, there will be nothing left in San Andreas! (500 exports)",
    "King of Carselling (1000 exports)",
    "Master of selling stolen goods (2500 exports)",
    "", // EMPTY SLOT
    "", // EMPTY SLOT
    "", // EMPTY SLOT
    "", // EMPTY SLOT
    "", // EMPTY SLOT
    "", // EMPTY SLOT
    "", // EMPTY SLOT
    "", // EMPTY SLOT
    "", // EMPTY SLOT
    "", // EMPTY SLOT
    "", // EMPTY SLOT
    "", // EMPTY SLOT
    "Bomb-bay bad boy (Get killed with an engine bomb)",
    "", // EMPTY SLOT
    "Ruined chance of becoming admin (kill a management member)",
    "Pleasant Person (get drunk)",
    "Alcoholic (die from alcohol)",
    "Keybind User (2500 reactiontest wins)",
    "Are you serious? (Get 50 lamekills)",
    "Pff...you suck lamer (Get 100 lamekills)",
    "You know how to fly a helicopter (Get 200 lamekills)",
    "Just a lucker (Get 100 FightClub kills)",
    "Come on, he had a nice hitbox (Get 200 FightClub kills)",
    "Oh, you are becoming pro? (Get 300 FightClub kills)",
    "The pwnage has just started (Get 400 FightClub kills)",
    "I ARE PWNZ (Get 500 FightClub kills)",
    "Do you have a driver license? (Get 5000 drift points)",
    "Sunday driver (Get 8000 drift points)",
    "Don't drink and drive! (Get 10000 drift points)",
    "You saw too much The Fast and the Furios (Get 15000 drift points)",
    "Tokyo Drift (Get 20000 drift points)",
    "Poor tires (Get 30000 drift points)",
    "Just startin' (Spray 15 tags)",
    "Taggin' up the Turf (Spray 30 tags)",
    "Gettin' your name out there (Spray 60 tags)",
    "Taggin' up the city (Spray 90 tags)",
    "Sprayed (Spray 100 tags)"
};

enum gPlayerStats {
    ACdeaths,
    ACkills
};
new iStatistics[MAX_PLAYERS][gPlayerStats];

enum gGlobalStats {
    ACreaction,
    ACkills
};

enum gThingsToSave {
    ACplayerid,
    ACamount
};
new iGlobalStats[gGlobalStats][gThingsToSave];

CAchieve__OnPlayerConnect(playerid) {
    for (new i = 0; i < TotalAchievements; i++)
        iAchievements[playerid][i] = 0;

    iStatistics[playerid][ACdeaths] = 0;
    iStatistics[playerid][ACkills] = 0;

    if (iGlobalStats[ACreaction][ACplayerid] == playerid) {
        iGlobalStats[ACreaction][ACplayerid] = -1;
        iGlobalStats[ACreaction][ACamount] = -1;
    }

    if (iGlobalStats[ACkills][ACplayerid] == playerid) {
        iGlobalStats[ACkills][ACplayerid] = -1;
        iGlobalStats[ACkills][ACamount] = -1;
    }
}

CAchieve__DetonateBomb(playerid) {
    CAchieve__Achieved(playerid, BOMB1);
}

CAchieve__SprayTag(playerid) {
    switch (sprayTagGetPlayerCount(playerid)) {
        case 15: CAchieve__Achieved(playerid, SPRAY15);
        case 30: CAchieve__Achieved(playerid, SPRAY30);
        case 60: CAchieve__Achieved(playerid, SPRAY60);
        case 90: CAchieve__Achieved(playerid, SPRAY90);
        case 100: CAchieve__Achieved(playerid, SPRAY100);
    }
}

CAchieve__ReactionWin(playerid, Float: fDiff) {
    if (iGlobalStats[ACreaction][ACplayerid] == playerid) {
        iGlobalStats[ACreaction][ACamount]++;

        switch (iGlobalStats[ACreaction][ACamount]) {
            case 3: CAchieve__Achieved(playerid, ACREACTION3);
            case 5: CAchieve__Achieved(playerid, ACREACTION5);
            case 10: CAchieve__Achieved(playerid, ACREACTION10);
        }
    } else {
        iGlobalStats[ACreaction][ACplayerid] = playerid;
        iGlobalStats[ACreaction][ACamount] = 1;
    }

    if (fDiff >= 3.0 && fDiff < 5.0)
        CAchieve__Achieved(playerid, ACQREACTION5);

    if (fDiff < 3.0) {
        CAchieve__Achieved(playerid, ACQREACTION5, 1);
        CAchieve__Achieved(playerid, ACQREACTION3);
    }

    if (PlayerInfo[playerid][reactionTestWins] >= 1000)
        CAchieve__Achieved(playerid, ACREACTION1000);
    if (PlayerInfo[playerid][reactionTestWins] >= 2500)
        CAchieve__Achieved(playerid, ACREACTION2500);
}

CAchieve__OnPlayerDeath(playerid, killerid) {
    if (killerid != Player::InvalidId) {
        if (iGlobalStats[ACkills][ACplayerid] == killerid) {
            iGlobalStats[ACkills][ACamount]++;

            switch (iGlobalStats[ACkills][ACamount]) {
                case 3: CAchieve__Achieved(killerid, ACAKILLS3);
                case 5: CAchieve__Achieved(killerid, ACAKILLS5);
            }
        } else {
            iGlobalStats[ACkills][ACplayerid] = killerid;
            iGlobalStats[ACkills][ACamount] = 1;
        }
    }

    iStatistics[playerid][ACdeaths]++;
    iStatistics[playerid][ACkills] = 0;

    switch (iStatistics[playerid][ACdeaths]) {
        case 5: CAchieve__Achieved(playerid, ACDEATHS5);
        case 10: CAchieve__Achieved(playerid, ACDEATHS10);
        case 25: CAchieve__Achieved(playerid, ACDEATHS25);
    }

    if (killerid != Player::InvalidId) {
        if (Player(playerid)->isManagement() == true && UndercoverAdministrator(playerid)->isUndercoverAdministrator() == false)
            CAchieve__Achieved(killerid, KILLMANAG);

        iStatistics[killerid][ACkills]++;
        iStatistics[killerid][ACdeaths] = 0;

        switch (iStatistics[killerid][ACkills]) {
            case 5: CAchieve__Achieved(killerid, ACKILLS5);
            case 10: CAchieve__Achieved(killerid, ACKILLS10);
            case 15: CAchieve__Achieved(killerid, ACKILLS15);
            case 25: CAchieve__Achieved(killerid, ACKILLS25);
        }
    }
}

CAchieve__OnPlayerLameKill(playerid, lameKills) {
    if (lameKills >= 50)
        CAchieve__Achieved(playerid, LAME50);

    if (lameKills >= 100)
        CAchieve__Achieved(playerid, LAME100);

    if (lameKills >= 200)
        CAchieve__Achieved(playerid, LAME200);
}

CAchieve__CheckIngameHours(playerid) {
    new iDiff = Time->currentTime() - Player(playerid)->connectionTime();

    if (iDiff >= 18000)
        CAchieve__Achieved(playerid, ACHOURS5);

    if (iDiff >= 7200)
        CAchieve__Achieved(playerid, ACHOURS2);

    if (iDiff >= 3600)
        CAchieve__Achieved(playerid, ACHOURS1);
}

CAchieve__Tax(playerid, amount) {
    if (amount >= 25000000)
        CAchieve__Achieved(playerid, TAX25);

    if (amount >= 10000000)
        CAchieve__Achieved(playerid, TAX10);

    if (amount >= 5000000)
        CAchieve__Achieved(playerid, TAX5);

    if (amount >= 2000000)
        CAchieve__Achieved(playerid, TAX2);

    if (amount >= 1000000)
        CAchieve__Achieved(playerid, TAX1);
}

CAchieve__Drink(playerid, units) {
    if (units >= DRINK_DRUNKLVL)
        CAchieve__Achieved(playerid, DRUNK);

    if (units > DRINK_DEADLVL)
        CAchieve__Achieved(playerid, DRUNKDEAD);
}

CAchieve__Export(playerid, cars) {
    if (cars >= 2500)
        CAchieve__Achieved(playerid, EXP2500);

    if (cars >= 1000)
        CAchieve__Achieved(playerid, EXP1000);

    if (cars >= 500)
        CAchieve__Achieved(playerid, EXP500);

    if (cars >= 250)
        CAchieve__Achieved(playerid, EXP250);

    if (cars >= 100)
        CAchieve__Achieved(playerid, EXP100);

    if (cars >= 50)
        CAchieve__Achieved(playerid, EXP50);
}

#if Feature::EnableFightClub == 0
CAchieve__FightClub(killerid, kills) {
    switch(kills) {
        case 100: CAchieve__Achieved(killerid, FC100);
        case 200: CAchieve__Achieved(killerid, FC200);
        case 300: CAchieve__Achieved(killerid, FC300);
        case 400: CAchieve__Achieved(killerid, FC400);
        case 500: CAchieve__Achieved(killerid, FC500);
    }
}
#endif

#if Feature::DisableRaces == 0
CAchieve__Drift(playerid, score) {
    if (score >= 5000)
        CAchieve__Achieved(playerid, DRIFT5000);

    if (score >= 8000)
        CAchieve__Achieved(playerid, DRIFT8000);

    if (score >= 10000)
        CAchieve__Achieved(playerid, DRIFT10000);

    if (score >= 15000)
        CAchieve__Achieved(playerid, DRIFT15000);

    if (score >= 20000)
        CAchieve__Achieved(playerid, DRIFT20000);

    if (score >= 30000)
        CAchieve__Achieved(playerid, DRIFT30000);
}
#endif

CAchieve__Achieved(playerid, achievement, silentmsg = 0) {
    if (iAchievements[playerid][achievement] == 0 && Player(playerid)->isRegistered() == true) {
        new string[256], count;

        iAchievements[playerid][achievement] = 1;
        format(string, sizeof(string), "You completed the achievement: %s", sAchievements[achievement]);
        SendClientMessage(playerid, COLOR_YELLOW, string);
        format(string, sizeof(string), " ~n~ ~n~~b~%s", string);

        if (silentmsg == 0) {
            GameTextForPlayer(playerid, string, 5000, 3);
            PlayerPlaySound(playerid, 1132, 0.0, 0.0, 0.0);
        }

        for (new i = 0; i < TotalAchievements; i++) {
            if (iAchievements[playerid][i] == 1)
                count++;
        }

        if (count == 1)
            SendClientMessage(playerid, COLOR_YELLOW, "You completed your first achievement! Congratulations!");
        else {
            format(string, sizeof(string), "You completed %d of the %d achievements so far!", count, TotalAchievements);
            SendClientMessage(playerid, COLOR_YELLOW, string);
        }

        if (Player(playerid)->isLoggedIn() == true) {
            new query[256];
            format(query, sizeof(query), "INSERT INTO achievements ( \
                                            playerid, \
                                            achievementid, \
                                            date \
                                        ) VALUES ( \
                                            '%d', \
                                            '%d', \
                                            NOW() \
                                        )",
                Account(playerid)->userId(), achievement);

            Database->query(query, "", -1);
        }
    }
}

MarkAchievementAsAchievedForPlayer(achievementId, playerId) {
    iAchievements[playerId][achievementId] = 1;
}

DeprecatedAchievementIdCheck(playerId, achievementId) {
    if (iAchievements[playerId][achievementId] == 1)
        return 1;

    return 0;
}

DeprecatedAchievementString(achievementId) {
    return sAchievements[achievementId];
}