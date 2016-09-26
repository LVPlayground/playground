// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Private symbol ensuring that the VehicleModel constructor won't be used.
const PrivateSymbol = Symbol('Please use the static methods.');

// JSON file in which information about the available vehicle models is stored.
const VehicleModelDataFile = 'data/vehicle_models.json';

// Cache of VehicleModel instances by their Id, name and category.
const modelsById = new Map();
const modelsByName = new Map();
const modelsByCategory = new Map();

// An instance of the VehicleModel class represents the data available for a particular model. There
// are static methods available on the function to conveniently get access to them.
class VehicleModel {
    // Returns an iterator to all known vehicle models.
    static* getAll() {
        yield* modelsById.values();
    }

    // Returns a VehicleModel instance by its |modelId|. Returns NULL when given an invalid Id.
    static getById(modelId) {
        return modelsById.get(modelId) || null;
    }

    // Returns a VehicleModel instance by its |modelName|. Returns NULL when given an invalid name.
    static getByName(modelName) {
        return modelsByName.get(modelName) || null;
    }

    // Returns an iterator of VehicleModel instances by their |category|, which must be one of the
    // VehicleModel.CATEGORY_* constants. Throws when given an invalid category.
    static* getByCategory(category) {
        const models = modelsByCategory.get(category);
        if (!models)
            throw new Error('Invalid category given: ' + category);

        yield* models;
    }

    // Returns an iterator of VehicleModel instances by their |...categories|, which must be part
    // of the VehicleModel.CATEGORY_* constants. Throws when given an invalid category.
    static* getByCategories(...categories) {
        for (const category of categories) {
            const models = modelsByCategory.get(category);
            if (!models)
                throw new Error('Invalid category given: ' + category);

            yield* models;
        }
    }

    // ---------------------------------------------------------------------------------------------

    // Initializes the VehicleModel data from the VehicleModelDataFile.
    static initialise(privateSymbol) {
        if (privateSymbol !== PrivateSymbol)
            throw new TypeError('Illegal call. The VehicleModel data is already initialised.');

        const modelInfos = JSON.parse(readFile(VehicleModelDataFile));
        modelInfos.forEach(modelInfo => {
            const model = new VehicleModel(privateSymbol, modelInfo);

            if (modelsById.has(model.id))
                throw new Error('Duplicated vehicle model Id: ' + model.id);

            if (modelsByName.has(model.name))
                throw new Error('Duplicated vehicle model name: ' + model.name);

            modelsById.set(model.id, model);
            modelsByName.set(model.name, model);

            for (const category of model.categories) {
                if (!modelsByCategory.has(category))
                    modelsByCategory.set(category, new Set());

                modelsByCategory.get(category).add(model);
            }

            // TODO: Add additional maps for data we want to be able to key by.
        });

        if (modelsById.size != 212 /* total number of vehicle models */)
            throw new Error('Expected data for 212 vehicle models to be loaded.');
    }

    // ---------------------------------------------------------------------------------------------

    constructor(privateSymbol, modelInfo) {
        if (privateSymbol !== PrivateSymbol)
            throw new TypeError('Illegal constructor. Use the static methods instead.');

        if (typeof modelInfo.id !== 'number' || modelInfo.id < 400 || modelInfo.id > 611)
            throw new Error('Vehicle model Id must be between 400 and 611.', modelInfo);

        if (typeof modelInfo.name !== 'string' || !modelInfo.name.length)
            throw new Error('Vehicle model name must be a non-empty string.', modelInfo);

        if (!Array.isArray(modelInfo.categories) || !modelInfo.categories)
            throw new Error('Vehicle model categories must be a non-empty array.', modelInfo);

        this.id_ = modelInfo.id;
        this.name_ = modelInfo.name;

        this.categories_ = new Set();
        modelInfo.categories.forEach(category => {
            const categoryKey = 'CATEGORY_' + category.replace(/\s/g, '_').toUpperCase();
            if (!VehicleModel.hasOwnProperty(categoryKey))
                throw new Error('Vehicle category must be predefined in JavaScript.', modelInfo);

            this.categories_.add(VehicleModel[categoryKey]);
        });
    }

    // Gets the Id of the vehicle model that this instance represents.
    get id() { return this.id_; }

    // Gets the name of the vehicle model.
    get name() { return this.name_; }

    // Gets an iterator of the categories to which this vehicle model belongs.
    get categories() { return this.categories_.values(); }

    // Returns whether this vehicle is part of the |category|.
    hasCategory(category) { return this.categories_.has(category); }

    // Returns whether this model is meant for airborne use.
    isAirborne() {
        return this.categories_.has(VehicleModel.CATEGORY_AIRPLANES) ||
               this.categories_.has(VehicleModel.CATEGORY_HELICOPTERS);
    }

    // Returns whether this model is an airplane.
    isAirplane() { return this.categories_.has(VehicleModel.CATEGORY_AIRPLANES); }

    // Returns whether tis model is a bike (either manual or motorized).
    isBike() {
        return this.categories_.has(VehicleModel.CATEGORY_BICYCLES) ||
               this.categories_.has(VehicleModel.CATEGORY_MOTORBIKES);
    }

    // Returns whether this model is meant for use on water.
    isBoat() { return this.categories_.has(VehicleModel.CATEGORY_BOATS); }

    // Returns whether this model is a helicopter.
    isHelicopter() { return this.categories_.has(VehicleModel.CATEGORY_HELICOPTERS); }

    // Returns whether this model represents a remote controllable vehicle.
    isRemoteControllable() { return this.categories_.has(VehicleModel.CATEGORY_RC_VEHICLES); }

    // Returns whether this model represents a trailer.
    isTrailer() { return this.categories_.has(VehicleModel.CATEGORY_TRAILERS); }
}

// Enumeration of the vehicle model categories that are available.
VehicleModel.CATEGORY_AIRPLANES = 0;
VehicleModel.CATEGORY_BICYCLES = 1;
VehicleModel.CATEGORY_BOATS = 2;
VehicleModel.CATEGORY_HELICOPTERS = 3;
VehicleModel.CATEGORY_MOTORBIKES = 4;
VehicleModel.CATEGORY_RC_VEHICLES = 5;
VehicleModel.CATEGORY_TRAILERS = 6;
VehicleModel.CATEGORY_TRAINS = 7;

VehicleModel.CATEGORY_UNKNOWN = 255;

// Synchronously initialise the VehicleModel data whilst loading the script.
VehicleModel.initialise(PrivateSymbol);

// Export the VehicleModel class on the global scope.
global.VehicleModel = VehicleModel;
