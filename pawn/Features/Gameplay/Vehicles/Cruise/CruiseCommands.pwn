// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * Implements the commands associated with the cruise controller, which allows administrators
 * to control if a cruise is active and which player leads it.
 *
 * @author Joeri de Graaf <oostcoast@sa-mp.nl>
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 */
class CruiseCommands {
    /**
     * LVP crew can start, stop or switch cruise leader with the /cruise command. Typing the command
     * without a specific operation will show an overview of the available options, and the current
     * cruise status. For regular players, global cruise information will be provided when using
     * this command.
     *
     * @param playerId Id of the player who typed the command.
     * @param params Any further text that the player passed to the command.
     * @command /cruise [car/start/stop/switch]
     */
    @command("cruise")
    public onCruiseCommand(playerId, params[]) {
        new operationName[16],
            parameterOffset = 0,
            message[128];

        if (Command->parameterCount(params) >= 1) {
            Command->stringParameter(params, 0, operationName, sizeof(operationName));
            parameterOffset = min(strlen(params), Command->startingIndexForParameter(params, 0) + strlen(operationName) + 1);

            // See if any method is listening to the operation given by the player. If so, bail out.
            if (Annotation::ExpandSwitch<CruiseCommand>(operationName, playerId, params[parameterOffset]) == 1)
                return 1;
        }

        if (Player(playerId)->isModerator() == true) {
            SendClientMessage(playerId, Color::Information, "Usage: /cruise [car/start/stop/switch]");
            if (CruiseController->isCruiseActive() == true) {
                new cruiseLeaderId = CruiseController->getCruiseLeaderId();
                format(message, sizeof(message), "  Cruise Status: {33AA33}active {FFFFFF}[%d] (%s)",
                cruiseLeaderId, Player(cruiseLeaderId)->nicknameString());
                SendClientMessage(playerId, Color::Information, message);
            } else SendClientMessage(playerId, Color::Information, "  Cruise Status: {DC143C}inactive");
        }

        else {
            if (CruiseController->isCruiseActive() == true) {
                new cruiseLeaderId = CruiseController->getCruiseLeaderId();
                format(message, sizeof(message),
                    "A cruise is running! {%06x}%s {FFFFFF}is leading, use {33AA33}\"/ctp %d\" {FFFFFF}to join the cruise.",
                    ColorManager->playerColor(cruiseLeaderId) >>> 8, Player(cruiseLeaderId)->nicknameString(),
                    cruiseLeaderId);
                SendClientMessage(playerId, Color::Information, message);
                if (Player(playerId)->isVip() == true)
                    SendClientMessage(playerId, Color::Information, "Since you're a VIP, you can use \"/cruise car\" to spawn cars!");
            } else
                SendClientMessage(playerId, Color::Information,
                    "There is no cruise active at the moment. Would like to lead one? Contact the crew with the @-prefix!");
        }

        return 1;
    }

    /**
     * If there is no cruise active, a player can be specified to lead one. A global world message
     * will then inform the rest of the players that a cruise has started.
     *
     * @param playerId Id of the player who typed the command.
     * @param player Id or name of the player who needs to be made cruise leader.
     * @command /cruise start [player]
     */
    @switch(CruiseCommand, "start")
    public onCruiseStartCommand(playerId, params[]) {
        if (Player(playerId)->isModerator() == false)
            return 0;

        if (CruiseController->isCruiseActive() == true) {
            SendClientMessage(playerId, Color::Information,
                "A cruise is currently active, use \"/cruise switch\" or \"/cruise stop\".");
            return 1;
        }

        if (!strlen(params)) {
            SendClientMessage(playerId, Color::Information, "Usage: /cruise start [player]");
            return 1;
        }

        new cruiseLeaderId = Command->playerParameter(params, 0, playerId);
        if (cruiseLeaderId == Player::InvalidId)
            return 1;

        CruiseController->setCruiseLeader(cruiseLeaderId);

        new message[128];
        SendClientMessageToAllEx(Color::Warning, "-------------------");
        format(message, sizeof(message),
            "*** Cruise Control: {FFFFFF}A cruise has just been started! %s leads, use \"/ctp %d\" to join!", 
            Player(cruiseLeaderId)->nicknameString(), cruiseLeaderId);
        SendClientMessageToAllEx(Color::Warning, message);
        SendClientMessageToAllEx(Color::Warning,
            "*** Cruise Control: {FFFFFF}You can use \"/vr\" and \"/flip\" outside Las Venturas to repair/flip your vehicle!");
        SendClientMessageToAllEx(Color::Warning, "-------------------");

        if (cruiseLeaderId == playerId)
            format(message, sizeof(message), "%s (Id:%d) has started a cruise and is the leader.",
                Player(cruiseLeaderId)->nicknameString(), cruiseLeaderId);
        else
            format(message, sizeof(message), "%s (Id:%d) has started a cruise and made %s (Id:%d) the leader.",
                Player(playerId)->nicknameString(), playerId, Player(cruiseLeaderId)->nicknameString(),
                cruiseLeaderId);
        Admin(playerId, message);

        return 1;
    }

