// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { VehicleDecorationSet } from 'features/vehicles/vehicle_decoration_set.js';

// Directory in which all the decorations have been written.
const kDecorationDirectory = 'data/decorations/';

export const kVehicleDecorations = new Set([
    { filename: 'dft_400.json', setting: 'decorations/dft_400' },
    { filename: 'horny_infernus.json', setting: 'decorations/horny_infernus' },
    { filename: 'dildo_sultan.json', setting: 'decorations/dildo_sultan' },
]);

// This class allows to decorate vehicles depending on the given settings.
export class VehicleDecorations {
    settings_ = null;

    // Contains a map of setting, VehicleDecorationSet
    decorations_ = null;

    // Contains a map of setting, decoration. Disabled settings will be removed from the map.
    enabledSettings_ = null;

    // Contains a map of what player, {vehicle, decoration}
    playerVehicleDecorations_ = null;

    constructor(settings, announce) {
        server.playerManager.addObserver(this);

        this.decorations_ = new Map();
        this.enabledSettings_ = new Map();
        this.playerVehicleDecorations_ = new Map();

        this.announce_ = announce;

        this.settings_ = settings;
        this.settings_.addReloadObserver(
            this, VehicleDecorations.prototype.attachSettingListeners.bind(this));

        for (const { filename, setting } of kVehicleDecorations) {
            const decoration = new VehicleDecorationSet(kDecorationDirectory + filename);
            this.decorations_.set(setting, decoration);

            if (this.settings_().getValue(setting))
                this.enabledSettings_.set(setting, decoration);
        }

        this.attachSettingListeners();
    }

    // Attaches all the change listeners for the known settings. Will have to be rebound if and when
    // the Settings feature reloads, as that makes all observers go away.
    attachSettingListeners() {
        for (const { setting } of kVehicleDecorations) {
            this.settings_().addSettingObserver(
                setting, this, VehicleDecorations.prototype.onSettingChanged.bind(this));
        }
    }

    // Called when the given |setting| has changed to the given |value|.
    onSettingChanged(setting, value) {
        const decoration = this.decorations_.get(setting);
        if (!decoration)
            return;  // this |setting| doesn't map to a known configuration, odd

        if (!this.enabledSettings_.has(setting)) {
            if (value)
                this.enabledSettings_.set(setting, decoration);

            return;
        }

        if (!value) {
            this.enabledSettings_.delete(setting);
            decoration.disableAll();
        }
    }

    // If payer enters a vehicle that can be decorated decorate it. 
    onPlayerEnterVehicle(player, vehicle) {
        if (this.playerVehicleDecorations_.has(player))
            return;

        if (player.vehicleSeat !== Vehicle.kSeatDriver)
            return;

        const decorations = 
            [...this.enabledSettings_.values()].filter(v => v.modelId === vehicle.model.id);

        if (decorations.length === 0)
            return;

        for (const decoration of decorations)
            decoration.enable(vehicle.id);

        //decoration.enable(vehicle.id);
        this.playerVehicleDecorations_.set(player, { vehicle: vehicle, decorations: decorations });

        // For the text draw only limit it to the first.
        const decoration = decorations[0];
        if (decoration.enterMessage !== null && decoration.enterMessage !== undefined)
            player.gameText(decoration.enterMessage, 3000, 4);

        if (decoration.announceMessage !== null && decoration.announceMessage !== undefined)
            this.announce_().announceToPlayers(decoration.announceMessage);
    }

    // Cleanup the objects upon leaving the vehicle.
    onPlayerLeaveVehicle(player) {
        const vehicleDecorations = this.playerVehicleDecorations_.get(player);
        if (!vehicleDecorations || vehicleDecorations.length === 0)
            return;

        for (const decoration of vehicleDecorations.decorations)
            decoration.disable(vehicleDecorations.vehicle.id);

        this.playerVehicleDecorations_.delete(player);
    }

    // Cleanup the objects upon disconnecting.
    onPlayerDisconnect(player) {
        const vehicleDecorations = this.playerVehicleDecorations_.get(player);
        if (!vehicleDecorations || vehicleDecorations.length === 0)
            return;

        for (const decoration of vehicleDecorations.decorations)
            decoration.disable(vehicleDecorations.vehicle.id);

        this.playerVehicleDecorations_.delete(player);
    }

    dispose() {
        server.playerManager.removeObserver(this);

        for (let decoration of this.decorations_.values()) {
            if (decoration !== null) {
                decoration.dispose();
                decoration = null;
            }
        }
    }
}
