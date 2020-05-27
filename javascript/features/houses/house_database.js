// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import HouseSettings from 'features/houses/house_settings.js';

// Query to load the locations at which houses can be created from the database.
const LOAD_LOCATIONS_QUERY = `
    SELECT
        house_location_id,
        entrance_x,
        entrance_y,
        entrance_z,
        entrance_facing_angle,
        entrance_interior_id
    FROM
        houses_locations
    WHERE
        location_removed IS NULL`;

// Query to load the parking lots associated with the house locations.
const LOAD_PARKING_LOTS_QUERY = `
    SELECT
        houses_parking_lots.house_parking_lot_id,
        houses_parking_lots.house_location_id,
        houses_parking_lots.position_x,
        houses_parking_lots.position_y,
        houses_parking_lots.position_z,
        houses_parking_lots.rotation,
        houses_parking_lots.interior_id
    FROM
        houses_parking_lots
    LEFT JOIN
        houses_locations ON houses_locations.house_location_id = houses_parking_lots.house_location_id
    WHERE
        houses_parking_lots.parking_lot_removed IS NULL AND
        houses_locations.location_removed IS NULL`;

// Query to load the house details from the database.
const LOAD_HOUSES_QUERY = `
    SELECT
        houses_settings.house_id,
        houses_settings.house_location_id,
        houses_settings.house_user_id,
        houses_settings.house_interior_id,
        houses_settings.house_name,
        houses_settings.house_access,
        houses_settings.house_spawn_point,
        houses_settings.house_welcome_message,
        houses_settings.house_stream_url,
        houses_settings.house_marker_color,
        UNIX_TIMESTAMP(houses_settings.house_created) AS house_created,
        users_gangs.gang_id,
        users.username
    FROM
        houses_settings
    LEFT JOIN
        houses_locations ON houses_locations.house_location_id = houses_settings.house_location_id
    LEFT JOIN
        users_gangs ON users_gangs.user_id = houses_settings.house_user_id AND
                       users_gangs.left_gang IS NULL
    LEFT JOIN
        users ON users.user_id = houses_settings.house_user_id
    WHERE
        houses_settings.house_removed IS NULL AND
        houses_locations.location_removed IS NULL AND
        users.username IS NOT NULL`;

// Query to load the additional features that have been purchased for player houses.
const LOAD_HOUSE_FEATURES_QUERY = `
    SELECT
        houses_settings.house_location_id,
        houses_features.house_feature_id,
        houses_features.position_x,
        houses_features.position_y,
        houses_features.position_z,
        houses_features.feature
    FROM
        houses_features
    LEFT JOIN
        houses_settings ON houses_settings.house_id = houses_features.house_id
    LEFT JOIN
        houses_locations ON houses_locations.house_location_id = houses_settings.house_location_id
    WHERE
        houses_features.feature_removed IS NULL AND
        houses_settings.house_removed IS NULL AND
        houses_locations.location_removed IS NULL`;

// Query to load the vehicles that have been associated with houses.
const LOAD_VEHICLES_QUERY = `
    SELECT
        houses_settings.house_location_id,
        houses_vehicles.house_vehicle_id,
        houses_vehicles.house_parking_lot_id,
        houses_vehicles.model_id
    FROM
        houses_vehicles
    LEFT JOIN
        houses_settings ON houses_settings.house_id = houses_vehicles.house_id
    LEFT JOIN
        houses_locations ON houses_locations.house_location_id = houses_settings.house_location_id
    LEFT JOIN
        houses_parking_lots ON houses_parking_lots.house_parking_lot_id = houses_vehicles.house_parking_lot_id
    WHERE
        houses_vehicles.vehicle_removed IS NULL AND
        houses_settings.house_removed IS NULL AND
        houses_locations.location_removed IS NULL AND
        houses_parking_lots.parking_lot_removed IS NULL`;

