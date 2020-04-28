// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/*

Las Venturas Playground 2.90 Reactiontest Handler
Author: Tomos Jenkins -- tomozj
(Original Author Unknown, handler rebuilt and merged here)

The regular reactiontest was converted to its own handler so it'd be easily
accessible in future, and so that it'd be cleaner to add things such as high
scores.

*/

// Enums
enum enumReaction
{
    timer,
    clock,
    mode,
    type,
    expire
}

// Variables
static reactionData[enumReaction];
static reactionText[11];
static reactionNumbers[256];
static reactionAnswer[256];
static calculation;

// CReaction__Initialize
// We initalize the reactiontest, and set the first timers.
CReaction__Initialize()
{
    CReaction__Rebuild();

    // Values none will ever type
    format(reactionText, 11, "jtfmals");
    format(reactionAnswer, 256, "ergegdghdfh");
}

// CReaction__Process
// We call this every second, meaning we can track things on the main LVP timer
// instead of using many.
CReaction__Process()
{
    new bool: anyConnectedHuman = false;

    for (new playerId = 0; playerId < PlayerManager->highestPlayerId(); ++playerId) {
        if (Player(playerId)->isNonPlayerCharacter())
            continue;

        anyConnectedHuman = true;
        break;
    }

    // The games should be paused when no players are currently connected to the server.
    if (!anyConnectedHuman)
        return 1;

    if(reactionData[timer] == 0)
    {
        // Something is supposed to happen now D:
        switch(reactionData[mode])
        {
            case 0:
            {
                // Time to start up.
                new Random = random(2);

                format(reactionText, 8, "jtfmals");
                format(reactionAnswer, 256, "ergegdghdfh");

                if(Random == 0)
                {
                    format(reactionText, 11, "%s", CReaction__GenerateRandom());
                }
                else
                {
                    format(reactionNumbers, 256, "%s", CReaction__GenerateCombi());
                }

                reactionData[type] = Random;
                reactionData[mode]++;
                reactionData[timer] += 5;
                reactionData[expire] = 5;
                return 1;
            }
            case 1:
            {
                // Now we show
                if(reactionData[type] == -1)
                {
                    SendClientMessageToAll(Color::White, "REACTION TEST ERROR");
                    return 1;
                }

                if(reactionData[type] == 0) {
                    // String type

                    new string[256];
                    format(string, sizeof(string) , "%d %s", GetEconomyValue(ReactionTest), reactionText);
                    EchoMessage("reaction-repeat", "dz", string);

                    reactionData[clock] = GetTickCount();
                    reactionData[timer] = -1;

                    format(string, sizeof(string), "The first one who says '%s' wins $%s!",
                        reactionText, formatPrice(GetEconomyValue(ReactionTest)));

                    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
                        SendClientMessage(i, COLOR_YELLOW, string);

                } else {
                    // Math sum type

                    new string[256];
                    format(string, sizeof(string) , "%d %s", GetEconomyValue(ReactionTest), reactionNumbers);
                    EchoMessage("reaction-calculate", "dz", string);

                    format(reactionAnswer, 256, "%d", calculation);

                    reactionData[clock] = GetTickCount();
                    reactionData[timer] = -1;

                    format(string, sizeof(string), "The first one who calculates '%s' wins $%s!",
                        reactionNumbers, formatPrice(GetEconomyValue(ReactionTest)));

                    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
                        SendClientMessage(i, COLOR_YELLOW, string);

                }
            }
        }

    } else if(reactionData[timer] == -1) {
        // Do nothing, timer de-activated.
    } else {
        reactionData[timer]--;
    }
    return 1;
}

// CReaction__Rebuild
// This rebuilds the reactiontest after a win.
CReaction__Rebuild()
{
    reactionData[timer] = (random(5)+2) * 60; // We want the time in minutes!
    reactionData[type] = -1;
    reactionData[mode] = 0;
    reactionData[clock] = -1;
}

