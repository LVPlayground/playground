// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const CommandBuilder = require('components/command_manager/command_builder.js');
const DatabaseVehicle = require('features/vehicles/database_vehicle.js');
const Menu = require('components/menu/menu.js');
const VehicleAccessManager = require('features/vehicles/vehicle_access_manager.js');

// The maximum distance from the player to the vehicle closest to them, in units.
const MaximumVehicleDistance = 10;

// The maximum number of unique models and vehicles in the area local to the player. Used for
// deciding whether it's save to store a vehicle at the given position.
const MaximumModelsInArea = 50;
const MaximumVehiclesInArea = 90;

// Mapping of vehicle commands to model Ids that should be created for quick access.
const QuickVehicleCommands = {
    ele: 562,
    inf: 411,
    nrg: 522,
    sul: 560,
    tur: 451,
    vor: 539
};

// Responsible for providing the commands associated with vehicles. Both players and administrators
// can create vehicles. Administrators can save, modify and delete vehicles as well.
class VehicleCommands {
    constructor(manager, abuse, announce, playground) {
        this.manager_ = manager;

        this.abuse_ = abuse;
        this.announce_ = announce;

        this.playground_ = playground;
        this.playground_.addReloadObserver(
            this, VehicleCommands.prototype.registerTrackedCommands);

        this.registerTrackedCommands(playground());

        // Function that checks whether the |player| has sprayed all tags. Will be overridden by
        // tests to prevent accidentially hitting the Pawn code.
        this.hasFinishedSprayTagCollection_ = player =>
            !!pawnInvoke('OnHasFinishedSprayTagCollection', 'i', player.id);

        // Command: /lock
        server.commandManager.buildCommand('lock')
            .build(VehicleCommands.prototype.onLockCommand.bind(this));

        // Command: /unlock
        server.commandManager.buildCommand('unlock')
            .build(VehicleCommands.prototype.onUnlockCommand.bind(this));

        // Quick vehicle commands.
        for (const [command, modelId] of Object.entries(QuickVehicleCommands)) {
            server.commandManager.buildCommand(command)
                .build(VehicleCommands.prototype.onQuickVehicleCommand.bind(this, modelId));
        }

        // Command: /v [vehicle]?
        //          /v [density/enter/help/optimise/reset]
        //          /v [player]? [access/delete/health/pin/respawn/save/unpin]
        server.commandManager.buildCommand('v')
            .restrict(player => this.playground_().canAccessCommand(player, 'v'))
            .sub('density')
                .restrict(Player.LEVEL_ADMINISTRATOR)
                .build(VehicleCommands.prototype.onVehicleDensityCommand.bind(this))
            .sub('enter')
                .restrict(Player.LEVEL_ADMINISTRATOR)
                .parameters([ { name: 'seat', type: CommandBuilder.NUMBER_PARAMETER,
                                optional: true } ])
                .build(VehicleCommands.prototype.onVehicleEnterCommand.bind(this))
            .sub('help')
                .build(VehicleCommands.prototype.onVehicleHelpCommand.bind(this))
            .sub('optimise')
                .restrict(Player.LEVEL_MANAGEMENT)
                .build(VehicleCommands.prototype.onVehicleOptimiseCommand.bind(this))
            .sub('reset')
                .restrict(Player.LEVEL_ADMINISTRATOR)
                .build(VehicleCommands.prototype.onVehicleResetCommand.bind(this))
            .sub(CommandBuilder.PLAYER_PARAMETER, player => player)
                .sub('access')
                    .restrict(Player.LEVEL_ADMINISTRATOR)
                    .parameters([ { name: 'level', type: CommandBuilder.WORD_PARAMETER,
                                    optional: true } ])
                    .build(VehicleCommands.prototype.onVehicleAccessCommand.bind(this))
                .sub('delete')
                    .restrict(Player.LEVEL_ADMINISTRATOR)
                    .build(VehicleCommands.prototype.onVehicleDeleteCommand.bind(this))
                .sub('health')
                    .restrict(Player.LEVEL_ADMINISTRATOR)
                    .parameters([ { name: 'health', type: CommandBuilder.NUMBER_PARAMETER,
                                    optional: true } ])
                    .build(VehicleCommands.prototype.onVehicleHealthCommand.bind(this))
                .sub('pin')
                    .restrict(Player.LEVEL_MANAGEMENT)
                    .build(VehicleCommands.prototype.onVehiclePinCommand.bind(this))
                .sub('respawn')
                    .restrict(Player.LEVEL_ADMINISTRATOR)
                    .build(VehicleCommands.prototype.onVehicleRespawnCommand.bind(this))
                .sub('save')
                    .restrict(Player.LEVEL_ADMINISTRATOR)
                    .build(VehicleCommands.prototype.onVehicleSaveCommand.bind(this))
                .sub('unpin')
                    .restrict(Player.LEVEL_MANAGEMENT)
                    .build(VehicleCommands.prototype.onVehicleUnpinCommand.bind(this))
                .build(/* deliberate fall-through */)
            .sub(CommandBuilder.WORD_PARAMETER)
                .build(VehicleCommands.prototype.onVehicleCommand.bind(this))
            .build(VehicleCommands.prototype.onVehicleCommand.bind(this));
    }