// Query to create a new house location in the database.
const CREATE_LOCATION_QUERY = `
    INSERT INTO
        houses_locations
        (entrance_x, entrance_y, entrance_z, entrance_facing_angle, entrance_interior_id, location_creator_id, location_created)
    VALUES
        (?, ?, ?, ?, ?, ?, NOW())`;

// Query to create a new parking lot associated with a location in the database.
const CREATE_PARKING_LOT_QUERY = `
    INSERT INTO
        houses_parking_lots
        (house_location_id, position_x, position_y, position_z, rotation, interior_id, parking_lot_creator_id, parking_lot_created)
    VALUES
        (?, ?, ?, ?, ?, ?, ?, NOW())`;

// Query to create a new set of house settings in the database.
const CREATE_HOUSE_QUERY = `
    INSERT INTO
        houses_settings
        (house_location_id, house_user_id, house_interior_id, house_name, house_created)
    VALUES
        (?, ?, ?, ?, NOW())`;

// Query to create a new feature associated with a given house, at a given position.
const CREATE_HOUSE_FEATURE_QUERY = `
    INSERT INTO
        houses_features
        (house_id, feature, position_x, position_y, position_z, feature_created)
    VALUES
        (?, ?, ?, ?, ?, NOW())`;

// Query to create a house visitor log in the database.
const CREATE_HOUSE_VISITOR_LOG = `
    INSERT INTO
        houses_visitor_logs
        (house_id, user_id, visit_date)
    VALUES
        (?, ?, NOW())`;

// Query to create a vehicle in the database.
const CREATE_VEHICLE_QUERY = `
    INSERT INTO
        houses_vehicles
        (house_parking_lot_id, house_id, model_id, vehicle_created)
    VALUES
        (?, ?, ?, NOW())`;

// Query for reading the visitor logs for a given house.
const READ_VISITOR_LOGS_QUERY = `
    SELECT
        users.username,
        UNIX_TIMESTAMP(houses_visitor_logs.visit_date) AS visit_time
    FROM
        houses_visitor_logs
    LEFT JOIN
        houses_settings ON houses_settings.house_id = houses_visitor_logs.house_id
    LEFT JOIN
        users ON users.user_id = houses_visitor_logs.user_id
    WHERE
        houses_visitor_logs.house_id = ? AND
        (? = 0 OR houses_settings.house_user_id != houses_visitor_logs.user_id)
    ORDER BY
        houses_visitor_logs.visit_date DESC
    LIMIT
        ?`;

// Query for updating the access requirements of a given house.
const UPDATE_ACCESS_SETTING_QUERY = `
    UPDATE
        houses_settings
    SET
        house_access = ?
    WHERE
        house_id = ?`;

// Query for updating the marker color of a given house.
const UPDATE_MARKER_COLOR_SETTING_QUERY = `
    UPDATE
        houses_settings
    SET
        house_marker_color = ?
    WHERE
        house_id = ?`;

// Query for updating the name of a given house.
const UPDATE_NAME_SETTING_QUERY = `
    UPDATE
        houses_settings
    SET
        house_name = ?
    WHERE
        house_id = ?`;

// Query for removing all existing spawn settings for a particular user.
const REMOVE_SPAWN_SETTINGS_FOR_USER_QUERY = `
    UPDATE
        houses_settings
    SET
        house_spawn_point = 0
    WHERE
        house_user_id = ? AND
        house_removed IS NULL`;

// Query for updating the spawn setting for a given house.
const UPDATE_SPAWN_SETTING_QUERY = `
    UPDATE
        houses_settings
    SET
        house_spawn_point = ?
    WHERE
        house_id = ?`;

// Query for updating the welcome message of a given house.
const UPDATE_WELCOME_MESSAGE_SETTING_QUERY = `
    UPDATE
        houses_settings
    SET
        house_welcome_message = ?
    WHERE
        house_id = ?`;

