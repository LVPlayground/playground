// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Command from 'features/playground/command.js';
import { CommandBuilder } from 'components/command_manager/command_builder.js';

// Command: /skipdamage [player]
class SkipDamageCommand extends Command {
    get name() { return 'skipdamage'; }
    get defaultPlayerLevel() { return Player.LEVEL_MANAGEMENT; }

    build(commandBuilder) {
        commandBuilder
            .parameters([{ name: 'target', type: CommandBuilder.PLAYER_PARAMETER }])
            .build(SkipDamageCommand.prototype.onSkipDamageCommand.bind(this));
    }

    onSkipDamageCommand(player, targetPlayer) {
        if (targetPlayer.syncedData.skipDamage) {
            targetPlayer.syncedData.skipDamage = false;
            player.sendMessage(Message.LVP_SKIP_DAMAGE_UPDATED, targetPlayer.name, 'no longer');
        } else {
            targetPlayer.syncedData.skipDamage = true;
            player.sendMessage(Message.LVP_SKIP_DAMAGE_UPDATED, targetPlayer.name, 'now');
        }
    }
}

export default SkipDamageCommand;
