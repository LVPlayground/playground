// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The checkpoint manager will generally exist twice, once for normal checkpoints and once for race
// checkpoints. It keeps track of the current checkpoint for a player, and makes sure the associated
// promise will resolve or reject as expected.
//
// WARNING: DO NOT USE THIS CLASS FOR NORMAL CHECKPOINTS YET. I haven't assessed how the Pawn part
// of the server uses checkpoints, and it may very well be that we need synchronization.
class CheckpointManager {
  constructor(type) {
    this.type_ = type;
    this.playerMap_ = new Map();

    // The normal events are called `player{enter,leave}checkpoint`, whereas the race checkpoint
    // events are named the same, just with the word "race" in between the text.
    let eventSuffix = type == CheckpointManager.NORMAL_CHECKPOINTS ? 'checkpoint'
                                                                   : 'racecheckpoint';

    // TODO: Is there a use-case in which we'd like to know the leave event?
    global.addEventListener('playerenter' + eventSuffix, this.__proto__.onEnter.bind(this));
    global.addEventListener('playerdisconnect', this.__proto__.onDisconnect.bind(this));
  }

  // Displays the |checkpoint| for |player|. Returns a promise that will be resolved when the player
  // enters the checkpoint, or rejected when they disconnect whilst it's being shown.
  displayForPlayer(player, checkpoint) {
    return new Promise((resolve, reject) => {
      let {x, y, z} = checkpoint.position;
      let size = checkpoint.size;

      if (this.type_ == CheckpointManager.NORMAL_CHECKPOINTS) {
        pawnInvoke('SetPlayerCheckpoint', 'iffff', player.id, x, y, z, size);
      } else {
        let {nextX, nextY, nextZ} = checkpoint.nextPosition;

        pawnInvoke('SetPlayerRaceCheckpoint', 'iifffffff', player.id, checkpoint.type, x, y, z,
            nextX, nextY, nextZ, size);
      }

      this.playerMap_.set(player, { resolve, reject });
    });
  }

  // Hides the current checkpoint for the player, when it's known to this checkpoint manager. The
  // promise returned when showing the checkpoint will be rejected.
  hideForPlayer(player, checkpoint) {
    if (!this.playerMap_.has(player))
      return;

    pawnInvoke('DisablePlayerRaceCheckpoint', 'i', player.id);

    this.playerMap_.get(player).reject();
    this.playerMap_.delete(player);
  }

  // Called when a player enters a checkpoint of |type_|. If we know about the checkpoint that is
  // current for the player, the associated promise will be resolved.
  onEnter(event) {
    let player = Player.get(event.playerid);
    if (player === null || !this.playerMap_.has(player))
      return;

    pawnInvoke('DisablePlayerRaceCheckpoint', 'i', player.id);

    this.playerMap_.get(player).resolve();
    this.playerMap_.delete(player);
  }

  // Called when a player disconnects from the server. If a checkpoint is currently showing for them
  // the associated promise will be rejected.
  onDisconnect(event) {
    let player = Player.get(event.playerid);
    if (player === null || !this.playerMap_.has(player))
      return;

    this.playerMap_.get(player).reject();
    this.playerMap_.delete(player);
  }
};

// The type of checkpoint that the manager is responsible for.
CheckpointManager.NORMAL_CHECKPOINTS = 0;
CheckpointManager.RACE_CHECKPOINTS = 1;

exports = CheckpointManager;
