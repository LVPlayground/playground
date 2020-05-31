// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Command from 'features/playground/command.js';
import CommandBuilder from 'components/command_manager/command_builder.js';

// Indicates how often we check for the player keys 
const FramesPerSecond = 10;

// Command: /indicator [player]
export default class IndicatorCommand extends Command {
    constructor(...args) {
        super(...args);

        this.indicating_ = new Map();

        server.playerManager.addObserver(this, true /* replayHistory */);
    }

    get name() { return 'indicator'; }
    get defaultPlayerLevel() { return Player.LEVEL_MANAGEMENT; }

    build(commandBuilder) {
        commandBuilder
            .parameters([{ name: 'target', type: CommandBuilder.PLAYER_PARAMETER, optional: true }])
            .build(IndicatorCommand.prototype.onIndicatorCommand.bind(this));
    }

    // Turn on or off the ability to use indicators.
    async onIndicatorCommand(player, target) {
        const subject = target || player;

        if (this.indicating_.has(subject)) {
            this.stopIndicating(subject);
            this.indicating_.delete(player);
            player.sendMessage(Message.COMMAND_SUCCESS, subject + ' can\'t use the blinkers anymore.');
            return;
        }

        player.sendMessage(Message.COMMAND_SUCCESS, subject + ' will now able to use the blinkers.');
        this.indicating_.set(subject, {});
        while (this.indicating_.has(subject) && subject.isConnected()) {
            const keys = this.getPlayerKeys(player);

            this.playerKeyUpdate(player, keys, this.indicating_.get(subject).oldKey);

            await seconds(1 / FramesPerSecond);
        }
    }

    // |Player| left the vehicle so cleanup. Keep him in the map though.
    onPlayerLeaveVehicle(player) {
        this.stopIndicating(player);
    }

    // |Player| disconnected so cleanup.
    onPlayerDisconnect(player) {
        this.stopIndicating(player);
        this.indicating_.delete(player);
    }

    // Check if |player| is pressing numpad 4/6 and didn't before. Update blinkers accordingly.
    playerKeyUpdate(player, newKey, oldKey) {
        if (!this.indicating_.has(player)) {
            return;
        }

        const vehicle = player.vehicle;
        if (!vehicle) { //Player not in a vehicle or not managed by JS.
            return;
        }

        if (this.isPlaneOrBoat(vehicle.model.id)) {
            return;
        }

        const hasOldQ = oldKey & 8192; // Numpad 4
        const hasNewQ = newKey & 8192;
        const hasOldE = oldKey & 16384; // Numpad 6
        const hasNewE = newKey & 16384;

        let left, right;
        if (hasNewQ && !hasOldQ) { // Player now pressed Q
            left = !this.indicating_.get(player).leftFront > 0;
        }
        else {
            left = this.indicating_.get(player).leftFront > 0;
        }

        if (hasNewE && !hasOldE) { // Player now pressed E
            right = !this.indicating_.get(player).rightFront > 0;
        }
        else {
            right = this.indicating_.get(player).rightFront > 0;
        }

        this.setBlinker(player, left, right, newKey);
    }

    // Change the state of the blinkers for the |player|
    setBlinker(player, left, right, newKey) {
        const blinkerModel = 19294;
        const vehicleId = player.vehicle.id;
        const sizes = pawnInvoke('GetVehicleModelInfo', 'iiFFF', player.vehicle.model.id, 1 /* size */);

        const items = this.indicating_.get(player);

        if (right) {
            if (!items.rightFront > 0) {
                items.rightFront = pawnInvoke('CreateObject', 'ifffffff', blinkerModel, 0, 0, 0, 0, 0, 0, 0);
                pawnInvoke('AttachObjectToVehicle', 'iiffffff', items.rightFront, vehicleId,
                    sizes[0] / 2.23, sizes[1] / 2.23, 0.1, 0, 0, 0);

                items.rightBack = pawnInvoke('CreateObject', 'ifffffff', blinkerModel, 0, 0, 0, 0, 0, 0, 0);
                pawnInvoke('AttachObjectToVehicle', 'iiffffff', items.rightBack, vehicleId,
                    sizes[0] / 2.23, -sizes[1] / 2.23, 0.1, 0, 0, 0);
            }
        } else {
            if (items.rightFront > 0) {
                pawnInvoke('DestroyObject', 'i', items.rightFront);
                items.rightFront = 0;
            }
            if (items.rightBack > 0) {
                pawnInvoke('DestroyObject', 'i', items.rightBack);
                items.rightBack = 0;
            }
        }

        if (left) {
            if (!items.leftFront > 0) {
                items.leftFront = pawnInvoke('CreateObject', 'ifffffff', blinkerModel, 0, 0, 0, 0, 0, 0, 0);
                pawnInvoke('AttachObjectToVehicle', 'iiffffff', items.leftFront, vehicleId,
                    -sizes[0] / 2.23, sizes[1] / 2.23, 0.1, 0, 0, 0);

                items.leftBack = pawnInvoke('CreateObject', 'ifffffff', blinkerModel, 0, 0, 0, 0, 0, 0, 0);
                pawnInvoke('AttachObjectToVehicle', 'iiffffff', items.leftBack, vehicleId,
                    -sizes[0] / 2.23, -sizes[1] / 2.23, 0.1, 0, 0, 0);
            }
        } else {
            if (items.leftFront > 0) {
                pawnInvoke('DestroyObject', 'i', items.leftFront);
                items.leftFront = 0;
            }
            if (items.leftBack > 0) {
                pawnInvoke('DestroyObject', 'i', items.leftBack);
                items.leftBack = 0;
            }
        }

        items.oldKey = newKey;
        this.indicating_.set(player, items);
    }

    // Make the |player|'s blinkers stop and unable to use again.
    stopIndicating(player) {
        if (!this.indicating_.has(player)) {
            return;
        }

        // Vehicle is not managed by JavaScript.
        if (!player.vehicle) {
            return;
        }

        this.setBlinker(player, false, false, null);
    }

    // Utility function to get a labelled version of the keys the player is pressing.
    getPlayerKeys(player) {
        const [keys, updown, leftright] = pawnInvoke('GetPlayerKeys', 'iIII', player.id);
        return keys;
    }

    // Determines whether the model is a plane or a bout (not supported).
    isPlaneOrBoat(modelId) {
        // Planes
        if (modelId == 460 || modelId == 476 || modelId == 511 || modelId == 512 || modelId == 513 ||
            modelId == 519 || modelId == 520 || modelId == 553 || modelId == 577 || modelId == 592 ||
            modelId == 593)
            return true;

        // Boats
        if (modelId == 430 || modelId == 446 || modelId == 452 || modelId == 453 || modelId == 454 ||
            modelId == 472 || modelId == 473 || modelId == 484 || modelId == 493 || modelId == 595)
            return true;

        return false;
    }

    dispose() {
        for (const player of this.indicating_.keys()) {
            this.stopIndicating(player);
        }

        this.indicating_ = null;
    }

}
