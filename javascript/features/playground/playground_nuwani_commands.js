// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/command_manager/command_builder.js';

// Implements commands specific to Las Venturas Playground which are made accessible through Nuwani,
// particularly commands related to lower-level server maintenance.
export class PlaygroundNuwaniCommands {
    announce_ = null;
    nuwani_ = null;

    constructor(announce, nuwani) {
        this.announce_ = announce;
        this.nuwani_ = nuwani;

        // Nuwani commands don't use the regular, server-side command manager.
        const commandManager = this.nuwani_().commandManager;

        // !lvp
        // !lvp reload messages
        // !lvp reload [feature]
        commandManager.buildCommand('lvp')
            .restrict(Player.LEVEL_MANAGEMENT)
            .sub('reload')
                .sub('messages')
                    .build(PlaygroundNuwaniCommands.prototype.onLvpReloadMessagesCommand.bind(this))
                .parameters([{ name: 'feature', type: CommandBuilder.WORD_PARAMETER } ])
                .build(PlaygroundNuwaniCommands.prototype.onLvpReloadFeatureCommand.bind(this))
            .build(PlaygroundNuwaniCommands.prototype.onLvpCommand.bind(this));
    }

    // !lvp
    //
    // Shows information on how to use the command.
    onLvpCommand(context) {
        context.respondWithUsage('!lvp reload [messages | [feature]]');
    }

    // !lvp reload messages
    //
    // Reloads the messages and format defined for the JavaScript features in `messages.json`.
    onLvpReloadMessagesCommand(context) {
        this.announce_().announceToAdministrators(
            Message.LVP_RELOAD_MESSAGES_IRC_ADMIN, context.nickname);

        try {
            const { originalMessageCount, messageCount } = Message.reloadMessages();
            context.respond('3Success: %d messages have been loaded 14(was: %d).',
                            messageCount, originalMessageCount);

        } catch (exception) {
            context.respond(`4Error: Unable to reload the messages: ${exception.message}`);
        }
    }

    // !lvp reload [feature]
    //
    // Reloads a particular JavaScript feature in its entirety. This is risky, so should be used
    // with care by those who are familiar with Las Venturas Playground development.
    async onLvpReloadFeatureCommand(context, feature) {
        if (!server.featureManager.hasFeature(feature)) {
            context.respond(`4Error: The ${feature} feature does not exist.`);
            return;
        }

        if (!server.featureManager.isEligibleForLiveReload(feature)) {
            context.respond(`4Error: The ${feature} feature is not eligible for live reload.`);
            return;
        }

        try {
            await server.featureManager.liveReload(feature);
            context.respond(`3Success: The ${feature} feature has been reloaded.`);
        } catch (exception) {
            context.respond(`4Error: Unable to reload ${feature}: ${exception.message}`);
        }

        this.announce_().announceToAdministrators(
            Message.NUWANI_ADMIN_FEATURE_RELOADED, context.nickname, feature);
    }

    dispose() {}
}
