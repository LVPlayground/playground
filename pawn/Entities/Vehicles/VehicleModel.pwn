// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

// How many vehicle models exist in GTA San Andreas?
const NumberOfVehicleModels = 611 /** highest Id **/ - 400 /** lowest Id **/ + 1 /** numbers are inclusive **/;

// A global empty string variable for when we need to return the name of an invalid vehicle model.
new emptyString[8];

/**
 * We can use a maximum of 31 flags to identify unique capabilities or characteristics of a vehicle
 * model. This enumeration casts the given values to integers.
 */
enum _: VehicleModelFlags {
    // Indicates that a vehicle model is a remote controllable vehicle.
    RemoteControllableVehicleFlag = 0x1,

    // Does this vehicle need to be spawned with AddStaticVehicle instead of CreateVehicle?
    StaticVehicleFlag = 0x2,

    // Is this vehicle a truck, and can is thus have trailers by itself?
    CanHaveTrailerVehicleFlag = 0x4,

    // Indicates that this vehicle is a trailer, attachable to other vehicles.
    TrailerVehicleFlag = 0x8,

    // Is this vehicle a helicopter (thus able to fly)?
    HelicopterVehicleFlag = 0x10,

    // Is this vehicle an airplane (and thus able to fly)?
    AirplaneVehicleFlag = 0x20,

    // Is this vehicle a boat (and thus can be controlled on water)?
    BoatVehicleFlag = 0x40,

    // Is this vehicle a bike?
    BikeVehicleFlag = 0x80,

    // Is this vehicle a bus (and thus can have more than 2 passengers)?
    BusVehicleFlag = 0x100,

    // Indicates that this vehicle can be modified at Transfender.
    TransfenderModificationFlag = 0x200,

    // Indicates that this vehicle can be modified at a Loco Low Co.
    LocoLowCoModificationFlag = 0x400,

    // Indicates that this vehicle can be modified at Wheel Arch Angels.
    WheelArchAngelsModificationFlag = 0x800,

    // Indicates that this vehicle does not support NOS (nitro injections).
    DisableNitroInjectionVehicleFlag = 0x1000,

    // Marks this vehicle as being unable to be created (i.e. because it's useless).
    DisableCreationVehicleFlag = 0x2000,

    // Indicates that this vehicle is an automobile.
    AutomobileVehicleFlag = 0x4000,
};

/**
 * Returns whether the given component Id represents a custom set of wheels. We can be a lot easier
 * on which vehicles these can be applied to, given that Grand Theft Auto treats them as just a
 * different set of textures with slightly different surface handling.
 *
 * @param componentId Id of the component to verify for whether it's a set of wheels.
 * @return boolean Whether this component Id represents a set of custom wheels.
 */
bool: IsComponentCustomWheels(componentId) {
    return (componentId >= 1073 && componentId <= 1085) ||
           (componentId >= 1096 && componentId <= 1098) ||
           (componentId == 1025);
}

