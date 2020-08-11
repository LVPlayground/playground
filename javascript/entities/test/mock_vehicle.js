// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Vehicle } from 'entities/vehicle.js';

// Global ID for mocked vehicles, used for testing. Never decrements.
let globalMockVehicleId = 0;

// Mocked implementation of the Vehicle class. Extends the actual class, and overrides functionality
// where it would interact with the Pawn server directly.
export class MockVehicle extends Vehicle {
    #originalPosition_ = null;
    #originalRotation_ = null;

    #position_ = null;
    #rotation_ = null;
    #health_ = 1000;
    #velocity_ = new Vector(0, 0, 0);

    #engine_ = true;
    #respawnCounter_ = 0;

    // Overridden to avoid creating an actual vehicle on the server.
    createVehicleInternal(options) {
        this.#position_ = options.position;
        this.#rotation_ = options.rotation;

        this.#originalPosition_ = options.position;
        this.#originalRotation_ = options.rotation;

        return ++globalMockVehicleId;
    }

    // Overrides to avoid interacting with a vehicle on the server.
    addComponentInternal(componentId) {}
    attachTrailerInternal(trailer) {}
    changeVehicleColorInternal(primaryColor, secondaryColor) {}
    changeVehicleNumberPlateInternal(numberPlate) {}
    changeVehiclePaintjobInternal(paintjob) {}
    removeComponentInternal(componentId) {}
    setInteriorInternal(interior) {}
    setVirtualWorldInternal(virtualWorld) {}
    destroyVehicleInternal() {}

    // ---------------------------------------------------------------------------------------------

    get health() { return this.#health_; }
    set health(value) { this.#health_ = value; }

    get position() { return this.#position_; }
    set position(value) { this.#position_ = value; }

    get rotation() { return this.#rotation_; }
    set rotation(value) { this.#rotation_ = value; }

    get velocity() { return this.#velocity_; }
    set velocity(value) { this.#velocity_ = value; }

    // ---------------------------------------------------------------------------------------------

    respawn() {
        this.#respawnCounter_++;
        this.#position_ = this.#originalPosition_;
        this.#rotation_ = this.#originalRotation_;

        this.clearOccupants();

        dispatchEvent('vehiclespawn', {
            vehicleid: this.id
        });
    }

    repair() { this.#health_ = 1000; }

    toggleEngine(engineRunning) { this.#engine_ = !!engineRunning; }

    get engineForTesting() { return this.#engine_; }
    get respawnCountForTesting() { return this.#respawnCounter_; }

    // ---------------------------------------------------------------------------------------------
    // Utility functionality for tests
    // ---------------------------------------------------------------------------------------------

    clearOccupants() {
        for (const player of this.getOccupants()) {
            dispatchEvent('playerstatechange', {
                playerid: player.id,
                oldstate: player.vehicleSeat == Vehicle.kSeatDriver ? Player.kStateVehicleDriver
                                                                    : Player.kStateVehiclePassenger,
                newstate: Player.kStateOnFoot
            });
        }
    }

    spawn() {
        dispatchEvent('vehiclespawn', {
            vehicleid: this.id
        });
    }

    death() {
        dispatchEvent('vehicledeath', {
            vehicleid: this.id,
            killerid: Player.kInvalidId
        });
    }
}
