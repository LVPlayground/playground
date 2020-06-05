// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { PlayerCommand } from 'features/player_commands/player_command.js';
import CommandBuilder from 'components/command_manager/command_builder.js';

// Command: /engine [player]
export default class SpawnWeapons extends PlayerCommand {
    get name() { return 'spawnweapons'; }

    build(commandBuilder) {
        commandBuilder
            .parameters([{ name: 'weapon', type: CommandBuilder.NUMBER_PARAMETER, optional: false },
                        { name: 'ammo', type: CommandBuilder.NUMBER_PARAMETER, optional: false}])
            .build(SpawnWeapons.prototype.onSpawnWeaponsCommand.bind(this));
    }

    // Turn on or off the engine for the target.
    onSpawnWeaponsCommand(player, weapon, ammo) {
        player.message(' hello ' + player.name + `get ${weapon}:${ammo}`);
    }

}
