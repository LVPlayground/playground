// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CollectableDatabase } from 'features/collectables/collectable_database.js';
import CommandBuilder from 'components/command_manager/command_builder.js';
import Menu from 'components/menu/menu.js';

import alert from 'components/dialogs/alert.js';

// Implements the commands related to collectables, both for the local player, as well as for the
// ability to see the achievements owned by other players online on the server.
export class CollectableCommands {
    manager_ = null;

    constructor(manager) {
        this.manager_ = manager;

        // /achievements [player]?
        server.commandManager.buildCommand('achievements')
            .parameters([{ name: 'player', type: CommandBuilder.PLAYER_PARAMETER, optional: true }])
            .build(CollectableCommands.prototype.onAchievementsCommand.bind(this));
        
        // /collectables
        server.commandManager.buildCommand('collectables')
            .build(CollectableCommands.prototype.onCollectablesCommand.bind(this));
    }

    // /achievements [player]?
    //
    // Displays the achievements achieved by either the player executing this command, or by any
    // other player online on the server. Distinguishes between the current collection round and
    // all achievements earned ever.
    onAchievementsCommand(currentPlayer, targetPlayer) {
        const player = targetPlayer || currentPlayer;


    }

    // /collectables
    //
    // Shows players the base of the /collectables command, which displays a dialog with options
    // that are available to them. This includes /achievements.
    async onCollectablesCommand(player) {
        const dialog = new Menu('Collectables', [
            'Series',
            'Progress'
        ]);

        const series = new Map([
            [
                'Achievements',
                {
                    delegate: this.manager_.getDelegate(CollectableDatabase.kAchievement),
                    instructions: null,
                }
            ],
            [
                '{FF5252}Red Barrels',
                {
                    delegate: this.manager_.getDelegate(CollectableDatabase.kRedBarrel),
                    instructions: Message.COLLECTABLE_INSTRUCTIONS_RED_BARRELS,
                }
            ],
            [
                '{B2FF59}Spray Tags',
                {
                    delegate: this.manager_.getDelegate(CollectableDatabase.kSprayTag),
                    instructions: Message.COLLECTABLE_INSTRUCTIONS_SPRAY_TAGS,
                }
            ],
        ]);

        for (const [ label, { delegate, instructions } ] of series) {
            const total = delegate.getCollectableCount();
            const collected = delegate.countCollectablesForPlayer(player).round;
            
            let progress = '';
            if (!collected)
                progress = '{CCCCCC}not started';
            else if (collected === total)
                progress = '{FFFF00}completed';
            else
                progress = `${collected} / ${total}`;

            // TODO: Display the |player|'s collection round if it's >1

            let listener = null;
            if (label.includes('Achievements')) {
                listener = CollectableCommands.prototype.onAchievementsCommand.bind(this, player);
            } else {
                listener = CollectableCommands.prototype.handleCollectableSeries.bind(
                    this, player, delegate, instructions);
            }

            dialog.addItem(label, progress, listener);
        }

        await dialog.displayForPlayer(player);
    }

    // Handles display of a menu with the specific series owned by |delegate| for the player. The
    // options available to the |player| will heavily depend on their progress thus far.
    async handleCollectableSeries(player, delegate, instructions) {
        const dialog = new Menu(delegate.name);

        // (1) Make instructions available on what the series' purpose is.
        dialog.addItem('Instructions', async () => {
            await alert(player, {
                title: delegate.name,
                message: instructions
            });
        });

        // buy hint
        // reset

        await dialog.displayForPlayer(player);
    }

    dispose() {
        server.commandManager.removeCommand('collectables');
        server.commandManager.removeCommand('achievements');
    }
}
