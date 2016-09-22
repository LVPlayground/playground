// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Query to load all created vehicles from the database.
const LOAD_VEHICLES_QUERY = `
    SELECT
        vehicle_id,
        model_id,
        position_x,
        position_y,
        position_z,
        rotation,
        primary_color,
        secondary_color,
        paintjob,
        interior_id
    FROM
        vehicles
    WHERE
        vehicle_removed IS NULL`;

// Class responsible for interactions of the vehicle feature with the database.
class VehicleDatabase {
    // Asynchronously loads all vehicles from the database.
    async loadVehicles() {
        const vehicles = [];

        const data = await server.database.query(LOAD_VEHICLES_QUERY);
        data.rows.forEach(info => {
            vehicles.push({
                databaseId: info.vehicle_id,

                modelId: info.model_id,
                position: new Vector(info.position_x, info.position_y, info.position_z),
                rotation: info.rotation,

                interiorId: info.interior_id,
                virtualWorld: 0 /* main world */,

                primaryColor: info.primary_color,
                secondaryColor: info.secondary_color,
                paintjob: info.paintjob
            });
        });

        return vehicles;
    }
}

exports = VehicleDatabase;
