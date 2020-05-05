// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Command from 'features/playground/command.js';
import CommandBuilder from 'components/command_manager/command_builder.js';
import Menu from 'components/menu/menu.js';
import MessageBox from 'components/dialogs/message_box.js';
import PlayerSettingsDatabase from 'features/playground/database/player_settings_database.js';

import MockPlayerSettingsDatabase from 'features/playground/database/test/mock_player_settings_database.js';

// This class provides the /playersettings command available to administrators to manage 
// there desired settings.
class PlayerSettingsCommands extends Command {
    get name() { return 'playersettings'; }
    get defaultPlayerLevel() { return Player.LEVEL_ADMINISTRATOR; }

    constructor() {
        super();
        // The database instance used to read and write persistent values.
        this.database_ = server.isTest() ? new MockPlayerSettingsDatabase()
            : new PlayerSettingsDatabase();

        server.playerManager.addObserver(this, true /* replayHistory */);
    }

    build(commandBuilder) {
        commandBuilder
            .build(PlayerSettingsCommands.prototype.onPlayerSettingsCommand.bind(this));
    }
    
    // Loads the settings of the player when a player has logged in
    onPlayerLogin(player) {
        if(player.userId === null || player.userId === undefined) {
            return;
        }   
        
        // Load the existing persistent values from the database, and apply them to the local state.
        Promise.resolve(this.database_.loadSettings(player.userId)).then(settings => {
            for (const [identifier, value] of settings) {
                try {
                    player.settings.setValue(identifier, value);
                } catch (exception) {
                    console.log('Warning: Unable to restore the player setting of ' + identifier + ': ' +
                        exception);
                }
            }
        });
    }

    // Creates the menu for the player to choose what setting to change.
    async onPlayerSettingsCommand(player) {
        const categories = new Map();
        const menu = new Menu('Choose a category of player settings', ['Category', 'Setting']);

        // Identify the categories of settings that exist on the server.
        for (const setting of player.settings.announcementSettings.values()) {
            if (!categories.has(setting.category))
                categories.set(setting.category, new Set());

            categories.get(setting.category).add(setting);
        }

        const sortedCategories = Array.from(categories.keys()).sort();
        for (const category of sortedCategories) {
            const subCommands = categories.get(category);
            const settingsLabel = subCommands.size == 1 ? '1 setting'
                : subCommands.size + ' settings';

            // Adds a menu item to display the entries in the |category|.
            menu.addItem(category, settingsLabel, async (player) => {
                const sortedSettings =
                    Array.from(subCommands  ).sort((lhs, rhs) => lhs.name.localeCompare(rhs.name));

                const innerMenu = new Menu('Choose a setting', ['Setting', 'Value']);
                for (const setting of sortedSettings) {
                    let valueLabel = setting.value ? 'enabled' : 'disabled';

                    if (setting.value != setting.defaultValue) {
                        valueLabel = '{FFFF00}' + valueLabel + '{FFFFFF} (default: ' +
                            (setting.defaultValue ? 'enabled' : 'disabled') + ')';
                    }

                    // Add a menu item for the particular setting, that will in turn defer to a
                    // function that allows the particular setting to be changed.
                    innerMenu.addItem(setting.name, valueLabel, async (player) => {
                        await this.handleBooleanSettingModification(player, setting);
                    });
                }

                await innerMenu.displayForPlayer(player);
            });
        }

        await menu.displayForPlayer(player);
    }

    // Handles the |player| modifying the |setting|, which represents a boolean value.
    async handleBooleanSettingModification(player, setting) {
        const menu = new Menu(setting.description);

        // Create creative labels that describe both the current value, the new value and the
        // default value that was configured for the setting in its entirety.
        const enableLabel = (setting.value ? '{FFFF00}' : '') + 'Enable' +
            (setting.defaultValue ? ' {FFFFFF}(default)' : '');
        const disableLabel = (!setting.value ? '{FFFF00}' : '') + 'Disable' +
            (!setting.defaultValue ? ' {FFFFFF}(default)' : '');

        menu.addItem(enableLabel, async (player) => {
            this.updateSetting(player, setting.identifier, true);

            return await MessageBox.display(player, {
                title: 'The announcement has been enabled!',
                message: Message.format(Message.ANNOUNCEMENT_TOGGLED, setting.identifier, 'enabled')
            });
        });

        menu.addItem(disableLabel, async (player) => {
            this.updateSetting(player, setting.identifier, false);

            return await MessageBox.display(player, {
                title: 'The announcement has been disabled!',
                message: Message.format(Message.ANNOUNCEMENT_TOGGLED, setting.identifier, 'disabled')
            });
        });

        await menu.displayForPlayer(player);
    }

    updateSetting(player, identifier, value) {
        player.settings.setValue(identifier, value);
        
        var setting = player.settings.settings.get(identifier);

        // Either delete or write the new |value| from or to the database. Don't block on it.
        if (value === setting.defaultValue)
            this.database_.deleteSetting(setting, player.userId);
        else
            this.database_.writeSetting(setting, player.userId);
        
    }

}

export default PlayerSettingsCommands;