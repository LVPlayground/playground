// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Private symbol ensuring that the DeathMatchLocation constructor won't be used.
const PrivateSymbol = Symbol('Please use the static methods.');

// JSON file in which information about the death match locations is available.
const DeathMatchLocationDataFile = 'data/death_match_locations.json';

// Map of all death match locations that are available.
const locations = new Map();

export class DeathMatchLocation {

    // Returns an array of all death match IDs supported.
    static getAllLocationIds() {
        return [...locations.keys()];
    }

    // Returns an iterator of all location values.
    static getAll() {
        return locations.values();
    }

    // Returns whether this location ID is known.
    static hasLocation(id) {
        return locations.has(id);
    }

    // Returns a location based by ID.
    // Throws error if: ID is not known.
    static getById(id) {
        if (!locations.has(id))
            throw new Error('Requesting invalid location: ' + id);

        return locations.get(id);
    }

    // Initializes all the locations.
    // Throws error if: Unknown private symbol.
    // Throws error if: There are duplicate death match locations.
    static initialize(privateSymbol) {
        if (privateSymbol !== PrivateSymbol)
            throw new TypeError('Illegal call. The DeathMatch data is already initialized.');

        const locationInfos = JSON.parse(readFile(DeathMatchLocationDataFile));

        locationInfos.forEach(locationInfo => {
            const location = new DeathMatchLocation(PrivateSymbol, locationInfo);

            if (locations.has(location.id))
                throw new Error('Duplicated death match location Id: ' + location.id);

            locations.set(location.id, location);
        });
    }

    // ---------------------------------------------------------------------------------------------

    // Private constructor to create a new death match location.
    // Should only be used within the DeathMatchLocation class.
    constructor(privateSymbol, locationInfo) {
        if (privateSymbol !== PrivateSymbol)
            throw new TypeError('Illegal constructor. Use the static methods instead.');

        this.id_ = locationInfo.id;

        this.name_ = locationInfo.name;

        this.interiorId_ = locationInfo.interior_id;
        this.world_ = VirtualWorld.acquire('DeathMatch: ' + locationInfo.name);

        this.weather_ = locationInfo.weather ?? 10;
        this.time_ = locationInfo.time ?? 12;

        this.playerHealth_ = locationInfo.player_health ?? 100;
        this.playerArmour_ = locationInfo.player_armour ?? 0;

        this.weapons_ = new Set();

        locationInfo.weapons.forEach(weaponInfo => {
            this.weapons_.add({
                weaponId: weaponInfo.weapon_id,
                ammo: weaponInfo.ammo
            });
        });

        this.boundaries_ = locationInfo.boundaries;

        this.spawnPositions_ = new Set();

        locationInfo.spawn_positions.forEach(positionInfo => {
            this.spawnPositions_.add({
                position: new Vector(...positionInfo.position),
                rotation: positionInfo.rotation
            });
        });
    }

    // Gets the internal Id as which this location is known.
    get id() { return this.id_; }

    // Gets the name under which this location will be represented in the UI.
    get name() { return this.name_; }

    // Gets the interior Id in which the location exists.
    get interiorId() { return this.interiorId_; }

    get world() { return this.world_; }

    get weather() { return this.weather_; }
    get time() { return this.time_; }

    get playerHealth() { return this.playerHealth_; }
    get playerArmour() { return this.playerArmour_; }

    get weapons() { return this.weapons_.values(); }

    // Gets an iterator with the spawn positions to use. These also determine the maximum amount of
    // of teams taking part of a match in this location.
    get spawnPositions() { return this.spawnPositions_.values(); }

    // Gets the world boundaries, if any, that should be applied to the fight.
    get boundaries() { return this.boundaries_; }
}


DeathMatchLocation.initialize(PrivateSymbol);