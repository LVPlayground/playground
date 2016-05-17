// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Supports exactly the same API as a regular Vehicle entity, but will only store the data locally
// instead of actually creating the vehicle on the server.
class MockVehicle {
    constructor(manager, options) {
        this.manager_ = manager;
        this.id_ = Math.floor(Math.random() * 10000000);

        this.modelId_ = options.modelId;
        this.position_ = options.position;
        this.rotation_ = options.rotation;
        this.primaryColor_ = options.primaryColor;
        this.secondaryColor_ = options.secondaryColor;
        this.siren_ = options.siren;

        this.paintjob_ = options.paintjob;

        this.interiorId_ = options.interiorId;
        this.virtualWorld_ = options.virtualWorld;

        this.health_ = 1000;
    }

    // Returns whether this vehicle has been created on the server.
    isConnected() { return this.id_ !== null; }

    // Gets the Id of this vehicle as assigned by the SA-MP server.
    get id() { return this.id_; }

    // Gets the model Id associated with this vehicle.
    get modelId() { return this.modelId_; }

    // Gets or sets the position of this vehicle.
    get position() { return this.position_; }
    set position(value) { this.position_ = value; }

    // Gets or sets the rotation of this vehicle.
    get rotation() { return this.rotation_; }
    set rotation(value) { this.rotation_ = value; }

    // Gets or sets the primary colour of this vehicle.
    get primaryColor() { return this.primaryColor_; }
    set primaryColor(value) { this.primaryColor_ = value; }

    // Gets or sets the secondary colour of this vehicle.
    get secondaryColor() { return this.secondaryColor_; }
    set secondaryColor(value) { this.secondaryColor_ = value; }

    // Gets whether the vehicle has been forced to have a siren.
    get siren() { return this.siren_; }

    // Gets or sets the paintjob that have been applied to this vehicle.
    get paintjob() { return this.paintjob_; }
    set paintjob(value) { this.paintjob_ = value; }

    // Gets or sets the interior that this vehicle has been linked to.
    get interiorId() { return this.interiorId_; }
    set interiorId(value) { this.interiorId_ = value; }

    // Gets or sets the virtual world this vehicle is tied to.
    get virtualWorld() { return this.virtualWorld_; }
    set virtualWorld(value) { this.virtualWorld_ = value; }

    // Gets or sets the health of this vehicle. Should generally be between 0 and 1000.
    get health() { return this.health_; }
    set health(value) { this.health_ = value; }

    // Repairs the vehicle. This resets the visual damage state as well.
    repair() { this.health_ = 1000; }

    // Adds |componentId| to this vehicle. No verification will be done on whether the component is
    // valid for this vehicle. Components can be added multiple times.
    addComponent(componentId) {}

    // Disposes the vehicle by removing it from the server.
    dispose() {
        this.manager_.didDisposeVehicle(this);
        this.manager_ = null;

        this.id_ = null;
    }
}

exports = MockVehicle;
