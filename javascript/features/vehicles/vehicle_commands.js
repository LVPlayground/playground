// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/command_manager/command_builder.js';
import { Menu } from 'components/menu/menu.js';
import { VehicleModel } from 'entities/vehicle_model.js';

import * as benefits from 'features/collectables/collectable_benefits.js';
import { toSafeInteger } from 'base/string_util.js';
import { Message } from 'base/message.js';

// The maximum distance from the player to the vehicle closest to them, in units.
const kMaximumVehicleDistance = 10;

// The maximum number of unique models and vehicles in the area local to the player. Used for
// deciding whether it's save to store a vehicle at the given position.
const MaximumModelsInArea = 50;
const MaximumVehiclesInArea = 90;

// Mapping of vehicle commands to model Ids that should be created for quick access.
const kQuickVehicleCommands = {
    // kBenefitBasicSprayQuickVehicleAccess, the easy tier
    pre: { modelId: 426, benefit: benefits.kBenefitBasicSprayQuickVehicleAccess },  // Premier
    sul: { modelId: 560, benefit: benefits.kBenefitBasicSprayQuickVehicleAccess },  // Sultan

    // kBenefitBasicBarrelQuickVehicleAccess, the alternative easy tier
    ele: { modelId: 562, benefit: benefits.kBenefitBasicBarrelQuickVehicleAccess },  // Elegy
    tur: { modelId: 451, benefit: benefits.kBenefitBasicBarrelQuickVehicleAccess },  // Turismo

    // kBenefitFullQuickVehicleAccess, the higher level tier
    inf: { modelId: 411, benefit: benefits.kBenefitFullQuickVehicleAccess },  // Infernus
    nrg: { modelId: 522, benefit: benefits.kBenefitFullQuickVehicleAccess },  // NRG-500
};

// Responsible for providing the commands associated with vehicles. Both players and administrators
// can create vehicles. Administrators can save, modify and delete vehicles as well.
class VehicleCommands {
    constructor(manager, announce, collectables, limits, playground, streamer) {
        this.manager_ = manager;
        this.delegates_ = new Set();

        this.announce_ = announce;
        this.collectables_ = collectables;
        this.limits_ = limits;
        this.streamer_ = streamer;

        this.playground_ = playground;
        this.playground_.addReloadObserver(
            this, VehicleCommands.prototype.registerTrackedCommands);

        this.registerTrackedCommands(playground());

        // Command: /seize
        server.commandManager.buildCommand('seize')
            .build(VehicleCommands.prototype.onSeizeCommand.bind(this));

        // Quick vehicle commands.
        for (const command of Object.keys(kQuickVehicleCommands)) {
            server.commandManager.buildCommand(command)
                .build(VehicleCommands.prototype.onQuickVehicleCommand.bind(this, command));
        }

        // Command: /v [vehicle]?
        //          /v [enter/help/reset/save]
        //          /v [player]? [delete/health/respawn]
        server.commandManager.buildCommand('v')
            .sub('enter')
                .restrict(Player.LEVEL_ADMINISTRATOR)
                .parameters([ { name: 'seat', type: CommandBuilder.NUMBER_PARAMETER,
                                optional: true } ])
                .build(VehicleCommands.prototype.onVehicleEnterCommand.bind(this))
            .sub('help')
                .build(VehicleCommands.prototype.onVehicleHelpCommand.bind(this))
            .sub('reset')
                .restrict(Player.LEVEL_MANAGEMENT)
                .build(VehicleCommands.prototype.onVehicleResetCommand.bind(this))
            .sub(CommandBuilder.PLAYER_PARAMETER, player => player)
                .sub('delete')
                    .build(VehicleCommands.prototype.onVehicleDeleteCommand.bind(this))
                .sub('health')
                    .restrict(Player.LEVEL_ADMINISTRATOR)
                    .parameters([ { name: 'health', type: CommandBuilder.NUMBER_PARAMETER,
                                    optional: true } ])
                    .build(VehicleCommands.prototype.onVehicleHealthCommand.bind(this))
                .sub('respawn')
                    .restrict(Player.LEVEL_ADMINISTRATOR)
                    .build(VehicleCommands.prototype.onVehicleRespawnCommand.bind(this))
                .sub('save')
                    .build(VehicleCommands.prototype.onVehicleSaveCommand.bind(this))
                .build(/* deliberate fall-through */)
            .sub(CommandBuilder.WORD_PARAMETER)
                .restrict(player => this.playground_().canAccessCommand(player, 'v'))
                .build(VehicleCommands.prototype.onVehicleCommand.bind(this))
            .build(VehicleCommands.prototype.onVehicleCommand.bind(this));
    }

