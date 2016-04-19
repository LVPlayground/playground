// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Called when the player selects an item from a menu.
 *
 * @param playerid Id of the player who selected the item
 * @param row Number of the row that was selected.
 */
public OnPlayerSelectedMenuRow(playerid, row) {
    g_PlayerMenu[playerid] = 0;

    CDrink__MenuProcess(playerid, row);
    CBomb__ProcessMenu(playerid, row);
    CHideGame__onMenuSelection(playerid, row);

    new message[128];
    if (GetPlayerMenu(playerid) == AirportMenu[0]) { /* Las Venturas */
        if (GetPlayerMoney(playerid) < 250000) { 
            TogglePlayerControllable(playerid, true);
            SendClientMessage(playerid, Color::Error, "You need $250,000 for this flight.");
            return 0;
        }

        for (new i = 0; i < 3; i++) {
            if (row != i)
                continue;

            GivePlayerMoney(playerid, -250000);
            SetPlayerPos(playerid, airports[i+1][0], airports[i+1][1], airports[i+1][2]);
            if (i == 2) SetPlayerInterior(playerid, 1);
            else SetPlayerInterior(playerid, 0);

            format(message, sizeof(message),"%s (Id:%d) has taken a flight to %s.",
                Player(playerid)->nicknameString(), playerid,
                (i == 0 ? "San Fierro" : i == 1 ? "Los Santos" : "Liberty City"));
            Admin(playerid, message);
        }

        TogglePlayerControllable(playerid,true);
        AirTime[playerid] = Time->currentTime();
        SendClientMessage(playerid, Color::Success, "Thank you for flying with Juank Air. You have arrived at your destination.");
    }

    if (GetPlayerMenu(playerid) == AirportMenu[1]) { /* San Fierro */
        if (GetPlayerMoney(playerid) < 250000) { 
            TogglePlayerControllable(playerid, true);
            SendClientMessage(playerid, Color::Error, "You need $250,000 for this flight.");
            return 0;
        }

        for (new i = 0; i < 3; i++) {
            if (row != i)
                continue;

            GivePlayerMoney(playerid, -250000);
            if (i == 0) SetPlayerPos(playerid, airports[i][0], airports[i][1], airports[i][2]);
            else SetPlayerPos(playerid, airports[i+1][0], airports[i+1][1], airports[i+1][2]);
            if (i == 2) SetPlayerInterior(playerid, 1);
            else SetPlayerInterior(playerid, 0);

            format(message, sizeof(message),"%s (Id:%d) has taken a flight to %s.",
                Player(playerid)->nicknameString(), playerid,
                (i == 0 ? "Las Venturas" : i == 1 ? "Los Santos" : "Liberty City"));
            Admin(playerid, message);
        }

        TogglePlayerControllable(playerid,true);
        AirTime[playerid] = Time->currentTime();
        SendClientMessage(playerid, Color::Success, "Thank you for flying with Juank Air. You have arrived at your destination.");
    }

    if (GetPlayerMenu(playerid) == AirportMenu[2]) { /* Los Santos */
        if (GetPlayerMoney(playerid) < 250000) { 
            TogglePlayerControllable(playerid, true);
            SendClientMessage(playerid, Color::Error, "You need $250,000 for this flight.");
            return 0;
        }

        for (new i = 0; i < 3; i++) {
            if (row != i)
                continue;

            GivePlayerMoney(playerid, -250000);
            if (i == 2) SetPlayerPos(playerid, airports[i+1][0], airports[i+1][1], airports[i+1][2]);
            else SetPlayerPos(playerid, airports[i][0], airports[i][1], airports[i][2]);
            if (i == 2) SetPlayerInterior(playerid, 1);
            else SetPlayerInterior(playerid, 0);

            format(message, sizeof(message),"%s (Id:%d) has taken a flight to %s.",
                Player(playerid)->nicknameString(), playerid,
                (i == 0 ? "Las Venturas" : i == 1 ? "San Fierro" : "Liberty City"));
            Admin(playerid, message);
        }

        TogglePlayerControllable(playerid,true);
        AirTime[playerid] = Time->currentTime();
        SendClientMessage(playerid, Color::Success, "Thank you for flying with Juank Air. You have arrived at your destination.");
    }

    if (GetPlayerMenu(playerid) == AirportMenu[3]) { /* Liberty City */
        if (GetPlayerMoney(playerid) < 250000) { 
            TogglePlayerControllable(playerid, true);
            SendClientMessage(playerid, Color::Error, "You need $250,000 for this flight.");
            return 0;
        }

        for (new i = 0; i < 3; i++) {
            if (row != i)
                continue;

            GivePlayerMoney(playerid, -250000);
            SetPlayerPos(playerid, airports[i][0], airports[i][1], airports[i][2]);
            SetPlayerInterior(playerid, 0);

            format(message, sizeof(message),"%s (Id:%d) has taken a flight to %s.",
                Player(playerid)->nicknameString(), playerid,
                (i == 0 ? "Las Venturas" : i == 1 ? "San Fierro" : "Liberty City"));
            Admin(playerid, message);
        }

        TogglePlayerControllable(playerid,true);
        AirTime[playerid] = Time->currentTime();
        SendClientMessage(playerid, Color::Success, "Thank you for flying with Juank Air. You have arrived at your destination.");
    }

    return 1;
}