// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { GameCustomSetting } from 'features/games/game_custom_setting.js';

import { format } from 'base/format.js';
import { timeDifferenceToString } from 'base/time.js';

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
            case 'First to...':
                return format('Best of %d', currentValue.kills);
            
            case 'Time limit...':
                return format('Time limit (%s)', timeDifferenceToString(currentValue.seconds));
            
            default:
                return currentValue.type;
        }
    }

    // Handles the customization flow for the objective.
    async handleCustomization(player, settings, currentValue) {

    }
}