    // Either adds or removes the given |delegate| from the set of vehicle command delegates.
    addCommandDelegate(delegate) { this.delegates_.add(delegate); }
    removeCommandDelegate(delegate) { this.delegates_.delete(delegate); }

    // ---------------------------------------------------------------------------------------------

    // Called when the player wants to seize the vehicle that they're in. This will move them to
    // the driver seat, which only works when that seat is available. This command uses raw Pawn
    // invocations to make sure it works on any vehicle.
    onSeizeCommand(player) {
        const vehicleId = pawnInvoke('GetPlayerVehicleID', 'i', player.id);
        if (vehicleId === Vehicle.kInvalidId || !vehicleId) {
            player.sendMessage(Message.VEHICLE_SEIZE_ON_FOOT);
            return;
        }

        const seatId = pawnInvoke('GetPlayerVehicleSeat', 'i', player.id);
        if (seatId === 0) {
            player.sendMessage(Message.VEHICLE_SEIZE_DRIVER_SELF);
            return;
        }

        const health = pawnInvoke('GetVehicleHealth', 'iF', vehicleId);
        if (health <= 250) {
            player.sendMessage(Message.VEHICLE_SEIZE_ON_FIRE);
            return;
        }

        // Locate other players who are sitting in the same vehicle.
        for (const otherPlayer of server.playerManager) {
            const otherVehicleId = pawnInvoke('GetPlayerVehicleID', 'i', otherPlayer.id);
            if (otherVehicleId !== vehicleId)
                continue;
            
            const otherSeatId = pawnInvoke('GetPlayerVehicleSeat', 'i', otherPlayer.id);
            if (otherSeatId === 0) {
                player.sendMessage(Message.VEHICLE_SEIZE_DRIVER, otherPlayer.name);
                return;
            }
        }

        // Stop the vehicle, because it shouldn't be moving.
        pawnInvoke('SetVehicleVelocity', 'ifff', vehicleId, 0, 0, 0);

        // Move them out of the vehicle first to avoid desyncs.
        player.position = player.position;

        // Move them in to the vehicle again.
        wait(750).then(() =>
            pawnInvoke('PutPlayerInVehicle', 'iii', player.id, vehicleId, /* driver= */ 0));

        // They've seized the vehicle, good for them. Let them know :).
        player.sendMessage(Message.VEHICLE_SEIZED);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the player executes one of the quick vehicle commands, for example `/inf` and
    // `/ele`. This will create a personal vehicle for them. Commands can be unlocked by collecting
    // achievements on the server, in different tier levels.
    async onQuickVehicleCommand(command, player) {
        const { modelId, benefit } = kQuickVehicleCommands[command];

        const allowed =
            this.playground_().canAccessCommand(player, 'v') ||
            this.collectables_().isPlayerEligibleForBenefit(player, benefit);

        if (!allowed) {
            player.sendMessage(Message.VEHICLE_QUICK_COLLECTABLES);
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

        const decision = this.limits_().canSpawnVehicle(player);
        if (!decision.isApproved()) {
            player.sendMessage(Message.VEHICLE_SPAWN_REJECTED, decision);
            return;
        }

        let vehicleModel = null;

        const potentialModelId = toSafeInteger(modelIdentifier);
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
                vehicleModels.sort((lhs, rhs) => lhs.name.localeCompare(rhs.name));

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

        if ([ 537, 538 ].includes(vehicleModel.id)) {
            player.sendMessage(Message.VEHICLE_SPAWN_NOT_ALLOWED_TRAIN);
            return;
        }

        const streamableVehicle = this.manager_.createVehicle(player, vehicleModel.id);
        if (!streamableVehicle) {
            player.sendMessage(Message.VEHICLE_SPAWN_NOT_ALLOWED);
            return;
        }

        // Inform the player of their new vehicle having been created.
        player.sendMessage(Message.VEHICLE_SPAWN_CREATED, vehicleModel.name);

        // Report that the |player| has spawned a vehicle. This rate-limits their usage too.
        this.limits_().reportSpawnVehicle(player);

        // If the |vehicle| is live, teleport the |player| to the driver seat after a minor delay.
        if (streamableVehicle.live)
            player.enterVehicle(streamableVehicle.live, Vehicle.kSeatDriver);
    }

    // Called when the |player| executes `/v delete` or `/v [player] delete`, which means they wish
    // to delete the vehicle the target is currently driving.
    async onVehicleDeleteCommand(player, subject) {
        let target = player;
        if (player.isAdministrator() && subject)
            target = subject;

        const vehicle = target.vehicle;

        // Bail out if the |player| is not currently in a vehicle - there's nothing to delete.. This
        // is a bit silly and a huge waste of server processing cycles. Ugh!
        if (!vehicle) {
            if (player === target)
                player.sendMessage(Message.VEHICLE_NOT_DRIVING_SELF);
            else
                player.sendMessage(Message.VEHICLE_NOT_DRIVING, target.name);
            
            return;
        }

        // Check if any of the delegates is able to handle the deletion. If they can, bail out.
        for (const delegate of this.delegates_) {
            if (await delegate.onVehicleDeleteCommand(player, target, vehicle))
                return;
        }

        // If the |player| is not an administrator, bail out at this point. They most likely have
        // misunderstood the command, so a reminder is helpful.
        if (!player.isAdministrator() || player.isTemporaryAdministrator()) {
            player.sendMessage(Message.VEHICLE_DELETE_HELP);
            return;
        }

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

        const interiorId = player.interiorId;
        const position = player.position;
        const virtualWorld = player.virtualWorld;

        let closestVehicleDistance = Number.MAX_SAFE_INTEGER;
        let closestVehicle = null;

        for (const vehicle of server.vehicleManager) {
            const distance = vehicle.position.distanceTo(position);
            if (distance > kMaximumVehicleDistance)
                continue;  // the |vehicle| is too far away
            
            if (closestVehicleDistance < distance)
                continue;  // a closer vehicle has already been found
            
            if (vehicle.interiorId != interiorId || vehicle.virtualWorld != virtualWorld)
                continue;  // the |vehicle| is not in the same world as the |player|
            
            closestVehicleDistance = distance;
            closestVehicle = vehicle;
        }

        // Bail out if no nearby vehicles have been found on the server.
        if (!closestVehicle) {
            player.sendMessage(Message.VEHICLE_ENTER_NONE_NEAR);
            return;
        }

        // Make sure that the |seat| the |player| wants to sit in is available.
        for (const occupant of closestVehicle.getOccupants()) {
            if (occupant.vehicleSeat !== seat)
                continue;

            player.sendMessage(
                Message.VEHICLE_ENTER_SEAT_OCCUPIED, closestVehicle.model.name);
            return;
        }

        // Make the |player| enter the closest vehicle in their area.
        player.enterVehicle(closestVehicle, seat);

        player.sendMessage(Message.VEHICLE_ENTERED, closestVehicle.model.name);
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
        const globalOptions = [];
        const vehicleOptions = [];

        if (player.isAdministrator()) {
            globalOptions.push('enter', 'help', 'reset');
            vehicleOptions.push('health', 'respawn');

            if (!player.isTemporaryAdministrator())
                vehicleOptions.push('delete', 'save');
            else
                globalOptions.push('delete', 'save')
        } else {
            globalOptions.push('delete', 'save');
        }

        if (this.playground_().canAccessCommand(player, 'v'))
            player.sendMessage(Message.VEHICLE_HELP_SPAWN);

        if (globalOptions.length)
            player.sendMessage(Message.VEHICLE_HELP_GLOBAL, globalOptions.sort().join('/'));

        if (vehicleOptions.length)
            player.sendMessage(Message.VEHICLE_HELP_VEHICLE, vehicleOptions.sort().join('/'));
    }

    // Called when the |player| requests the vehicle layout to be reset.
    onVehicleResetCommand(player) {
        this.manager_.respawnUnoccupiedVehicles();

        this.announce_().announceToAdministrators(
            Message.VEHICLE_ANNOUNCE_RESET, player.name, player.id);

        player.sendMessage(Message.VEHICLE_RESET);
    }

    // Called when the |player| executes `/v respawn` or `/v [player] respawn`, which means they
    // wish to reset the vehicle's position to its original spot.
    onVehicleRespawnCommand(player, subject) {
        const vehicle = subject.vehicle;
        if (!vehicle) {
            player.sendMessage(Message.VEHICLE_RESPAWN_NOT_IN_VEHICLE, subject.name);
            return;
        }

        this.manager_.respawnVehicle(vehicle);

        player.sendMessage(Message.VEHICLE_RESPAWNED, vehicle.model.name);
    }

    // Called when the |player| executes `/v save`, which means they wish to save the vehicle in the
    // database to make it a persistent vehicle. Delegates will also be considered before making
    // this decision, as players might want to save e.g. their house vehicle.
    async onVehicleSaveCommand(player, subject) {
        let target = player;
        if (player.isAdministrator() && subject)
            target = subject;

        const vehicle = target.vehicle;

        // Bail out if the |player| is not currently in a vehicle - there's nothing to save. They
        // can see general usage guidelines after having entered one.
        if (!vehicle) {
            if (player === target)
                player.sendMessage(Message.VEHICLE_NOT_DRIVING_SELF);
            else
                player.sendMessage(Message.VEHICLE_NOT_DRIVING, target.name);
            
            return;
        }

        const options = [];

        // Check whether one of the registered delegates is able to handle the vehicle's save. They
        // return a sequence of options, which could be displayed in a dialog.
        for (const delegate of this.delegates_)
            options.push(...await delegate.getVehicleSaveCommandOptions(player, target, vehicle));

        // If the |player| is an administrator and has the ability to save vehicles, add that to the
        // given |options| as well. This does allow them to save vehicles of other players.
        if (player.isAdministrator() && !player.isTemporaryAdministrator()) {
            options.push({
                label: `Save to the vehicle layout`,
                listener: VehicleCommands.prototype.onVehiclePermanentlySaveCommand.bind(this),
            });
        }

        // There are three options here: (1) no options, show a help message, (2) one option, fast
        // path and immediately call the listener, or (3) multiple options, show a dialog.
        if (options.length === 1) return await options[0].listener(player, target, vehicle);

        if (!options.length) {
            player.sendMessage(Message.VEHICLE_SAVE_HELP);
            return;
        }

        // (1) Sort the |options| based in ascending order based on the label text.
        options.sort((lhs, rhs) => lhs.label.localeCompare(rhs.label));

        // (2) Compile a dialog with each of the |options|, and have the user pick one instead.
        const dialog = new Menu('Vehicle options');

        for (const { label, listener } of options)
            dialog.addItem(label, listener.bind(null, player, target, vehicle));

        return await dialog.displayForPlayer(player);
    }

    // Called when the |player|'s |vehicle| has to be permanently saved to the database. This option
    // is only available to permanent administrators, and will persist between sessions.
    async onVehiclePermanentlySaveCommand(player, target, vehicle) {
        // Bail out if the |player| is not driving a vehicle, or it's not managed by this system.
        if (!this.manager_.isManagedVehicle(vehicle)) {
            player.sendMessage(Message.VEHICLE_NOT_DRIVING, target.name);
            return;
        }

        const wasPersistent = this.manager_.isPersistentVehicle(vehicle);

        // Bail out if there are too many models or vehicles in the area already.
        const areaInfo = await this.streamer_().query(vehicle.position);

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

        for (const command of Object.keys(kQuickVehicleCommands))
            server.commandManager.removeCommand(command);

        server.commandManager.removeCommand('v');

        server.commandManager.removeCommand('seize');
    }
}

export default VehicleCommands;
