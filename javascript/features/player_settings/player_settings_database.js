// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const LOAD_SETTINGS_QUERY = `
    SELECT
        setting_name,
        setting_value
    FROM
        users_settings  
    WHERE
        user_id = ?`;

const WRITE_SETTING_QUERY = `
    INSERT INTO
        users_settings
        (user_id, setting_name, setting_value)
    VALUES
        (?, ?, ?)
    ON DUPLICATE KEY 
        UPDATE 
            setting_value = ?`;

const DELETE_SETTING_QUERY = `
    DELETE FROM
        users_settings
    WHERE
        setting_name = ?
    AND
        user_id = ?`;

// Class that provides interaction with the database for reading, writing and removing player
// setting overrides. All methods in this class are asynchronous since they communicate with MySQL.
class PlayerSettingsDatabase {
    // Loads all known setting overrides from the database.
    async loadSettings(userId) {
        const settings = new Map();

        const data = await server.database.query(LOAD_SETTINGS_QUERY, userId);
        data.rows.forEach(row =>
            settings.set(row.setting_name, JSON.parse(row.setting_value)));

        return settings;
    }

    // Writes the new value for the |setting| to the database.
    async writeSetting(setting, userId) {
        const serializedValue = JSON.stringify(setting.value);

        await server.database.query(
            WRITE_SETTING_QUERY, userId, setting.identifier, serializedValue, serializedValue);
    }

    // Deletes the previously overridden value for the |setting| from the database.
    async deleteSetting(setting, userId) {
        await server.database.query(
            DELETE_SETTING_QUERY, setting.identifier, userId);
    }
}

export default PlayerSettingsDatabase;
