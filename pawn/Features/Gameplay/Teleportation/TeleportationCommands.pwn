// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Multiple teleport types are available throughout LVP, one of them being a crew-only feature. The
 * DefaultTeleport is for non-vehicle teleportation, while CarTeleport teleports both player and vehicle.
 * The SecretTeleport type can be used by crew members to secretly teleport to a player, without being
 * held back by restrictions.
 */
enum TeleportationType {
    DefaultTeleport,
    CarTeleport,
    SecretTeleport
};

/**
 * Implements various commands and settings related to teleportation around the map. This includes
 * both player-to-player teleportation, player-to-position teleportation and the options available
 * to both players and administrators to change these settings.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 */
class TeleportationCommands {
    /**
     * We allow player-to-player teleportation under certain circumstances. This command is able to
     * teleport players only; meaning no vehicles get teleported along. Fur such cases, a different
     * command exists.
     * 
     * @param playerId Id of the player who typed the command.
     * @param player Id or name of the player to teleport to.
     * @command /tp [player]
     */
    @command("tp", "teleport")
    public onTeleportCommand(playerId, params[]) {
        if (Command->parameterCount(params) != 1) {
            SendClientMessage(playerId, Color::Information, "Usage: /tp [player]");
            return 1;
        }

        new subjectId = Command->playerParameter(params, 0, playerId);
        if (subjectId == Player::InvalidId)
            return 1;

        new bool: teleportAvailable = TeleportationManager->isTeleportAvailable(playerId, subjectId, DefaultTeleport);
        if (teleportAvailable == false)
            return 1;

        TeleportationManager->teleportPlayer(playerId, subjectId, DefaultTeleport);

        return 1;
    }

    /**
     * This command is able to carteleport players, meaning their the vehicle they currently reside
     * in gets moved along.
     * 
     * @param playerId Id of the player who typed the command.
     * @param player Id or name of the player to teleport to.
     * @command /ctp [player]
     */
    @command("ctp", "carteleport")
    public onCarTeleportCommand(playerId, params[]) {
        if (Command->parameterCount(params) != 1) {
            SendClientMessage(playerId, Color::Information, "Usage: /ctp [player]");
            return 1;
        }

        new subjectId = Command->playerParameter(params, 0, playerId);
        if (subjectId == Player::InvalidId)
            return 1;

        if (GetPlayerState(playerId) != PLAYER_STATE_DRIVER) {
            SendClientMessage(playerId, Color::Error, "You need to be driving a vehicle to use /ctp.");
            return 1;
        }

        new vehicleId = GetPlayerVehicleID(playerId), modelId = GetVehicleModel(vehicleId);
        if ((modelId == 432 /* Rhino */ || modelId == 449 /* Tram */ || modelId == 539 /* Vortex */
            || modelId == 537 /* Train */) && CruiseController->getCruiseLeaderId() != subjectId) {
            SendClientMessage(playerId, Color::Error, "You can't carteleport with this type of vehicle.");
            return 1;
        }

        new bool: teleportAvailable = TeleportationManager->isTeleportAvailable(playerId, subjectId, CarTeleport);
        if (teleportAvailable == false)
            return 1;

        TeleportationManager->teleportPlayer(playerId, subjectId, CarTeleport);

        return 1;
    }

    /**
     * We allow player-to-player teleportation under certain circumstances. This command is able to
     * teleport players only; meaning no vehicles get teleported along. Fur such cases, a different
     * command exists.
     * 
     * @param playerId Id of the player who typed the command.
     * @param player Id or name of the player to teleport to.
     * @command /stp [player]
     */
    @command("stp")
    public onSecretTeleportCommand(playerId, params[]) {
        if (Player(playerId)->isModerator() == false)
            return 0;

        if (Command->parameterCount(params) == 0) {
            SendClientMessage(playerId, Color::Information, "Usage: /stp [player]");
            return 1;
        }

        new subjectId = Command->playerParameter(params, 0, playerId);
        if (subjectId == Player::InvalidId)
            return 1;

        new bool: teleportAvailable = TeleportationManager->isTeleportAvailable(playerId, subjectId, SecretTeleport);
        if (teleportAvailable == false)
            return 1;

        TeleportationManager->teleportPlayer(playerId, subjectId, SecretTeleport);

        return 1;
    }