    // ---------------------------------------------------------------------------------------------

    // Called when a player executes `/lock`. This enables them to lock the vehicle they're
    // currently driving in. Any other vehicles they've locked will be gracefully unlocked.
    onLockCommand(player) {
        const databaseVehicle = this.manager_.getManagedDatabaseVehicle(player.vehicle);

        // TODO: Support /lock for vehicles associated with houses.
        // https://github.com/LVPlayground/playground/issues/343

        // Bail out if the |player| is not registered, which we require for vehicle locks.
        if (!player.isRegistered()) {
            player.sendMessage(Message.VEHICLE_LOCK_UNREGISTERED);
            return;
        }

        // Bail out if the |player| is not driving a vehicle, or it's not managed by this system.
        if (!databaseVehicle) {
            player.sendMessage(Message.VEHICLE_NOT_DRIVING_SELF);
            return;
        }

        // Bail out if the |player| is a passenger of the vehicle they're in.
        if (player.vehicle.driver !== player) {
            player.sendMessage(Message.VEHICLE_LOCK_PASSENGER);
            return;
        }

        // Bail out if the vehicle is already locked for the player.
        if (this.manager_.access.isLocked(databaseVehicle, VehicleAccessManager.LOCK_PLAYER)) {
            player.sendMessage(Message.VEHICLE_LOCK_REDUNDANT, player.vehicle.model.name);
            return;
        }

        // Restrict access to the |databaseVehicle| to |player|.
        this.manager_.access.restrictToPlayer(databaseVehicle, player.userId);

        player.sendMessage(Message.VEHICLE_LOCKED, player.vehicle.model.name);
    }

