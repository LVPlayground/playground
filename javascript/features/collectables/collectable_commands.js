// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CollectableDatabase } from 'features/collectables/collectable_database.js';
import { CommandBuilder } from 'components/command_manager/command_builder.js';
import { CubicBezier } from 'base/cubic_bezier.js';
import { Menu } from 'components/menu/menu.js';

import { kAchievements } from 'features/collectables/achievements.js';

import { alert } from 'components/dialogs/alert.js';
import { confirm } from 'components/dialogs/confirm.js';
import { format } from 'base/format.js';
import { getAreaNameForPosition } from 'components/gameplay/area_names.js';

// Size of a chunk in regards to the collectable hint distance calculations.
export const kPriceChunkSize = 175;

// Implements the commands related to collectables, both for the local player, as well as for the
// ability to see the achievements owned by other players online on the server.
export class CollectableCommands {
    announce_ = null;
    finance_ = null;
    settings_ = null;

    manager_ = null;

    // Cubic Bézier curve for calculating the price of hints, based on items remaining.
    hintPriceBezier_ = null;

    constructor(manager, announce, finance, settings) {
        this.announce_ = announce;
        this.finance_ = finance;
        this.settings_ = settings;

        this.manager_ = manager;

        // Collectable hint prices: https://cubic-bezier.com/#.57,.05,.56,.95
        this.hintPriceBezier_ = new CubicBezier(.57, .05, .56, .95);

        // /achievements [player]?
        server.commandManager.buildCommand('achievements')
            .parameters([{ name: 'player', type: CommandBuilder.PLAYER_PARAMETER, optional: true }])
            .build(CollectableCommands.prototype.onAchievementsCommand.bind(this));

        // /barrels
        server.commandManager.buildCommand('barrels')
            .build(CollectableCommands.prototype.onSpecificSeriesCommand.bind(this, 'barrels'));

        // /collectables
        server.commandManager.buildCommand('collectables')
            .build(CollectableCommands.prototype.onCollectablesCommand.bind(this));
        
        // /tags
        server.commandManager.buildCommand('tags')
            .build(CollectableCommands.prototype.onSpecificSeriesCommand.bind(this, 'tags'));
        
        // /treasures
        server.commandManager.buildCommand('treasures')
            .build(CollectableCommands.prototype.onSpecificSeriesCommand.bind(this, 'treasures'));
    }

    // ---------------------------------------------------------------------------------------------

