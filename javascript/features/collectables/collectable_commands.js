// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CollectableDatabase } from 'features/collectables/collectable_database.js';
import CommandBuilder from 'components/command_manager/command_builder.js';
import { CubicBezier } from 'base/cubic_bezier.js';
import Menu from 'components/menu/menu.js';

import alert from 'components/dialogs/alert.js';
import { getAreaNameForPosition } from 'components/gameplay/area_names.js';

// 
export const kPriceChunkSize = 175;

// Implements the commands related to collectables, both for the local player, as well as for the
// ability to see the achievements owned by other players online on the server.
export class CollectableCommands {
    manager_ = null;
    settings_ = null;

    // Cubic Bézier curve for calculating the price of hints, based on items remaining.
    hintPriceBezier_ = null;

    constructor(manager, settings) {
        this.manager_ = manager;
        this.settings_ = settings;

        // Collectable hint prices: https://cubic-bezier.com/#.57,.05,.56,.95
        this.hintPriceBezier_ = new CubicBezier(.57, .05, .56, .95);

        // /achievements [player]?
        server.commandManager.buildCommand('achievements')
            .parameters([{ name: 'player', type: CommandBuilder.PLAYER_PARAMETER, optional: true }])
            .build(CollectableCommands.prototype.onAchievementsCommand.bind(this));
        
        // /collectables
        server.commandManager.buildCommand('collectables')
            .build(CollectableCommands.prototype.onCollectablesCommand.bind(this));
    }

    // ---------------------------------------------------------------------------------------------

    // /achievements [player]?
    //
    // Displays the achievements achieved by either the player executing this command, or by any
    // other player online on the server. Distinguishes between the current collection round and
    // all achievements earned ever.
    onAchievementsCommand(currentPlayer, targetPlayer) {
        const player = targetPlayer || currentPlayer;


    }

    // ---------------------------------------------------------------------------------------------

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

        // Whether the |player| has finished collecting everything for the series.
        const completed =
            delegate.getCollectableCount() === delegate.countCollectablesForPlayer(player).round;

        // (1) Make instructions available on what the series' purpose is.
        dialog.addItem('Instructions', async () => {
            await alert(player, {
                title: delegate.name,
                message: instructions
            });
        });

        // (2) If the |player| is still collecting them, offer the ability to purchase a hint.
        if (!completed) {
            
        }

        // (3) If the |player| has completed the series, allow them to reset it.
        if (completed) {

        }

        // Purchase a hint ($...)
        // Start over again

        await dialog.displayForPlayer(player);
    }

    // ---------------------------------------------------------------------------------------------

    // Calculates the price for a hint based on the number of remaining collectables, as well as
    // the distance between the player and the collectable. (Based on rough order of magnitude.)
    calculatePriceForHint(playerPosition, collectablePosition, collectedRatio) {
        const kMinimumPrice = this.settings_().getValue('playground/collectable_hint_price_min');
        const kMaximumPrice = this.settings_().getValue('playground/collectable_hint_price_max');

        // The base price of the hint, based on the |collectedRatio| among the Bézier curve used
        // for calculating the price. Won't be a nice, round value.
        const basePrice =
            kMinimumPrice + (kMaximumPrice - kMinimumPrice) *
                this.hintPriceBezier_.calculate(collectedRatio);

        // If the |playerPosition| and |collectablePosition| are sufficiently far away from each
        // other, we offer discounts because the answer will be inaccurate. This means players can
        // "guess" where a collectable is without paying: this is deliberate, because it's clever.
        const distance = playerPosition.distanceTo(collectablePosition);
        const distanceChunks = Math.floor(distance / kPriceChunkSize);  // [0, 34]

        const multiplier = 1 - distanceChunks * .0075;

        // Return the base price with the calculated multiplier based on distance.
        return basePrice * multiplier;
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.commandManager.removeCommand('collectables');
        server.commandManager.removeCommand('achievements');
    }
}
