// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Command } from 'features/playground/command.js';
import { CommandBuilder } from 'components/commands/command_builder.js';
import { VirtualWorld } from 'entities/virtual_world.js';

// Command: /jetpack [player] ["remove"]
export default class JetpackCommand extends Command {
    get name() { return 'jetpack'; }
    get defaultPlayerLevel() { return Player.LEVEL_ADMINISTRATOR; }
    get description() { return `Get a jetpack to fly around in.`; }

    build(commandBuilder) {
        commandBuilder
            .sub(CommandBuilder.kTypePlayer, 'target')
                .description('Give or remove a jetpack to another player.')
                .restrict(Player.LEVEL_ADMINISTRATOR)
                .parameters([
                    { name: 'remove', type: CommandBuilder.kTypeText, optional: true }
                ])
                .build(JetpackCommand.prototype.onJetpackCommand.bind(this))
            .build(JetpackCommand.prototype.onJetpackCommand.bind(this));
    }

    onJetpackCommand(player, targetPlayer, action = null) {
        const subject = targetPlayer || player;

        // Do not allow jetpacks to be spawned in virtual worlds.
        if (!VirtualWorld.isMainWorld(subject.virtualWorld) && !player.isManagement()) {
            player.sendMessage(Message.LVP_JETPACK_NOT_AVAILABLE_VW);
            return;
        }

        // Is the administrator removing a jetpack from this player instead of granting one?
        if (player.isAdministrator() && action === 'remove') {
            subject.specialAction = Player.kSpecialActionNone;
            subject.clearAnimations();

            subject.sendMessage(Message.LVP_JETPACK_REMOVED, player.name, player.id);
            if (player !== subject)
                player.sendMessage(Message.LVP_JETPACK_REMOVED_OTHER, subject.name, subject.id);

            this.announce_().announceToAdministrators(
                Message.LVP_JETPACK_ANNOUNCE, player.name, player.id, 'removed', 'from',
                subject.name, subject.id);

            return;
        }

        // Grant a jetpack to the |subject|.
        subject.specialAction = Player.kSpecialActionJetpack;

        if (subject !== player) {
            player.sendMessage(Message.LVP_JETPACK_GRANTED_OTHER, subject.name, subject.id);
            subject.sendMessage(Message.LVP_JETPACK_GRANTED, player.name, player.id);

            this.announce_().announceToAdministrators(
                Message.LVP_JETPACK_ANNOUNCE, player.name, player.id, 'given', 'to', subject.name,
                subject.id);

            return;
        }

        player.sendMessage(Message.LVP_JETPACK_GRANTED_SELF);
    }
}
