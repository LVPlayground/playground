// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const CommandBuilder = require('components/command_manager/command_builder.js');

// Tag to send a message to the crew-channel
const CrewTag = 'crew';

// Tag to send a message to the management-channel
const ManTag = 'man';

// For some purposes it could come in handy to know something about your own position and the
// direction looking in. Some small positioning-related commands are for that defined in here.
class IrcChatCommands {
    constructor(announce) {
        this.announce_ = announce;

        server.commandManager.buildCommand('crew')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([{ name: 'message', type: CommandBuilder.SENTENCE_PARAMETER }])
            .build(IrcChatCommands.prototype.onCrewCommand.bind(this));

        server.commandManager.buildCommand('man')
            .restrict(Player.LEVEL_MANAGEMENT)
            .parameters([{ name: 'message', type: CommandBuilder.SENTENCE_PARAMETER }])
            .build(IrcChatCommands.prototype.onManCommand.bind(this));
    }

    sendMessageToPlayerAndIrc(player, channel, message, ircTag) {
        player.sendMessage(Message.IRC_CHAT_MESSAGE_SENT, channel, player.name, message);

        this.announce_().announceToIRC(ircTag, player.name, message);
    }

    onCrewCommand(player, message) {
        this.sendMessageToPlayerAndIrc(player, '#LVP.Crew', message, CrewTag);
    }

    onManCommand(player, message) {
        this.sendMessageToPlayerAndIrc(player, '#LVP.Management', message, ManTag);
    }

    // Cleans up the state created by this class, i.e. unregisters the commands.
    dispose() {
        server.commandManager.removeCommand('crew');
        server.commandManager.removeCommand('man');
    }
}

exports = IrcChatCommands;
