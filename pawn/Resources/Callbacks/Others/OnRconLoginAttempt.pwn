// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**********************************************************
 *
 * Las Venturas Playground v3.0 OnRconLoginAttempt
 *
 **********************************************************/

public OnRconLoginAttempt(ip[], password[], success)
{
    // Author: Matthias
    if(!success) // If the password was incorrect
    {
        for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
        {
            if(!Player(i)->isConnected() || IsPlayerNPC(i))
            {
                continue;
            }

            if(!strcmp(ip, Player(i)->ipAddressString(), true)) // Use strcmp to check if the IP is the same as the one trying to login.
            {
                // Incorrect password, increase the attemps variable.
                iRconLoginAttempts[i]++;

                if(iRconLoginAttempts[i] == 3)
                {
                    // 3 incorrect passwords, ban him.
                    new szMessage[128], pName[24];
                    GetPlayerName(i, pName, 24);
                    format( szMessage, 256, "%s (Id:%d) has been banned for 3 invalid RCON attempts.", pName, i);
                    Admin(i, szMessage);

                    Player(i)->ban("Too many invalid Remote Console login attempts.");

                    iRconLoginAttempts[i] = 0;
                    return 1;
                }
            }
        }
    }
    else
    {
        for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
        {
            if(!strcmp(ip, Player(i)->ipAddressString(), true) && !Player(i)->isNonPlayerCharacter()) // Use strcmp to check if the IP is the same as the one trying to login.
            {
                new szMsg[128];
                format(szMsg, 128, "%s (Id:%d) has logged into the RCON server command console.",
                    Player(i)->nicknameString(), i);
                Admin(i, szMsg);
                break;
            }
        }
    }
    return 1;
}
