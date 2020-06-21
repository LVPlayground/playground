// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { PersistentVehicleInfo } from 'features/vehicles/persistent_vehicle_info.js';

// Query to load all created vehicles from the database.
const LOAD_VEHICLES_QUERY = `
    SELECT
        vehicles.vehicle_id,
        vehicles.model_id,
        vehicles.position_x,
        vehicles.position_y,
        vehicles.position_z,
        vehicles.rotation,
        vehicles.paintjob,
        vehicles.primary_color,
        vehicles.secondary_color,
        vehicles.number_plate
    FROM
        vehicles
    WHERE
        vehicle_removed IS NULL`;

// Query to create a new persistent vehicle in the database.
const CREATE_VEHICLE_QUERY = `
    INSERT INTO
        vehicles
        (model_id, position_x, position_y, position_z, rotation, paintjob, primary_color,
         secondary_color, number_plate, vehicle_created)
    VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;

// Query to update the details of an existing persistent vehicle in the database.
const UPDATE_VEHICLE_QUERY = `
    UPDATE
        vehicles
    SET
        model_id = ?,
        position_x = ?,
        position_y = ?,
        position_z = ?,
        rotation = ?,
        paintjob = ?,
        primary_color = ?,
        secondary_color = ?,
        number_plate = ?,
        interior_id = ?
    WHERE
        vehicle_id = ?`;

// Query to update just the vehicle's access rights.
const UPDATE_VEHICLE_ACCESS_QUERY = `
    UPDATE
        vehicles
    SET
        vehicle_access_type = ?,
        vehicle_access_value = ?
    WHERE
        vehicle_id = ?`;

// Query to flag a given vehicle as having been removed in the database.
const DELETE_VEHICLE_QUERY = `
    UPDATE
        vehicles
    SET
        vehicle_removed = NOW()
    WHERE
        vehicle_id = ?`;

// Class responsible for interactions of the vehicle feature with the database.
class VehicleDatabase {
    // Asynchronously loads all vehicles from the database.
    async loadVehicles() {
        const vehicles = [];

        const data = await server.database.query(LOAD_VEHICLES_QUERY);
        data.rows.forEach(info => {
            const vehicleInfo = new PersistentVehicleInfo({
                vehicleId: info.vehicle_id,

                modelId: info.model_id,

                position: new Vector(info.position_x, info.position_y, info.position_z),
                rotation: info.rotation,

                paintjob: info.paintjob,
                primaryColor: info.primary_color,
                secondaryColor: info.secondary_color,
                numberPlate: info.number_plate,
            });

            vehicles.push(vehicleInfo);
        });

        return vehicles;
    }

    // Asynchronously creates the |vehicleSettings| in the database.
    async createVehicle(vehicleSettings) {
        const data = await server.database.query(CREATE_VEHICLE_QUERY, vehicleSettings.modelId,
            vehicleSettings.position.x, vehicleSettings.position.y, vehicleSettings.position.z,
            vehicleSettings.rotation, vehicleSettings.paintjob, vehicleSettings.primaryColor,
            vehicleSettings.secondaryColor, vehicleSettings.numberPlate);
        
        return new PersistentVehicleInfo(vehicleSettings, {
            vehicleId: data.insertId
        });
    }

    // Asynchronously updates the |databaseVehicle| in the database.
    async updateVehicle(vehicleSettings, persistentVehicleInfo) {
        await server.database.query(UPDATE_VEHICLE_QUERY, vehicleSettings.modelId,
            vehicleSettings.position.x, vehicleSettings.position.y, vehicleSettings.position.z,
            vehicleSettings.rotation, vehicleSettings.paintjob, vehicleSettings.primaryColor,
            vehicleSettings.secondaryColor, vehicleSettings.numberPlate,
            persistentVehicleInfo.vehicleId);
        
        return new PersistentVehicleInfo(persistentVehicleInfo, vehicleSettings);
    }

    // Asynchronously updates the |databaseVehicle|'s access values in the database.
    async updateVehicleAccess(databaseVehicle) {
        await server.database.query(UPDATE_VEHICLE_ACCESS_QUERY, databaseVehicle.accessType,
            databaseVehicle.accessValue, databaseVehicle.databaseId);
    }

    // Asynchronously deletes the |databaseVehicle| from the database.
    async deleteVehicle(databaseVehicle) {
        await server.database.query(DELETE_VEHICLE_QUERY, databaseVehicle.databaseId);
    }
}

export default VehicleDatabase;
