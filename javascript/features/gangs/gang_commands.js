// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let CommandBuilder = require('components/command_manager/command_builder.js');

// This class owns and handles the commands that provide an interface to the gang manager for
// players. It allows them to create, destroy and manage their, and others' gangs.
class GangCommands {
  constructor(commandManager, gangManager) {
    commandManager.buildCommand('pgang')
        // /pgang create [name]
        .sub('create').parameters([{ name: 'name', type: CommandBuilder.SENTENCE_PARAMETER }])
                      .build(this.__proto__.gangCreate.bind(this))

        // /pgang invite [player]
        .sub('invite').parameters([{ name: 'player', type: CommandBuilder.PLAYER_PARAMETER }])
                      .build(this.__proto__.gangInvite.bind(this))

        // /pgang join [id]?
        .sub('join').parameters([{ name: 'id', type: CommandBuilder.NUMBER_PARAMETER, optional: true }])
                    .build(this.__proto__.gangJoin.bind(this))

        // /pgang kick [player]
        .sub('kick').parameters([{ name: 'player', type: CommandBuilder.PLAYER_PARAMETER }])
                    .build(this.__proto__.gangKick.bind(this))

        // /pgang leave
        .sub('leave').build(this.__proto__.gangLeave.bind(this))

        // /pgang [id]? [color/info]
        .sub(CommandBuilder.NUMBER_PARAMETER, player => this.getCurrentGangId(player))

            // /pgang [id]? color
            .sub('color').build(this.__proto__.gangColor.bind(this))

            // /pgang [id]? info
            .sub('info').build(this.__proto__.gangInfo.bind(this))

            // /pgang [id]?
            .build()

        // pgang
        .build();

    // /pgangs
    commandManager.registerCommand('pgangs', this.__proto__.gangs.bind(this));
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
  gangs(player) { }

  //
  getCurrentGangId(player) { return null; }

};

exports = GangCommands;