    /**
     * To switch cruise leaders during an active cruise, /cruise switch can be used.
     *
     * @param playerId Id of the player who typed the command.
     * @param player Id or name of the player who needs to be made cruise leader.
     * @command /cruise switch [player]
     */
    @switch(CruiseCommand, "switch")
    public onCruiseSwitchCommand(playerId, params[]) {
        if (Player(playerId)->isModerator() == false)
            return 0;

        if (CruiseController->isCruiseActive() == false) {
            SendClientMessage(playerId, Color::Information,
                "There is currently no cruise active, use \"/cruise start\" to start one!");
            return 1;
        }

        if (!strlen(params)) {
            SendClientMessage(playerId, Color::Information, "Usage: /cruise switch [player]");
            return 1;
        }

        new nextCruiseLeaderId = Command->playerParameter(params, 0, playerId);
        if (nextCruiseLeaderId == Player::InvalidId)
            return 1;

        if (nextCruiseLeaderId == CruiseController->getCruiseLeaderId()) {
            SendClientMessage(playerId, Color::Error, "This player is already leading.");
            return 1;
        }

        CruiseController->setCruiseLeader(nextCruiseLeaderId);

        new message[128];
        SendClientMessageToAllEx(Color::Warning, "-------------------");
        format(message, sizeof(message),
            "*** Cruise Control: {FFFFFF}%s has taken over as new cruise leader, use \"/ctp %d\" to join!",
            Player(nextCruiseLeaderId)->nicknameString(), nextCruiseLeaderId);
        SendClientMessageToAllEx(Color::Warning, message);
        SendClientMessageToAllEx(Color::Warning, "-------------------");

        if (nextCruiseLeaderId == playerId)
            format(message, sizeof(message), "%s (Id:%d) has taken over the cruise.",
                Player(playerId)->nicknameString(), playerId);
        else
            format(message, sizeof(message), "%s (Id:%d) has made %s (Id:%d) the new cruise leader.",
                Player(playerId)->nicknameString(), playerId,
                Player(nextCruiseLeaderId)->nicknameString(), nextCruiseLeaderId);
        Admin(playerId, message);

        return 1;
    }

    /**
     * To end an active cruise, /cruise stop can be used.
     *
     * @param playerId Id of the player who typed the command.
     * @param params Any further text that the player passed to the command. Unused.
     * @command /cruise stop
     */
    @switch(CruiseCommand, "stop")
    public onCruiseStopCommand(playerId, params[]) {
        if (Player(playerId)->isModerator() == false)
            return 0;

        if (CruiseController->isCruiseActive() == false) {
            SendClientMessage(playerId, Color::Information,
                "There is currently no cruise active to stop! Use \"/cruise start\" to start one.");
            return 1;
        }

        CruiseController->setCruiseLeader(Player::InvalidId);

        new message[128];
        SendClientMessageToAllEx(Color::Warning, "-------------------");
        SendClientMessageToAllEx(Color::Warning,
            "*** Cruise Control: {FFFFFF}The cruise has ended, see you next time!");
        SendClientMessageToAllEx(Color::Warning, "-------------------");

        format(message, sizeof(message), "%s (Id:%d) has ended the cruise.",
            Player(playerId)->nicknameString(), playerId);
        Admin(playerId, message);

        return 1;
        #pragma unused params
    }

    /**
     * VIPs have the ability to spawn a car during a cruise, a nice addition to the overall cruise
     * sensation. The list of spawnable vehicles is limited to a few fast cars, and some original
     * ones like a truck, boat, heli, monster etc.
     *
     * @param playerId Id of the player who typed the command.
     * @param params Any further text that the player passed to the command. Unused.
     * @command /cruise car
     */
    @switch(CruiseCommand, "car")
    public onCruiseCarCommand(playerId, params[]) {
        if (Player(playerId)->isVip() == false && Player(playerId)->isModerator() == false) {
            SendClientMessage(playerId, Color::Error, "This is a VIP only command. For more information, check out \"/donate\"!");
            return 1;
        }

        if (CruiseController->isCruiseActive() == false) {
            SendClientMessage(playerId, Color::Information, "There is currently no cruise active.");
            return 1;
        }

        if (CruiseController->isPlayerNearCruiseLeader(playerId) == false) {
            SendClientMessage(playerId, Color::Error, "You can only spawn a cruise car near the cruise leader.");
            return 1;
        }

        new cruiseVehicles[512];
        for (new vehicle = 0; vehicle < sizeof(g_spawnableCruiseVehicles); vehicle++) {
            if (vehicle == 0)
                format(cruiseVehicles, sizeof(cruiseVehicles), "%s\r\n",
                    VehicleModel(g_spawnableCruiseVehicles[vehicle])->nameString());
            else
                format(cruiseVehicles, sizeof(cruiseVehicles), "%s%s\r\n",
                    cruiseVehicles, VehicleModel(g_spawnableCruiseVehicles[vehicle])->nameString());
        }

        ShowPlayerDialog(playerId, CruiseController::DialogId, DIALOG_STYLE_LIST, "Spawnable Vehicles",
            cruiseVehicles, "Select", "Cancel");

        return 1;
        #pragma unused params
    }
};