// Query for updating the audio stream URL of a given house.
const UPDATE_STREAM_URL_SETTING_QUERY = `
    UPDATE
        houses_settings
    SET
        house_stream_url = ?
    WHERE
        house_id = ?`;

// Query to remove a previously created location from the database.
const REMOVE_LOCATION_QUERY = `
    UPDATE
        houses_locations
    SET
        location_removed = NOW()
    WHERE
        house_location_id = ?`;

// Query to remove a previously created parking lot from the database.
const REMOVE_PARKING_LOT_QUERY = `
    UPDATE
        houses_parking_lots
    SET
        parking_lot_removed = NOW()
    WHERE
        house_parking_lot_id = ?`;

// Query to remove a previously created house from the database.
const REMOVE_HOUSE_QUERY = `
    UPDATE
        houses_settings
    SET
        house_removed = NOW()
    WHERE
        house_id = ?`;

// Query to remove a given feature from a house in the database.
const REMOVE_HOUSE_FEATURE_QUERY = `
    UPDATE
        houses_features
    SET
        feature_removed = NOW()
    WHERE
        house_id = ? AND
        feature = ?`;

// Query to remove one of the vehicles associated with a house.
const REMOVE_VEHICLE_QUERY = `
    UPDATE
        houses_vehicles
    SET
        vehicle_removed = NOW()
    WHERE
        house_vehicle_id = ?`;

// Defines the database interactions for houses that are used for loading, updating and removing
// persistent data associated with them.
class HouseDatabase {
    // Loads the existing house locations from the database, and asynchronously returns them.
    async loadLocations() {
        let parkingLots = new Map();
        let locations = [];

        // (1) Load the parking lots from the database.
        {
            const data = await server.database.query(LOAD_PARKING_LOTS_QUERY);
            data.rows.forEach(parkingLot => {
                const locationId = parkingLot.house_location_id;
                const position =
                    new Vector(parkingLot.position_x, parkingLot.position_y, parkingLot.position_z);

                if (!parkingLots.has(locationId))
                    parkingLots.set(locationId, []);

                parkingLots.get(locationId).push({
                    id: parkingLot.house_parking_lot_id,
                    position: position,
                    rotation: parkingLot.rotation,
                    interiorId: parkingLot.interior_id
                });
            });
        }

        // (2) Load the location information itself from the database.
        {
            const data = await server.database.query(LOAD_LOCATIONS_QUERY);
            data.rows.forEach(location => {
                const locationId = location.house_location_id;
                const position =
                    new Vector(location.entrance_x, location.entrance_y, location.entrance_z);

                locations.push([
                    locationId,
                    {
                        position: position,
                        facingAngle: location.entrance_facing_angle,
                        interiorId: location.entrance_interior_id,
                        parkingLots: parkingLots.get(locationId) || []
                    }
                ]);
            });
        }

        return locations;
    }

    // Loads the existing houses, including their settings and interior details, from the database.
    async loadHouses() {
        const houses = new Map();

        // (1) Load the houses from the database.
        {
            const data = await server.database.query(LOAD_HOUSES_QUERY);
            data.rows.forEach(row => {
                houses.set(row.house_location_id, {
                    id: row.house_id,
                    name: row.house_name,

                    ownerId: row.house_user_id,
                    ownerGangId: row.gang_id,
                    ownerName: row.username,

                    purchaseTime: row.house_created,

                    interiorId: row.house_interior_id,

                    access: HouseDatabase.toHouseAccessValue(row.house_access),
                    spawnPoint: !!row.house_spawn_point,
                    welcomeMessage: row.house_welcome_message,
                    streamUrl: row.house_stream_url,
                    markerColor: row.house_marker_color,

                    features: new Map(),
                    vehicles: []
                });
            });
        }

        // (2) Load the additional features from the database.
        {
            const data = await server.database.query(LOAD_HOUSE_FEATURES_QUERY);
            data.rows.forEach(row => {
                const locationId = row.house_location_id;

                const house = houses.get(locationId);
                if (!house) {
                    console.log('Warning: Feature #' + row.house_feature_id + ' is associated ' +
                                'with an invalid house (#' + row.house_id + '.');
                    return;
                }

                if (house.features.has(row.feature)) {
                    console.log('Warning: Feature #' + row.house_feature_id + ' is redundant ' +
                                'with a previously defined feature (house #' + row.house_id + '.');
                    return;
                }

                house.features.set(
                    row.feature, new Vector(row.position_x, row.position_y, row.position_z));
            });
        }

        // (3) Load the vehicles from the database.
        {
            const data = await server.database.query(LOAD_VEHICLES_QUERY);
            data.rows.forEach(row => {
                const locationId = row.house_location_id;

                if (!houses.has(locationId)) {
                    console.log('Warning: Vehicle #' + row.house_vehicle_id + ' is associated ' +
                                'with an invalid house (#' + row.house_id + '.');
                    return;
                }

                houses.get(locationId).vehicles.push({
                    id: row.house_vehicle_id,
                    modelId: row.model_id,

                    parkingLotId: row.house_parking_lot_id
                });
            });
        }

        return houses;
    }

