// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Beginning of the range of virtual world ids that are private to a particular player id.
const PRIVATE_VIRTUAL_WORLD_BASE = 201;

// Beginning of the range of virtual world ids that are private to a particular interior.
const INTERIOR_VIRTUAL_WORLD_BASE = 1201;

// Beginning of the range of virtual world ids that are private to a particular house.
const HOUSE_VIRTUAL_WORLD_BASE = 2001;

// Range of private virtual world that can be reserved by features for private usage. A ring-buffer
// will be created for storing the available virtual worlds.
const EXCLUSIVE_VIRTUAL_WORLD_BASE = 10000000;
const EXCLUSIVE_VIRTUAL_WORLD_RANGE = 500;

// Object containing all acquired virtual worlds.
let acquiredVirtualWorlds = {};

// A virtual world is a separated dimension in the San Andreas world, featuring its own entities,
// environment (weather, time) and other properties.
export class VirtualWorld {
  // Returns the private virtual world Id for this |player|.
  static forPlayer(player) {
    return player.id + PRIVATE_VIRTUAL_WORLD_BASE;
  }

  // Returns the private virtual world for the given |interiorId|.
  static forInterior(interiorId) {
    return interiorId + INTERIOR_VIRTUAL_WORLD_BASE;
  }

  // Returns the private virtual world for the given |house|.
  static forHouse(location) {
    return location.id + HOUSE_VIRTUAL_WORLD_BASE;
  }

  // Acquires an exclusive Virtual World id that can be used by the feature. A description must be
  // given, so that leaky features can be detected through debugging.
  static acquire(description) {
    // TODO: This could be an O(1) operation when using a ring buffer, rather than the O(n) it
    // is today, with n being the number of exclusive virtual worlds (worst case only).
    for (let worldOffset = 0; worldOffset < EXCLUSIVE_VIRTUAL_WORLD_RANGE; ++worldOffset) {
      let worldId = worldOffset + EXCLUSIVE_VIRTUAL_WORLD_BASE;
      if (acquiredVirtualWorlds.hasOwnProperty(worldId))
        continue;

      acquiredVirtualWorlds[worldId] = description;
      return worldId;
    }

    // Throw an exception if no virtual worlds were available.
    throw new Error('No virtual worlds were available for allocation to the feature.');
  }

  // Returns whether the |virtualWorld| is one of the main worlds in which players can freeroam.
  static isMainWorld(worldId) {
    return worldId == 0;
  }

  // Returns whether the |virtualWorld| is considered to be one of the main worlds for communication
  // purposes. I actually am not sure what `isMainWorld` is supposed to do.
  static isMainWorldForCommunication(virtualWorld) {
    return virtualWorld === 0 ||  // main world
           virtualWorld === 101 ||  // Caligula's Palace Casino
          (virtualWorld >= 1201 && virtualWorld <= 2000) ||  // interiors
          (virtualWorld >= 2001 && virtualWorld <= 7000) ||  // houses
          (virtualWorld >= 7001 && virtualWorld <= 8000);    // player isolated worlds
  }

  // Releases a virtual world, which means that other parts of the gamemode will be able to use it.
  static release(worldId) {
    delete acquiredVirtualWorlds[worldId];
  }
};
