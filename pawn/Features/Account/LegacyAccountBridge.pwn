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

        // mutable: money_debt
        iLoan[playerId] = DatabaseResult(resultId)->readInteger("money_debt");
        iLoanPercent[playerId] = 4; /* default to 4% */

        // mutable: message_level
        MessageLevelsManager->setPlayerMessageLevel(playerId, DatabaseResult(resultId)->readInteger("message_level"));

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

        // mutable: stats_fc_kills
        CFightClub__SetKillCount(playerId, DatabaseResult(resultId)->readInteger("stats_fc_kills"));

        // mutable: stats_fc_deaths
        CFightClub__SetDeathCount(playerId, DatabaseResult(resultId)->readInteger("stats_fc_deaths"));

        // mutable: death_message
        new deathMessage[128];
        DatabaseResult(resultId)->readString("death_message", deathMessage);
        if (strlen(deathMessage) > 0)
            DeathMessageManager->setPlayerDeathMessageText(playerId, deathMessage);

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
        new onlineTime = (gameplayhours[playerId] * 3600 + gameplayminutes[playerId] * 60 + gameplayseconds[playerId]);

        // TODO: Remove the following fields.
        // * plus_points
        // * pro_account
        // * platinum_account
        // * platinum_earnings
        format(query, querySize,
            "UPDATE users_mutable SET " ...
                "skin_id = %d, " ...

                "jailed = %d, " ...
                "settings = %d, " ...
                "death_message = \"%s\", " ...

                "save_location = \"%.2f %.2f %.2f %.2f %.2f\", " ...

                "online_time = %d, " ...

                "money_debt = %d, " ...
                "money_bounty = %d, " ...

                "message_level = %d, " ...
                "preferred_radio_channel = \"%s\", " ...

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
                PlayerSettings(playerId)->value(),
                DeathMessageManager->getPlayerDeathMessageText(playerId),

                // Saved location
                SavedPos2[playerId][0], SavedPos2[playerId][1], SavedPos2[playerId][2],
                SavedPos2[playerId][3], SavedPos2[playerId][4],

                // Gameplay statistics (values)
                onlineTime,

                // Financial information
                iLoan[playerId],
                HitmanTracker(playerId)->playerBounty(),

                MessageLevelsManager->getPlayerMessageLevel(playerId),
                PlayerSyncedData(playerId)->preferredRadioChannel(),

                // General statistics
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
    }
};
