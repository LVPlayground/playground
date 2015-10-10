// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * The vehicle flags determine what kind of vehicle it is, exactly. Should it be stored to the
 * database, is it locked for everyone but administrators and 
 */
enum VehicleFlags {
    // Is the vehicle stored in this slot valid?
    ValidVehicleFlag,

    // Is this vehicle persistent? This means that it has been stored in the database, and we need
    // to ask the vehicle storage manager to update it on any changes made to the vehicle.
    PersistentVehicleFlag,

    // The definition of an "open world" vehicle is one that isn't associated with any specific
    // feature and has been created by an administrator. Only these vehicles can be removed using
    // the generic /v and /vehicle commands.
    OpenWorldVehicle,

    // DO NOT ADD ANY MORE FLAGS ABOVE THIS LINE. STUFF WILL GO BAD IF YOU DO.

    // ---------------------------------------------------------------------------------------------
    // Persistent vehicle flags

    // Adds a nitrous oxide engine to the vehicle, also known as NOS.
    NitrousOxideEngineVehicleFlag,

    // Marks the vehicle as being only available for VIP members and crew of LVP.
    VeryImportantPlayerVehicle,

    // Marks the vehicle as being only available to administrators of LVP.
    AdministratorVehicle,
};

/**
 * This is the primary class curating vehicle-specific information in Las Venturas Playground's
 * vehicle management systems. It'll store basic information the vehicle's state and similar data,
 * and will be controlled and managed by the VehicleController class.
 *
 * Given the size of the MAX_VEHICLES constant, which currently is set to 2000, each property added
 * to this class will increase the gamemode's size by roughly 8 kilobytes. Be very careful, please.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class Vehicle <vehicleId (MAX_VEHICLES)> {
    // An Id for invalid vehicles in the gamemode, which therefore cannot be used. It's very
    // important for methods in this class to check against it, as it's a prime candidate for
    // creating array overflows.
    public const InvalidId = INVALID_VEHICLE_ID;

    // What is the Id we give to invalid paintjobs? This needs to be in the range of [0, 255] because
    // of the way we store it, and it can't be [0, 1, 2] because these are valid paintjobs.
    public const InvalidPaintjobId = 3;

    // What is the Id of this vehicle in the database, if it's a persistent vehicle?
    new m_databaseId;

    // What are the flags that currently apply to this vehicle? This is used to store whether it
    // should be locked for certain groups, should be stored, etcetera.
    new m_flags;

    // This property stores the vehicle's primary(0) and secondary(1) colors, the paintjob(2)
    // which has been applied to it and the interiorId(3) it has spawned in.
    new m_colorsPaintJobAndInterior;

    // What is the vehicle's saved position and facing angle?
    new Float: m_positionAndRotation[4];

    // ---- PRIVATE INLINE CONVENIENCE METHODS -----------------------------------------------------

    // Convenience method to toggle a flag on the vehicle.
    private inline toggleFlag(VehicleFlags: flag, bool: enabled) {
        Cell->setBitValue(m_flags, flag, enabled);
    }

    // Convenience method to determine whether a flag has been enabled.
    private inline hasFlag(VehicleFlags: flag) {
        return (Cell->getBitValue(m_flags, flag) == 1);
    }

    // ---- PUBLIC INLINE STATUS GETTERS -----------------------------------------------------------

    /**
     * Determine whether this vehicle is valid. That means that the Id is within range and it has
     * been registered within Las Venturas Playground.
     *
     * @return boolean Is the vehicle valid?
     */
    public inline bool: isValid() {
        return (vehicleId >= 0 && vehicleId < MAX_VEHICLES && this->hasFlag(ValidVehicleFlag));
    }

    /**
     * Retrieve whether this vehicle should be treated as a persistent vehicle. Persistent vehicles
     * will be stored in the database and loaded when the gamemode starts up.
     *
     * @return boolean Should this vehicle be persistent?
     */
    public inline bool: isPersistent() {
        return this->hasFlag(PersistentVehicleFlag);
    }

    // ---- PUBLIC FUNCTIONAL METHODS --------------------------------------------------------------

    /**
     * Initialize the internal state of a new vehicle. All member variables and flags should be re-
     * set at this point, making sure that we can make a clean start.
     *
     * @param primaryColor Primary color the vehicle has spawned with.
     * @param secondaryColor Secondary color the vehicle has spawned with.
     * @param interiorId Id of the interior to which the vehicle has spawned.
     */
    public initialize(primaryColor, secondaryColor, interiorId) {
        m_flags = 0;
        m_databaseId = Vehicle::InvalidId;

        this->toggleFlag(ValidVehicleFlag, true);

        m_colorsPaintJobAndInterior = 0;
        Cell->setByteValue(m_colorsPaintJobAndInterior, 0, primaryColor);
        Cell->setByteValue(m_colorsPaintJobAndInterior, 1, secondaryColor);
        Cell->setByteValue(m_colorsPaintJobAndInterior, 2, Vehicle::InvalidPaintjobId);
        Cell->setByteValue(m_colorsPaintJobAndInterior, 3, interiorId);
    }

    /**
     * Applies persistent flags from the vehicle which have been loaded from the database. These
     * contain features such as whether the vehicle has NOS and what it's access level is.
     *
     * @param flags The flags which should be applied to this vehicle.
     */
    public applyPersistentFlags(flags) {
        if (Cell->getBitValue(flags, NitrousOxideEngineVehicleFlag) == 1)
            this->setHasNitrousOxideEngine(true);

        if (Cell->getBitValue(flags, VeryImportantPlayerVehicle) == 1)
            this->setVeryImportantPlayerVehicle(true);

        if (Cell->getBitValue(flags, AdministratorVehicle) == 1)
            this->setAdministratorVehicle(true);

        // TODO: I'm sure there's some bit magic we can do here to make it easier, and handle the
        // individual feature cases afterwards.
    }

    /**
     * Compiles an integer representing the persistent flags for this vehicle. These will be restored
     * when the vehicle has been loaded again from the database.
     *
     * @return integer The flags which persistently apply to this vehicle.
     */
    public persistentFlags() {
        new flags = 0;
        if (this->hasFlag(NitrousOxideEngineVehicleFlag))
            Cell->setBitValue(flags, NitrousOxideEngineVehicleFlag, true);

        if (this->hasFlag(VeryImportantPlayerVehicle))
            Cell->setBitValue(flags, VeryImportantPlayerVehicle, true);

        if (this->hasFlag(AdministratorVehicle))
            Cell->setBitValue(flags, AdministratorVehicle, true);

        return flags;
    }

    /**
     * Toggle whether the vehicle is a persistent vehicle. They will be serialized to a database by
     * the vehicle storage manager, and be excluded from certain auto-cleanup operations.
     *
     * @param bePersistent Should the vehicle be labeled as being persistent?
     */
    public setVehiclePersistent(bool: persistent) {
        new bool: currentlyPersistent = this->isPersistent();
        if (currentlyPersistent == persistent)
            return; // nothing has changed about this vehicle's settings.

        if (persistent == true) {
            // This vehicle is being promoted to being a persistent vehicle.
            VehicleStorageManager->requestStoreVehicle(vehicleId);
            this->toggleFlag(PersistentVehicleFlag, true);
        } else {
            // We're requesting the vehicle to surrender its persistent status.
            VehicleStorageManager->requestRemoveVehicle(vehicleId);
            this->toggleFlag(PersistentVehicleFlag, false);
        }
    }

    /**
     * Clean up the vehicle's current state after it has been removed from the gamemode. This makes
     * sure that the isValid() method no longer will return true.
     */
    public onDestroyed() {
        if (this->isPersistent())
            VehicleStorageManager->requestRemoveVehicle(vehicleId);

        m_databaseId = Vehicle::InvalidId;
        m_flags = 0;
    }

    // ---- PUBLIC GETTER AND SETTER METHODS -------------------------------------------------------

    /**
     * Returns the Id of this vehicle as it has been stored in the database, if it is a persistent
     * vehicle which we either loaded or was created during this session.
     *
     * @return integer Id of this vehicle in the database, or Vehicle::InvalidId.
     */
    public databaseId() {
        return (m_databaseId);
    }

    /**
     * Changes the database Id which this vehicle has been associated with. This method should only
     * be called from the VehicleStorageManager, which' responsibility is to load and store all
     * the vehicles in the database.
     *
     * @param databaseId Id this vehicle is represented with in the database.
     */
    public setDatabaseId(databaseId) {
        this->toggleFlag(PersistentVehicleFlag, true);
        m_databaseId = databaseId;
    }

    /**
     * Returns whether access to this vehicle should be restricted to VIPs on Las Venturas Playground.
     * We give VIPs some additional goodies because they donated to the server.
     *
     * @return boolean Is access to this vehicle restricted to VIPs?
     */
    public inline bool: isVeryImportantPlayerVehicle() {
        return this->hasFlag(VeryImportantPlayerVehicle);
    }

    /**
     * Sets whether this vehicle should be restricted to VIPs on the server. This setting will
     * persist in case the vehicle is a persistent vehicle.
     *
     * @param restricted Should access to the vehicle be restricted?
     */
    public setVeryImportantPlayerVehicle(bool: restricted) { 
        this->toggleFlag(VeryImportantPlayerVehicle, restricted);
    }

    /**
     * Returns whether access to this vehicle should be restricted to administrators and Management
     * members of the server. This will be strictly enforced.
     *
     * @return boolean Is access to this vehicle restricted to administrators?
     */
    public inline bool: isAdministratorVehicle() {
        return this->hasFlag(AdministratorVehicle);
    }

    /**
     * Sets whether access to this vehicle should be restricted to administrators. The setting will
     * persist between sessions in case the vehicle is persistent itself.
     *
     * @param restricted Should access to the vehicle be restricted?
     */
    public setAdministratorVehicle(bool: restricted) {
        this->toggleFlag(AdministratorVehicle, restricted);
    }

    /**
     * Retrieve the primary color of a vehicle. As SA-MP does not provide a native function for
     * doing so, implement it on top of our data cell.
     *
     * @return integer The primary color of this vehicle.
     */
    public inline primaryColor() {
        return (Cell->getByteValue(m_colorsPaintJobAndInterior, 0));
    }

    /**
     * Set the primary color of this vehicle. It's important that we use this method instead of
     * the native provided by SA-MP, as we'd like the status of this vehicle to be up to date.
     *
     * @param primaryColor The primary color to change into for this vehicle.
     */
    public setPrimaryColor(primaryColor) {
        ChangeVehicleColor(vehicleId, primaryColor, Cell->getByteValue(m_colorsPaintJobAndInterior, 1));
        Cell->setByteValue(m_colorsPaintJobAndInterior, 0, primaryColor);
    }

    /**
     * Retrieve the secondary color given to a vehicle.
     *
     * @return integer The secondary color of this vehicle.
     */
    public inline secondaryColor() {
        return (Cell->getByteValue(m_colorsPaintJobAndInterior, 1));
    }

    /**
     * Update the secondary color. Like updating the primary color, this method is provided in order
     * to allow us to keep up to date with the data.
     *
     * @param secondaryColor The secondary color to change into for this vehicle.
     */
    public setSecondaryColor(secondaryColor) {
        ChangeVehicleColor(vehicleId, Cell->getByteValue(m_colorsPaintJobAndInterior, 0), secondaryColor);
        Cell->setByteValue(m_colorsPaintJobAndInterior, 1, secondaryColor);
    }

    /**
     * Updating both colors at once if the more common operation, so provide that as well.
     *
     * @param primaryColor The primary color the vehicle should be painted in.
     * @param secondaryColor The secondary color the vehicle should be painted in.
     */
    public setColors(primaryColor, secondaryColor) {
        ChangeVehicleColor(vehicleId, primaryColor, secondaryColor);
        Cell->setByteValue(m_colorsPaintJobAndInterior, 0, primaryColor);
        Cell->setByteValue(m_colorsPaintJobAndInterior, 1, secondaryColor);
    }

    /**
     * Retrieve the paint job which has been applied to the vehicle.
     *
     * @return integer The paint job which has been applied to this vehicle.
     */
    public inline paintJob() {
        return (Cell->getByteValue(m_colorsPaintJobAndInterior, 2));
    }

    /**
     * Update the paint job applied to this vehicle. As with other methods, besides updating the
     * visual paint job itself, the internal state will also be updated. Setting the paint job
     * id to "3" will reset the appearance to a normal vehicle.
     *
     * @param paintJobId Id of the paint job to apply to this value.
     */
    public setPaintJob(paintJobId) {
        ChangeVehiclePaintjob(vehicleId, paintJobId);
        Cell->setByteValue(m_colorsPaintJobAndInterior, 2, paintJobId);
    }

    /**
     * Retrieve the Interior Id to which the vehicle has been linked.
     *
     * @return integer The Interior Id to which this vehicle has been linked.
     */
    public inline interiorId() {
        return (Cell->getByteValue(m_colorsPaintJobAndInterior, 3));
    }

    /**
     * Update the interior this vehicle is linked to, and reflact that in the stored state.
     *
     * @param interiorId Id of the interior this vehicle should be linked to.
     */
    public setInteriorId(interiorId) {
        LinkVehicleToInterior(vehicleId, interiorId);
        Cell->setByteValue(m_colorsPaintJobAndInterior, 3, interiorId);
    }

    /**
     * Returns the model Id of this vehicle. If the vehicle does not exist, the value "0" will be
     * returned which *could* cause an overflow. Beware.
     *
     * @return integer Model Id of the vehicle, in the range of [400, 612].
     */
    public inline modelId() {
        return GetVehicleModel(vehicleId);
    }

    /**
     * Returns whether this vehicle is an Open World vehicle. The definition of this is any vehicle
     * which has been created with the "/v" or "/vehicle" commands, and is not owned by a system.
     *
     * @return boolean Whether this vehicle is an Open World vehicle.
     */
    public inline bool: isOpenWorldVehicle() {
        return this->hasFlag(OpenWorldVehicle);
    }

    /**
     * Marks this vehicle as being an Open World vehicle. This action is not reversible. After calling
     * this method, any administrator can remove it using the /v destroy command.
     */
    public inline markOpenWorldVehicle() {
        this->toggleFlag(OpenWorldVehicle, true);
    }

    /**
     * Returns whether this vehicle is equipped with a nitrous oxide engine.
     *
     * @return boolean Whether this vehicle has a NOS engine.
     */
    public inline bool: hasNitrousOxideEngine() {
        return this->hasFlag(NitrousOxideEngineVehicleFlag);
    }

    /**
     * Sets whether this vehicle should be equipped with a nitrous oxide engine, better known as
     * NOS. This will persist on a vehicle, and we'll re-add NOS when the vehicle respawns.
     *
     * @param engine Should the vehicle have a nitrous engine?
     */
    public setHasNitrousOxideEngine(bool: engine) {
        if (this->hasNitrousOxideEngine() == engine)
            return; // no change in behaviour.

        new modelId = this->modelId();
        if (VehicleModel(modelId)->isNitroInjectionAvailable() == false)
            return; // this vehicle cannot have nitro.

        this->toggleFlag(NitrousOxideEngineVehicleFlag, engine);
        if (engine == true /** give the vehicle nitro **/)
            AddVehicleComponent(vehicleId, 1010);
        else /** remove nitro from the vehicle **/
            RemoveVehicleComponent(vehicleId, 1010);
    }

    /**
     * Retrieve the last saved position and rotation for a vehicle.
     *
     * @param positionX A float to store the X-position in.
     * @param positionY A float to store the Y-position in.
     * @param positionZ A float to store the Z-position in.
     * @param rotation A float to store the rotation in.
     */
    public getPositionAndRotation(&Float: positionX, &Float: positionY, &Float: positionZ, &Float: rotation) {
        positionX = m_positionAndRotation[0];
        positionY = m_positionAndRotation[1];
        positionZ = m_positionAndRotation[2];
        rotation = m_positionAndRotation[3];
    }

    /**
     * Set the current saved position and rotation for a vehicle.
     *
     * @param positionX A float to retrieve the X-position from.
     * @param positionY A float to retrieve the Y-position from.
     * @param positionZ A float to retrieve the Z-position from.
     * @param rotation A float to retrieve the rotation from.
     */
    public setPositionAndRotation(Float: positionX, Float: positionY, Float: positionZ, Float: rotation) {
        m_positionAndRotation[0] = positionX;
        m_positionAndRotation[1] = positionY;
        m_positionAndRotation[2] = positionZ;
        m_positionAndRotation[3] = rotation;
    }
};
