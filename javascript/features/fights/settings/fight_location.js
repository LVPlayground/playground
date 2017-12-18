// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Private symbol ensuring that the FightLocation constructor won't be used.
const PrivateSymbol = Symbol('Please use the static methods.');

// JSON file in which information about the fight locations is available.
const FightLocationDataFile = 'data/fight_locations.json';

// Set of locations that have been marked as available for selection by players.
const availableLocations = new Set();

// Map of all fight locations that are available in the current Las Venturas Playground version.
const locations = new Map();

// Represents the location at which a fight will take place. Locations define the area in which the
// fight will take place, the world boundaries, spawn positions and decorative objects.
class FightLocation {
    // Returns the location identified by |id|. Will throw when that's an invalid ID.
    static getById(id) {
        if (!locations.has(id))
            throw new Error('Requesting invalid location: ' + id);

        return locations.get(id);
    }

    // Returns an iterator that includes all available fight locations.
    static* getAvailable() {
        yield* availableLocations.values();
    }

    // Returns an iterator that includes all fight locations, including unavailable ones.
    static* getAll() {
        yield* locations.values();
    }

    // ---------------------------------------------------------------------------------------------

    // Initialises all fight location information. This only has to be called once.
    static initialise(privateSymbol) {
        if (privateSymbol !== PrivateSymbol)
            throw new TypeError('Illegal call. The FightLocation data is already initialised.');

        const locationInfos = JSON.parse(readFile(FightLocationDataFile));
        locationInfos.forEach(locationInfo => {
            const location = new FightLocation(PrivateSymbol, locationInfo);

            if (locations.has(location.id))
                throw new Error('Duplicated fight location Id: ' + location.id);

            locations.set(location.id, location);

            if (location.isAvailable())
                availableLocations.add(location);
        });
    }

    // ---------------------------------------------------------------------------------------------

    constructor(privateSymbol, locationInfo) {
        if (privateSymbol !== PrivateSymbol)
            throw new TypeError('Illegal constructor. Use the static methods instead.');

        this.id_ = locationInfo.id;

        this.name_ = locationInfo.name;
        this.available_ = !!locationInfo.available;

        this.interiorId_ = locationInfo.interior_id;

        this.spawnPositions_ = new Set();

        locationInfo.spawn_positions.forEach(positionInfo => {
            this.spawnPositions_.add({
                position: new Vector(...positionInfo.position),
                rotation: positionInfo.rotation
            });
        });

        // TODO: This should use some sort of Rect class.
        this.boundaries_ = locationInfo.boundaries;

        this.objects_ = [];

        if (locationInfo.hasOwnProperty('objects')) {
            locationInfo.objects.forEach(objectInfo => {
                this.objects_.push({
                    modelId: objectInfo.modelId,
                    position: new Vector(...objectInfo.position),
                    rotation: new Vector(...objectInfo.rotation)
                });
            });
        }
    }

    // Gets the internal Id as which this location is known.
    get id() { return this.id_; }

    // Gets the name under which this location will be represented in the UI.
    get name() { return this.name_; }

    // Gets the maximum number of parties (players or teams) that can participate in this fight.
    get maxParties() { return this.spawnPositions_.size; }

    // Returns whether this flight club location is available for fights.
    isAvailable() { return this.available_; }

    // Gets the interior Id in which the location exists.
    get interiorId() { return this.interiorId_; }

    // Gets an iterator with the spawn positions to use. These also determine the maximum amount of
    // of teams taking part of a match in this location.
    get spawnPositions() { return this.spawnPositions_.values(); }

    // Gets the world boundaries, if any, that should be applied to the fight.
    get boundaries() { return this.boundaries_; }

    // Gets an array with the objects that should be created for this location.
    get objects() { return this.objects_; }
}

// Synchronously initialise the FightLocation data whilst loading the script.
FightLocation.initialise(PrivateSymbol);

export default FightLocation;
