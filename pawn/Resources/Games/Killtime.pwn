// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

new KTTime;

KillTimeStart(minutes = 5) {
    new string[256];

    for (new player = 0; player < MAX_PLAYERS; player++) {
        KTKills[player] = 0;
        KTDeaths[player] = 0;
    }

    SendClientMessageToAll(COLOR_YELLOW, "KillTime modus started!");
    SendClientMessageToAll(Color::White, "The goal of KillTime: Kill more people than your opponents!");

    format(string, sizeof(string), "You have %d minutes before the KillTime is over. Kill them all!", minutes);
    SendClientMessageToAll(Color::White, string);

    format(string, sizeof(string), "The winner gets $%s! Success!", formatPrice(GetEconomyValue(KilltimeVictory)));
    SendClientMessageToAll(Color::White, string);

    KTTime = minutes;
    sKillTime = true;
    KTTimer = SetTimer("KillTimeRun", 60000, 1);
}

forward KillTimeRun();
public KillTimeRun() {
    new lead = -1, leadKills = 0, string[256];
    KTTime--;

    for (new player = 0; player <= PlayerManager->highestPlayerId(); player++) {
        if (Player(player)->isConnected() == false)
            continue;

        if (KTKills[player] > leadKills) {
            lead = player;
            leadKills = KTKills[player];
        }
    }

    if (KTTime > 1) {
        if (lead > -1)
            format(string, sizeof(string), "KillTime: %d minutes to go! %s is leading with %d kills!",
                KTTime, Player(lead)->nicknameString(), leadKills);
        else
            format(string, sizeof(string), "KillTime: %d minutes to go! Nobody's leading yet!", KTTime);
        SendClientMessageToAll(COLOR_YELLOW, string);
    }

    else if (KTTime == 1) {
        format(string, sizeof(string), "KillTime: Last minute, who will win?!");
        SendClientMessageToAll(COLOR_YELLOW, string);
    }

    else {
        KillTimer(KTTimer);
        KTTimer = -1;
        sKillTime = false;

        if (Player(lead)->isConnected() == false) {
            format(string, sizeof(string), "None won the killtime. The $%s has been donated to LVP's monkey sanctuary.",
                formatPrice(GetEconomyValue(KilltimeVictory)));
            SendClientMessageToAll(COLOR_YELLOW, string);

            format(string, sizeof(string), "[killtime] None -");
            AddEcho(string);
        } else {
            format(string, sizeof(string), "%s has won the KillTime with %d kills!", Player(lead)->nicknameString(), leadKills);
            SendClientMessageToAll(COLOR_YELLOW, string);

            new const price = GetEconomyValue(KilltimeVictory);

            format(string, sizeof(string), "Congratulations! You have won $%s!", formatPrice(price));
            SendClientMessage(lead, Color::Green, string);

            format(string, sizeof(string), "[killtime] %s %d", Player(lead)->nicknameString(), leadKills);
            AddEcho(string);

            GiveRegulatedMoney(lead, KilltimeVictory);
            WonMinigame[lead]++;
        }

        for (new player = 0; player <= PlayerManager->highestPlayerId(); player++) {
            if (Player(player)->isConnected() == false || Player(player)->isAdministrator() == true)
                continue;

            new weaponId, ammo;
            GetPlayerWeaponData(player, 7, weaponId, ammo);
            RemovePlayerWeapon(player, weaponId);
        }
    }
}

LegacyIsKillTimeActivated() {
    if (sKillTime)
        return true;

    return false;
}