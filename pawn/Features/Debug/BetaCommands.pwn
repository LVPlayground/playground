// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * This file implements a series of commands which are only available during beta tests of Las
 * Venturas Playground. They will be available to all players participating in them.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class BetaCommands {
    /**
     * Gives the player a list of available commands during beta tests
     *
     * @command /betacommands
     */
    @command("betacommands")
    public onBetaCommandsCommand(playerId, params[]) {
        SendClientMessage(playerId, Color::Information, "Commands available during beta tests:");
        SendClientMessage(playerId, Color::Information,
            "/resetcamera, /setpos, /setcamerapos, /setcameralookat, /setlevel, /setvip");
        SendClientMessage(playerId, Color::Information, "/displayzones");

        return 1;
        #pragma unused params
    }

    /**
     * Allows the position of any player to be updated to the position as given in the parameters.
     *
     * @command /setpos [positionX] [positionY] [positionZ]
     */
    @command("setpos")
    public onSetPosCommand(playerId, params[]) {
        if (Command->parameterCount(params) != 3) {
            SendClientMessage(playerId, Color::Information, "Usage: /setpos [positionX] [positionY] [positionZ]");
            return 1;
        }

        new Float: positionX = Command->floatParameter(params, 0),
            Float: positionY = Command->floatParameter(params, 1),
            Float: positionZ = Command->floatParameter(params, 2);

        SetPlayerPos(playerId, positionX, positionY, positionZ);
        return 1;
    }

    /**
     * Makes it possible for the player to change the position of their camera, which makes it a lot
     * easier to determine the right position for cinegraphic effects in the game.
     *
     * @command /setcamerapos [positionX] [positionY] [positionZ]
     */
    @command("setcamerapos")
    public onSetCameraPosCommand(playerId, params[]) {
        if (Command->parameterCount(params) != 3) {
            SendClientMessage(playerId, Color::Information, "Usage: /setcamerapos [positionX] [positionY] [positionZ]");
            return 1;
        }

        new Float: positionX = Command->floatParameter(params, 0),
            Float: positionY = Command->floatParameter(params, 1),
            Float: positionZ = Command->floatParameter(params, 2);

        TogglePlayerSpectating(playerId, 1);
        SetPlayerCameraPos(playerId, positionX, positionY, positionZ);
        return 1;
    }

    /**
     * Makes it possible for the player to change what their camera is looking at, for example to
     * find the right position and look-at vector for cinegraphic effects.
     *
     * @command /setcameralookat [positionX] [positionY] [positionZ]
     */
    @command("setcameralookat")
    public onSetCameraLookAtCommand(playerId, params[]) {
        if (Command->parameterCount(params) != 3) {
            SendClientMessage(playerId, Color::Information, "Usage: /setcameralookat [positionX] [positionY] [positionZ]");
            return 1;
        }

        new Float: positionX = Command->floatParameter(params, 0),
            Float: positionY = Command->floatParameter(params, 1),
            Float: positionZ = Command->floatParameter(params, 2);

        SetPlayerCameraLookAt(playerId, positionX, positionY, positionZ);
        return 1;
    }

    /**
     * Resets the player's camera behind their persona in order to make sure that they can play the
     * game again. We'll also make the player controllable again.
     *
     * @command /resetcamera
     */
    @command("resetcamera")
    public onResetCameraCommand(playerId, params[]) {
        TogglePlayerSpectating(playerId, 0);
        SetCameraBehindPlayer(playerId);

        return 1;
        #pragma unused params
    }

    /**
     * Makes it possible for the player to switch level for testing purposes.
     * available levels: PlayerLevel, AdministratorLevel, ManagementLevel
     *
     * @command /setlevel [administrator/undercover/manager]
     */
    @command("setlevel")
    public onSetLevelCommand(playerId, params[]) {
        new levelName[16];

        if (Command->parameterCount(params) >= 1) {
            Command->stringParameter(params, 0, levelName, sizeof(levelName));

            if (strcmp( levelName, "player", true) == 0) {
                AccountData(playerId)->applyPlayerLevel(PlayerLevel);

                SendClientMessage(playerId, Color::Information, "You are now a regular Player.");
                return 1;
            }
            else if (strcmp( levelName, "admin", true, 5) == 0) {
                AccountData(playerId)->applyPlayerLevel(AdministratorLevel);
                UndercoverAdministrator(playerId)->setIsUndercoverAdministrator(false);

                SendClientMessage(playerId, Color::Information, "You are now an Administrator");
                return 1;
            }
            else if (strcmp( levelName, "undercover", true) == 0) {
                AccountData(playerId)->applyPlayerLevel(AdministratorLevel);
                UndercoverAdministrator(playerId)->setIsUndercoverAdministrator(true);

                SendClientMessage(playerId, Color::Information, "You are now a Undercover Administrator.");    
                return 1;
            }
            else if (strcmp( levelName, "man", true, 3) == 0) {
                AccountData(playerId)->applyPlayerLevel(ManagementLevel);
                UndercoverAdministrator(playerId)->setIsUndercoverAdministrator(false);

                SendClientMessage(playerId, Color::Information, "You are now a Manager.");
                return 1;
            }
        }

        SendClientMessage(playerId, Color::Information, "Usage: /setlevel [player/admin/undercover/manager]");

        return 1;
    }

    /**
     * Makes it possible for the player to obtain VIP status for testing purposes.
     *
     * @param playerId Id of the player who wants to toggle their VIP status.
     * @param params The parameters as passed on by the player.
     * @command /setvip [on/off]
     */
    @command("setvip")
    public onSetVipCommand(playerId, params[]) {
        new levelName[16];
        if (Command->parameterCount(params) >= 1) {
            Command->stringParameter(params, 0, levelName, sizeof(levelName));

            if (strcmp(levelName, "on", true) == 0) {
                Player(playerId)->setIsVip(true);

                SendClientMessage(playerId, Color::Information, "You are now a VIP.");
                return 1;
            }
            if (strcmp(levelName, "off", true) == 0) {
                Player(playerId)->setIsVip(false);

                SendClientMessage(playerId, Color::Information, "You are no longer a VIP.");
                return 1;
            }
        }

        SendClientMessage(playerId, Color::Information, "Usage: /setvip [on/off]");

        return 1;
        #pragma unused params
    }
};
