// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * We allow our VIPs and some other players to access certain vehicles called "admin vehicles",
 * since they are meant for the crew. The vehicles in case are the Hydra and the Hunter, both
 * very powerful and deadly.
 * Exactly for that reason LVP handles certain rules for these vehicles, and that's why we want
 * to be able to disallow players from accessing the vehicles if they've abused them.
 *
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 */
class AdminVehicleAccessManager {
    /**
     * Granting/limiting admin vehicle access to VIPs is done by the crew. For that, they have the
     * vallow command, which shows the current player's setting when no parameters are given.
     * 
     * @param playerId Id of the player who executed this command.
     * @param subjectId Id of the player who this command should be applied to.
     * @param access Turn the vehicle access on or off.
     * @command /p [player] vallow [on/off]
     */
    @switch(PlayerCommand, "vallow")
    public onPlayerVallowCommand(playerId, subjectId, params[]) {
        if (Player(playerId)->isAdministrator() == false)
            return 0;

        if (playerId == subjectId) {
            SendClientMessage(playerId, Color::Error, "You can't vallow yourself.");
            return 1;
        }

        if (Player(subjectId)->isNonPlayerCharacter() == true) {
            SendClientMessage(playerId, Color::Error, "You can't vallow NPCs.");
            return 1;
        }

        if (Player(subjectId)->isVip() == false) {
            SendClientMessage(playerId, Color::Error, "Only VIPs should be granted/limited admin vehicle access.");
            return 1;
        }

        new message[128];
        if (Command->parameterCount(params) == 0) {
            format(message, sizeof(message),
                "Admin vehicle access currently is %s {FFFFFF}for %s.",
                (PlayerSettings(subjectId)->isAdminVehicleAccessDisabled() == false ?
                "{33AA33}enabled" : "{DC143C}disabled"), Player(subjectId)->nicknameString());

            SendClientMessage(playerId, Color::Information, message);

            // Inform the user about the correct usage.
            SendClientMessage(playerId, Color::Information, "Usage: /p [player] vallow [on/off]");
            return 1;
        }

        new bool: adminVehicleAccess = Command->booleanParameter(params, 0) == false;
        PlayerSettings(subjectId)->setAdminVehicleAccessDisabled(adminVehicleAccess);

        format(message, sizeof(message),
            "Admin vehicle access for {FFFFFF}%s {33AA33}has been %s{33AA33}.",
            Player(subjectId)->nicknameString(), (adminVehicleAccess ? "{DC143C}disabled" : "{33AA33}enabled"));
        SendClientMessage(playerId, Color::Success, message);

        // Inform the player about this event.
        format(message, sizeof(message), "An administrator has %s {FFFFFF}you to access admin vehicles.",
            (adminVehicleAccess ? "{DC143C}disallowed" : "{33AA33}allowed"));
        SendClientMessage(subjectId, Color::Information, message);

        // Inform the crew.
        format(message, sizeof(message), "%s (Id:%d) has persistently %s admin vehicle access to %s (Id: %d).",
            Player(playerId)->nicknameString(), playerId, (adminVehicleAccess ? "disallowed" : "allowed"),
            Player(subjectId)->nicknameString(), subjectId);
        Admin(playerId, message);

        // Synchronize the player's access level to make sure they're not in forbidden vehicles.
        VehicleAccessManager->synchronizePlayerVehicleAccess(subjectId);

        return 1;
    }

    /**
     * To check which players ingame have access to admin vehicles, crew can use the /vallowed command.
     * 
     * @param playerId Id of the crew member who executed this command.
     * @param params Any further text that the player passed to the command. Unused.
     * @command /vallowed
     */
    @command("vallowed")
    public onVallowedCommand(playerId, params[]) {
        if (Player(playerId)->isModerator() == false)
            return 0;

        SendClientMessage(playerId, Color::Information, "Current players with admin vehicle access:");

        new message[128], displayed = 0;
        for (new player = 0; player <= PlayerManager->highestPlayerId(); player++) {
            if (Player(player)->isConnected() == true && Player(player)->isVip() == true
                && PlayerSettings(player)->isAdminVehicleAccessDisabled() == false) {
                format(message, sizeof(message), " {CCCCCC}(%d) {%06x}%s", player, ColorManager->playerColor(player) >>> 8,
                    Player(player)->nicknameString());

                SendClientMessage(playerId, Color::Information, message);
                ++displayed;
            }
        }

        if (displayed == 0)
            SendClientMessage(playerId, Color::Information, " There aren't any players with such access at the moment..");

        return 1;
        #pragma unused params
    }

    /**
     * The reason we have this class is to limit abusers in their access to admin vehicles. Here
     * we finally check if a player is truly abusing, and if so, we contact the crew.
     *
     * @param playerId Id of the player who died.
     * @param killerId Id of the killer, or INVALID_PLAYER_ID if there was none.
     * @param reason Reason (extended weapon Id) which caused this player to die.
     */
    @list(OnPlayerDeath)
    public onPlayerDeath(playerId, killerId, reason) {
        new message[128];

        // Check if the player didn't suicide.
        if (killerId == Player::InvalidId)
            return 0;

        // Does the killer have access to admin vehicles, and isn't part of the crew?
        if (PlayerSettings(killerId)->isAdminVehicleAccessDisabled() == false
            && (Player(killerId)->isVip() == true && Player(killerId)->isModerator() == false
            && IsPlayerInAnyVehicle(killerId))) {
            // Get the killer's current vehicle and check if it's either an hydra or hunter.
            // Also, check if the reason is either a death from minigun or explosion.
            new adminVehicle = GetVehicleModel(GetPlayerVehicleID(killerId));
            if ((adminVehicle == 520 || adminVehicle == 425) && (reason == 51 || reason == 38)) {
                // We inform the crew about this, it's their responsibility to handle this.
                format(message, sizeof(message),
                    "Possible admin vehicle abuser: %s (Id:%d) killed %s (Id:%d) with an %s.",
                    Player(killerId)->nicknameString(), killerId, Player(playerId)->nicknameString(),
                    playerId, (adminVehicle == 520 ? "hydra" : "hunter"));
                Admin(killerId, message);
            }
        }

        return 1;
    }
};
