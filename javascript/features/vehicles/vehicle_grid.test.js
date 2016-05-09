// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const StoredVehicle = require('features/vehicles/stored_vehicle.js');
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

});
