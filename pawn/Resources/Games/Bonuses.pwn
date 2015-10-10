// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/*******************************************************************************
 *                              Bonus Times                                    *
 *                                                                             *
 *                    Author: thiaZ (thiaZ@t-online.de)                        *
 *                                                                             *
 *  Players would get more excited to do minigames, exports, rampages etc.     *
 *  when they are getting more money. So i decided to do such 'bonus times'    *
 *  they'll start every 90 minutes and all players have 3 minutes to export    *
 *  vehicles, kill players, get a rampage or to win minigames by getting the   *
 *  extra money.                                                               *
 *                                                                             *
 *******************************************************************************/

#define BONUS_MINIGAMES    0
#define BONUS_EXPORT       1
#define BONUS_KILL         2

#define BONUS_TIME         240 // 4 minutes.

new bool:BonusTime[3];

new BonusRecievements[3] =
{
    20000, //Minigames
    30000, //Export
    15000 //Killing a player
};


stock BonusTime__Start()
{
    new szMessageToAll[128];
    new Bonus = random(sizeof(BonusTime));
    switch(Bonus)
    {
        case 0:
        {
            format(szMessageToAll, 128, "* The bonus time started: everyone who wins a minigame within the next %d minutes gets $%s bonus cash.",
                BONUS_TIME/60, formatPrice(BonusRecievements[0]));
            SendClientMessageToAll(COLOR_PINK, szMessageToAll);
            for(new i; i<sizeof(BonusTime); i++)
            {
                BonusTime[i] = false;
            }
            BonusTime[0] = true;
            SetTimer("BonusTime__End", BONUS_TIME * 1000, 0);
        }
        case 1:
        {
            format(szMessageToAll, 128, "* The bonus time started: everyone who exports a vehicle within the next %d minutes gets $%s bonus cash.",
                BONUS_TIME/60, formatPrice(BonusRecievements[1]));
            SendClientMessageToAll(COLOR_PINK, szMessageToAll);
            for(new i; i<sizeof(BonusTime); i++)
            {
                BonusTime[i] = false;
            }
            BonusTime[1] = true;
            SetTimer("BonusTime__End", BONUS_TIME * 1000, 0);
        }
        case 2:
        {
            format(szMessageToAll, 128, "* The bonus time started: everyone who kills somebody within the next %d minutes gets $%s bonus cash.",
                BONUS_TIME/60, formatPrice(BonusRecievements[2]));
            SendClientMessageToAll(COLOR_PINK, szMessageToAll);
            for(new i; i<sizeof(BonusTime); i++)
            {
                BonusTime[i] = false;
            }
            BonusTime[2] = true;
            SetTimer("BonusTime__End", BONUS_TIME * 1000, 0);
        }
    }
    return true;
}

stock BonusTime__CheckPlayer(playerid, BonusCase)
{
    new szMessageToPlayer[128];
    if(BonusCase == BONUS_MINIGAMES)
    {
        if(BonusTime[BONUS_MINIGAMES] == true)
        {
            SendClientMessage(playerid, COLOR_PINK, "* You've successfully won a minigame while the bonus time was active!");
            format(szMessageToPlayer, 128, "* You earned $%s by doing this.", formatPrice(BonusRecievements[BONUS_MINIGAMES]));
            SendClientMessage(playerid, COLOR_PINK, szMessageToPlayer);
            GivePlayerMoney(playerid, BonusRecievements[BONUS_MINIGAMES]);
        }
    }

    if(BonusCase == BONUS_EXPORT)
    {
        if(BonusTime[BONUS_EXPORT] == true)
        {
            SendClientMessage(playerid, COLOR_PINK, "* You've successfully exported a vehicle while the bonus time was active!");
            format(szMessageToPlayer, 128, "* You earned $%s by doing this.", formatPrice(BonusRecievements[BONUS_EXPORT]));
            SendClientMessage(playerid, COLOR_PINK, szMessageToPlayer);
            GivePlayerMoney(playerid, BonusRecievements[BONUS_EXPORT]);
        }
    }

    if(BonusCase == BONUS_KILL)
    {
        if(BonusTime[BONUS_KILL] == true)
        {
            SendClientMessage(playerid, COLOR_PINK, "* You've successfully killed a player while the bonus time was active!");
            format(szMessageToPlayer, 128, "* You earned $%s by doing this.", formatPrice(BonusRecievements[BONUS_KILL]));
            SendClientMessage(playerid, COLOR_PINK, szMessageToPlayer);
            GivePlayerMoney(playerid, BonusRecievements[BONUS_KILL]);
        }
    }

    return true;
}

forward BonusTime__End();
public BonusTime__End()
{
    if(BonusTime[BONUS_KILL] == true || BonusTime[BONUS_EXPORT] == true || BonusTime[BONUS_MINIGAMES] == true)
    {
        SendClientMessageToAll(COLOR_PINK, "* The bonus time has ended now.");
        BonusTime[BONUS_KILL] = false;
        BonusTime[BONUS_EXPORT] = false;
        BonusTime[BONUS_MINIGAMES] = false;
    }
    return true;
}