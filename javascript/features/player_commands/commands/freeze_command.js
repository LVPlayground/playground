// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { PlayerCommand } from 'features/player_commands/player_command.js';

// Implements the "/my freeze" and "/p [player] freeze" commands, which makes it possible to freeze
// a particular player. This action will be relayed to the player directly.
export class FreezeCommand extends PlayerCommand {
    get name() { return 'freeze'; }

    // This command is not available to all players, only to administrators.
    get playerLevel() { return Player.LEVEL_ADMINISTRATOR; }

    // Called when a player executes the command. Will immediately freeze the |target|, and let them
    // know about the adminstrative action being taken on them.
    async execute(player, target) {
        target.controllable = false;

        if (player === target) {
            this.announce().announceToAdministrators(
                Message.PLAYER_COMMANDS_FREEZE_SELF_ADMIN, player.name, player.id);
            
            player.sendMessage(Message.PLAYER_COMMANDS_FREEZE_SELF);

        } else {
            this.announce().announceToAdministrators(
                Message.PLAYER_COMMANDS_FREEZE_OTHER_ADMIN, player.name, player.id, target.name,
                target.id);
            
            player.sendMessage(Message.PLAYER_COMMANDS_FREEZE_OTHER, target.name, target.id);
            target.sendMessage(Message.PLAYER_COMMANDS_FREEZE_FYI, player.name, player.id);
        }
    }
}

// Implements the "/my unfreeze" and "/p [player] unfreeze" commands, which do the reverse of the
// freeze command: it makes it possible for the player to move around again.
export class UnfreezeCommand extends PlayerCommand {
    get name() { return 'unfreeze'; }

    // This command is not available to all players, only to administrators.
    get playerLevel() { return Player.LEVEL_ADMINISTRATOR; }

    // Called when a player executes the command. Will immediately release the given |target|.
    async execute(player, target) {
        target.controllable = true;

        if (player === target) {
            this.announce().announceToAdministrators(
                Message.PLAYER_COMMANDS_UNFREEZE_SELF_ADMIN, player.name, player.id);

            player.sendMessage(Message.PLAYER_COMMANDS_UNFREEZE_SELF);

        } else {
            this.announce().announceToAdministrators(
                Message.PLAYER_COMMANDS_UNFREEZE_OTHER_ADMIN, player.name, player.id, target.name,
                target.id);

            player.sendMessage(Message.PLAYER_COMMANDS_UNFREEZE_OTHER, target.name, target.id);
            target.sendMessage(Message.PLAYER_COMMANDS_UNFREEZE_FYI, player.name, player.id);
        }
    }
}
