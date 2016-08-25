// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Command = require('features/playground/command.js');
const CommandBuilder = require('components/command_manager/command_builder.js');

// Command: /spm [player] [message]
class SecretPrivateMessageCommand extends Command {
    get name() { return 'spm'; }
    get defaultPlayerLevel() { return Player.LEVEL_MANAGEMENT; }

    build(commandBuilder) {
        commandBuilder
            .parameters([ { name: 'target',  type: CommandBuilder.PLAYER_PARAMETER },
                          { name: 'message', type: CommandBuilder.SENTENCE_PARAMETER } ])
            .build(SecretPrivateMessageCommand.prototype.onSecretPrivateMessageCommand.bind(this));
    }

    onSecretPrivateMessageCommand(player, target, message) {
        const color = Color.fromRGB(0x26, 0xA6, 0x9A);

        if (target === player) {
            player.sendMessage(Message.COMMAND_ERROR, 'You cannot send yourself secret messages!');
            return;
        }

        target.sendMessage('Secret PM from ' + player.name + ' (Id:' + player.id + '): ' + message);
        player.sendMessage('Secret PM to ' + target.name + ' (Id:' + target.id + '): ' + message);
    }
}

exports = SecretPrivateMessageCommand;