    /**
     * Allows players to toggle whether other players can teleport to them. This feature is only
     * available for VIPs, and will persist throughout playing sessions.
     *
     * @param playerId Id of the player who executed this command.
     * @param subjectId Id of the player who this command should be applied to.
     * @param params Any further text that the player passed to the command.
     * @command /p [player] teleport [on/off]
     * @command /my teleport [on/off]
     */
    @switch(PlayerCommand, "teleport")
    public onPlayerTeleportCommand(playerId, subjectId, params[]) {
        if (playerId == subjectId && Player(playerId)->isVip() == false && Player(playerId)->isAdministrator() == false) {
            SendClientMessage(playerId, Color::Error, "This is a VIP only command. For more information, check out \"/donate\"!");
            return 1;
        }

        if (playerId != subjectId && Player(subjectId)->isVip() == false) {
            SendClientMessage(playerId, Color::Error, "Error: This player has no VIP status.");
            return 1;
        }

        new message[128];
        if (Command->parameterCount(params) == 0) {
            format(message, sizeof(message), "Teleportation to %s currently is %s{FFFFFF}.",
                (playerId == subjectId ? "you" : Player(subjectId)->nicknameString()), // personalize who it's being sent to.
                (PlayerSettings(subjectId)->isTeleportationDisabled() ?
                    "{DC143C}disabled" :
                    "{33AA33}enabled"));

            SendClientMessage(playerId, Color::Information, message);

            // Inform the user about the correct usage.
            if (playerId != subjectId)
                SendClientMessage(playerId, Color::Information, "  Usage: /p [player] teleport [on/off]");
            else
                SendClientMessage(playerId, Color::Information, "  Usage: /my teleport [on/off]");
            return 1;
        }

        new bool: disabledTeleportation = Command->booleanParameter(params, 0) == false;
        PlayerSettings(subjectId)->setTeleportationDisabled(disabledTeleportation);

        format(message, sizeof(message), "Teleportation to %s has been %s{33AA33}.",
            (playerId == subjectId ? "you" : Player(subjectId)->nicknameString()),
            (disabledTeleportation ?
                "{DC143C}disabled" :
                "{33AA33}enabled"));
        SendClientMessage(playerId, Color::Success, message);

        return 1;
    }

    /**
     * Enabling the map teleport feature allows players -administrators and higher- to go to the
     * main menu in Grand Theft Auto, select the "map" option and right click on it to immediately
     * teleport to that location. This setting persists across playing sessions.
     *
     * @param playerId Id of the player who executed this command.
     * @param subjectId Id of the player who this command should be applied to.
     * @param params Any further text that the player passed to the command.
     * @command /p [player] maptp [on/off]
     * @command /my maptp [on/off]
     */
    @switch(PlayerCommand, "maptp")
    public onPlayerMapTeleportCommand(playerId, subjectId, params[]) {
        if (Player(playerId)->isAdministrator() == false)
            return 0;

        new message[128];
        if (Command->parameterCount(params) == 0) {
            format(message, sizeof(message), "Map teleportation is currently %s{FFFFFF} for %s.",
                (PlayerSettings(subjectId)->isMapTeleportationEnabled() ?
                    "{33AA33}enabled" :
                    "{DC143C}disabled"),
                (playerId == subjectId ? "you" : Player(subjectId)->nicknameString())); // personalize who it's being sent to.

            SendClientMessage(playerId, Color::Information, message);

            // Inform the user about the correct usage.
            if (playerId != subjectId)
                SendClientMessage(playerId, Color::Information, "  Usage: /p [player] maptp [on/off]");
            else
                SendClientMessage(playerId, Color::Information, "  Usage: /my maptp [on/off]");
            return 1;
        }

        new bool: enableMapTeleportation = Command->booleanParameter(params, 0);
        PlayerSettings(subjectId)->setMapTeleportationEnabled(enableMapTeleportation);

        format(message, sizeof(message), "Map teleportation has been %s{33AA33} for %s.",
                (PlayerSettings(subjectId)->isMapTeleportationEnabled() ?
                    "{33AA33}enabled" :
                    "{DC143C}disabled"),
                (playerId == subjectId ? "you" : Player(subjectId)->nicknameString()));
        SendClientMessage(playerId, Color::Success, message);

        // Management members have the ability to enable this feature for non-administrators too,
        // however, with an added announcement message to other in-game crew.
        if (Player(subjectId)->isAdministrator() == false) {
            format(message, sizeof(message), "%s (Id:%d) has persistently %s map teleportation for %s (Id:%d).",
                Player(playerId)->nicknameString(), playerId, (PlayerSettings(subjectId)->isMapTeleportationEnabled() ?
                    "enabled" : "disabled"), Player(subjectId)->nicknameString(), subjectId);
            Admin(playerId, message);

            format(message, sizeof(message), "%s (Id:%d) has %s map teleportation for you.",
                Player(playerId)->nicknameString(), playerId,
                (PlayerSettings(subjectId)->isMapTeleportationEnabled() ? "enabled" : "disabled"));
            SendClientMessage(subjectId, Color::Information, message);
        }

        return 1;
    }
};
