// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/command_manager/command_builder.js';

// Encapsulates a series of commands to do with the ability to ignore other players.
export class IgnoreCommands {
    communication_ = null;

    // Gets the MessageVisibilityManager from the Communication feature.
    get visibilityManager() { return this.communication_().visibilityManager_; }

    constructor(communication) {
        this.communication_ = communication;

        // /ignore [player]
        server.deprecatedCommandManager.buildCommand('ignore')
            .parameters([{ name: 'player', type: CommandBuilder.PLAYER_PARAMETER }])
            .build(IgnoreCommands.prototype.onIgnoreCommand.bind(this));

        // /ignored [player]?
        server.deprecatedCommandManager.buildCommand('ignored')
            .sub(CommandBuilder.PLAYER_PARAMETER)
                .restrict(Player.LEVEL_ADMINISTRATOR)
                .build(IgnoreCommands.prototype.onIgnoredCommand.bind(this))
            .build(IgnoreCommands.prototype.onIgnoredCommand.bind(this));

        // /unignore [player]
        server.deprecatedCommandManager.buildCommand('unignore')
            .parameters([{ name: 'player', type: CommandBuilder.PLAYER_PARAMETER }])
            .build(IgnoreCommands.prototype.onUnignoreCommand.bind(this));
    }

    // /ignore [player]
    //
    // Makes the given |player| ignore the selected |subject|. No further communication will be
    // received from them, although they may still see other evidence of them existing.
    onIgnoreCommand(player, subject) {
        const ignored = this.visibilityManager.getIgnoredPlayers(player);
        if (ignored.includes(subject)) {
            player.sendMessage(Message.IGNORE_ADDED_REDUNDANT, subject.name);
            return;
        }

        this.visibilityManager.addPlayerToIgnoreList(player, subject);

        player.sendMessage(Message.IGNORE_ADDED_PLAYER, subject.name);
    }

    // /ignored [player]?
    //
    // Gives an overview of who the |player| has ignored. Administrators are able to use the command
    // on other players as well, as it helps them to debug what's going on.
    onIgnoredCommand(currentPlayer, targetPlayer) {
        const player = targetPlayer || currentPlayer;

        const ignored = this.visibilityManager.getIgnoredPlayers(player);
        if (!ignored.length) {
            currentPlayer.sendMessage(Message.IGNORE_IGNORED_NOBODY);
            return;
        }

        const ignoredPlayers = [];
        for (const ignoredPlayer of ignored) {
            if (!ignoredPlayer.isConnected()) {
                this.visibilityManager.removePlayerFromIgnoreList(player, ignoredPlayer);
                continue;
            }

            ignoredPlayers.push(`${ignoredPlayer.name} (Id:${ignoredPlayer.id})`);
        }

        // It's possible that there were left-over players who have disconnected since.
        if (!ignoredPlayers.length) {
            currentPlayer.sendMessage(Message.IGNORE_IGNORED_NOBODY);
            return;
        }

        // Send the list of |ignoredPlayers| in batches of five to keep the messages short.
        while (ignoredPlayers.length) {
            currentPlayer.sendMessage(
                Message.IGNORE_IGNORED, ignoredPlayers.splice(0, 5).join(', '));
        }
    }

    // /unignore [player]
    //
    // Removes the given |subject| from the ignore list specific to |player|. They'll start to
    // receive all communication sent by them again.
    onUnignoreCommand(player, subject) {
        const ignored = this.visibilityManager.getIgnoredPlayers(player);
        if (!ignored.includes(subject)) {
            player.sendMessage(Message.IGNORE_REMOVED_REDUNDANT, subject.name);
            return;
        }

        this.visibilityManager.removePlayerFromIgnoreList(player, subject);

        player.sendMessage(Message.IGNORE_REMOVED_PLAYER, subject.name);
    }

    dispose() {
        server.deprecatedCommandManager.removeCommand('unignore');
        server.deprecatedCommandManager.removeCommand('ignored');
        server.deprecatedCommandManager.removeCommand('ignore');
    }
}
