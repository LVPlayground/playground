// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * The MySQL plugin will automatically call this method once vehicle information from the database
 * is available in the cache. Load the vehicles, and then be sure to free up the result.
 *
 * @param resultId Id of the result in which the data is stored.
 * @param dataId Additional data Id. Unused.
 */
forward VehicleLayoutRequestCallback(resultId, dataId);
public VehicleLayoutRequestCallback(resultId, dataId) {
    VehicleStorageManager->onReceivedVehicleInfo(resultId);
    DatabaseResult(resultId)->free();
}

/**
 * Automatically invoked by the MySQL plugin when a vehicle has been stored in the database, and a
 * newly inserted Id is available. We need to mark the vehicle as having a persistent database Id.
 *
 * @param resultId Id of the result set in which the data is stored.
 * @param vehicleId Id of the vehicle which this request was for.
 */
forward VehicleStoreRequestCallback(resultId, vehicleId);
public VehicleStoreRequestCallback(resultId, vehicleId) {
    new databaseId = DatabaseResult(resultId)->insertId();

    VehicleStorageManager->onFinishedStoreRequest(vehicleId, databaseId);
    DatabaseResult(resultId)->free();
}

/**
 * Vehicles will be stored in the main MySQL database, so we need to load them while the gamemode is
 * starting up, and update them whenever something happens to a certain vehicle, such as visual
 * amendments or it being removed from Las Venturas Playground altogether.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class VehicleStorageManager {
    // The prepared statement used for storing an existing vehicle in the database.
    new m_storeVehicleStatement;

    // The prepared statement used for updating a vehicle's persistent information.
    new m_updateVehicleStatement;

    // The prepared statement we use to "remove" vehicles from the database.
    new m_removeVehicleStatement;

    /**
     * When the gamemode loads, we need to prepare the vehicles which should be spawned in Las
     * Venturas Playground. Request them from the database, so we can handle that later on.
     */
    @list(OnGameModeInit)
    public initialize() {
        m_storeVehicleStatement = Database->prepare("INSERT INTO " ...
                                                    "    vehicles " ...
                                                    "    (model_id, vehicle_flags, position_x, position_y, position_z, rotation, primary_color, " ...
                                                    "     secondary_color, paintjob, interior_id, vehicle_created, vehicle_removed) " ...
                                                    "VALUES " ...
                                                    "    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), '0000-00-00 00:00:00')", "iiffffiiii");

        m_updateVehicleStatement = Database->prepare("UPDATE " ...
                                                     "    vehicles " ...
                                                     "SET " ...
                                                     "    vehicle_flags = ?, " ...
                                                     "    position_x = ?, " ...
                                                     "    position_y = ?, " ...
                                                     "    position_z = ?, " ...
                                                     "    rotation = ?, " ...
                                                     "    primary_color = ?, " ...
                                                     "    secondary_color = ?, " ...
                                                     "    paintjob = ? " ...
                                                     "WHERE " ...
                                                     "    vehicle_id = ?", "iffffiiii");

        m_removeVehicleStatement = Database->prepare("UPDATE " ...
                                                     "    vehicles " ...
                                                     "SET " ...
                                                     "    vehicle_removed = NOW() " ...
                                                     "WHERE " ...
                                                     "    vehicle_id = ?", "i");

        // Finish by retrieving all existing vehicles from the database, which makes sure that any
        // player who joins the server will have the ability to drive around in vehicles.
        Database->query("SELECT " ...
                        "    vehicle_id, model_id, vehicle_flags, position_x, position_y, position_z, " ...
                        "    rotation, paintjob, primary_color, secondary_color, interior_id " ...
                        "FROM " ...
                        "    vehicles " ...
                        "WHERE " ...
                        "    vehicle_removed = '0000-00-00 00:00:00'", "VehicleLayoutRequestCallback");
    }

    /**
     * When the database replies with the vehicles for the current gamemode session, we'll iterate
     * through all the results and load the intended vehicles for each of them.
     *
     * @param resultId Id of the result which contains our information.
     */
    public onReceivedVehicleInfo(resultId) {
        if (DatabaseResult(resultId)->count() == 0)
            return; // no vehicles are available in the database.

        new vehiclesLoaded = 0;
        while (DatabaseResult(resultId)->next()) {
            new vehicleId = VehicleManager->createVehicle(
                /** model_id **/ DatabaseResult(resultId)->readInteger("model_id"),
                /** positionX **/ DatabaseResult(resultId)->readFloat("position_x"),
                /** positionY **/ DatabaseResult(resultId)->readFloat("position_y"),
                /** positionZ **/ DatabaseResult(resultId)->readFloat("position_z"),
                /** rotation **/ DatabaseResult(resultId)->readFloat("rotation"),
                /** primaryColor **/ DatabaseResult(resultId)->readInteger("primary_color"),
                /** secondaryColor **/ DatabaseResult(resultId)->readInteger("secondary_color"),
                /** interiorId **/ DatabaseResult(resultId)->readInteger("interior_id"));

            if (vehicleId == Vehicle::InvalidId)
                continue; // we were unable to load this vehicle for some reason.

            Vehicle(vehicleId)->setDatabaseId(DatabaseResult(resultId)->readInteger("vehicle_id"));
            Vehicle(vehicleId)->markOpenWorldVehicle();

            Vehicle(vehicleId)->applyPersistentFlags(DatabaseResult(resultId)->readInteger("vehicle_flags"));

            new paintjobId = DatabaseResult(resultId)->readInteger("paintjob");
            if (paintjobId != Vehicle::InvalidPaintjobId)
                Vehicle(vehicleId)->setPaintJob(paintjobId);

            ++vehiclesLoaded;
        }

        // Output an error to the console when no vehicles were retrieved.
        if (vehiclesLoaded == 0)
            printf("[VehicleController] ERROR: Could not load any vehicles.");
    }

    /**
     * Executes a MySQL query which aims to store this vehicle in the database, and thereby making
     * it a persistent vehicle. We'll take its current location and status as the guideline.
     *
     * @param vehicleId Id of the vehicle which should be made persistent.
     */
    public requestStoreVehicle(vehicleId) {
        if (Vehicle(vehicleId)->isValid() == false)
            return; // no valid vehicle has been provided to this method.

        if (Vehicle(vehicleId)->isPersistent() == true)
            return; // the vehicle already is persistent, no reason to store it again.

        new Float: position[3], Float: rotation;
        GetVehiclePos(vehicleId, position[0], position[1], position[2]);
        GetVehicleZAngle(vehicleId, rotation);

        Vehicle(vehicleId)->setPositionAndRotation(position[0], position[1], position[2], rotation);

        // The compiler spins in an infinite loop if we call this method directly in Database::execute().
        new paintJob = Vehicle(vehicleId)->paintJob(), persistentFlags = Vehicle(vehicleId)->persistentFlags();

        // model_id, position_x, position_y, position_z, rotation, primary_color, secondary_color, interior_id
        Database->execute(m_storeVehicleStatement, "VehicleStoreRequestCallback", vehicleId, \
            Vehicle(vehicleId)->modelId(), persistentFlags, position[0], position[1], \
            position[2], rotation, Vehicle(vehicleId)->primaryColor(), Vehicle(vehicleId)->secondaryColor(), \
            paintJob, Vehicle(vehicleId)->interiorId());
    }

    /**
     * Invoked when the request to store a vehicle in the database has succeeded and we've received
     * the persistent database Id from the newly inserted row.
     *
     * @param vehicleId Id of the vehicle which now is a persistent vehicle.
     * @param databaseId Id of the vehicle in the database.
     */
    public onFinishedStoreRequest(vehicleId, databaseId) {
        if (Vehicle(vehicleId)->isValid() == false)
            return; // uhhh, the vehicle was removed in the last 0.05 seconds?

        Vehicle(vehicleId)->setDatabaseId(databaseId);
    }

    /**
     * Request the vehicle's data in the database to be updated with whatever values are current
     * right now. This is useful for when the administrator changed the colors or position.
     *
     * @param vehicleId Id of the vehicle which should be stored in the database.
     */
    public requestUpdateVehicle(vehicleId) {
        if (Vehicle(vehicleId)->isValid() == false)
            return; // no valid vehicle has been provided to this method.

        if (Vehicle(vehicleId)->isPersistent() == false)
            return; // the vehicle is not persistent, there's nothing to update.

        new Float: position[3], Float: rotation;
        GetVehiclePos(vehicleId, position[0], position[1], position[2]);
        GetVehicleZAngle(vehicleId, rotation);

        Vehicle(vehicleId)->setPositionAndRotation(position[0], position[1], position[2], rotation);

        // The compiler spins in an infinite loop if we call this method directly in Database::execute().
        new paintJob = Vehicle(vehicleId)->paintJob(), persistentFlags = Vehicle(vehicleId)->persistentFlags();

        Database->execute(m_updateVehicleStatement, "", 0, persistentFlags, position[0], position[1], \
            position[2], rotation, Vehicle(vehicleId)->primaryColor(), Vehicle(vehicleId)->secondaryColor(), \
            paintJob, Vehicle(vehicleId)->databaseId());
    }

    /**
     * Executes a MySQL query which aims to remove this vehicle from the database. Because this is
     * an asynchronous operation, we don't know whether it will succeed or not.
     *
     * @param vehicleId Id of the vehicle which should be removed from the database.
     */
    public requestRemoveVehicle(vehicleId) {
        if (Vehicle(vehicleId)->isValid() == false)
            return; // no valid vehicle has been provided to this method.

        if (Vehicle(vehicleId)->isPersistent() == false)
            return; // the vehicle isn't persistent, there is nothing to remove.

        Database->execute(m_removeVehicleStatement, "", 0, Vehicle(vehicleId)->databaseId());
    }
};