// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * As a simple thank you we offer our donating users various features and abilities regular players
 * have not. The appropriate commands to support these extras are holded by this class.
 *
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 */
class VeryImportantPlayersCommands {
    /**
     * This command can be used by VIPs to list all their features and extras, allowing them to quickly
     * see what they have earned for donating.

     * Having a little influence on your own environment can really help out in some situations. Hence
     * Las Venturas Playground offers its VIPs to change their own weather at free will. We've also
     * added a funny weathertype called 'drugs'.
     * 
     * @param playerId Id of the player who executed this command.
     * @param subjectId Id of the player who this command should be applied to.
     * @param weatherType Type of weather.
     * @command /my weather [day/evening/hot/storm/foggy/drugs]
     **/
    @switch(PlayerCommand, "weather")
    public onPlayerWeatherCommand(playerId, subjectId, params[]) {
        if (playerId != subjectId)
            return 0; /* VIPs don't need admins to change their weather for them */

        if (Player(playerId)->isVip() == false && Player(playerId)->isAdministrator() == false) {
            SendClientMessage(playerId, Color::Error, "This is a VIP only command. For more information, check out \"/donate\"!");
            return 1;
        }

        if (Command->parameterCount(params) != 1) {
            SendClientMessage(playerId, Color::Information, "Usage: /my weather [day/evening/hot/storm/foggy/drugs]");
            return 1;
        }

        if (VeryImportantPlayersManager->changeVipWeather(playerId, params[0]))
            SendClientMessage(playerId, Color::Success, "The weather has been changed for you!");

        return 1;
    }

    /**
     * Like weather, VIPs are also allowed to change their in-game time. We allow them to do this
     * on a per-hour granularity, i.e. values [0, 23]. The given time will be reset when they either
     * change the weather, or when they respawn.
     *
     * @param playerId Id of the player who executed this command.
     * @param subjectId Id of the player who this command should be applied to.
     * @command /my time [off | 0-23]
     */
    @switch(PlayerCommand, "time")
    public onPlayerTimeCommand(playerId, subjectId, params[]) {
        if (playerId != subjectId)
            return 0; /* VIPs don't need admins to change their time for them */

        if (Player(playerId)->isVip() == false && Player(playerId)->isAdministrator() == false) {
            SendClientMessage(playerId, Color::Error, "This is a VIP only command. For more information, check out \"/donate\"!");
            return 1;
        }

        if (Command->parameterCount(params) != 1) {
            SendClientMessage(playerId, Color::Information, "Usage: /my time [off | 0-23]");
            return 1;
        }

        new argument[32];
        Command->stringParameter(params, 0, argument, sizeof(argument));

        if (strcmp(argument, "off", true) == 0) {
            TimeController->releasePlayerDefaultTime(playerId);
            SendClientMessage(playerId, Color::Success, "The time has been released for you!");
            return 1;
        }

        new hour = Command->integerParameter(params, 0);
        if (Command->parameterCount(params) != 1) {
            SendClientMessage(playerId, Color::Information, "Usage: /my time [off | 0-23]");
            return 1;
        }

        TimeController->setPlayerDefaultTime(playerId, hour, 0);

        SendClientMessage(playerId, Color::Success, "The time has been changed for you!");

        return 1;
    }

    /**
     * Ingame player colours can be persistently changed by VIPs. Alias for /my colour.
     * 
     * @param playerId Id of the player who is changing their colour.
     * @param subjectId Id of the player who this command should be applied to.
     * @param params Any further text that the player passed to the command. Unused.
     * @command /my color [reset]?
     */
    @switch(PlayerCommand, "color")
    public onPlayerColorCommand(playerId, subjectId, params[]) {
        this->onPlayerColourCommand(playerId, subjectId, params);

        return 1;
    }

    /**
     * Ingame player colours can be persistently changed by VIPs.
     * 
     * @param playerId Id of the player who is changing their colour.
     * @param params Any further text that the player passed to the command. Unused.
     * @command /my colour
     */
    @switch(PlayerCommand, "colour")
    public onPlayerColourCommand(playerId, subjectId, params[]) {
        if (playerId != subjectId)
            return 0; /* VIPs don't need admins to change their color for them */

        if (!Player(playerId)->isVip() && !Player(playerId)->isAdministrator()) {
            SendClientMessage(playerId, Color::Error, "This is a VIP only command. For more information, check out \"/donate\"!");
            return 1;
        }

        // Handle the case where the player typed "/my color reset" to be subject to randomness again.
        if (Command->parameterCount(params) == 1 && !strcmp(params, "reset", true, 5)) {
            ColorManager->releasePlayerCustomColor(playerId);

            SendClientMessage(playerId, Color::Success, "Your custom color has been reset!");
            return 1;
        }

        // The color changing itself is done within the ColorPicker class.
        ColorPicker->showColorPicker(playerId, PlayerColor);

        return 1;
        #pragma unused params
    }

    /**
     * VIPs can apply a few looks to themselves which will make them look more funny. Every look
     * comes with its own weapon, which will give the look an extra touch. The look is lost on respawn.
     * 
     * @param playerId Id of the player who executed this command.
     * @param subjectId Id of the player who this command should be applied to.
     * @param lookType Type of look.
     * @command /my look [assassin/maniac/punk/riot]
     */
    @switch(PlayerCommand, "look")
    public onPlayerLookCommand(playerId, subjectId, params[]) {
        if (playerId != subjectId)
            return 0; /* VIPs don't need admins to change their looks for them */

        if (Player(playerId)->isVip() == false && Player(playerId)->isAdministrator() == false) {
            SendClientMessage(playerId, Color::Error, "This is a VIP only command. For more information, check out \"/donate\"!");
            return 1;
        }

        if (Command->parameterCount(params) != 1) {
            SendClientMessage(playerId, Color::Information, "Usage: /my look {DC143C}[reset] {FFFFFF}[assassin/bastard/maniac/ninja/punk/riot]");
            return 1;
        }

        if (IsPlayerInAnyVehicle(playerId)) {
            SendClientMessage(playerId, Color::Error,
                "To prevent abuse, you should exit your vehicle and stand still to use this command.");
            return 1;
        }

        if (!CanPlayerTeleport(playerId)) {
            SendClientMessage(playerId, Color::Error, "You can't change your look while fighting.");
            return 1;
        }

        if (ShipManager->isPlayerWalkingOnShip(playerId)) {
            SendClientMessage(playerId, Color::Error, "You can't change your look while on the ship.");
            return 1;
        }

        VeryImportantPlayersManager->changeVipLook(playerId, params[0]);

        return 1;
    }
};
