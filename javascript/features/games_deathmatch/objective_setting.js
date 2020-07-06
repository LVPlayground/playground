// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { GameCustomSetting } from 'features/games/game_custom_setting.js';
import { Menu } from 'components/menu/menu.js';
import { Question } from 'components/dialogs/question.js';

import { format } from 'base/format.js';
import { timeDifferenceToString } from 'base/time.js';

// Returns whether the given |value| is in range of |min| (inclusive) and |max| (inclusive).
function isNumberInRange(min, max, value) {
    const floatValue = parseFloat(value);
    if (Number.isNaN(floatValue) || !Number.isSafeInteger(floatValue))
        return false;
    
    return floatValue >= min && floatValue <= max;
}

// Represents the player's ability to chose the objective of a game. At heart this is an enumeration
// where certain options have further customization values available, e.g. the number of rounds, or
// the time limit for which a deathmatch game is allowed to run.
export class ObjectiveSetting extends GameCustomSetting {
    // Composes the default value for the objective based on the |description|.
    static getDefaultValue(description) {
        switch (description.objective) {
            case 'Last man standing':
            case 'Continuous':
                return { type: description.objective };
            
            case 'Best of...':
            case 'First to...':
                return { type: description.objective, kills: description.objectiveValue };
            
            case 'Time limit...':
                return { type: description.objective, seconds: description.objectiveValue };
        }
    }

    // Returns the value label to display in the actual box. This combines the type of objective
    // with the specialization given by the player, e.g. best of X.
    getCustomizationDialogValue(currentValue) {
        switch (currentValue.type) {
            case 'Best of...':
                return format('Best of %d rounds', currentValue.kills);

            case 'First to...':
                return format('First to %d kills', currentValue.kills);

            case 'Time limit...':
                return format('Time limit (%s)', timeDifferenceToString(currentValue.seconds));

            default:
                return currentValue.type;
        }
    }

    // Handles the customization flow for the objective.
    async handleCustomization(player, settings, currentValue) {
        const dialog = new Menu('Game objective', [
            'Objective',
            'Value',
        ]);

        const options = [
            [
                'Last man standing',
                ObjectiveSetting.prototype.applyOption.bind(this, settings, 'Last man standing')
            ],
            [
                'Best of...',
                ObjectiveSetting.prototype.handleBestOfSetting.bind(this, settings, player)
            ],
            [
                'First to...',
                ObjectiveSetting.prototype.handleFirstToSetting.bind(this, settings, player)
            ],
            [
                'Time limit...',
                ObjectiveSetting.prototype.handleTimeLimitSetting.bind(this, settings, player)
            ],
            [
                'Continuous',
                ObjectiveSetting.prototype.applyOption.bind(this, settings, 'Continuous')
            ],
        ];

        for (const [ option, listener ] of options) {
            const label = this.getOptionLabel(option, currentValue);
            const value = this.getOptionValue(option, currentValue);

            dialog.addItem(label, value, listener);
        }

        return await dialog.displayForPlayer(player);
    }

    // Applies the given |option| as the desired objective.
    applyOption(settings, option) { settings.set('deathmatch/objective', { type: option }); }

    // Handles the case where the objective should be "Best of X rounds".
    async handleBestOfSetting(settings, player) {
        const rounds = await Question.ask(player, {
            question: 'Game objective',
            message: `Please enter the number of rounds for the game.`,
            constraints: {
                validation: isNumberInRange.bind(null, 2, 50),
                explanation: 'The number of rounds must be between 2 and 50.',
                abort: 'You need to give a reasonable number of rounds for the game.',
            }
        });

        if (!rounds)
            return null;

        settings.set('deathmatch/objective', {
            type: 'Best of...',
            kills: parseInt(rounds, 10),
        });
    }

    // Handles the case where the objective should be "First to X kills".
    async handleFirstToSetting(settings, player) {
        const kills = await Question.ask(player, {
            question: 'Game objective',
            message: `Please enter the number of kills for the game.`,
            constraints: {
                validation: isNumberInRange.bind(null, 2, 50),
                explanation: 'The number of kills must be between 2 and 50.',
                abort: 'You need to give a reasonable number of kills for the game.',
            }
        });

        if (!kills)
            return null;

        settings.set('deathmatch/objective', {
            type: 'First to...',
            kills: parseInt(kills, 10),
        });
    }

    // Handles the case where the objective should be a time limit.
    async handleTimeLimitSetting(settings, player) {
        const seconds = await Question.ask(player, {
            question: 'Game objective',
            message: `Please enter the game's time limit in seconds.`,
            constraints: {
                validation: isNumberInRange.bind(null, 30, 1800),
                explanation: 'The time limit must be between 30 seconds and 1800 seconds, which ' +
                             'is 30 minutes.',
                abort: 'You need to give a reasonable time limit for the game.',
            }
        });

        if (!seconds)
            return null;

        settings.set('deathmatch/objective', {
            type: 'Time limit...',
            seconds: parseInt(seconds, 10),
        });
    }

    // Returns the label to display for the given |option|, based on the |currentValue|. The
    // selected option will be highlighted in yellow.
    getOptionLabel(option, currentValue) {
        if (currentValue.type === option)
            return `{FFFF00}${option}`;
        
        return option;
    }

    // Returns the value to display for the given |option|. If it's not the selected option, an
    // empty string will be used. Otherwise the value depends on the type of |option|.
    getOptionValue(option, currentValue) {
        if (currentValue.type !== option)
            return '';
        
        switch (option) {
            case 'Best of...':
                return format('{FFFF00}%d rounds', currentValue.kills);

            case 'First to...':
                return format('{FFFF00}%d kills', currentValue.kills);
            
            case 'Time limit...':
                return format('{FFFF00}%s', timeDifferenceToString(currentValue.seconds));
        }

        return '{FFFF00}X';
    }
}