    // Creates a new house location at |locationInfo| created by the |player|.
    async createLocation(player, locationInfo) {
        const { facingAngle, interiorId, position } = locationInfo;

        const data = await server.database.query(
            CREATE_LOCATION_QUERY, position.x, position.y, position.z, facingAngle, interiorId,
            player.account.userId);

        return data.insertId;
    }

    // Creates a new database entry for the |parkingLot| associated with the |location|.
    async createLocationParkingLot(player, location, parkingLot) {
        const position = parkingLot.position;
        const data = await server.database.query(
            CREATE_PARKING_LOT_QUERY, location.id, position.x, position.y, position.z,
            parkingLot.rotation, parkingLot.interiorId, player.account.userId);

        return data.insertId;
    }

    // Creates a new house in the database trying |interiorId| to |location|, owned by |player|.
    async createHouse(player, location, interiorId) {
        const name = player.name + '\'s house';
        const data = await server.database.query(
            CREATE_HOUSE_QUERY, location.id, player.account.userId, interiorId, name);

        return {
            id: data.insertId,
            name: name,

            ownerId: player.account.userId,
            ownerGangId: player.gangId,
            ownerName: player.name,

            purchaseTime: Math.floor(Date.now() / 1000),

            interiorId: interiorId,

            access: HouseSettings.ACCESS_DEFAULT,
            spawnPoint: false,
            welcomeMessage: '',
            streamUrl: '',
            markerColor: 'yellow',

            features: new Map(),
            vehicles: []
        };
    }

    // Creates a new |feature| for the given |location|, at |position|.
    async createHouseFeature(location, feature, position) {
        await server.database.query(CREATE_HOUSE_FEATURE_QUERY, location.settings.id, feature,
                                    position.x, position.y, position.z);
    }

    // Creates a log entry noting that the |player| has visited the |location|.
    async createHouseVisitorLog(location, player) {
        await server.database.query(
            CREATE_HOUSE_VISITOR_LOG, location.settings.id, player.account.userId);
    }

    // Creates a vehicle with |vehicleInfo| in the |parkingLot| associated with the house at
    // |location|. The |vehicleInfo| must be an object having {modelId}.
    async createVehicle(location, parkingLot, vehicleInfo) {
        const data = await server.database.query(
            CREATE_VEHICLE_QUERY, parkingLot.id, location.settings.id, vehicleInfo.modelId);

        return data.insertId;
    }

    // Reads the |count| most recent entry logs for the given |location|, optionally |ignoreOwner|.
    async readVisitorLogs(location, count = 20, ignoreOwner = false) {
        const logs = [];
        const data = await server.database.query(
            READ_VISITOR_LOGS_QUERY, location.settings.id, ignoreOwner ? 1 : 0, count);

        data.rows.forEach(row =>
            logs.push({ name: row.username, date: row.visit_time }));

        return logs;
    }

