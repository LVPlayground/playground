// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * The DeathmatchCommands class combines all the supported commands for the roaming deathmatchers.
 *
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 */
class DeathmatchCommands {
    /**
     * When players want to commit suicide, they can use the /kill command.
     * 
     * @param playerId Id of the player who typed the command.
     * @param params Any further text that the player passed to the command. Unused.
     * @command /kill
     */
    @command("kill")
    public onKillCommand(playerId, params[]) {
        if (IsPlayerInMinigame(playerId)) {
            SendClientMessage(playerId, Color::Error, "You can't use this in a minigame, use \"/leave\" first.");
            return 1;
        }

        if (DamageManager(playerId)->isPlayerFighting() == true) {
            SendClientMessage(playerId, Color::Error, "You can't use this while fighting.");
            return 1;
        }

        if (GetPlayerInterior(playerId) != 0) {
            SendClientMessage(playerId, Color::Error, "You can't use this in an interior.");
            return 1;
        }

        if (ShipManager->isPlayerWalkingOnShip(playerId)) {
            SendClientMessage(playerId, Color::Error, "You can't use this on the ship.");
            return 1;
        }

        SetPlayerHealth(playerId, 0);
        SendClientMessage(playerId, Color::Information, "You've committed suicide!");

        return 1;
        #pragma unused params
    }
};
