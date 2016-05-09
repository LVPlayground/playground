// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// These constants define the range of the grid. Vehicles may not be added outside the boundaries of
// these coordinates, trying to do so will be met with an exception.
const MinimumGridCoordinate = -3000;
const MaximumGridCoordinate = 3000;

// The vehicle grid stores all vehicles on a grid in order to provide reasonably fast KNN updates.
// It is a two dimensional grid- the Z-index (height) of the vehicle will be ignored.
class VehicleGrid {
    constructor(streamDistance) {
        this.streamDistance_ = streamDistance;

        this.maximumSquaredDistance_ = streamDistance * streamDistance;

        this.grid_ = {};
        this.gridWidth_ = ((0 - MinimumGridCoordinate) + MaximumGridCoordinate) / streamDistance;
        
        if (!Number.isInteger(this.gridWidth_))
            throw new Error('The width of the grid must be a whole number.');

        this.vehicles_ = new Set();

        // Initialize the grid with empty arrays, so that the rest of the implementation can assume
        // that all valid cells have been assigned arrays of vehicles.
        for (let x = 0; x < this.gridWidth_; ++x) {
            this.grid_[x] = {};

            for (let y = 0; y < this.gridWidth_; ++y)
                this.grid_[x][y] = [];
        }
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

        if (position.x < MinimumGridCoordinate || position.x >= MaximumGridCoordinate)
            throw new Error('The x-coordinate of the vehicle is out of range: ' + position.x);

        if (position.y < MinimumGridCoordinate || position.y >= MaximumGridCoordinate)
            throw new Error('The y-coordinate of the vehicle is out of range: ' + position.y);

        this.vehicles_.add(storedVehicle);

        const gridX = this.coordinateToGridIndex(position.x);
        const gridY = this.coordinateToGridIndex(position.y);

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

        this.grid_[gridX][gridY] = this.grid_[gridX][gridY].filter(entry => entry != storedVehicle);
    }

    // Gets the closest |count| vehicles to the |player| that are within the streaming distance.
    closest(player, count) {
        const position = player.position;

        const playerGridX = this.coordinateToGridIndex(position.x);
        const playerGridY = this.coordinateToGridIndex(position.y);

        let candidates = [];
        for (let deltaX = -1; deltaX <= 1; ++deltaX) {
            for (let deltaY = -1; deltaY <= 1; ++deltaY) {
                const x = playerGridX + deltaX;
                const y = playerGridY + deltaY;

                // Bail out if this particular cell is out of range on the grid.
                if (x < 0 || x >= this.gridWidth_ || y < 0 || y >= this.gridWidth_)
                    continue;

                this.grid_[x][y].forEach(storedVehicle => {
                    const squaredDistance = position.squaredDistanceTo2D(storedVehicle.position);
                    if (squaredDistance > this.maximumSquaredDistance_)
                        return;  // the vehicle is too far away

                    candidates.push({ storedVehicle, squaredDistance });
                });
            }
        }

        // Sort the candidate vehicles by distance in descending order.
        candidates.sort((lhs, rhs) => {
            if (lhs.squaredDistance === rhs.squaredDistance)
                return 0;

            return lhs.squaredDistance > rhs.squaredDistance ? 1 : -1;
        });

        // Return the top |count| stored vehicle instances.
        return candidates.slice(0, count).map(entry => entry.storedVehicle);
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