// CReaction__OnText
// When someone types something.. this is called.
CReaction__OnText(playerid, text[])
{
    // Now we need to finish the reactiontest. There are two, but there's no
    // need to have all code two times. So just combine them into one!
    if (strcmp( text, reactionText, true ) == 0 || strcmp( text, reactionAnswer, true ) == 0) {
        if (reactionData[expire] == 1)
        {
            SendClientMessage( playerid, Color::Red, "* You are too late! The reaction-test already ended!" );
            return 0;
        }
        if (reactionData[mode] == 0) {
            SendClientMessage( playerid, Color::Red, "* You are too late! Someone has already won in the reaction-test!" );
            return 0;
        }

        // So we've got a right answer and this should be handled, add a win and
        // give the 10.000 dollar I recon, and some nice messages as well :>
        SendClientMessage( playerid, Color::Green, "* You have won the reaction-test!" );
        GiveRegulatedMoney( playerid, ReactionTest );

        CReaction__Win(playerid);


        // Calculate the difference in seconds between the start and the end.
        new iDifferance = (GetTickCount() - reactionData[clock]);
        new Float:fDiff = floatdiv( iDifferance, 1000 );

        // HIGH SCORE STUFF GOES HERE WITH fDIFF!!!!! -------------------------------------------------------------------------------------------------------------------------------.>>>

        // Instrument the player winning this reaction test.
        Instrumentation->recordActivity((strcmp(text, reactionAnswer, true) == 0) ? 
            ReactionTestCalculateActivity : ReactionTestRepeatActivity, floatround(fDiff));

        // format the message depending on the times someone has won the reaction
        // test. If it's the first time, we give a bonus of 1.000.000. Ok, not really.
        new szMessage[ 256 ], szName[ 24 ];
        GetPlayerName( playerid, szName, 24 );

        if (PlayerInfo[playerid][reactionTestWins] == 0) {
            format( szMessage, sizeof( szMessage ), "* %s has won the reaction test in %.2f seconds, for the first time!", szName, fDiff );
        }
        else {
            format( szMessage, sizeof( szMessage ), "* %s has won the reaction test in %.2f seconds, he/she won %d times.", szName, fDiff, PlayerInfo[playerid][reactionTestWins]);
        }

        // Now just distribute the message to all the players;
        for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
        {
            if(Player(i)->isConnected())
                SendClientMessage(i, COLOR_YELLOW, szMessage );
        }

        // Achievement thing
        CAchieve__ReactionWin(playerid, fDiff);
        CReaction__Rebuild();

        reactionData[expire] = 0;


        format( szMessage, sizeof( szMessage ), "%s %d %.2f", szName, playerid, fDiff );
        EchoMessage("reaction-result", "sdf", szMessage);
        return 1;
    }
    return 1;
}

// CReaction__OnCommand
// Called when someone uses /reactiontest
CReaction__OnCommand(playerid)
{
    reactionData[timer] = 0;
    reactionData[type] = -1;
    reactionData[mode] = 0;
    reactionData[clock] = -1;
    SendClientMessage(playerid, Color::Green, "The reaction test will start in 5 seconds!");
    return;
}

// CReaction__Win
// When someone wins
CReaction__Win(playerid)
{
    // they won!
    PlayerInfo[playerid][reactionTestWins]++;
    return 1;
}

CReaction__GenerateRandom()
{
    new word[11];
    new chars[] = "ABCDEFGHJKLMNPQRSTUVWXYZ123456798ABCDEFGHJKLMNPQRSTUVWXYZ";
    for(new i=0; i<8; i++)
    {
        new id = random(57);
        word[i] = chars[id];
    }

    return word;
}

CReaction__RandomNumbers(bool:equationMultiply = false)
{
    if(equationMultiply == false)
    {
        new number;
        number = random(99);

        if(number == 0 ) {
            number+=1;
        }
        return number;
    }
    else
    {
        new number = randomex(2, 4);
        return number;
    }
}


CReaction__RandomSymbol()
{
    new symbol;

    if(random(3) != 0)
    {
        symbol = random(3); // 0 = -, 1 = +. // 2 = *.
    }
    else
    {
        symbol = random(2);
    }

    return symbol;
}


CReaction__GenerateCombi()
{
    new line[256];
    new val1, val2, val3, sym1, sym2;
    new Subtotal;

    val1 = CReaction__RandomNumbers();
    val2 = CReaction__RandomNumbers();
    val3 = CReaction__RandomNumbers();
    sym1 = CReaction__RandomSymbol();
    sym2 = CReaction__RandomSymbol();

    if(sym1 == 1 && sym2 == 1) {
        format(line,256,"%d+%d+%d", val1, val2, val3  );
        Subtotal = val1 + val2;
        calculation = Subtotal + val3;
    } else if(sym1 == 1 && sym2 == 0) {
        format(line,256,"%d+%d-%d", val1, val2, val3  );
        Subtotal = val1 + val2;
        calculation = Subtotal - val3;
    } else if(sym1 == 0 && sym2 == 1) {
        format(line,256,"%d-%d+%d", val1, val2, val3  );
        Subtotal = val1 - val2;
        calculation = Subtotal + val3;
    } else if(sym1 == 0 && sym2 == 0) {
        format(line,256,"%d-%d-%d", val1, val2, val3  );
        Subtotal = val1 - val2;
        calculation = Subtotal - val3;
    }
    else if (sym1 == 0 && sym2 > 0){   // random offset. We'll add a nice multiplication here :>
        val3 = CReaction__RandomNumbers(true);
        format(line,256,"(%d+%d) * %d", val1, val2, val3  );
        Subtotal = val1 + val2;
        calculation = Subtotal * val3;
    }
    else if(sym1 > 0 && sym2 > 1){
        val3 = CReaction__RandomNumbers(true);
        format(line,256,"(%d-%d) * %d", val1, val2, val3  );
        Subtotal = val1 - val2;
        calculation = Subtotal * val3;
    }
    else
    {
        val3 = CReaction__RandomNumbers(true);
        format(line,256,"(%d-%d) * %d", val1, val2, val3  );
        Subtotal = val1 - val2;
        calculation = Subtotal * val3;
    }
    return line;
}

CReaction__ReactionExpire()
{

    if (reactionData[expire] > 2)
    {
        reactionData[expire] --;
    }
    if (reactionData[expire] == 2)
    {

        CReaction__Rebuild();
        //      SendClientMessageToAll(Color::Red, "No one won the reactiontest!");
        reactionData[expire] = 1;
    }
}
