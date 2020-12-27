// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Represents a vehicle that's associated with a house. A vehicle is tied to a particular parking
// lot and to a particular house.
export class HouseVehicle {
    // Id of this vehicle in the database.
    id = null;

    // Id of the model that should be used to represent this vehicle.
    modelId = null;

    // Parking lot on which this vehicle should be parked.
    parkingLot = null;

    // Optional primary colour this vehicle should appear in.
    primaryColor = null;

    // Optional secondary colour this vehicle should appear in.
    secondaryColor = null;

    // Optional paintjob this vehicle should appear in.
    paintjob = null;

    // Array of components this vehicle should spawn with.
    components = null;

    constructor(vehicle, parkingLot) {
        this.id = vehicle.id;
        this.modelId = vehicle.modelId;

        this.parkingLot = parkingLot;

        this.primaryColor = vehicle.primaryColor ?? null;
        this.secondaryColor = vehicle.secondaryColor ?? null;
        this.paintjob = vehicle.paintjob ?? null;
        this.components = vehicle.components ?? [];
    }

    applyVehicleInfo(vehicleInfo) {
        this.modelId = vehicleInfo.modelId;

        this.primaryColor = vehicleInfo.primaryColor ?? null;
        this.secondaryColor = vehicleInfo.secondaryColor ?? null;
        this.paintjob = vehicleInfo.paintjob ?? null;
        this.components = vehicleInfo.components ?? [];
    }
}
