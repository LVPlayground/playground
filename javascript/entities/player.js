// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

class Player {
  constructor(playerId) {
    this.playerId = playerId;
  }

  get name() {
    return pawnInvoke('GetPlayerName', 'iS', this.playerId);
  }

  set name(value) {
    pawnInvoke('SetPlayerName', 'is', this.playerId, value);
  }

  get position() {
    return pawnInvoke('GetPlayerPos', 'iFFF', this.playerId);
  }

  set position(value) {
    if (!Array.isArray(value) || value.length != 3)
      throw new Error('unable to update the position of player ' + this.playerId + ': expected a 3-value array.');

    pawnInvoke('SetPlayerPos', 'ifff', this.playerId, value[0], value[1], value[2]);
  }
};

// Expose the Player object globally since it will be commonly used.
global.Player = Player;
