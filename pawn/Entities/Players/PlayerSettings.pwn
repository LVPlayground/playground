// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Contains every key which can be used as a player setting. This enum is strictly internal to this
 * file, and normal getters and setters should be implemented in PlayerSettings to support this.
 *
 * NEW ENTRIES MUST BE APPENDED AT THE BOTTOM OF THIS ENUM. Adding entries in the middle will screw
 * up existing entries and mock with the settings of all players. Just.. don't.
 */
enum _: PlayerSettingKey {
    AccountUpdatedForSettingsSettingKey = 0,
    TeleportationDisabledSettingKey = 1,
    MapTeleportationEnabledSettingKey = 2,
    EarningsToBankAccountDisabledSettingKey = 3,
    AllVirtualWorldChatEnabledSettingKey = 5,
    PlayerInfoEnabledSettingKey = 6,
    PlayerHitSoundEnabledSettingKey = 7,
    PlayerDisableAutomatedAnnouncementsKey = 8,
};

// Assert that we don't put more than 32 items in the PlayerSettingKey enum.
#assert PlayerSettingKey <= 32

/**
 * Each player can have a number of settings which control how their account acts in the game. For
 * players who have registered with Las Venturas Playground, these settings will persist across
 * several playing sessions. This class has a maximum of 32 settings for now.
 *
 * Because every setting is a simple 0/1 value, each setting will be implemented as a boolean. You
 * are advised to prefix the getter with "is", for example, "isTeleportationDisabled".
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class PlayerSettings <playerId (MAX_PLAYERS)> {
    // The cell in which we'll store all this player's settings.
    new m_settings;

    // ---------------------------------------------------------------------------------------------

    /**
     * Toggles a certain setting to be either on or off, as indicated by the enabled parameter.
     *
     * @param setting The setting which' value needs to be changed.
     * @param enabled Whether this setting should be enabled.
     */
    private inline toggleSetting(setting, enabled) {
        Cell->setBitValue(m_settings, setting, enabled);
    }

    /**
     * Retrieves whether a certain setting has been enabled for this player.
     *
     * @param setting The setting which' value should be retrieved.
     * @return boolean Whether this setting has been enabled for this player.
     */
    private inline bool: hasSetting(setting) {
        return (Cell->getBitValue(m_settings, setting) == 1);
    }

    // ---------------------------------------------------------------------------------------------

    /**
     * Retrieves the raw value which describes the status of all settings for this player.
     *
     * @return integer The raw value of all settings.
     */
    public value() {
        return m_settings;
    }

    /**
     * Restores the value of this player's settings based on the value provided. Usually it will be
     * retrieved from the database when the player logs in.
     *
     * @param value The value of the settings as set for this player.
     */
    public restore(value) {
        m_settings = value;

        // We can't easily determine whether a player's account has been updated to use settings, so
        // we created an initial setting that always must be true if settings have been set.
        if (this->hasSetting(AccountUpdatedForSettingsSettingKey) == false)
            this->reset();
    }

    /**
     * Resets all settings for this player to their default values. Each setting will default to
     * being off, unless manually enabled in this method. It will automatically be invoked when a
     * player connects to Las Venturas Playground.
     */
    @list(OnPlayerConnect)
    public reset() {
        m_settings = 0;

        // TODO: Add individual settings which should be enabled by default here.
        this->toggleSetting(AccountUpdatedForSettingsSettingKey, true);
    }

    /**
     * Restores any settings which were altered at giving tempadmin. Each setting will default to
     * what they should be for a normal player. It will automatically be invoked when a player
     * disconnects from Las Venturas Playground.
     */
    @list(OnPlayerDisconnect)
    public restoreOnDisconnect() {
        if (LegacyIsUserTempAdmin(playerId))
            this->toggleSetting(MapTeleportationEnabledSettingKey, false);
    }

    // ---------------------------------------------------------------------------------------------

    /**
     * Returns whether teleportation is disabled for this player. This means that other players
     * shouldn't be able to teleport to them, unless they're an administrator.
     *
     * @todo Make this an inline function when the PreCompiler learns about instances properly.
     * @return boolean Whether teleportation is disabled for this player.
     */
    public bool: isTeleportationDisabled() {
        return this->hasSetting(TeleportationDisabledSettingKey);
    }

    /**
     * Toggles whether teleportation should be disabled for this player.
     *
     * @todo Make this an inline function when the PreCompiler learns about instances properly.
     * @param disabled Should teleportation be disabled?
     */
    public setTeleportationDisabled(bool: disabled) {
        this->toggleSetting(TeleportationDisabledSettingKey, !!disabled);
    }

    /**
     * Returns whether the map teleportation feature should be enabled for this player. This means
     * that they can go to the "map" option in the GTA menu and right click to teleport anywhere.
     *
     * @return boolean Should map teleportation be enabled for this player?
     */
    public bool: isMapTeleportationEnabled() {
        return this->hasSetting(MapTeleportationEnabledSettingKey);
    }

    /**
     * Toggles whether the map teleportation feature should be available for this player.
     *
     * @todo Make this an inline function when the PreCompiler learns about instances properly.
     * @param enabled Is the map teleportation feature enabled?
     */
    public setMapTeleportationEnabled(bool: enabled) {
        this->toggleSetting(MapTeleportationEnabledSettingKey, !!enabled);
    }

    /**
     * Returns whether automatic depositing of in-game earnings, for example from properties, to the
     * player's bank account should be disabled.
     *
     * @return boolean Should earnings not be deposited to the player's account?
     */
    public bool: areEarningsToBankAccountDisabled() {
        return this->hasSetting(EarningsToBankAccountDisabledSettingKey);
    }

    /**
     * Toggles whether received earnings should *not* be deposited into a player's bank account.
     *
     * @param disabled Whether this feature should be disabled.
     */
    public setEarningsToBankAccountDisabled(bool: disabled) {
        this->toggleSetting(EarningsToBankAccountDisabledSettingKey, !!disabled);
    }

    /**
     * Returns whether the ability to read chat messages in all virtual world has been disabled.
     *
     * @return boolean Whether the ability to read messages in all virtual world has been disabled.
     */
    public bool: isAllVirtualWorldChatEnabled() {
        return this->hasSetting(AllVirtualWorldChatEnabledSettingKey);
    }

    /**
     * Toggles whether the ability to read messages in all virtual worlds should be disabled.
     *
     * @param disabled Whether this ability should be disabled.
     */
    public setAllVirtualWorldChatEnabled(bool: enabled) {
        this->toggleSetting(AllVirtualWorldChatEnabledSettingKey, !!enabled);
    }

    /**
     * Returns whether the ability to see playerinfo textdraws has been disabled.
     *
     * @return boolean Whether the ability to see playerinfo textdraws has been disabled.
     */
    public bool: isPlayerInfoEnabled() {
        return this->hasSetting(PlayerInfoEnabledSettingKey);
    }

    /**
     * Toggles whether the ability to see playerinfo textdraws should be disabled.
     *
     * @param disabled Whether this ability should be disabled.
     */
    public setPlayerInfoEnabled(bool: enabled) {
        this->toggleSetting(PlayerInfoEnabledSettingKey, !!enabled);
    }

    public bool: isPlayerHitSoundEnabled() {
        return this->hasSetting(PlayerHitSoundEnabledSettingKey);
    }

    public setPlayerHitSoundEnabled(bool: enabled) {
        this->toggleSetting(PlayerHitSoundEnabledSettingKey, !!enabled);
    }

    public bool: areAutomatedAnnouncementsDisabled() {
        return this->hasSetting(PlayerDisableAutomatedAnnouncementsKey);
    }

    public setAutomatedAnnouncementsDisabled(bool: disabled) {
        this->toggleSetting(PlayerDisableAutomatedAnnouncementsKey, !!disabled);
    }

    // TODO: Implement other settings.
};