    // /achievements [player]?
    //
    // Displays the achievements achieved by either the player executing this command, or by any
    // other player online on the server. Distinguishes between the current collection round and
    // all achievements earned ever.
    async onAchievementsCommand(currentPlayer, targetPlayer) {
        const player = targetPlayer || currentPlayer;
        const achievements = this.manager_.getDelegate(CollectableDatabase.kAchievement);

        const dialog = new Menu('Achievements', [
            'Name',
            'Description',

        ], { pageSize: 25 });

        for (const [ achievement, { name, text } ] of kAchievements) {
            const achieved = achievements.hasAchievement(player, achievement, /* round= */ false);
            const colour = achieved ? '{FFFF00}' : '{CCCCCC}';

            dialog.addItem(colour + name, colour + text);
        }

        await dialog.displayForPlayer(currentPlayer);
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
            [
                '{64FFDA}Treasures',
                {
                    delegate: this.manager_.getDelegate(CollectableDatabase.kTreasures),
                    instructions: Message.COLLECTABLE_INSTRUCTIONS_TREASURES,
                }
            ],
        ]);

        for (const [ label, { delegate, instructions } ] of series) {
            const total = delegate.getCollectableCount();
            const statistics = delegate.getPlayerStatistics(player);

            const collected = statistics.collectedRound.size;
            
            let progress = '';
            if (!collected)
                progress = '{CCCCCC}not started';
            else if (collected === total)
                progress = '{FFFF00}completed';
            else
                progress = `${collected} / ${total}`;

            if (statistics.round > 1)
                progress += ` {80ff00}(round ${statistics.round})`;

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

    // Called when a player has entered the command for a specific series of collectables. Will
    // handle the case as if they got their through the `/collectables` command.
    async onSpecificSeriesCommand(player, series) {
        switch (series) {
            case 'barrels':
                return this.handleCollectableSeries(
                    player,
                    this.manager_.getDelegate(CollectableDatabase.kRedBarrel),
                    Message.COLLECTABLE_INSTRUCTIONS_RED_BARRELS);

            case 'tags':
                return this.handleCollectableSeries(
                    player,
                    this.manager_.getDelegate(CollectableDatabase.kSprayTag),
                    Message.COLLECTABLE_INSTRUCTIONS_SPRAY_TAGS);

            case 'treasures':
                return this.handleCollectableSeries(
                    player,
                    this.manager_.getDelegate(CollectableDatabase.kTreasures),
                    Message.COLLECTABLE_INSTRUCTIONS_TREASURES);

            default:
                throw new Error(`Unknown collectable series given: ${series}.`);
        }
    }

    // Handles display of a menu with the specific series owned by |delegate| for the player. The
    // options available to the |player| will heavily depend on their progress thus far.
    async handleCollectableSeries(player, delegate, instructions) {
        const dialog = new Menu(delegate.name);

        // Whether the |player| has finished collecting everything for the series.
        const ratio = 
            delegate.countCollectablesForPlayer(player).round / delegate.getCollectableCount();

        // Whether completion of a collectable is required before they can be reset.
        const requireCompletion =
            this.settings_().getValue('playground/collectable_reset_require_complete');

        // (1) Make instructions available on what the series' purpose is.
        dialog.addItem('Instructions', async () => {
            await alert(player, {
                title: delegate.name,
                message: instructions
            });
        });

        // (2) If the |player| is still collecting them, offer the ability to purchase a hint.
        if (ratio < 1) {
            const collectablePosition = this.findClosestCollectablePosition(player, delegate);
            const price = this.calculatePriceForHint(player.position, collectablePosition, ratio);

            const formattedPrice = format('%$', price);
            const colour = this.finance_().getPlayerCash(player) < price ? '{F4511E}' : '{43A047}';
            
            // The menu item includes the price of the hint, coloured based on whether the |player|
            // is currently carrying enough money to pay for it or not.
            dialog.addItem(`Purchase a hint (${colour}${formattedPrice}{FFFFFF})...`, async () => {
                if (this.finance_().getPlayerCash(player) < price) {
                    return alert(player, {
                        title: delegate.name,
                        message: `You need ${format('%$', price)} to pay for the hint!`,
                    });
                }

                // Take the cash from them, then start compiling the hint's message.
                this.finance_().takePlayerCash(player, price);

                const playerPosition = player.position;

                const direction = this.determineDirection(playerPosition, collectablePosition);
                const distance =
                    Math.max(1, Math.round(playerPosition.distanceTo(collectablePosition) / 50))
                        * 50;
                
                const areaName = getAreaNameForPosition(collectablePosition);
                const message = `There is a ${delegate.singularName} about ${distance} meters to` +
                                `\nthe ${direction} in ${areaName}... Happy hunting!`;
                
                // Display the |message| to the player as an alert, and then send it to them again
                // in the chat box so that they have the opportunity to read it again.
                await alert(player, {
                    title: delegate.name,
                    message
                });
                
                player.sendMessage(
                    Message.COLLECTABLE_HINT, delegate.singularName, distance, direction, areaName);
            });
        }

        // (3) If the |player| has completed the series, allow them to reset it. It will ask for
        // confirmation, after which a new round will be started for the player.
        if ((requireCompletion && ratio === 1) || (!requireCompletion && ratio > 0)) {
            dialog.addItem('Start over again...', async () => {
                const confirmation = await confirm(player, {
                    title: delegate.name,
                    message: `Are you sure that you want to collect all the ${delegate.name}\n` +
                             `again? You will keep all the awarded benefits.`
                });

                if (!confirmation)
                    return;  // the |player| changed their mind
                
                // Start the new round for the |player|...
                delegate.startCollectableRoundForPlayer(player);

                // Announce it to administrators, since this is significant.
                this.announce_().announceToAdministrators(
                    Message.COLLECTABLE_RESET_ADMIN, player.name, player.id, delegate.name);
                
                // Announce it to the |player|, so that they know this has happened as well.
                await alert(player, {
                    title: delegate.name,
                    message: `All your ${delegate.name} have been reset! Enjoy collecting\n` +
                             `them again, and remember that your awarded benefits still exist!`
                });
            });
        }

        // Statistics?

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

    // Determines a rough direction. This is a bit cheeky - we only consider { north, east, south,
    // west }, and pick the direction with the biggest derivation.
    determineDirection(playerPosition, collectablePosition) {
        const diffX = playerPosition.x - collectablePosition.x;
        const diffY = playerPosition.y - collectablePosition.y;

        if (Math.abs(diffX) > Math.abs(diffY)) {
            return diffX > 0 ? 'west'
                             : 'east';
        } else {
            return diffY > 0 ? 'south'
                             : 'north';
        }
    }

    // Finds the collectable that's closest to the |player| given the |delegate|, which they haven't
    // collected just yet. Returns that collectable, or NULL when none could be found.
    findClosestCollectablePosition(player, delegate) {
        let closestCollectable = null;
        let closestDistance = Number.MAX_SAFE_INTEGER;

        const playerDistance = player.position;
        const playerStatistics = delegate.getPlayerStatistics(player);

        for (const [ id, { position } ] of delegate.getCollectablesForHints(player)) {
            if (playerStatistics && playerStatistics.collectedRound.has(id))
                continue;  // they've already collected this entry

            const distance = playerDistance.squaredDistanceTo(position);
            if (distance >= closestDistance)
                continue;
            
            closestCollectable = position;
            closestDistance = distance;
        }

        return closestCollectable;
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.commandManager.removeCommand('treasures');
        server.commandManager.removeCommand('tags');
        server.commandManager.removeCommand('barrels');

        server.commandManager.removeCommand('collectables');
        server.commandManager.removeCommand('achievements');
    }
}
