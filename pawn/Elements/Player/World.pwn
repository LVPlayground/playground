// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

new g_VirtualWorld[MAX_PLAYERS];
new g_WorldInvite[MAX_PLAYERS];

LegacyChangePlayerWorld(playerId, worldId) {
    g_VirtualWorld[playerId] = worldId;
}

OnPlayerWorldCommand(playerId, params[]) {
    if (GetPlayerInterior(playerId) != 0) {
        SendClientMessage(playerId, Color::Error, "You have to be outside to switch worlds.");
        return 0;
    }

    if (Command->parameterCount(params) == 0) {
        if (Player(playerId)->isAdministrator() == true)
            SendClientMessage(playerId, Color::Information, "Usage: /world [0-99/invite/join/kick/set]");
        else
            SendClientMessage(playerId, Color::Information, "Usage: /world [0-99/invite/join]");

        return 1;
    }

    new worldId = Command->integerParameter(params, 0);
    if (worldId == g_VirtualWorld[playerId]) {
        SendClientMessage(playerId, Color::Error, "You're currently in this world.");
        return 1;
    }

    if (worldId != -1 && World->isWorldValid(worldId) == true) {
        if (!IsPlayerAllowedToTeleport(playerId)) {
            SendClientMessage(playerId, Color::Error, "You can't change worlds while you are fighting.");
            return 1;
        }

        if (LegacyIsVehicleBombAdded(GetPlayerVehicleID(playerId)) == true) {
            SendClientMessage(playerId, Color::Error, "You can't change worlds with a bombcar.");
            return 1;
        }

        l_GotoWorld(playerId, worldId);

        return 1;
    }

    new worldCommand[12];
    Command->stringParameter(params, 0, worldCommand, sizeof(worldCommand));
    if (strcmp(worldCommand, "invite", true, 6) == 0) {
        if (g_VirtualWorld[playerId] == 0) {
            SendClientMessage(playerId, Color::Error, "You have to be outside the main world to use this!");
            return 1;
        }

        if (Command->parameterCount(params) != 2) {
            SendClientMessage(playerId, Color::Information, "Usage: /world invite [player]");
            return 1;
        }

        new subjectId = Command->playerParameter(params, 1, playerId);
        if (subjectId == Player::InvalidId)
            return 0;

        if (subjectId == playerId) {
            SendClientMessage(playerId, Color::Error, "You can't invite yourself into a virtual world.");
            return 1;
        }

        if (g_VirtualWorld[subjectId] == g_VirtualWorld[playerId]) {
            SendClientMessage(playerId, Color::Error, "This player is already present in this world!");
            return 1;
        }

        new message[128];
        format(message, sizeof(message), "*** %s (Id:%d) has invited %s (Id:%d) to this world.",
            Player(playerId)->nicknameString(), playerId, Player(subjectId)->nicknameString(), subjectId);
        for (new player = 0; player <= PlayerManager->highestPlayerId(); player++) {
            if (Player(player)->isConnected() == true && g_VirtualWorld[player] == g_VirtualWorld[playerId])
                SendClientMessage(player, Color::Information, message);
        }

        format(message, sizeof(message),
            "*** %s (Id:%d) has invited you to join world #%d. Type /world join to accept this invitation.",
            Player(playerId)->nicknameString(), playerId, g_VirtualWorld[playerId]);
        SendClientMessage(subjectId, Color::Information, message);
        g_WorldInvite[subjectId] = g_VirtualWorld[playerId];

        return 1;
    }

    if (strcmp(worldCommand, "kick", true, 4) == 0) {
        if (Player(playerId)->isAdministrator() == false)
            return 0;

        if (Command->parameterCount(params) != 2) {
            SendClientMessage(playerId, Color::Information, "Usage: /world kick [player]");
            SendClientMessage(playerId, Color::Information, " Kicks a player from a virtual world to the main world.");
            return 1;
        }

        new subjectId = Command->playerParameter(params, 1, playerId);
        if (subjectId == Player::InvalidId)
            return 0;

        if (g_VirtualWorld[subjectId] == 0) {
            SendClientMessage(playerId, Color::Error, "This player is currently in the main world." );
            return 1;
        }

        if (Player(subjectId)->isAdministrator() == true) {
            SendClientMessage(playerId, Color::Error, "This player is a crew member.");
            return 1;
        }

        new message[128];
        format(message, sizeof(message), "*** %s (Id:%d) has kicked you from world #%d.",
            Player(playerId)->nicknameString(), playerId, g_VirtualWorld[subjectId]);
        SendClientMessage(subjectId, Color::Information, message);

        format(message, sizeof(message), "%s (Id:%d) has kicked %s (Id:%d) from world #%d.",
            Player(playerId)->nicknameString(), playerId, Player(subjectId)->nicknameString(),
            subjectId, g_VirtualWorld[subjectId]);
        Admin(playerId, message);

        l_GotoWorld(subjectId, World::MainWorld);

        return 1;
    }

    if (strcmp(worldCommand, "join", true, 4) == 0) {
        if (g_WorldInvite[playerId] == 0) {
            SendClientMessage(playerId, Color::Error, "You haven't been invited to any world.");
            return 0;
        }

        l_GotoWorld(playerId, g_WorldInvite[playerId]);

        new message[128];
        format(message, sizeof(message), "%s (Id:%d) has teleported to world #%d.",
            Player(playerId)->nicknameString(), playerId, g_WorldInvite[playerId]);
        Admin(playerId, message);

        return 1;
    }

    if (strcmp(worldCommand, "set", true, 3) == 0) {
        if (Player(playerId)->isAdministrator() == false)
            return 0;

        if (Command->parameterCount(params) != 3) {
            SendClientMessage(playerId, Color::Information, "Usage: /world set [player] [0-99]");
            return 1;
        }

        new subjectId = Command->playerParameter(params, 1, playerId);
        if (subjectId == Player::InvalidId)
            return 0;

        worldId = Command->integerParameter(params, 2);
        if (World->isWorldValid(worldId) == false) {
            SendClientMessage(playerId, Color::Information, "Usage: /world set [player] [0-99]");
            return 1;
        }

        l_GotoWorld(subjectId, worldId);

        new message[128];
        format(message, sizeof(message), "*** %s (Id:%d) has forced you to world #%d.",
            Player(playerId)->nicknameString(), playerId, worldId);
        SendClientMessage(subjectId, Color::Information, message);

        format(message, sizeof(message), "%s (Id:%d) has forced %s (Id:%d) to world #%d.",
            Player(playerId)->nicknameString(), playerId, Player(subjectId)->nicknameString(),
            subjectId, worldId);
        Admin(playerId, message);

        return 1;
    }

    return 1;
}

