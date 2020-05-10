// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import ScopedCallbacks from 'base/scoped_callbacks.js';

// The text draw manager keeps track of which text draws are being displayed to which users.
export class TextDrawManager {
  constructor() {
    // Object keeping track of all in-game players and their associated text-draws.
    this.players_ = {};

    this.callbacks_ = new ScopedCallbacks();

    // Listen to the `playerdisconnect` event to clear state of leaving players.
    this.callbacks_.addEventListener(
        'playerclickplayertextdraw',
        TextDrawManager.prototype.onPlayerClickPlayerTextDraw.bind(this));
    this.callbacks_.addEventListener(
        'playerdisconnect', TextDrawManager.prototype.onPlayerDisconnect.bind(this));
  }

  // Creates |textDraw| for |player| unless it's already being displayed. Returns NULL when the text
  // draw is already visible for the player, or a number when it has just been created.
  createForPlayer(player, textDraw) {
    let playerId = player.id;
    if (!this.players_.hasOwnProperty(playerId))
      this.players_[playerId] = new Map();

    if (this.players_[playerId].has(textDraw))
      return null;

    // Create the text draw on the SA-MP server, which will send it to the player's client.
    let textDrawId = pawnInvoke('CreatePlayerTextDraw', 'iffs', playerId, ...textDraw.position, textDraw.text);

    this.players_[playerId].set(textDraw, textDrawId);
    return textDrawId;
  }

  // Returns the id of |textDraw| when it is being presented to |player|.
  getForPlayer(player, textDraw) {
    let playerId = player.id;
    if (!this.players_.hasOwnProperty(playerId))
      return null;

    if (!this.players_[playerId].has(textDraw))
      return null;

    return this.players_[playerId].get(textDraw);
  }

  // Hides |textDraw| from |player| if it's being displayed. Returns whether the |textDraw| was
  // visible for them, and it was removed from their screen successfully.
  hideForPlayer(player, textDraw) {
    let textDrawId = this.getForPlayer(player, textDraw);
    if (textDrawId === null)
      return true;

    pawnInvoke('PlayerTextDrawDestroy', 'ii', player.id, textDrawId);

    this.players_[player.id].delete(textDraw);
    return true;
  }

  // Called when a player clicks on a player text draw.
  onPlayerClickPlayerTextDraw(event) {
    const player = server.playerManager.getById(event.playerid);
    const playerId = event.playerid;

    if (!player || !this.players_.hasOwnProperty(playerId))
      return;

    for (const [textDraw, textDrawId] of this.players_[playerId]) {
      if (textDrawId != event.playertextid)
        continue;

      textDraw.onClick(player);
      break;
    }
  }

  // Called when a player disconnects from the server. Clears out all state for the player.
  onPlayerDisconnect(event) {
    delete this.players_[event.playerid];
  }

  dispose() {
    this.callbacks_.dispose();
    this.callbacks_ = null;
  }
};
