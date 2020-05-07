// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import CommandBuilder from 'components/command_manager/command_builder.js';

// For some purposes it could come in handy to know something about your own position and the
// direction looking in. Some small positioning-related commands are for that defined in here.
class IrcChatCommands {
    constructor(nuwani) {
        this.nuwani_ = nuwani;

        server.commandManager.buildCommand('crew')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([{ name: 'message', type: CommandBuilder.SENTENCE_PARAMETER }])
            .build(IrcChatCommands.prototype.onCrewCommand.bind(this));

        server.commandManager.buildCommand('man')
            .restrict(player => player.isManagement())
            .parameters([{ name: 'message', type: CommandBuilder.SENTENCE_PARAMETER }])
            .build(IrcChatCommands.prototype.onManCommand.bind(this));
    }

    sendMessageToPlayerAndIrc(player, channel, message) {
        player.sendMessage(Message.IRC_CHAT_MESSAGE_SENT, channel, player.name, message);

        this.nuwani_().echo('chat-irc', channel, player.name, player.id, message);
    }

    onCrewCommand(player, message) {
        this.sendMessageToPlayerAndIrc(player, '#LVP.Crew', message);
    }

    onManCommand(player, message) {
        this.sendMessageToPlayerAndIrc(player, '#LVP.Management', message);
    }

    // Cleans up the state created by this class, i.e. unregisters the commands.
    dispose() {
        server.commandManager.removeCommand('crew');
        server.commandManager.removeCommand('man');
    }
}

export default IrcChatCommands;
