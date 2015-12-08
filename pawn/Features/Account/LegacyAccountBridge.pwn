// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * As porting over all the data structures is going to be a massive amount of work, for now we
 * can set the old variables to the right values.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class LegacyAccountBridge {
    /**
     * Update all the old account system variables with the values from the new one.
     *
     * @todo Remove all values from this method.
     * @param playerId Id of the player to apply settings for.
     */
    public Apply(playerId, resultId) {
        // mutable: online_time
        new online = DatabaseResult(resultId)->readInteger("online_time");
        gameplayhours[playerId] = Math->floor(online / 3600);
        gameplayminutes[playerId] = Math->floor((online - gameplayhours[playerId] * 3600) / 60);
        gameplayseconds[playerId] = online % 60;

        // mutable: skin_id
        new skinId = DatabaseResult(resultId)->readInteger("skin_id");
        if (skinId != SpawnManager(playerId)->skinId())
            SpawnManager(playerId)->setSkinId(skinId);

        // mutable: kill_count
        MyKills[playerId] = DatabaseResult(resultId)->readInteger("kill_count");

        // mutable: death_count
        MyDeaths[playerId] = DatabaseResult(resultId)->readInteger("death_count");

        // mutable: money_cash
        GivePlayerMoney(playerId, DatabaseResult(resultId)->readInteger("money_cash"));
        SetPlayerScore(playerId, DatabaseResult(resultId)->readInteger("money_cash"));

        // mutable: money_debt
        iLoan[playerId] = DatabaseResult(resultId)->readInteger("money_debt");
        iLoanPercent[playerId] = 4; /* default to 4% */

        // mutable: money_spawn
        g_iSpawnMoney[playerId] = DatabaseResult(resultId)->readInteger("money_spawn");

        // mutable: message_level
        MessageLevelsManager->setPlayerMessageLevel(playerId, DatabaseResult(resultId)->readInteger("message_level"));

        // mutable: message_flags
        /// @todo Implement message priorities.

        // mutable: stats_reaction
        PlayerInfo[playerId][reactionTestWins] = DatabaseResult(resultId)->readInteger("stats_reaction");

        // mutable: stats_minigame
        WonMinigame[playerId] = DatabaseResult(resultId)->readInteger("stats_minigame");

        // mutable: stats_export
        playerVehExp[playerId] = DatabaseResult(resultId)->readInteger("stats_exports");

        // mutable: stats_packages
        PlayerInfo[playerId][fPackages] = DatabaseResult(resultId)->readInteger("stats_packages");

        // mutable: stats_carbomb
        MyCarBombs[playerId] = DatabaseResult(resultId)->readInteger("stats_carbombs");

        // mutable: stats_heli_kills
        MyHeliKills[playerId] = DatabaseResult(resultId)->readInteger("stats_heli_kills");

        // mutable: stats_drivebys
        MyDrivebys[playerId] = DatabaseResult(resultId)->readInteger("stats_drivebys");

#if Feature::EnableFightClub == 0
        // mutable: stats_fc_kills
        CFightClub__SetKillCount(playerId, DatabaseResult(resultId)->readInteger("stats_fc_kills"));

        // mutable: stats_fc_deaths
        CFightClub__SetDeathCount(playerId, DatabaseResult(resultId)->readInteger("stats_fc_deaths"));
#endif

        // mutable: death_message
        new deathMessage[128];
        DatabaseResult(resultId)->readString("death_message", deathMessage);
        if (strlen(deathMessage) > 0)
            DeathMessageManager->setPlayerDeathMessageText(playerId, deathMessage);

        // mutable: sawnoff_weapon
        iPlayerSawnoffWeapon[playerId] = DatabaseResult(resultId)->readInteger("sawnoff_weapon");

        // mutable: save_location
        new savedLocation[128], locationIndex = 0;
        DatabaseResult(resultId)->readString("save_location", savedLocation);
        if (strlen(savedLocation) > 0) {
            SavedPos2[playerId][0] = floatstr(strtok(savedLocation, locationIndex));
            SavedPos2[playerId][1] = floatstr(strtok(savedLocation, locationIndex));
            SavedPos2[playerId][2] = floatstr(strtok(savedLocation, locationIndex));
            SavedPos2[playerId][3] = floatstr(strtok(savedLocation, locationIndex));
            SavedPos2[playerId][4] = floatstr(strtok(savedLocation, locationIndex));
        }

        /// @todo: Load achievements of this player.

        CSave__BeginLoad(playerId);

        firstJoin[playerId] = 1;
    }

    /**
     * Create the query used for updating the player's persistent profile. Since a lot of these
     * variables and inlines are stored elsewhere, we can't yet place this in AccountData.
     *
     * @param playerId Id of the player to generate the query for.
     * @param query The string buffer in which we can store the created query.
     * @param querySize The maximum size of the array buffer.
     */
    public CreateQuery(playerId, query[], querySize) {
        new bankAccountType[8];
        format(bankAccountType, sizeof(bankAccountType), "%s",
            BankAccount(playerId)->type() == NormalBankAccount ? "Normal" : "Premier");

        new customColor = 0;
        if (Player(playerId)->isVip() == true) {
            // We first need to release any previously set custom color. This operation will only
            // do something if the player has temporary administrator rights.
            ColorManager->restorePreviousPlayerCustomColor(playerId);

            // Now return the color as it has been set by the player itself.
            customColor = ColorManager->playerCustomColor(playerId);
        }

        // TODO: Remove the following fields.
        // * plus_points
        // * money_bank_limit
        // * pro_account
        // * platinum_account
        // * platinum_earnings
#if Feature::EnableFightClub == 0
        format(query, querySize,
            "UPDATE users_mutable SET " ...
                "skin_id = %d, " ...

                "jailed = %d, " ...
                "sawnoff_weapon = %d, " ...
                "settings = %d, " ...
                "custom_color = %d, " ...
                "death_message = \"%s\", " ...

                "save_location = \"%.2f %.2f %.2f %.2f %.2f\", " ...

                "online_time = %d, " ...
                "kill_count = %d, " ...
                "death_count = %d, " ...

                "money_bank = %d, " ...
                "money_bank_type = \"%s\", " ...
                "money_cash = %d, " ...
                "money_debt = %d, " ...
                "money_bounty = %d, " ...
                "money_spawn = %d, " ...

                "message_level = %d, " ...

                "stats_reaction = %d, " ...
                "stats_minigame = %d, " ...
                "stats_exports = %d, " ...
                "stats_packages = %d, " ...
                "stats_carbombs = %d, " ...
                "stats_heli_kills = %d, " ...
                "stats_drivebys = %d, " ...
                "stats_fc_kills = %d, " ...
                "stats_fc_deaths = %d, " ...

                "last_ip = INET_ATON(\"%s\"), " ...
                "last_seen = NOW(), " ...
                "updated = NOW() " ...

            "WHERE user_id = %d",

                // General account settings.
                SpawnManager(playerId)->skinId(),

                JailController->remainingJailTimeForPlayer(playerId),
                iPlayerSawnoffWeapon[playerId],
                PlayerSettings(playerId)->value(),
                customColor,
                DeathMessageManager->getPlayerDeathMessageText(playerId),

                // Saved location
                SavedPos2[playerId][0], SavedPos2[playerId][1], SavedPos2[playerId][2],
                SavedPos2[playerId][3], SavedPos2[playerId][4],

                // Gameplay statistics (values)
                (gameplayhours[playerId] * 3600 + gameplayminutes[playerId] * 60 + gameplayseconds[playerId]),
                MyKills[playerId],
                MyDeaths[playerId],

                // Financial information
                BankAccount(playerId)->balance(),
                bankAccountType,
                GetPlayerMoney(playerId),
                iLoan[playerId],
                HitmanTracker(playerId)->playerBounty(),
                g_iSpawnMoney[playerId],

                MessageLevelsManager->getPlayerMessageLevel(playerId),

                // General statistics
                PlayerInfo[playerId][reactionTestWins],
                WonMinigame[playerId],
                playerVehExp[playerId],
                PlayerInfo[playerId][fPackages],
                MyCarBombs[playerId],
                MyHeliKills[playerId],
                MyDrivebys[playerId],
                CFightClub__GetKillCount(playerId),
                CFightClub__GetDeathCount(playerId),

                // Remaining settings
                Player(playerId)->ipAddressString(),

                // User Id (conditional)
                Account(playerId)->userId());
#endif
#if Feature::EnableFightClub == 1
        format(query, querySize,
            "UPDATE users_mutable SET " ...
                "skin_id = %d, " ...

                "jailed = %d, " ...
                "sawnoff_weapon = %d, " ...
                "settings = %d, " ...
                "custom_color = %d, " ...
                "death_message = \"%s\", " ...

                "save_location = \"%.2f %.2f %.2f %.2f %.2f\", " ...

                "online_time = %d, " ...
                "kill_count = %d, " ...
                "death_count = %d, " ...

                "money_bank = %d, " ...
                "money_bank_type = \"%s\", " ...
                "money_cash = %d, " ...
                "money_debt = %d, " ...
                "money_bounty = %d, " ...
                "money_spawn = %d, " ...

                "message_level = %d, " ...

                "stats_reaction = %d, " ...
                "stats_minigame = %d, " ...
                "stats_exports = %d, " ...
                "stats_packages = %d, " ...
                "stats_carbombs = %d, " ...
                "stats_heli_kills = %d, " ...
                "stats_drivebys = %d, " ...
                "stats_fc_kills = %d, " ...
                "stats_fc_deaths = %d, " ...

                "last_ip = INET_ATON(\"%s\"), " ...
                "last_seen = NOW(), " ...
                "updated = NOW() " ...

            "WHERE user_id = %d",

                // General account settings.
                SpawnManager(playerId)->skinId(),

                JailController->remainingJailTimeForPlayer(playerId),
                iPlayerSawnoffWeapon[playerId],
                PlayerSettings(playerId)->value(),
                customColor,
                DeathMessageManager->getPlayerDeathMessageText(playerId),

                // Saved location
                SavedPos2[playerId][0], SavedPos2[playerId][1], SavedPos2[playerId][2],
                SavedPos2[playerId][3], SavedPos2[playerId][4],

                // Gameplay statistics (values)
                (gameplayhours[playerId] * 3600 + gameplayminutes[playerId] * 60 + gameplayseconds[playerId]),
                MyKills[playerId],
                MyDeaths[playerId],

                // Financial information
                BankAccount(playerId)->balance(),
                bankAccountType,
                GetPlayerMoney(playerId),
                iLoan[playerId],
                HitmanTracker(playerId)->playerBounty(),
                g_iSpawnMoney[playerId],

                MessageLevelsManager->getPlayerMessageLevel(playerId),

                // General statistics
                PlayerInfo[playerId][reactionTestWins],
                WonMinigame[playerId],
                playerVehExp[playerId],
                PlayerInfo[playerId][fPackages],
                MyCarBombs[playerId],
                MyHeliKills[playerId],
                MyDrivebys[playerId],
                0,
                0,

                // Remaining settings
                Player(playerId)->ipAddressString(),

                // User Id (conditional)
                Account(playerId)->userId());
#endif
    }
};
