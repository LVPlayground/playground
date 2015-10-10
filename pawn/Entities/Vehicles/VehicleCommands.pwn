// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * Various commands related to vehicles are available to both administrators and players. For the
 * Administrators, we have the ability to create new vehicles and modify or remove existing ones. 
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class VehicleCommands {
    // What is the dialog Id that will be used for the vehicle destroying warning?
    public const WarningDialogId = @counter(OnDialogResponse);

    /**
     * The /v command is one of the more powerful commands available in Las Venturas Playground, and
     * allows administrators to gain control over the vehicles available on the server. There are a
     * gazillion sub-commands, each of which has been implemented in its own separate method.
     *
     * @param playerId Id of the player who just executed the /v command.
     * @param params Parameters they passed to the command.
     * @command /v [create/enter] | [player]? [access/color/destroy/health/nos/paintjob/respawn/save]
     */
    @command("v", "vehicle")
    public onVehicleCommand(playerId, params[]) {
        if (Player(playerId)->isAdministrator() == false)
            return 0; // only administrators may use this command.

        new parameterCount = Command->parameterCount(params),
            parameterIndex = 0,
            vehicleId = Vehicle::InvalidId;

        // Administrators have the ability to apply commands to another vehicle occupied by any
        // other player. In this case, the first argument will be a player Id or name. This is a bit
        // tricky because players named "create", "enter" or whatever will be nasty.
        if (parameterCount >= 1) {
            new targetPlayerId = Command->playerParameter(params, 0);
            if (targetPlayerId != Player::InvalidId) {
                if (IsPlayerInAnyVehicle(targetPlayerId))
                    vehicleId = GetPlayerVehicleID(targetPlayerId);

                ++parameterIndex;
            }
        }

        // Although the administrator may want to apply this over their own vehicle as well.
        if (vehicleId == Vehicle::InvalidId && IsPlayerInAnyVehicle(playerId))
            vehicleId = GetPlayerVehicleID(playerId);

        // The GetPlayerVehicleID() command may return garbage, protect against it.
        if (vehicleId == 0 || Vehicle(vehicleId)->isValid() == false)
            vehicleId = Vehicle::InvalidId;

        new operationName[16],
            parameterOffset = 0;

        // We have two different sets of sub-commands. Firstly there are generic commands, which are
        // available when the player is not in a vehicle. Then there are vehicle-specific commands,
        // which require the player to be in a vehicle.
        if (vehicleId == Vehicle::InvalidId) {
            if (parameterCount >= 1) {
                Command->stringParameter(params, 0, operationName, sizeof(operationName));
                parameterOffset = min(strlen(params), Command->startingIndexForParameter(params, 0) + strlen(operationName) + 1);

                // See if any method is listening to the operation given by the player. If so, bail out.
                if (Annotation::ExpandSwitch<GenericVehicleCommand>(operationName, playerId, params[parameterOffset]) != -1)
                    return 1;
            }

            // No (valid) operation was given by the player, show them the usage information.
            SendClientMessage(playerId, Color::Information, "Usage: /v [create/enter]");
            return 1;
        }

        // Otherwise we do have a vehicle Id, which means that we have a completely different set of
        // commands available to us. These commands are usually specific to a vehicle.
        if (parameterCount > parameterIndex) {
            Command->stringParameter(params, parameterIndex, operationName, sizeof(operationName));
            parameterOffset = min(strlen(params), Command->startingIndexForParameter(params, parameterIndex) + strlen(operationName) + 1);

            // See if any method is listening to the operation given by the player. If so, bail out.
            if (Annotation::ExpandSwitch<SpecificVehicleCommand>(operationName, playerId, vehicleId, params[parameterOffset]) != -1)
                return 1;
        }

        // No (valid) operation was given by the player, show them the usage information.
        SendClientMessage(playerId, Color::Information, "Usage: /v [player]? {DC143C}[destroy/save]{FFFFFF} [access/color/health/nos/paintjob/respawn]");

        return 1;
    }

    /**
     * The /v create command allows administrators to create any vehicle at will. The vehicle will
     * be created in the player's current interior and virtual world. Vehicles created with this
     * command will *not* be persistent yet, the /vehicle save command must be executed. After a
     * vehicle created using this command respawns, it will be removed if it's not persistent.
     *
     * @param playerId Id of the player who wishes to create a vehicle.
     * @param params Parameters they passed to the command.
     * @command /v create [modelId/name]
     */
    @switch(GenericVehicleCommand, "create")
    public onVehicleCreateCommand(playerId, params[]) {
        if (Command->parameterCount(params) == 0) {
            SendClientMessage(playerId, Color::Information, "Usage: /v create [modelId | modelName]");
            return 1;
        }

        if (GetPlayerVirtualWorld(playerId) != 0 /* World::MainWorld */) {
            SendClientMessage(playerId, Color::Error, "Error: This command may be issued only in the main world.");
            return 1;
        }

        new modelId = VehicleModel->vehicleModelByString(params);
        if (modelId == VehicleModel::InvalidId) {
            SendClientMessage(playerId, Color::Error, "Error: Invalid vehicle model supplied.");
            return 1;
        }

        if (VehicleModel(modelId)->isStaticVehicle() == true) {
            SendClientMessage(playerId, Color::Error, "Error: Static vehicles not allowed mid-game.");
            return 1;
        }

        // Great, now we know which vehicle the player wants to spawn. Get all the required information
        // and then create the vehicle in the world itself. The vehicle will get a random color.
        new Float: position[3], Float: rotation;
        GetPlayerPos(playerId, position[0], position[1], position[2]);
        GetPlayerFacingAngle(playerId, rotation);

        new vehicleId = VehicleManager->createVehicle(modelId, position[0], position[1], position[2],
            rotation, -1, -1, GetPlayerInterior(playerId), 0 /* World::MainWorld */);

        if (vehicleId == Vehicle::InvalidId) {
            SendClientMessage(playerId, Color::Error, "Error: Unable to create the vehicle. Are we at our limit?");
            return 1;
        }

        PutPlayerInVehicle(playerId, vehicleId, DriverSeat);

        // Mark this vehicle as an open world vehicle, which means it may be removed using the
        // /v and /vehicle commands again as well.
        Vehicle(vehicleId)->markOpenWorldVehicle();

        // Record this vehicle creation as an activity so we can track it.
        Instrumentation->recordActivity(CreatedVehicleActivity);

        // Cool, we have a vehicle! Now we just have to tell the player and other administrators
        // about this vehicle being created, and we're done.
        new message[128];
        format(message, sizeof(message), "Your %s has been spawned, and you're now driving it! Please mind",
            VehicleModel(modelId)->nameString());
        SendClientMessage(playerId, Color::Success, message);
        SendClientMessage(playerId, Color::Success, "that you have to type \"/v save\" if you'd like this vehicle to be persistent.");

        format(message, sizeof(message), "%s (Id:%d) spawned a(n) %s at their location.",
            Player(playerId)->nicknameString(), playerId, VehicleModel(modelId)->nameString());
        Admin(playerId, message);

        return 1;
    }

    /**
     * Sometimes it's not natively possible to enter a vehicle in Grand Theft Auto, in which case we
     * need a command to force the user in. This command will find the vehicle closest to the user,
     * and then force-enter them into the vehicle as the driver.
     * 
     * @param playerId Id of the player who executed the /v enter command.
     * @param params Additional parameters they passed in. Ignored.
     * @command /v enter
     */
    @switch(GenericVehicleCommand, "enter")
    public onVehicleEnterCommand(playerId, params[]) {
        new Float: position[3], Float: distance;
        GetPlayerPos(playerId, position[0], position[1], position[2]);

        new Float: closestVehicleDistance = 9999.0,
            closestVehicleId = Vehicle::InvalidId;

        for (new vehicleId = 0; vehicleId < MAX_VEHICLES; ++vehicleId) {
            if (Vehicle(vehicleId)->isValid() == false || !IsVehicleStreamedIn(vehicleId, playerId))
                continue; // invalid vehicle, or not streamed in for the player.

            distance = GetVehicleDistanceFromPoint(vehicleId, position[0], position[1], position[2]);
            if (distance > closestVehicleDistance)
                continue; // another vehicle is closer to the player.

            closestVehicleDistance = distance;
            closestVehicleId = vehicleId;
        }

        if (Vehicle(closestVehicleId)->isValid() == false) {
            SendClientMessage(playerId, Color::Error, "Error: Unable to determine the vehicle closest to you.");
            return 1;
        }

        for (new otherPlayerId = 0; otherPlayerId <= PlayerManager->highestPlayerId(); ++otherPlayerId) {
            if (Player(otherPlayerId)->isConnected() == false)
                continue; // the player isn't connected to the server.

            if (GetPlayerVehicleID(otherPlayerId) != closestVehicleId || GetPlayerVehicleSeat(otherPlayerId) != DriverSeat)
                continue; // the player isn't driving the vehicle closest to us.

            SendClientMessage(otherPlayerId, Color::Error, "An administrator has forced you out of your vehicle.");
            RemovePlayerFromVehicle(otherPlayerId);
            break;
        }

        PutPlayerInVehicle(playerId, closestVehicleId, DriverSeat);

        new message[128];
        format(message, sizeof(message), "You have successfully entered the %s closest to you.",
            VehicleModel(GetVehicleModel(closestVehicleId))->nameString());
        SendClientMessage(playerId, Color::Success, message);

        return 1;
        #pragma unused params
    }

    /**
     * Vehicles are fancy, but if all vehicles need to be recreated every time Las Venturas Playground
     * launches the gamemode then it's not very maintainable. Executing the "save" command will either
     * create the vehicle in the database, or update the settings we have stored for it.
     *
     * @param playerId Id of the player who likes to save a vehicle.
     * @param vehicleId Id of the vehicle which should be stored in the database.
     * @param params Additional parameters passed on by the player. Ignored.
     * @command /v save
     */
    @switch(SpecificVehicleCommand, "save")
    public onVehicleSaveCommand(playerId, vehicleId, params[]) {
        if (Vehicle(vehicleId)->isOpenWorldVehicle() == false) {
            SendClientMessage(playerId, Color::Error, "Error: Only vehicles created with the /v command may be saved.");
            return 1;
        }

        new operation[8];

        // If the vehicle has previously been saved in the database already then we want to update
        // the stored information with whatever is current. Otherwise, create it as a new vehicle.
        if (Vehicle(vehicleId)->isPersistent() == true) {
            VehicleStorageManager->requestUpdateVehicle(vehicleId);
            operation = "updated";
        } else {
            VehicleStorageManager->requestStoreVehicle(vehicleId);
            operation = "stored";
        }

        // Now we need to do the lovely announce-this-action-to-the-world dance again.
        new message[128],
            modelId = Vehicle(vehicleId)->modelId();

        format(message, sizeof(message), "%s (Id:%d) has %s a(n) %s in the database.",
            Player(playerId)->nicknameString(), playerId, operation, VehicleModel(modelId)->nameString());
        Admin(playerId, message);

        format(message, sizeof(message), "The %s has been %s in the database.",
            VehicleModel(modelId)->nameString(), operation);
        SendClientMessage(playerId, Color::Success, message);

        return 1;
        #pragma unused params
    }

    /**
     * While most vehicles will be available for all players on the server, it is possible that there
     * will be vehicles restricted to VIP users or administrators.
     *
     * @param playerId Id of the player who likes to change permissions for a vehicle.
     * @param vehicleId Id of the vehicle which' permissions should be updated.
     * @param params Additional parameters passed on by the player.
     * @command /v access [admin/player/vip]
     */
    @switch(SpecificVehicleCommand, "access")
    public onVehicleAccessCommand(playerId, vehicleId, params[]) {
        if (Vehicle(vehicleId)->isOpenWorldVehicle() == false) {
            SendClientMessage(playerId, Color::Error, "Error: Only vehicles created with the /v command may be made restricted.");
            return 1;
        }

        new message[128], accessLevel[16];
        if (Command->parameterCount(params) == 1) {
            Command->stringParameter(params, 0, accessLevel, sizeof(accessLevel));
            if (!strcmp(accessLevel, "player")) {
                Vehicle(vehicleId)->setAdministratorVehicle(false);
                Vehicle(vehicleId)->setVeryImportantPlayerVehicle(false);
            } else if (!strcmp(accessLevel, "vip")) {
                Vehicle(vehicleId)->setAdministratorVehicle(false);
                Vehicle(vehicleId)->setVeryImportantPlayerVehicle(true);
            } else if (!strcmp(accessLevel, "admin")) {
                Vehicle(vehicleId)->setAdministratorVehicle(true);
                Vehicle(vehicleId)->setVeryImportantPlayerVehicle(false);
            } else {
                SendClientMessage(playerId, Color::Error, "Invalid access level supplied, we cannot change the vehicle's permissions!");
                SendClientMessage(playerId, Color::Information, "  Usage: /v access [admin/player/vip]");
                return 1;
            }

            format(message, sizeof(message), "%s (Id:%d) has changed the access level of a(n) %s.",
                Player(playerId)->nicknameString(), playerId, VehicleModel(GetVehicleModel(vehicleId))->nameString());
            Admin(playerId, message);

            SendClientMessage(playerId, Color::Success, "The vehicle's access level has been changed!");
            VehicleAccessManager->synchronizeAccessForVehicle(vehicleId);
        }

        if (Vehicle(vehicleId)->isAdministratorVehicle() == true)
            strncpy(accessLevel, "administrators", sizeof(accessLevel));
        else if (Vehicle(vehicleId)->isVeryImportantPlayerVehicle() == true)
            strncpy(accessLevel, "VIPs", sizeof(accessLevel));
        else
            strncpy(accessLevel, "players", sizeof(accessLevel));

        format(message, sizeof(message), "This %s can currently be accessed by all {33AA33}%s{FFFFFF}.",
            VehicleModel(GetVehicleModel(vehicleId))->nameString(), accessLevel);
        SendClientMessage(playerId, Color::Information, message);

        if (Command->parameterCount(params) == 0)
            SendClientMessage(playerId, Color::Information, "Change the access level by using \"/v access [admin/player/vip]\".");

        return 1;
    }

    /**
     * It's rather common for vehicles in Grand Theft Auto: San Andreas to be equipped with a Nitrous
     * Oxide Engine, also known as NOS. This flag can be enabled for every Open World vehicle, and,
     * if the vehicle is a persistent vehicle, will be stored with it.
     * 
     * @param playerId Id of the player who wants to modify the vehicle.
     * @param vehicleId Id of the vehicle that is about to be modified.
     * @param params Additional parameters passed on to this method.
     * @command /v dinitrogenmonoxideengine [on/off]
     */
    @switch(SpecificVehicleCommand, "nos")
    public onVehicleDinitrogenMonoxideEngineCommand(playerId, vehicleId, params[]) {
        if (Vehicle(vehicleId)->isOpenWorldVehicle() == false) {
            SendClientMessage(playerId, Color::Error, "Error: Only vehicles created with the /v command may be modified.");
            return 1;
        }

        new modelId = Vehicle(vehicleId)->modelId();
        if (VehicleModel(modelId)->isNitroInjectionAvailable() == false) {
            SendClientMessage(playerId, Color::Error, "Error: Nitrous Oxide Injection is not available for this vehicle model.");
            return 1;
        }

        new message[128];
        if (Command->parameterCount(params) == 0) {
            format(message, sizeof(message), "Nitrous Oxide Injection is currently %s{FFFFFF} for this vehicle.",
                Vehicle(vehicleId)->hasNitrousOxideEngine() ? "{33AA33}enabled" : "{DC143C}disabled");

            SendClientMessage(playerId, Color::Information, message);
            SendClientMessage(playerId, Color::Information, "  Use \"/v nos [on/off]\" to change this setting.");
            return 1;
        }

        new bool: enableNitrousOxideEngine = Command->booleanParameter(params, 0);
        Vehicle(vehicleId)->setHasNitrousOxideEngine(enableNitrousOxideEngine);

        format(message, sizeof(message), "Nitrous Oxide Injection has been made %s{33AA33} for this vehicle.",
                Vehicle(vehicleId)->hasNitrousOxideEngine() ? "{33AA33}available" : "{DC143C}unavailable");
        SendClientMessage(playerId, Color::Success, message);

        return 1;
    }

    /**
     * Allows moderators to change the colors of a vehicle. Valid colors are in the range of 0 - 255.
     *
     * @param playerId Id of the player who wants to manage the vehicle's colors.
     * @param vehicleId Id of the vehicle they'd like to manage the colors about.
     * @param params Additional parameters passed on to the command, optional.
     * @command /v color [0-255]? [0-22]?
     */
    @switch(SpecificVehicleCommand, "color")
    public onVehicleColorCommand(playerId, vehicleId, params[]) {
        new message[128];
        if (Command->parameterCount(params) == 0) {
            format(message, sizeof(message), "The colors currently applied to this %s are: %d and %d.",
                VehicleModel(GetVehicleModel(vehicleId))->nameString(), Vehicle(vehicleId)->primaryColor(),
                Vehicle(vehicleId)->secondaryColor());

            SendClientMessage(playerId, Color::Information, message);
            SendClientMessage(playerId, Color::Information, "  Use \"/v color [0-255] [0-255]\" to change this setting.");
            return 1;
        }

        // With one or more parameters, we're going to assume that the player wants to change the
        // colors of this vehicle.
        new primaryColor = Command->integerParameter(params, 0),
            secondaryColor = Command->integerParameter(params, 1);
        if (secondaryColor == -1 && primaryColor >= 0 && primaryColor <= 255) {
            Vehicle(vehicleId)->setPrimaryColor(primaryColor);

            format(message, sizeof(message), "The %s's primary color has been changed to %d.",
                VehicleModel(GetVehicleModel(vehicleId))->nameString(), primaryColor);
            SendClientMessage(playerId, Color::Success, message);
        }

        else if (primaryColor == -1 && secondaryColor >= 0 && secondaryColor <= 255) {
            Vehicle(vehicleId)->setSecondaryColor(secondaryColor);

            format(message, sizeof(message), "The %s's secondary color has been changed to %d.",
                VehicleModel(GetVehicleModel(vehicleId))->nameString(), secondaryColor);
            SendClientMessage(playerId, Color::Success, message);
        }

        else if (primaryColor >= 0 && primaryColor <= 255 && secondaryColor >= 0 && secondaryColor <= 255) {
            Vehicle(vehicleId)->setColors(primaryColor, secondaryColor);

            format(message, sizeof(message), "The %s's colors have been changed to %d and %d.",
                VehicleModel(GetVehicleModel(vehicleId))->nameString(), primaryColor, secondaryColor);
            SendClientMessage(playerId, Color::Success, message);
        }

        else
            SendClientMessage(playerId, Color::Error, "The new colors need to be between 0 and 255, inclusive.");

        return 1;
    }

    /**
     * Allows moderators to change the paintjob of a vehicle. Valid paintjobs are in the range of
     * 0-2, whereas the number "3" can be used to remove a previously set paintjob.
     *
     * @param playerId Id of the player who wants to manage a vehicle's paintjob.
     * @param vehicleId Id of the vehicle they'd like to manage the paintjob about.
     * @param params Additional parameters passed on to the command, optional.
     * @command /v paintjob [0-3]?
     */
    @switch(SpecificVehicleCommand, "paintjob")
    public onVehiclePaintjobCommand(playerId, vehicleId, params[]) {
        new message[128];
        if (Command->parameterCount(params) == 0) {
            format(message, sizeof(message), "The paintjob currently applied to this %s is: %d.",
                VehicleModel(GetVehicleModel(vehicleId))->nameString(), Vehicle(vehicleId)->paintJob());

            SendClientMessage(playerId, Color::Information, message);
            SendClientMessage(playerId, Color::Information, "  Use \"/v paintjob [0-3]\" to change this setting.");
            return 1;
        }

        // With one or more parameters, we're going to assume that the player wants to change the
        // paintjob Id of this vehicle. Let's interpret and validate the new Id they gave.
        new paintjobId = Command->integerParameter(params, 0);
        if (paintjobId < 0 || paintjobId > 3) {
            SendClientMessage(playerId, Color::Error, "The new paintjob needs to be between 0 and 2, inclusive.");
            SendClientMessage(playerId, Color::Information, "  Use \"/v paintjob 3\" to remove a paintjob.");
            return 1;
        }

        Vehicle(vehicleId)->setPaintJob(paintjobId);

        if (paintjobId == 3)
            format(message, sizeof(message), "The paintjob has been removed from your %s.",
                VehicleModel(GetVehicleModel(vehicleId))->nameString());
        else
            format(message, sizeof(message), "The %s's paintjob has been changed to %d.",
                VehicleModel(GetVehicleModel(vehicleId))->nameString(), paintjobId);
        SendClientMessage(playerId, Color::Success, message);

        return 1;
    }

    /**
     * Allows moderators to retrieve or change the health applying to a vehicle. The valid range for
     * the health is [0, 1000], in which 0 will make the vehicle explode immediately. The vehicle's
     * visible status will not be restored as part of this command.
     *
     * @param playerId Id of the player who wants to manage a vehicle's health.
     * @param vehicleId Id of the vehicle they'd like to manage the health about.
     * @param params Additional parameters passed on to the command, optional.
     * @command /v health [0-1000]?
     */
    @switch(SpecificVehicleCommand, "health")
    public onVehicleHealthCommand(playerId, vehicleId, params[]) {
        new message[128], Float: currentHealth;
        if (Command->parameterCount(params) == 0) {
            GetVehicleHealth(vehicleId, currentHealth);

            format(message, sizeof(message), "The %s's current health is: %.0f.",
                VehicleModel(GetVehicleModel(vehicleId))->nameString(), currentHealth);
            SendClientMessage(playerId, Color::Information, message);
            SendClientMessage(playerId, Color::Information, "  Use \"/v health [0-1000]\" to change this setting.");

            return 1;
        }

        // With one or more parameters, we're going to assume that the player wants to change the
        // health of this vehicle. Let's interpret, validate and then set the new health they want.
        new Float: health = Command->floatParameter(params, 0);
        if (health < 0.0 || health > 1000.0) {
            SendClientMessage(playerId, Color::Red, "The new health needs to be between 0 and 1000, inclusive.");
            return 1;
        }

        SetVehicleHealth(vehicleId, health);

        format(message, sizeof(message), "The health of the %s has been changed to %.0f.",
            VehicleModel(GetVehicleModel(vehicleId))->nameString(), health);
        SendClientMessage(playerId, Color::Success, message);

        return 1;
    }

    /**
     * Vehicles can get stuck, of players may be abusing a vehicle to the point where it's just no
     * fun anymore. In these cases, respawning a vehicle may proof to be a solution.
     *
     * @param playerId Id of the player who wants to respawn a vehicle.
     * @param vehicleId Id of the vehicle which they want to respawn.
     * @param params Additional parameters passed on to the command. Ignored.
     * @command /v respawn
     */
    @switch(SpecificVehicleCommand, "respawn")
    public onVehicleRespawnCommand(playerId, vehicleId, params[]) {
        new vehicleName[18];
        format(vehicleName, sizeof(vehicleName), "%s", VehicleModel(GetVehicleModel(vehicleId))->nameString());

        SetVehicleToRespawn(vehicleId);

        new message[128];
        format(message, sizeof(message), "The %s has successfully been respawned in San Andreas.", vehicleName);
        SendClientMessage(playerId, Color::Success, message);

        format(message, sizeof(message), "%s (Id:%d) has respawned a(n) %s.",
            Player(playerId)->nicknameString(), playerId, vehicleName);
        Admin(playerId, message);

        return 1;
        #pragma unused params
    }

    /**
     * The /vehicle destroy command allows administrators to once again remove vehicles which were
     * previously created in Las Venturas Playground. We know that the player is in a vehicle, so
     * this operation should be relatively simple to complete.
     *
     * @param playerId Id of the player who is trying to remove a vehicle.
     * @param vehicleId Id of the vehicle which the player currently is in.
     * @param params Additional parameters passed on by the player. Ignored.
     * @command /v destroy
     */
    @switch(SpecificVehicleCommand, "destroy")
    public onVehicleDestroyCommand(playerId, vehicleId, params[]) {
        if (Vehicle(vehicleId)->isOpenWorldVehicle() == false) {
            SendClientMessage(playerId, Color::Error, "Error: Only vehicles created with the /v command may be destroyed.");
            return 1;
        }

        ShowPlayerDialog(playerId, VehicleCommands::WarningDialogId, DIALOG_STYLE_MSGBOX, "Las Venturas Playground",
            "Warning: Issueing this command will NOT respawn the vehicle. Instead, it\n" ...
            "will permanently remove the vehicle from the gamemode and the database.\n" ...
            "To respawn a vehicle, use /v respawn.\n\n" ...
            "Are you sure you wish to destroy this vehicle?",
            "Yes", "Cancel");

        return 1;
        #pragma unused params
    }

    /**
     * After the administrator chose an option in the dialog -- either Yes or Cancel, we may have to
     * remove the actual vehicle from the gamemode.
     *
     * @param playerId Id of the player who we received a reply from.
     * @param button The button on the dialog which was clicked by the administrator.
     * @param listItem Index of the item in the list, if applicable.
     * @param inputText Text which has been entered in the dialog, if applicable.
     */
    @switch(OnDialogResponse, VehicleCommands::WarningDialogId)
    public onWarningDialogResponse(playerId, DialogButton: button, listItem, inputText[]) {
        if (button != LeftButton)
            return; // we only reset in case the admin clicked on "Yes".

        new Float: position[3], vehicleName[18], vehicleId = GetPlayerVehicleID(playerId);
        GetVehiclePos(vehicleId, position[0], position[1], position[2]);
        SetPlayerPos(playerId, position[0], position[1], position[2]);

        format(vehicleName, sizeof(vehicleName), "%s", VehicleModel(GetVehicleModel(vehicleId))->nameString());

        // Now actually remove the vehicle itself.
        VehicleManager->destroyVehicle(vehicleId);

        // Record this action as an instrumentation so we can track it.
        Instrumentation->recordActivity(DestroyedVehicleActivity);

        // Now we just have to compile some messages to inform everyone of this change.
        new message[128];
        format(message, sizeof(message), "Your %s has been removed, and you're back on your feet.", vehicleName);
        SendClientMessage(playerId, Color::Success, message);

        format(message, sizeof(message), "%s (Id:%d) removed a(n) %s at their location.",
            Player(playerId)->nicknameString(), playerId, vehicleName);
        Admin(playerId, message);

        #pragma unused listItem, inputText
    }

    /**
     * Administrators have the ability to respawn all vehicles by typing the /fixvehicles command.
     * This will respawn all vehicles being unused at the moment.
     *
     * @param playerId Id of the player who executed this command.
     * @param params Additional parameters passed on to this command. Unused.
     * @command /fixvehicles
     */
    @command("fixvehicles")
    public onFixVehiclesCommand(playerId, params[]) {
        if (Player(playerId)->isModerator() == false)
            return 0;

        for (new vehicleId = 1; vehicleId <= MAX_VEHICLES; vehicleId++) {
            if (LegacyGetGtaVehicleId() == vehicleId)
                continue;

            new bool: vehicleOccupied = false;
            for (new subjectId = 0; subjectId <= PlayerManager->highestPlayerId(); subjectId++) {
                if (IsPlayerInVehicle(subjectId, vehicleId)) {
                    vehicleOccupied = true;
                    break;
                }
            }

            if (vehicleOccupied == false)
                SetVehicleToRespawn(vehicleId);
        }

        new message[128];
        format(message, sizeof(message), "%s (Id:%d) has respawned all unoccupied vehicles.",
            Player(playerId)->nicknameString(), playerId);
        Admin(playerId, message);

        return 1;
        #pragma unused params
    }
};