    // Called when a player executes `/unlock`. This enables them to free up a vehicle again if they
    // decide others can access it after all.
    onUnlockCommand(player) {
        const databaseVehicle = this.manager_.getManagedDatabaseVehicle(player.vehicle);

        // TODO: Support /unlock for vehicles associated with houses.
        // https://github.com/LVPlayground/playground/issues/343

        // Bail out if the |player| is not registered, which we require for vehicle locks.
        if (!player.isRegistered()) {
            player.sendMessage(Message.VEHICLE_UNLOCK_UNREGISTERED);
            return;
        }

        // Bail out if the |player| is not driving a vehicle, or it's not managed by this system.
        if (!databaseVehicle) {
            player.sendMessage(Message.VEHICLE_NOT_DRIVING_SELF);
            return;
        }

        // Bail out if the |player| is a passenger of the vehicle they're in, unless they're an
        // administrator in which case we allow them to override it.
        if (player.vehicle.driver !== player && !player.isAdministrator()) {
            player.sendMessage(Message.VEHICLE_UNLOCK_PASSENGER);
            return;
        }

        // Bail out if the |databaseVehicle| is not actually locked right now.
        if (!this.manager_.access.isLocked(databaseVehicle)) {
            player.sendMessage(Message.VEHICLE_UNLOCK_REDUNDANT);
            return;
        }

        // Unlocks the |databaseVehicle| so that it can be used by anyone.
        this.manager_.access.unlock(databaseVehicle);

        player.sendMessage(Message.VEHICLE_UNLOCKED, player.vehicle.model.name);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the player executes one of the quick vehicle commands, for example `/inf` and
    // `/ele`. This will create a personal vehicle for them.
    async onQuickVehicleCommand(modelId, player) {
        // TODO: This should just be an alias for `/v [modelId]` when the spray tag requirement
        // has been dropped, or at least changed into a progressive model.

        const allowed = this.playground_().canAccessCommand(player, 'v') ||
                        await Promise.resolve().then(() =>
                            this.hasFinishedSprayTagCollection_(player));

        if (!allowed) {
            player.sendMessage(Message.VEHICLE_QUICK_SPRAY_TAGS);
            return;
        }

        await this.onVehicleCommand(player, String(modelId));
    }

    // ---------------------------------------------------------------------------------------------

    // Called when a player executes `/v` or `/v [vehicle]`, which can be either a vehicle Id or
    // part of a vehicle's name. The vehicle will be created for them.
    async onVehicleCommand(player, modelIdentifier) {
        if (!modelIdentifier) {
            // TODO: Implement a fancy vehicle selection dialog.
            //     https://github.com/LVPlayground/playground/issues/330
            //     https://github.com/LVPlayground/playground/issues/273
            return this.onVehicleHelpCommand(player);
        }

        if (player.vehicle) {
            player.sendMessage(Message.VEHICLE_QUICK_ALREADY_DRIVING);
            return;
        }

        if (player.interiorId != 0 /* outside */ || player.virtualWorld != 0 /* main world */) {
            player.sendMessage(Message.VEHICLE_QUICK_MAIN_WORLD);
            return;
        }

        const spawnStatus = this.abuse_().canSpawnVehicle(player);
        if (!spawnStatus.allowed) {
            player.sendMessage(Message.VEHICLE_SPAWN_REJECTED, spawnStatus.reason);
            return false;
        }

        let vehicleModel = null;

        const potentialModelId = modelIdentifier.toSafeInteger();
        if (potentialModelId && potentialModelId >= 400 && potentialModelId <= 611) {
            vehicleModel = VehicleModel.getById(potentialModelId);
        } else {
            const vehicleModels = VehicleModel.getByName(
                modelIdentifier, true /* fuzzy */, true /* all */);

            if (vehicleModels.length == 1) {
                vehicleModel = vehicleModels[0];
            } else if (vehicleModels.length > 1) {
                const disambiguationDialog =
                    new Menu('Please disambiguate the vehicle!', ['Name', 'Model ID']);

                // Sort the vehicles it found by name, alphabetically.
                vehicleModels.sort((lhs, rhs) => lhs.name.localeCompare(rhs));

                for (const model of vehicleModels)
                    disambiguationDialog.addItem(model.name, model.id);
                
                const decision = await disambiguationDialog.displayForPlayer(player);
                if (!decision || !decision.item[1])
                    return;  // the player closed or mocked with the disambiguation dialog

                vehicleModel = VehicleModel.getById(decision.item[1]);
            }
        }
        
        if (!vehicleModel) {
            player.sendMessage(Message.VEHICLE_SPAWN_NOT_FOUND, modelIdentifier);
            return;
        }

        const vehicle = this.manager_.createVehicle({
            player: player,  // associates the vehicle with the |player|

            modelId: vehicleModel.id,
            position: player.position,
            rotation: player.rotation,
            interiorId: player.interiorId,
            virtualWorld: player.virtualWorld
        });

        // Inform the player of their new vehicle having been created.
        player.sendMessage(Message.VEHICLE_SPAWN_CREATED, vehicleModel.name);

        // Report that the |player| has spawned a vehicle. This rate-limits their usage too.
        this.abuse_().reportSpawnedVehicle(player);

        // If the |vehicle| is live, teleport the |player| to the driver seat after a minor delay.
        if (vehicle && vehicle.isConnected())
            player.enterVehicle(vehicle, Vehicle.SEAT_DRIVER);
    }

    // Called when the |player| executes `/v access` or `/v [player] access`, which means they wish
    // to view or change the required access level of the vehicle.
    async onVehicleAccessCommand(player, subject, level) {
        if (level) level = level.toLowerCase();

        const vehicle = subject.vehicle;
        const databaseVehicle = this.manager_.getManagedDatabaseVehicle(vehicle);

        // Bail out if the |subject| is not driving a vehicle, or it's not managed by this system.
        if (!databaseVehicle) {
            player.sendMessage(Message.VEHICLE_NOT_DRIVING, subject.name);
            return;
        }

        const availableOptions = ['players', 'vips', 'administrators'];
        if (player.isManagement())
            availableOptions.push('management');

        // Bail out if the |level| is empty, or not included in the |availableOptions|.
        if (!availableOptions.includes(level)) {
            let restriction = null;

            switch (databaseVehicle.accessType) {
                case DatabaseVehicle.ACCESS_TYPE_EVERYONE:
                    break;
                case DatabaseVehicle.ACCESS_TYPE_PLAYER:
                    restriction = 'a particular player';
                    break;
                case DatabaseVehicle.ACCESS_TYPE_PLAYER_LEVEL:
                    switch (databaseVehicle.accessValue) {
                        case Player.LEVEL_PLAYER:
                            restriction = 'players';
                            break;
                        case Player.LEVEL_ADMINISTRATOR:
                            restriction = 'administrators';
                            break;
                        case Player.LEVEL_MANAGEMENT:
                            restriction = 'Management members';
                            break;
                    }
                    break;
                case DatabaseVehicle.ACCESS_TYPE_PLAYER_VIP:
                    restriction = 'VIP members';
                    break;
            }

            player.sendMessage(restriction ? Message.VEHICLE_ACCESS_RESTRICTED
                                           : Message.VEHICLE_ACCESS_UNRESTRICTED,
                               vehicle.model.name, restriction);
            player.sendMessage(Message.VEHICLE_ACCESS_USAGE, availableOptions.join('/'));
            return;
        }

        let accessType = DatabaseVehicle.ACCESS_TYPE_EVERYONE;
        let accessValue = 0;

        let restriction = null;

        switch (level) {
            // Allows everybody to access the |vehicle|.
            case 'players':
                break;

            // Allows VIP members to access the |vehicle|.
            case 'vips':
                accessType = DatabaseVehicle.ACCESS_TYPE_PLAYER_VIP;
                restriction = 'VIP members';
                break;

            // Allows all administrators and Management members to access the |vehicle|.
            case 'administrators':
                accessType = DatabaseVehicle.ACCESS_TYPE_PLAYER_LEVEL;
                accessValue = Player.LEVEL_ADMINISTRATOR;
                restriction = 'administrators';
                break;

            // Allows all Management members to access the |vehicle|.
            case 'management':
                accessType = DatabaseVehicle.ACCESS_TYPE_PLAYER_LEVEL;
                accessValue = Player.LEVEL_MANAGEMENT;
                restriction = 'Management members';
                break;
        }

        // Update the access value with the manager. This will update the database if necessary.
        await this.manager_.updateVehicleAccess(vehicle, accessType, accessValue);

        const announcement =
            Message.format(restriction ? Message.VEHICLE_ANNOUNCE_ACCESS
                                       : Message.VEHICLE_ANNOUNCE_ACCESS_LIFTED,
                           player.name, player.id, vehicle.model.name, restriction);

        this.announce_().announceToAdministrators(announcement);

        player.sendMessage(Message.VEHICLE_ACCESS_CHANGED, vehicle.model.name);
    }

    // Called when the |player| executes `/v delete` or `/v [player] delete`, which means they wish
    // to delete the vehicle the target is currently driving.
    async onVehicleDeleteCommand(player, subject) {
        const vehicle = subject.vehicle;

        // Bail out if the |subject| is not driving a vehicle, or it's not managed by this system.
        if (!this.manager_.isManagedVehicle(vehicle)) {
            player.sendMessage(Message.VEHICLE_NOT_DRIVING, subject.name);
            return;
        }

        const wasPersistent = this.manager_.isPersistentVehicle(vehicle);

        await this.manager_.deleteVehicle(vehicle);

        if (wasPersistent) {
            this.announce_().announceToAdministrators(Message.VEHICLE_ANNOUNCE_DELETED, player.name,
                                                      player.id, vehicle.model.name);
        }

        player.sendMessage(Message.VEHICLE_DELETED, vehicle.model.name);
    }

    // Called when the |player| executes `/v density`, which will show them the density of vehicles
    // and models within streaming radius around their current position.
    async onVehicleDensityCommand(player) {
        const areaInfo = await this.manager_.streamer.query(player.position);

        player.sendMessage(Message.VEHICLE_DENSITY, areaInfo.vehicles, areaInfo.models,
                           this.manager_.streamer.streamingDistance);
        player.sendMessage(Message.VEHICLE_DENSITY_TOTAL, this.manager_.streamer.size,
                           this.manager_.streamer.streamedSize)
    }

    // Called when the |player| executes `/v enter [seat]?`, which means they'd like to enter the
    // vehicle closest to them in the given seat. Only available to administrators.
    async onVehicleEnterCommand(player, seat) {
        // Bail out if |player| is already driving a vehicle.
        if (player.vehicle) {
            player.sendMessage(Message.VEHICLE_ENTER_ALREADY_DRIVING, player.vehicle.model.name);
            return;
        }

        seat = seat || 0;

        // Bail out if the given |seat| is not valid for this vehicle.
        // TODO: This should pull the number of seats from the model information instead.
        if (seat < 0 || seat >= 8) {
            player.sendMessage(Message.VEHICLE_ENTER_SEAT_INVALID);
            return;
        }

        const position = player.position;
        const areaInfo = await this.manager_.streamer.query(position);

        // Make sure that there is a vehicle close enough to the |player|.
        if (!areaInfo.closestVehicle ||
                areaInfo.closestVehicle.position.distanceTo(position) > MaximumVehicleDistance) {
            player.sendMessage(Message.VEHICLE_ENTER_NONE_NEAR);
            return;
        }

        // Make sure that the closest vehicle is not restricted to a particular player.
        const databaseVehicle = this.manager_.getManagedDatabaseVehicle(areaInfo.closestVehicle);
        if (databaseVehicle && databaseVehicle.accessType == DatabaseVehicle.ACCESS_TYPE_PLAYER &&
            databaseVehicle.accessValue != player.userId /* it may be the |player|'s vehicle */) {
            player.sendMessage(Message.VEHICLE_ENTER_RESTRICTED);
            return;
        }

        // Make sure that the |seat| the |player| wants to sit in is available.
        for (const occupant of areaInfo.closestVehicle.getOccupants()) {
            if (occupant.vehicleSeat !== seat)
                continue;

            player.sendMessage(
                Message.VEHICLE_ENTER_SEAT_OCCUPIED, areaInfo.closestVehicle.model.name);
            return;
        }

        // Make the |player| enter the closest vehicle in their area.
        player.enterVehicle(areaInfo.closestVehicle, seat);

        player.sendMessage(Message.VEHICLE_ENTERED, areaInfo.closestVehicle.model.name);
    }

    // Called when the |player| executes `/v health` or `/v [player] health`, which means they wish
    // to either see or change the health of the vehicle.
    onVehicleHealthCommand(player, subject, health) {
        const vehicle = subject.vehicle;

        // Bail out if the |subject| is not driving a vehicle, or it's not managed by this system.
        if (!this.manager_.isManagedVehicle(vehicle)) {
            player.sendMessage(Message.VEHICLE_NOT_DRIVING, subject.name);
            return;
        }

        if (health === undefined || health < 0 || health > 1000) {
            player.sendMessage(Message.VEHICLE_HEALTH_CURRENT, vehicle.health);
            player.sendMessage(Message.VEHICLE_HEALTH_USAGE);
            return;
        }

        player.sendMessage(Message.VEHICLE_HEALTH_UPDATED, vehicle.health, health);

        vehicle.health = health;
    }

    // Called when the |player| executes `/v help`. Displays more information about the command, as
    // well as the available sub-commands to the |player|.
    onVehicleHelpCommand(player) {
        player.sendMessage(Message.VEHICLE_HELP_SPAWN);

        if (!player.isAdministrator())
            return;

        const globalOptions = ['density', 'enter', 'help', 'reset'];
        const vehicleOptions = ['access', 'delete', 'health', 'respawn', 'save'];

        if (player.isManagement()) {
            globalOptions.push('optimise');
            vehicleOptions.push('pin', 'unpin');
        }

        player.sendMessage(Message.VEHICLE_HELP_GLOBAL, globalOptions.sort().join('/'));
        player.sendMessage(Message.VEHICLE_HELP_VEHICLE, vehicleOptions.sort().join('/'));
    }

    // Called when a Management member executes the `/v optimise` command in an effort to optimise
    // the vehicle streamer. It will make an announcement to administrators about the game.
    async onVehicleOptimiseCommand(player) {
        let streamBeforeOptimiseTime = null;
        let streamAfterOptimiseTime = null;
        let optimiseTime = null;

        const streamer = this.manager_.streamer;

        // (1) Determine the duration of a stream cycle prior to optimisation.
        {
            const beginTime = highResolutionTime();
            await streamer.stream();

            streamBeforeOptimiseTime = highResolutionTime() - beginTime;
        }

        // (2) Optimise the streamer.
        {
            const beginTime = highResolutionTime();
            this.manager_.streamer.optimise();

            optimiseTime = highResolutionTime() - beginTime;
        }

        // (3) Determine the duration of a stream cycle after optimisation.
        {
            const beginTime = highResolutionTime();
            await streamer.stream();

            streamAfterOptimiseTime = highResolutionTime() - beginTime;
        }

        this.announce_().announceToAdministrators(
            Message.VEHICLE_ANNOUNCE_OPTIMISED, player.name, player.id, streamBeforeOptimiseTime,
            streamAfterOptimiseTime, optimiseTime);

        player.sendMessage(Message.VEHICLE_OPTIMISED);
    }

    // Called when a Management member executes the `/v pin` or `/v [player] pin` command, which
    // means that they wish to pin the associated vehicle with the streamer.
    onVehiclePinCommand(player, subject) {
        const vehicle = subject.vehicle;

        // Bail out if the |subject| is not driving a vehicle, or it's not managed by this system.
        if (!this.manager_.pinVehicle(vehicle)) {
            player.sendMessage(Message.VEHICLE_NOT_DRIVING, subject.name);
            return;
        }

        player.sendMessage(Message.VEHICLE_PINNED, subject.name, vehicle.model.name);
    }

    // Called when the |player| requests the vehicle layout to be reset.
    onVehicleResetCommand(player) {
        this.manager_.streamer.respawnUnoccupiedVehicles();

        this.announce_().announceToAdministrators(
            Message.VEHICLE_ANNOUNCE_RESET, player.name, player.id);

        player.sendMessage(Message.VEHICLE_RESET);
    }

    // Called when the |player| executes `/v respawn` or `/v [player] respawn`, which means they
    // wish to reset the vehicle's position to its original spot.
    onVehicleRespawnCommand(player, subject) {
        const vehicle = subject.vehicle;

        // Bail out if the |subject| is not driving a vehicle, or it's not managed by this system.
        if (!this.manager_.isManagedVehicle(vehicle)) {
            player.sendMessage(Message.VEHICLE_NOT_DRIVING, subject.name);
            return;
        }

        this.manager_.respawnVehicle(vehicle);

        player.sendMessage(Message.VEHICLE_RESPAWNED, vehicle.model.name);
    }

    // Called when the |player| executes `/v save` or `/v [player] save`, which means they wish to
    // save the vehicle in the database to make it a persistent vehicle.
    async onVehicleSaveCommand(player, subject) {
        const vehicle = subject.vehicle;

        // Bail out if the |subject| is not driving a vehicle, or it's not managed by this system.
        if (!this.manager_.isManagedVehicle(vehicle)) {
            player.sendMessage(Message.VEHICLE_NOT_DRIVING, subject.name);
            return;
        }

        const wasPersistent = this.manager_.isPersistentVehicle(vehicle);

        // Bail out if there are too many models or vehicles in the area already.
        const areaInfo = await this.manager_.streamer.query(vehicle.position);

        if ((areaInfo.vehicles > MaximumVehiclesInArea || areaInfo.models > MaximumModelsInArea) &&
                !wasPersistent /* persistent vehicles are usually already counted for */) {
            player.sendMessage(Message.VEHICLE_SAVE_TOO_BUSY, areaInfo.vehicles,
                               MaximumVehiclesInArea, areaInfo.models, MaximumModelsInArea);
            return;
        }

        await this.manager_.storeVehicle(vehicle);

        if (!wasPersistent) {
            this.announce_().announceToAdministrators(Message.VEHICLE_ANNOUNCE_SAVED, player.name,
                                                      player.id, vehicle.model.name);
        }

        player.sendMessage(
            Message.VEHICLE_SAVED, vehicle.model.name, (wasPersistent ? 'updated' : 'saved'));
    }

    // Called when a Management member executes the `/v unpin` or `/v [player] unpin` command, which
    // means that they wish to unpin the associated vehicle with from streamer.
    onVehicleUnpinCommand(player, subject) {
        const vehicle = subject.vehicle;

        // Bail out if the |subject| is not driving a vehicle, or it's not managed by this system.
        if (!this.manager_.unpinVehicle(vehicle)) {
            player.sendMessage(Message.VEHICLE_NOT_DRIVING, subject.name);
            return;
        }

        player.sendMessage(Message.VEHICLE_UNPINNED, subject.name, vehicle.model.name);
    }

    // ---------------------------------------------------------------------------------------------

    // Registers the privileged commands with the `/lvp access` feature.
    registerTrackedCommands(playground) {
        playground.registerCommand('v', Player.LEVEL_ADMINISTRATOR);
    }

    // Drops registrations for the privileged commands.
    unregisterTrackedCommands(playground) {
        playground.unregisterCommand('v');
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.unregisterTrackedCommands(this.playground_());

        for (const command of Object.keys(QuickVehicleCommands))
            server.commandManager.removeCommand(command);

        server.commandManager.removeCommand('v');

        server.commandManager.removeCommand('lock');
        server.commandManager.removeCommand('unlock');
    }
}

exports = VehicleCommands;
