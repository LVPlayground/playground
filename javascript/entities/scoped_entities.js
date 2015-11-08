// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// An instance of the scoped entities class enables you to create entities for usage in a temporary
// environment, for example a minigame, that can all be removed at once by calling the dispose()
// method. 
class ScopedEntities {
  constructor() {
    this.vehicles_ = [];
  }

  // Creates a vehicle with |parameters|. The vehicle will be removed automatically when this
  // instance is being disposed of.
  createVehicle(...parameters) {
    let vehicle = new Vehicle(...parameters);
    if (vehicle === null)
      return null;

    this.vehicles_.push(vehicle);
    return vehicle;
  }

  // Disposes of all entities that were created by this ScopedEntities instance. Any remaining
  // references will become invalid and may not work as expected anymore.
  dispose() {
    this.vehicles_.forEach(vehicle => vehicle.dispose());
  }
};

exports = ScopedEntities;
