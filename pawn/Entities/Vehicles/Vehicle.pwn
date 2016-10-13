// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

enum VehicleFlags {
    ValidVehicleFlag,
    PersistentVehicleFlag,  // DEPRECATED @ October 13th, 2016
    OpenWorldVehicle,
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

        this->toggleFlag(ValidVehicleFlag, true);

        m_colorsPaintJobAndInterior = 0;
        Cell->setByteValue(m_colorsPaintJobAndInterior, 0, primaryColor);
        Cell->setByteValue(m_colorsPaintJobAndInterior, 1, secondaryColor);
        Cell->setByteValue(m_colorsPaintJobAndInterior, 2, Vehicle::InvalidPaintjobId);
        Cell->setByteValue(m_colorsPaintJobAndInterior, 3, interiorId);
    }

    /**
     * Clean up the vehicle's current state after it has been removed from the gamemode. This makes
     * sure that the isValid() method no longer will return true.
     */
    public onDestroyed() {
        m_flags = 0;
    }

    // ---- PUBLIC GETTER AND SETTER METHODS -------------------------------------------------------

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
     * Retrieve the secondary color given to a vehicle.
     *
     * @return integer The secondary color of this vehicle.
     */
    public inline secondaryColor() {
        return (Cell->getByteValue(m_colorsPaintJobAndInterior, 1));
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
