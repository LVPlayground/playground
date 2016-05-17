// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Vector = require('base/vector.js');

class GameObject {
  constructor(options) {
    this.id_ = 0;

    if (typeof options === 'object') {
      // Creates a new game object based on the options defined in |options|.
      let modelId = options.modelId || 0;
      let position = options.position || new Vector(0, 0, 0);
      let rotation = options.rotation || new Vector(0, 0, 0);

      let streamDistance = options.streamDistance || 300.0 /* STREAMER_OBJECT_SD */;
      let drawDistance = options.drawDistance || 0.0 /* STREAMER_OBJECT_DD */;

      let worlds = options.worlds || [ (typeof options.worldId !== 'undefined' ? options.worldId : -1 ) ];
      let interiors = options.interiors || [ (typeof options.interiorId !== 'undefined' ? options.interiorId : -1 ) ];
      let players = options.players || [ (typeof options.playerId !== 'undefined' ? options.playerId : -1 ) ];
      let areas = [ -1 ];

      // NOTE: The native function definition of CreateDynamicObjectEx notes that the drawDistance
      // parameter comes *after* the streamDistance, as is the case with CreateDynamicObject.
      // However, the implementation expects them in this order.
      //
      // https://github.com/samp-incognito/samp-streamer-plugin/blob/master/src/natives/extended.cpp

      this.id_ = pawnInvoke('CreateDynamicObjectEx', 'iffffffffaaaaiiii', modelId, position.x,
                            position.y, position.z, rotation.x, rotation.y, rotation.z,
                            drawDistance, streamDistance, worlds, interiors, players, areas,
                            worlds.length, interiors.length, players.length, areas.length);

      if (this.id_ == GameObject.INVALID_ID)
        throw new Error('Unable to create the new game object.');
    }
  }

  // Returns the id by which this game object is identified in the streamer plugin.
  get id() { return this.id_; }

  // Disposes of the game object, and removes it from the world entirely.
  dispose() {
    pawnInvoke('DestroyDynamicObject', 'i', this.id_);
  }
};

// The Id that is used to represent invalid objects (INVALID_STREAMER_ID in Pawn).
GameObject.INVALID_ID = 0;

// Expose the GameObject object globally since it will be commonly used.
global.GameObject = GameObject;

exports = GameObject;