/**
 * Each of the 211 vehicle models available in Grand Theft Auto: San Andreas has unique constraints,
 * settings and characteristics, and of course a unique name. This class provides quick and easy
 * accessors to each of them, including for more complicated data such as a vehicle's sizes.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class VehicleModel <modelId (NumberOfVehicleModels)> {
    // What is the highest model Id avaiable to vehicles in San Andreas?
    public const HighestModelId = 611;

    // What is the lowest model Id available to vehicles in San Andreas?
    public const LowestModelId = 400;

    // Invalid model Ids (outside the valid range) will be represented with this value.
    public const InvalidId = -1;

    // What is the name of this vehicle model?
    new m_modelName[18];

    // Stores the flags which are relevant to this vehicle model.
    new m_modelFlags;

    // How many unique models are being used on Las Venturas Playground right now?
    new static m_modelUsageCount;

    // How often is this vehicle being used in the game?
    new m_usageCount;

    /**
     * Initializes this VehicleModel instance with the information we'll receive from the Vehicle
     * Model Data. This is the only method in which we modify this class' data.
     */
    public initialize(name[], flags) {
        strncpy(m_modelName, name, sizeof(m_modelName));
        m_modelFlags = flags;
        m_usageCount = 0;
    }

    /**
     * Uses the passed model Id, which is expected to be in the range of [400, 611], to validate
     * that it indeed is a valid and usable vehicle.
     *
     * @return boolean Returns whether the given vehicle model Id is valid.
     */
    public inline bool: isValidVehicleModel() {
        return (modelId >= VehicleModel::LowestModelId && modelId <= VehicleModel::HighestModelId);
    }

    /**
     * Increases the reference count on this given vehicle. If this is the first instance of this
     * model, we'll increase the global model usage count as well.
     *
     * @param modelId Id of the model being referenced. Implicitly passed.
     */
    public static increaseReferenceCount(modelId) {
        if (m_usageCount[modelId - VehicleModel::LowestModelId] == 0)
            ++m_modelUsageCount;

        ++m_usageCount[modelId - VehicleModel::LowestModelId];
    }

    /**
     * Returns how many models have currently been created in Las Venturas Playground.
     *
     * @return integer The amount of unique models currently in the game.
     */
    public static inline globalModelCount() {
        return m_modelUsageCount;
    }

    /**
     * Returns how many vehicles have been created in Las Venturas Playground for this very model.
     * Since a model Id will be passed, we need to declare this method as being static.
     *
     * @return integer The number of vehicles using this model Id.
     */
    public static inline vehicleCount(modelId) {
        return m_usageCount[modelId - VehicleModel::LowestVehicleId];
    }

    /**
     * Returns the name of the vehicle with the given model Id. If the given vehicle Id is invalid,
     * then an empty string will be returned instead.
     *
     * @param modelId Id of the vehicle model [400, 611] to check a flag of.
     * @return string Name of the vehicle, as a string. Should be treated as a const.
     */
    public static inline nameString(modelId) {
        return ((modelId >= VehicleModel::LowestModelId && modelId <= VehicleModel::HighestModelId) ? m_modelName[modelId - VehicleModel::LowestModelId] : emptyString);
    }

    /**
     * Determines whether a certain flag has been set for the vehicle model as indicated by the Id.
     * We'll validate whether the Id is correct, and then check the given flag against the flags of
     * the vehicle model that's being checked for.
     *
     * @param modelId Id of the vehicle model [400, 611] to check a flag of.
     * @param flag The flag which we'll should be checking for.
     * @return boolean Whether the vehicle model Id is valid, and the flag is set.
     */
    private static inline bool: hasFlag(modelId, VehicleModelFlags: flag) {
        return (modelId >= VehicleModel::LowestModelId && modelId <= VehicleModel::HighestModelId && (m_modelFlags[modelId - VehicleModel::LowestModelId] & flag) == flag);
    }

    /**
     * Determines whether a certain flag has been set for the vehicle model as indicated by the Id.
     * No validations of the modelId parameter will be done, so use with care.
     *
     * @param modelId Id of the vehicle model [400, 611] to check a flag of.
     * @param flag The flag which we'll should be checking for.
     * @return boolean Whether the given flag is set.
     */
    private static inline bool: hasFlagUnchecked(modelId, VehicleModelFlags: flag) {
        return ((m_modelFlags[modelId - VehicleModel::LowestModelId] & flag) == flag);
    }

    /**
     * Returns whether the vehicle represented by this model Id is a remote controllable vehicle.
     * These vehicles need special handling in allowing players to enter them.
     *
     * @param modelId Id of the vehicle model. Implicitly passed.
     * @return boolean Is this model a remote controllable vehicle?
     */
    public static inline bool: isRemoteControllableVehicle(modelId) {
        return this->hasFlag(modelId, RemoteControllableVehicleFlag);
    }

    /**
     * Some vehicles need to be created with AddStaticVehicle because of San Andreas: Multiplayer
     * constraints. An example of this would be trains. We mark certain vehicle models as needing
     * this so the vehicle manager can automatically do the right thing.
     *
     * @param modelId Id of the vehicle model. Implicitly passed.
     * @return boolean Should vehicles using this model Id be spawned staticly?
     */
    public static inline bool: isStaticVehicle(modelId) {
        return this->hasFlag(modelId, StaticVehicleFlag);
    }

    /**
     * Returns whether this model Id represents an helicopter.
     *
     * @param modelId Id of the vehicle model to check against.
     * @return boolean Is this model representing an helicopter?
     */
    public static inline bool: isHelicopter(modelId) {
        return this->hasFlag(modelId, HelicopterVehicleFlag);
    }

    /**
     * Returns whether this model Id represents an airplane.
     *
     * @param modelId Id of the vehicle model to check against.
     * @return boolean Is this model representing an airplane?
     */
    public static inline bool: isAirplane(modelId) {
        return this->hasFlag(modelId, AirplaneVehicleFlag);
    }

    /**
     * Returns whether this model Id represents an automobile.
     * 
     * @param modelId Id of the vehicle model to check against.
     * @return boolean Is this model representing an automobile?
     */
    public static inline bool: isAutomobile(modelId) {
        return this->hasFlag(modelId, AutomobileVehicleFlag);
    }

    /**
     * Returns whether this model Id represents a bike.
     *
     * @param modelId Id of the vehicle model to check against.
     * @return boolean Is this model representing a bike?
     */
    public static inline bool: isBike(modelId) {
        return this->hasFlag(modelId, BikeVehicleFlag);
    }

    /**
     * Returns whether this vehicle model Id represents a trailer. Trailers cannot be driven by
     * players, and must be positioned in a different way.
     *
     * @param modelId Id of the model which might be a trailer.
     * @return boolean Whether this model Id represents a trailer.
     */
    public static inline bool: isTrailer(modelId) {
        return this->hasFlag(modelId, TrailerVehicleFlag);
    }

    /**
     * Returns whether nitro injection is available for this vehicle. It's available on all vehicles
     * except for boats and ones explicitly marked as being unsupportive.
     *
     * @param modelId Id of the vehicle model. Implicitly passed.
     * @return boolean Does this vehicle model support nitro injection?
     * @todo Make this inline once inline methods can have multiple lines in the PreCompiler.
     */
    public static bool: isNitroInjectionAvailable(modelId) {
        return this->isValidVehicleModel(modelId) &&
               this->hasFlagUnchecked(modelId, TrailerVehicleFlag) == false &&
               this->hasFlagUnchecked(modelId, HelicopterVehicleFlag) == false &&
               this->hasFlagUnchecked(modelId, AirplaneVehicleFlag) == false &&
               this->hasFlagUnchecked(modelId, BoatVehicleFlag) == false &&
               this->hasFlagUnchecked(modelId, BikeVehicleFlag) == false &&
               this->hasFlagUnchecked(modelId, DisableNitroInjectionVehicleFlag) == false;
    }

    /**
     * In case we receive an update from a player informing us about a modification they made to
     * their vehicle, which unfortunately are being processed on the client side, a way of validating
     * whether the made modification is appropriate for this vehicle is necessary.
     *
     * @param modelId Id of the vehicle model. Implicitly passed.
     * @param componentId Id of the component which is being applied to the vehicle.
     * @return boolean Is the given component valid for this vehicle?
     */
    public static bool: isValidComponent(modelId, componentId) {
        // First check whether the component is in a range of known vehicle modifications. If it's
        // not, then we can be fairly certain that this is a crash attempt.
        if (componentId <= 1001 || componentId >= 1189)
            return false;

        // Then check whether the applied modification is nitrogen oxide injection (nos), the
        // stronger hydrolics, stereo bass boost or custom wheels. We can treat them separately.
        if ((componentId >= 1008 && componentId <= 1010) || // nitrogen
             componentId == 1086 || componentId == 1087  || // hydrolics, stereo
             IsComponentCustomWheels(componentId)) {
            // It is. Disallow this modification if the vehicle doesn't allow nitrogen injection.
            if (this->isNitroInjectionAvailable(modelId) == false)
                return false;
        }

        // TODO: Check modifications based on the vehicle model Id.

        // By default allow all the modifications for now. If we see a large number of crashes
        // related to vehicle modifications, we can be stricter in this regard.
        return true;
    }
};
