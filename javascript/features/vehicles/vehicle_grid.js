// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// These constants define the range of the grid. Vehicles may not be added outside the boundaries of
// these coordinates, trying to do so will be met with an exception.
const MinimumGridCoordinate = -3000;
const MaximumGridCoordinate = 3000;

// The vehicle grid stores all vehicles on a grid in order to provide reasonably fast KNN updates.
class VehicleGrid {
    constructor(streamDistance) {
        this.streamDistance_ = streamDistance;

        this.grid_ = {};
        this.vehicles_ = new Set();
    }

    // Gets the number of vehicles that have been added to the grid.
    get size() { return this.vehicles_.size; }

    // Adds the |storedVehicle| to the grid. This will be ignored when the |storedVehicle| already
    // exists on the grid, because that could lead to unexpected results.
    addVehicle(storedVehicle) {
        if (this.vehicles_.has(storedVehicle))
            return;

        if (storedVehicle.interiorId !== 0)
            throw new Error('The vehicle streamer is only available for the main world.');

        const position = storedVehicle.position;

        if (position.x < MinimumGridCoordinate || position.x > MaximumGridCoordinate)
            throw new Error('The x-coordinate of the vehicle is out of range: ' + position.x);

        if (position.y < MinimumGridCoordinate || position.y > MaximumGridCoordinate)
            throw new Error('The y-coordinate of the vehicle is out of range: ' + position.y);

        this.vehicles_.add(storedVehicle);

        const gridX = this.coordinateToGridIndex(position.x);
        const gridY = this.coordinateToGridIndex(position.y);

        if (!this.grid_.hasOwnProperty(gridX))
            this.grid_[gridX] = {};

        if (!this.grid_[gridX].hasOwnProperty(gridY))
            this.grid_[gridX][gridY] = [];

        this.grid_[gridX][gridY].push(storedVehicle);
    }

    // Removes the |storedVehicle| from the grid.
    removeVehicle(storedVehicle) {
        if (!this.vehicles_.has(storedVehicle))
            return;

        this.vehicles_.delete(storedVehicle);

        const position = storedVehicle.position;

        const gridX = this.coordinateToGridIndex(position.x);
        const gridY = this.coordinateToGridIndex(position.y);

        if (!this.grid_.hasOwnProperty(gridX))
            return;  // theoretically this should never happen

        if (!this.grid_[gridX].hasOwnProperty(gridY))
            return;  // theoretically this should never happen

        this.grid_[gridX][gridY] = this.grid_[gridX][gridY].filter(entry => entry != storedVehicle);
    }

    // Converts the |coordinate| to an index on the grid based on the range and streaming distance.
    coordinateToGridIndex(coordinate) {
        return Math.floor((coordinate + Math.abs(MinimumGridCoordinate)) / this.streamDistance_);
    }

    dispose() {
        this.vehicles_ = null;
        this.grid_ = null;
    }
}

exports = VehicleGrid;
