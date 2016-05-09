// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const StoredVehicle = require('features/vehicles/stored_vehicle.js');
const Vector = require('base/vector.js');
const VehicleGrid = require('features/vehicles/vehicle_grid.js');

describe('VehicleGrid', (it, beforeEach, afterEach) => {
    let grid = null;

    beforeEach(() => grid = new VehicleGrid(300));
    afterEach(() => grid.dispose());

    // Creates a new StoredVehicle instance based on the |options|. Reasonable defaults will be
    // applied if no options are provided to this function.
    function createStoredVehicle(options = {}) {
        return new StoredVehicle({
            vehicle_id: options.vehicleId || Math.floor(Math.random() * 1000000),
            model_id: options.modelId || 411,
            position_x: options.positionX || Math.floor(Math.random() * 6000) - 3000,
            position_y: options.positionY || Math.floor(Math.random() * 6000) - 3000,
            position_z: options.positionZ || Math.floor(Math.random() * 20),
            rotation: options.rotation || Math.floor(Math.random() * 360),
            primary_color: options.primaryColor || 0,
            secondary_color: options.secondaryColor || 0,
            paintjob: options.paintjob || 0,
            interior_id: options.interiorId || 0
        });
    }

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
        let cells = Array(20).fill(0);

        for (let coordinate = -3000; coordinate < 3000; ++coordinate)
            cells[grid.coordinateToGridIndex(coordinate)]++;

        assert.isTrue(cells.every(value => value === 300));
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

        for (let gridX = gridCenterX - 1; gridX <= gridCenterX + 1; ++gridX) {
            for (let gridY = gridCenterY - 1; gridY <= gridCenterY + 1; ++gridY)
                assert.equal(grid.grid_[gridX][gridY].length, 1);
        }

        const gunther = { position: new Vector(150, 150, 0) };
        const russell = { position: new Vector(0, 0, 0) }

        assert.equal(grid.closest(gunther, 10).length, 9);
        assert.equal(grid.closest(russell, 10).length, 4);

        const closestFour = grid.closest(russell, 4).map(storedVehicle => {
            return [ storedVehicle.position.x, storedVehicle.position.y ];
        });

        assert.deepEqual(closestFour, [ [-1, -1], [-1, 150], [150, -1], [150, 150] ]);
    });
});
