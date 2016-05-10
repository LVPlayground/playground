// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Vector = require('base/vector.js');
const VehicleGrid = require('features/vehicles/vehicle_grid.js');

const createStoredVehicle = require('features/vehicles/test/create_stored_vehicle.js');

describe('VehicleGrid', (it, beforeEach, afterEach) => {
    let grid = null;

    beforeEach(() => grid = new VehicleGrid(300));
    afterEach(() => grid.dispose());

    it('should not allow grids with a non-whole number of cells', assert => {
        assert.throws(() => new VehicleGrid(123 /** 6000 / 123 = 48.78 **/));
    });

    it('should allow vehicles to be added multiple times', assert => {
        const storedVehicle = createStoredVehicle();

        assert.equal(grid.size, 0);

        grid.addVehicle(storedVehicle);
        assert.equal(grid.size, 1);

        grid.addVehicle(storedVehicle);
        assert.equal(grid.size, 1);

        grid.removeVehicle(storedVehicle);
        assert.equal(grid.size, 0);
    });

    it('should not allow vehicles in alternative interiors to be added', assert => {
        const storedVehicle = createStoredVehicle({ interiorId: 1 });
        assert.throws(() => grid.addVehicle(storedVehicle));
    });

    it('should not allow out-of-range vehicles to be added', assert => {
        assert.throws(() => grid.addVehicle(createStoredVehicle({ positionX: -4000 })));
        assert.throws(() => grid.addVehicle(createStoredVehicle({ positionX:  4000 })));

        assert.throws(() => grid.addVehicle(createStoredVehicle({ positionY: -4000 })));
        assert.throws(() => grid.addVehicle(createStoredVehicle({ positionY:  4000 })));
    });

    it('should be able to convert a coordinate to a grid index', assert => {
        let cells = Array(grid.gridWidth).fill(0);

        for (let coordinate = -3000; coordinate < 3000; ++coordinate)
            cells[grid.coordinateToGridIndex(coordinate)]++;

        assert.isTrue(cells.every(value => value === (6000 / grid.gridWidth)));
    });

    it('should not complain if the player is not positioned on the grid', assert => {
        const player = { position: new Vector(-50000, -50000, 0) };
        assert.deepEqual(grid.closest(player, 10 /* count */), []);
    });

    it('should be able to find the vehicles closest to a given player', assert => {
        const locations = [ [1, 1], [2, 8], [3, 2], [3, 3], [5, 6], [7, 1], [9, 9] ];
        const player = { position: new Vector(4, 5, 0) };

        locations.forEach(loc =>
            grid.addVehicle(createStoredVehicle({ positionX: loc[0], positionY: loc[1] })));

        const [closestStoredVehicle] = grid.closest(player, 1);
        assert.equal(closestStoredVehicle.position.x, 5);
        assert.equal(closestStoredVehicle.position.y, 6);

        const closestFive = grid.closest(player, 5).map(storedVehicle => {
            return [ storedVehicle.position.x, storedVehicle.position.y ];
        });

        assert.deepEqual(closestFive, [[5, 6], [3, 3], [3, 2], [2, 8], [1, 1]]);
    });

    it('should considering neighbouring cells when finding the closest vehicles', assert => {
        const locations = [ [  -1,   -1 ], [ 150,   -1 ], [ 301,   -1 ],
                            [  -1,  150 ], [ 150,  150 ], [ 301,  150 ],
                            [  -1,  301 ], [ 150,  301 ], [ 301,  301 ] ];

        locations.forEach(loc =>
            grid.addVehicle(createStoredVehicle({ positionX: loc[0], positionY: loc[1] })));
        
        const gridCenterX = grid.coordinateToGridIndex(locations[4][0]);
        const gridCenterY = grid.coordinateToGridIndex(locations[4][1]);

        const gunther = { position: new Vector(150, 150, 0) };
        const russell = { position: new Vector(0, 0, 0) }

        assert.equal(grid.closest(gunther, 10).length, 9);
        assert.equal(grid.closest(russell, 10).length, 4);

        const closestFour = grid.closest(russell, 4).map(storedVehicle => {
            return [ storedVehicle.position.x, storedVehicle.position.y ];
        });

        assert.deepEqual(closestFour, [ [-1, -1], [150, -1], [-1, 150], [150, 150] ]);
    });

    it('should be performant for 500 players with 25,000 randomly positioned vehicles', assert => {
        const PLAYER_COUNT = 500;
        const VEHICLE_COUNT = 25000;
        const CLOSEST_COUNT = 40;

        let players = [];

        for (let vehicleIndex = 0; vehicleIndex < VEHICLE_COUNT; ++vehicleIndex)
            grid.addVehicle(createStoredVehicle());

        for (let playerIndex = 0; playerIndex < PLAYER_COUNT; ++playerIndex) {
            players.push({
                position: new Vector(Math.floor(Math.random() * 6000) - 3000,
                                     Math.floor(Math.random() * 6000) - 3000, 0)
            });
        }

        const minimumVehicles = Math.floor((6000 / grid.streamDistance) / 4);
        const beginTime = highResolutionTime();

        players.forEach(player =>
            assert.isAboveOrEqual(grid.closest(player, CLOSEST_COUNT).length, minimumVehicles));

        const totalTime = Math.round((highResolutionTime() - beginTime) * 100) / 100;;

        console.log('[VehicleGrid] Processed ' + CLOSEST_COUNT + ' vehicles for ' + PLAYER_COUNT +
                    ' players on a random grid of ' + VEHICLE_COUNT + ': ' + totalTime + 'ms.');
    });

    it('should be performant for 500 players with 10,000 grouped vehicles', assert => {
        const PLAYER_COUNT = 500;
        const VEHICLE_COUNT = 10000;
        const CLOSEST_COUNT = 40;

        let players = [];

        // Add all vehicles between [1000, 1000] and [3000, 3000], comparable to Las Venturas.
        for (let vehicleIndex = 0; vehicleIndex < VEHICLE_COUNT; ++vehicleIndex) {
            grid.addVehicle(createStoredVehicle({ positionX: Math.random(2000) + 1000,
                                                  positionY: Math.random(2000) + 1000 }));
        }

        // Most of the players should be located in this area as well.
        for (let playerIndex = 0; playerIndex < PLAYER_COUNT; ++playerIndex) {
            players.push({
                position: new Vector(Math.floor(Math.random() * 3000) - 500,
                                     Math.floor(Math.random() * 3000) - 500, 0)
            });
        }

        const minimumVehicles = Math.floor((6000 / grid.streamDistance) / 4);
        const beginTime = highResolutionTime();

        players.forEach(player =>
            assert.isAboveOrEqual(grid.closest(player, CLOSEST_COUNT).length, 0));

        const totalTime = Math.round((highResolutionTime() - beginTime) * 100) / 100;;

        console.log('[VehicleGrid] Processed ' + CLOSEST_COUNT + ' vehicles for ' + PLAYER_COUNT +
                    ' players on a biased grid of ' + VEHICLE_COUNT + ': ' + totalTime + 'ms.');
    });
});
