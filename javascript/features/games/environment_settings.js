// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { GameCustomSetting } from 'features/games/game_custom_setting.js';
import { Menu } from 'components/menu/menu.js';

// Configuration and mappings for the gravity options available to games.
// Sync: //components/games/structured_game_description_templates.js
const kGravityConfiguration = new Map([
    [ 'Low', 0.0035 ],
    [ 'Normal', null ],
    [ 'High', 0.012 ],
]);

// Configuration and mappings for the time options available to games.
// Sync: //components/games/structured_game_description_templates.js
const kTimeConfiguration = new Map([
    [ 'Morning', 8 ],
    [ 'Afternoon', 15 ],
    [ 'Evening', 20 ],
    [ 'Night', 2 ],
]);

// Configuration and mappings for the weather options available to games.
// Sync: //components/games/structured_game_description_templates.js
const kWeatherConfiguration = new Map([
    [ 'Cloudy', 7 ],
    [ 'Foggy', 9 ],
    [ 'Heatwave', 11 ],
    [ 'Rainy', 8 ],
    [ 'Sandstorm', 19 ],
    [ 'Sunny', 10 ],
]);

// Represents the environment for minigames, which can be customised to the player's liking. This
// includes the time, the weather, as well as the gravity level to apply.
export class EnvironmentSettings extends GameCustomSetting {
    // Options available for each of the configuration values.
    static kGravityOptions = [ ...kGravityConfiguration.keys() ];
    static kTimeOptions = [ ...kTimeConfiguration.keys() ];
    static kWeatherOptions = [ ...kWeatherConfiguration.keys() ];

    // Returns the actual in-game values for the given |option|.
    static getGravityForOption(option) { return kGravityConfiguration.get(option) ?? null; }
    static getTimeForOption(option) { return kTimeConfiguration.get(option) ?? null; }
    static getWeatherForOption(option) { return kWeatherConfiguration.get(option) ?? null; }

    // Returns the value that is to be displayed in the generic customization dialog for games.
    getCustomizationDialogValue(currentValue) {
        let value = null;

        switch (currentValue.weather) {
            case 'Cloudy':
            case 'Foggy':
            case 'Rainy':
            case 'Sunny':
                value = currentValue.weather + ' ' + currentValue.time.toLowerCase();
                break;
            
            case 'Heatwave':
            case 'Sandstorm':
                if (currentValue.time === 'Night')
                    value = currentValue.time + 'ly ' + currentValue.weather.toLowerCase();
                else
                    value = currentValue.time + ' ' + currentValue.weather.toLowerCase();
                break;
            
            default:
                throw new Error('Invalid weather value: ' + currentValue.weather);
        }

        if (currentValue.gravity !== 'Normal')
            value += `, ${currentValue.gravity.toLowerCase()} gravity`;
        
        return value;
    }

    // Handles the customization flow for the given |player|. The resulting environment settings
    // will directly be written to the |settings| object.
    async handleCustomization(player, settings, currentValue) {
        const dialog = new Menu('Game environment', [
            'Setting',
            'Value',
        ]);

        const availableSettings = [
            [ 'Gravity', 'gravity', EnvironmentSettings.kGravityOptions ],
            [ 'Time', 'time', EnvironmentSettings.kTimeOptions ],
            [ 'Weather', 'weather', EnvironmentSettings.kWeatherOptions ],
        ];

        for (const [ label, property, options ] of availableSettings) {
            const selectedOption = currentValue[property];

            dialog.addItem(label, selectedOption, async () => {
                const value = await this.handleEnumeration(player, label, selectedOption, options);
                if (!value)
                    return null;
                
                currentValue[property] = value;

                // Store the |currentValue| back to the |settings|, so that they will apply.
                settings.set('game/environment', currentValue);
            });
        }

        return await dialog.displayForPlayer(player);
    }

    // Displays a list of the given |option| that the |player| is able to choose from. The given
    // |selectedOption| will be highlighted in yellow, to indicate it's already set.
    async handleEnumeration(player, title, selectedOption, options) {
        const dialog = new Menu('Game ' + title.toLowerCase());

        let value = selectedOption;
        for (const option of options) {
            const prefix = option === selectedOption ? '{FFFF00}' : '';

            dialog.addItem(prefix + option, () => value = option);
        }

        if (!await dialog.displayForPlayer(player))
            return null;
        
        return value;
    }
}
