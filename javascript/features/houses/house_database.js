// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Query to load the locations at which houses can be created from the database.
const LOAD_LOCATIONS_QUERY = `
    SELECT
        house_location_id,
        entrance_x,
        entrance_y,
        entrance_z
    FROM
        houses_locations
    WHERE
        location_removed IS NULL`;

// Query to create a new house location in the database.
const CREATE_LOCATION_QUERY = `
    INSERT INTO
        houses_locations
        (entrance_x, entrance_y, entrance_z, location_creator_id, location_created)
    VALUES
        (?, ?, ?, ?, NOW())`;

// Query to remove a previously created location from the database.
const REMOVE_LOCATION_QUERY = `
    UPDATE
        houses_locations
    SET
        location_removed = NOW()
    WHERE
        house_location_id = ?`;

// Defines the database interactions for houses that are used for loading, updating and removing
// persistent data associated with them.
class HouseDatabase {
    // Loads the existing house locations from the database, and asynchronously returns them.
    async loadLocations() {
        let locations = [];

        const data = await server.database.query(LOAD_LOCATIONS_QUERY);
        data.rows.forEach(location => {
            locations.push({
                id: location.house_location_id,
                position: new Vector(location.entrance_x, location.entrance_y, location.entrance_z)
            });
        });

        return locations;
    }

    // Creates a new house location at |position| created by the |player|.
    async createLocation(player, position) {
        const data = await server.database.query(
            CREATE_LOCATION_QUERY, position.x, position.y, position.z, player.userId);

        return data.insertId;
    }

    // Removes the |location| from the database.
    async removeLocation(location) {
        await server.database.query(REMOVE_LOCATION_QUERY, location.id);
    }
}

exports = HouseDatabase;
