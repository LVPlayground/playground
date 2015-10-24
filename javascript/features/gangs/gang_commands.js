// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// This class owns and handles the commands that provide an interface to the gang manager for
// players. It allows them to create, destroy and manage their, and others' gangs.
class GangCommands {
  constructor(commandManager, gangManager) {
    commandManager.registerCommand('pgang', [
      // /gang create [name]
      { level: Player.LEVEL_PLAYER,
        parameters: [ 'create', Command.STRING_PARAMETER ],
        listener: GangCommands.prototype.gangCreate.bind(this) },

      // /gang info
      // /gang [id] info
      { level: Player.LEVEL_PLAYER,
        parameters: [ 'info' ],
        listener: GangCommands.prototype.displayInfo.bind(this) },

      { level: Player.LEVEL_PLAYER,
        parameters: [ Command.NUMBER_PARAMETER, 'info' ],
        listener: GangCommands.prototype.displayInfo.bind(this) },

      // /gang leave
      { level: Player.LEVEL_PLAYER,
        parameters: [ 'leave' ],
        listener: GangCommands.prototype.gangLeave.bind(this) },

      // /gang
      { level: Player.LEVEL_PLAYER,
        parameters: null,
        listener: GangCommands.prototype.gang.bind(this) }
    ]);
  }

  // Creates a new gang called |name|. The player must not be in a gang already.
  gangCreate(player, name) {
    console.log('/gang create ' + name);
  }

  // Displays information about the gang identified by |id| to the player, or about the gang the
  // player is currently part of if the |id| parameter was omitted.
  gangInfo(player, id) {
    console.log('/gang ' + id + ' info');
  }

  // Allows |player| to leave the gang they're currently part of.
  gangLeave(player) {
    console.log('/gang leave');
  }

  // Sends information about using the commands to |player|.
  gang(player) {
    console.log('/gang');
  }
};

exports = GangCommands;
