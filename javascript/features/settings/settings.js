// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Feature from 'components/feature_manager/feature.js';
import { PawnConfig } from 'features/settings/pawn_config.js';
import { Setting } from 'entities/setting.js';
import SettingList from 'features/settings/setting_list.js';
import SettingsDatabase from 'features/settings/settings_database.js';

import MockSettingsDatabase from 'features/settings/test/mock_settings_database.js';

// Provides the ability to get and set settings that should persist between server restarts. Values
// that have been changed from their defaults will be stored in the database.
class Settings extends Feature {
    constructor() {
        super();

        // This is a foundational feature.
        this.markFoundational();

        // The database instance used to read and write persistent values.
        this.database_ = server.isTest() ? new MockSettingsDatabase()
                                         : new SettingsDatabase();

        // Map of setting identifiers (as "category/name") to the corresponding Setting instance.
        this.settings_ = new Map();

        // Map of setting identifiers to a map of instances to listeners.
        this.observers_ = new Map();

        // The PawnConfig instance, which magically synchronizes any setting with Pawn.
        this.pawnConfig_ = new PawnConfig();

        // Import the settings from the |SettingList| in to the local state.
        for (const setting of SettingList)
            this.settings_.set(setting.identifier, setting);

        // Load the existing persistent values from the database, and apply them to the local state.
        Promise.resolve(this.database_.loadSettings()).then(settings => {
            for (const [identifier, value] of settings) {
                try {
                    this.setValue(identifier, value);
                } catch (exception) {
                    console.log('Warning: Unable to restore the setting of ' + identifier + ': ' +
                                exception);
                }
            }
        });
    }

    // ---------------------------------------------------------------------------------------------

    // Gets an iterator with the Settings that are available on Las Venturas Playground.
    getSettings() { return this.settings_.values(); }

    // Returns the full settings map.
    get settings() { return this.settings_; }

    // ---------------------------------------------------------------------------------------------

    // Adds an observer for the setting |identifier|. It'll be keyed on the |instance|, and the
    // |listener| will be invoked whenever the value is updated. Will throw on invalid identifiers.
    //
    // The listeners are expected to be scoped to the |instance| and have the following prototype:
    //
    //     listener(identifier, newValue, oldValue, defaultValue)
    //
    // All listeners for the |instance| and |identifier| have to be removed simultaneously.
    addSettingObserver(identifier, instance, listener) {
        const setting = this.settings_.get(identifier);
        if (!setting)
            throw new Error('Invalid setting given: ' + identifier);

        if (!this.observers_.has(identifier))
            this.observers_.set(identifier, new Map());

        const observers = this.observers_.get(identifier);
        if (!observers.has(instance))
            observers.set(instance, new Set());

        observers.get(instance).add(listener);
    }

    // Removes the observers for the |identifier| that were keyed on the |instance|. Will throw
    // when an invalid |identifier| has been passed.
    removeSettingObserver(identifier, instance) {
        if (!this.settings_.has(identifier))
            throw new Error('Invalid setting given: ' + identifier);

        const observers = this.observers_.get(identifier);
        if (!observers || !observers.has(instance))
            return;  // there are no listeners for the |identifier|

        observers.delete(instance);

        if (!observers.size)
            this.observers_.delete(identifier);
    }

    // ---------------------------------------------------------------------------------------------

    // Gets the value currently assigned to the |identifier|. Will throw when the |identifier| is
    // not known to the settings system, since we can't return anything sensible in that case.
    getValue(identifier) {
        const setting = this.settings_.get(identifier);
        if (!setting)
            throw new Error('Invalid setting given: ' + identifier);

        return setting.value;
    }

    // Sets the value of the setting identified by |identifier| to |value|. Type checking will be
    // done to make sure that the updated value is valid for the setting.
    setValue(identifier, value) {
        const setting = this.settings_.get(identifier);
        if (!setting)
            throw new Error('Invalid setting given: ' + identifier);

        switch (setting.type) {
            case Setting.TYPE_BOOLEAN:
                if (typeof value !== 'boolean')
                    throw new Error('The value for ' + identifier + ' must be a boolean.');

                break;
            case Setting.TYPE_NUMBER:
                if (typeof value !== 'number')
                    throw new Error('The value for ' + identifier + ' must be a number.');
                break;

            case Setting.TYPE_STRING:
                if (typeof value !== 'string')
                    throw new Error('The value for ' + identifier + ' must be a string.');
                break;

            default:
                throw new Error(`Unknown type(${setting.type}) for the setting ${identifier}.`);
        }

        // Inform the PawnConfig class about updates to any settings.
        this.pawnConfig_.onSettingUpdated(setting, value);

        // Inform observers for the |identifier| about the value change.
        const observers = this.observers_.get(identifier);
        if (observers) {
            for (const [instance, listeners] of observers) {
                for (const listener of listeners)
                    listener.call(instance, identifier, value, setting.value, setting.defaultValue);
            }
        }

        setting.value = value;

        // Either delete or write the new |value| from or to the database. Don't block on it.
        if (value === setting.defaultValue)
            this.database_.deleteSetting(setting);
        else
            this.database_.writeSetting(setting);
    }

    // ---------------------------------------------------------------------------------------------

    // For testing purposes, it might be needed to actually create a setting.
    createSettingForTesting({ category, setting, type, value, description }) {
        this.settings_.set(
            `${category}/${setting}`, new Setting(category, setting, type, value, description));
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        for (const setting of this.settings_.values())
            setting.value = setting.defaultValue;

        this.settings_.clear();
        this.settings_ = null;
    }
}

export default Settings;
