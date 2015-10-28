// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// This class owns and handles the commands that provide an interface to the gang manager for
// players. It allows them to create, destroy and manage their, and others' gangs.
class GangCommands {
  constructor(commandManager, gangManager) {
    // /pgang
    // /pgang create [name]
    // /pgang invite [player]
    // /pgang join [id]?
    // /pgang kick [player]
    // /pgang leave
    // /pgang [id]? info
    // /pgang [id]? color
    // /pgangs
  }

  //
  gang(player) { }

  //
  gangCreate(player, name) { }

  //
  gangInvite(player, invitee) { }

  //
  gangJoin(player, id) { }

  //
  gangKick(player, kickee) { }

  //
  gangLeave(player) { }

  //
  gangInfo(player, id) { }

  //
  gangColor(player, id, color) { }

  //
  gangs(player) { }

};

exports = GangCommands;
