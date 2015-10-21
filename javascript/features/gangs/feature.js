// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let Feature = require('components/feature_manager/feature.js'),
    GangCommands = require('features/gangs/gang_commands.js'),
    GangManager = require('features/gangs/gang_manager.js');

// The gang feature class is the entry point of the Gangs feature. It owns all gang-related
// functionality and provides an API for other features to depend on.
class GangFeature extends Feature {
  constructor(playground) {
    super(playground);

    // Initialize the gang manager, which owns the actual gangs.
    this.manager_ = new GangManager(playground.database);

    // Initialize the commands that provide the user interface for the gang feature to the players,
    // which depends on the global CommandManager and the gang manager.
    this.commands_ = new GangCommands(playground.commandManager, this.manager_);

    // Bind to the events important for the gang feature.
    // TODO(Russell): Use a weak binding system rather than fixed ones.
    global.addEventListener('playerlogin', GangFeature.prototype.onPlayerLogin.bind(this));
    global.addEventListener('playerdisconnect', GangFeature.prototype.onPlayerDisconnect.bind(this));
  }

  // Called when a player has logged in to their account. This is a Las Venturas Playground-specific
  // event, and will not work on other servers.
  onPlayerLogin(event) {
    let player = Player.get(event.playerid);
    if (player)
      this.manager_.onPlayerLogin(player, event.userid);
  }

  // Called when a player disconnects from the server. If they were part of a gang, the gang manager
  // has to be informed of their departure.
  onPlayerDisconnect(event) {
    let player = Player.get(event.playerid);
    if (player)
      this.manager_.onPlayerDisconnect(player);
  }
};

exports = GangFeature;
