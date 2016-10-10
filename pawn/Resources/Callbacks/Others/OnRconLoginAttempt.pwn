// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**********************************************************
 *
 * Las Venturas Playground v3.0 OnRconLoginAttempt
 *
 **********************************************************/

public OnRconLoginAttempt(ip[], password[], success) {
    for (new playerId = 0; playerId <= PlayerManager->highestPlayerId(); playerId++) {
        if (!Player(playerId)->isConnected() || Player(playerId)->isNonPlayerCharacter())
            continue;

        if (strcmp(ip, Player(playerId)->ipAddressString(), true) == 0) {
            new notice[128];

            if (!success) {
                iRconLoginAttempts[playerId]++;

                if (iRconLoginAttempts[playerId] == 3) {
                    format(notice, sizeof(notice), "%s (Id:%d) has been banned for 3 invalid RCON login attempts.",
                        Player(playerId)->nicknameString(), playerId);
                    Admin(playerId, notice);

                    Player(playerId)->ban("Too many invalid RCON login attempts.");
                    iRconLoginAttempts[playerId] = 0;
                }
            } else {
                iRconLoginAttempts[playerId] = 0;
            }

            break;
        }
    }

    return 1;
}