    // Updates the access requirements of the house at |location| to |value|.
    async updateHouseAccess(location, value) {
        await server.database.query(
            UPDATE_ACCESS_SETTING_QUERY, HouseDatabase.toHouseAccessEnum(value),
            location.settings.id);
    }

    // Updates the marker color of the |location| to |color|.
    async updateHouseMarkerColor(location, color) {
        await server.database.query(UPDATE_MARKER_COLOR_SETTING_QUERY, color, location.settings.id);
    }

    // Updates the name of the house at |location| to |name|.
    async updateHouseName(location, name) {
        await server.database.query(UPDATE_NAME_SETTING_QUERY, name, location.settings.id);
    }

    // Updates the spawn position choice of the houses owned by |location|'s owner. All previous
    // settings will be removed first, then the |location| will be updated to |spawn|.
    async updateHouseSpawn(location, spawn) {
        await server.database.query(
            REMOVE_SPAWN_SETTINGS_FOR_USER_QUERY, location.settings.ownerId);
        await server.database.query(
            UPDATE_SPAWN_SETTING_QUERY, spawn ? 1 : 0, location.settings.id);
    }

    // Updates the welcome message that will be shown to players once they enter the |location|. The
    // |welcomeMessage| may be an empty string.
    async updateHouseWelcomeMessage(location, welcomeMessage) {
        await server.database.query(
            UPDATE_WELCOME_MESSAGE_SETTING_QUERY, welcomeMessage, location.settings.id);
    }

    // Updates the audio stream URL for the |location|. The |streamUrl| may be an empty string.
    async updateHouseStreamUrl(location, streamUrl) {
        console.log(streamUrl);
        await server.database.query(
            UPDATE_STREAM_URL_SETTING_QUERY, streamUrl, location.settings.id);
    }

    // Removes the |location| from the database.
    async removeLocation(location) {
        await server.database.query(REMOVE_LOCATION_QUERY, location.id);
    }

    // Removes the |parkingLot| from the database.
    async removeLocationParkingLot(parkingLot) {
        await server.database.query(REMOVE_PARKING_LOT_QUERY, parkingLot.id);
    }

    // Removes the house tied to |location| from the database.
    async removeHouse(location) {
        await server.database.query(REMOVE_HOUSE_QUERY, location.settings.id);
    }

    // Removes the |feature| from the |location| in the database.
    async removeHouseFeature(location, feature) {
        await server.database.query(REMOVE_HOUSE_FEATURE_QUERY, location.settings.id, feature);
    }

    // Removes the |vehicle| associated with the |location| from the database.
    async removeVehicle(vehicle) {
        await server.database.query(REMOVE_VEHICLE_QUERY, vehicle.id);
    }

    // Converts the |value| to one of the house access enumeration values.
    static toHouseAccessEnum(value) {
        switch (value) {
            case HouseSettings.ACCESS_EVERYBODY:
                return 'Everybody';
            case HouseSettings.ACCESS_FRIENDS_AND_GANG:
                return 'FriendsAndGang';
            case HouseSettings.ACCESS_FRIENDS:
                return 'Friends';
            case HouseSettings.ACCESS_PERSONAL:
                return 'Personal';
            default:
                throw new Error('Invalid house access value: ' + value);
        }
    }

    // Converts the |enum| to one of the house access values.
    static toHouseAccessValue(enumeration) {
        switch (enumeration) {
            case 'Everybody':
                return HouseSettings.ACCESS_EVERYBODY;
            case 'FriendsAndGang':
                return HouseSettings.ACCESS_FRIENDS_AND_GANG;
            case 'Friends':
                return HouseSettings.ACCESS_FRIENDS;
            case 'Personal':
                return HouseSettings.ACCESS_PERSONAL;
            default:
                throw new Error('Invalid house access enum: ' + enumeration);
        }
    }
}

export default HouseDatabase;