l_GotoWorld(playerId, worldId) {
    new message[128], vehicleId, trailerId;

    if (IsPlayerInAnyVehicle(playerId) && GetPlayerState(playerId) == PLAYER_STATE_DRIVER) {
        vehicleId = GetPlayerVehicleID(playerId);
        if (IsTrailerAttachedToVehicle(vehicleId))
            trailerId = GetVehicleTrailer(vehicleId);

        SetVehicleVirtualWorld(vehicleId, worldId);
        if (trailerId != 0)
            SetVehicleVirtualWorld(trailerId, worldId);

        AttachTrailerToVehicle(trailerId, vehicleId);
    }

    if (g_VirtualWorld[playerId] != World::MainWorld) {
        TimeController->releasePlayerOverrideTime(playerId);
        SetPlayerWeather(playerId, g_iSavedWeatherID);

        format(message, sizeof(message), "*** %s (Id:%d) has left this world.",
            Player(playerId)->nicknameString(), playerId);
        for (new player = 0; player <= PlayerManager->highestPlayerId(); player++) {
            if (Player(player)->isConnected() == true && g_VirtualWorld[player] == g_VirtualWorld[playerId]
                && player != playerId)
                SendClientMessage(player, Color::Information, message);
        }
    }

    g_VirtualWorld[playerId] = worldId;
    g_WorldInvite[playerId] = 0;

    SetPlayerVirtualWorld(playerId, worldId);

    if (worldId != World::MainWorld) {
        format(message, sizeof(message), "*** %s (Id:%d) has joined this world (#%d).",
            Player(playerId)->nicknameString(), playerId, worldId);
        for (new player = 0; player <= PlayerManager->highestPlayerId(); player++) {
            if (Player(player)->isConnected() == true && g_VirtualWorld[player] == worldId)
                SendClientMessage(player, Color::Information, message);
        }
    }

    format(message, sizeof(message), "%s (Id:%d) has teleported to world #%d.",
        Player(playerId)->nicknameString(), playerId, worldId);
    Admin(playerId, message);

    return 1;
}
