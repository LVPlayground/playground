// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let Command = require('components/command_manager/command.js');

// This class owns and handles the commands that provide an interface to the gang manager for
// players. It allows them to create, destroy and manage their, and others' gangs.
class GangCommands {
  constructor(commandManager, gangManager) {
    return;

    commandManager.buildCommand('pgang')
        // /pgang create [name]
        .sub('create').parameters({ name: 'name', type: Command.SENTENCE_PARAMETER })
                      .build(GangCommands.prototype.gangCreate.bind(this))

        // /pgang invite [player]
        .sub('invite').parameters({ name: 'player', type: Command.PLAYER_PARAMETER })
                      .build(GangCommands.prototype.gangInvite.bind(this))

        // /pgang join [id]?
        .sub('join').parameters({ name: 'id', type: Command.NUMBER_PARAMETER, optional: true })
                    .build(GangCommands.prototype.gangJoin.bind(this))

        // /pgang kick [player]
        .sub('kick').parameters({ name: 'player', type: Command.PLAYER_PARAMETER })
                    .build(GangCommands.prototype.gangKick.bind(this))

        // /pgang leave
        .sub('leave').build(GangCommands.prototype.gangLeave.bind(this))

        // /pgang [id]? [color/info]
        .sub(Command.NUMBER_PARAMETER, player => this.getCurrentGangId(player))

            // /pgang [id]? color
            .sub('color').build(GangCommands.prototype.gangColor.bind(this))

            // /pgang [id]? info
            .sub('info').build(GangCommands.prototype.gangInfo.bind(this))

            // /pgang [id]?
            .build(GangCommands.prototype.gang.bind(this))

        // pgang
        .build(GangCommands.prototype.gang.bind(this));

    // /pgangs
    commandManager.registerCommand('pgangs', GangCommands.prototype.gangs.bind(this));
  }

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
  gangColor(player, id, color) { }

  //
  gangInfo(player, id) { }

  //
  gang(player, id) { }

  //
  gangs(player) { }

  //
  getCurrentGangId(player) { return null; }

};

exports = GangCommands;
