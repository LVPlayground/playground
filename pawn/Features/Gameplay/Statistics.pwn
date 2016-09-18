// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Throughout the game we gather several statistics for each player, which we'd like to share with
 * them. Kills, deaths, online time, amount of sprayed tags, achievements, fightclub kills and
 * deaths, bank balance, amount of exports, reactiontests and so on. We pack this all in a neat
 * dialog which players can bring up using the specified commands.
 *
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 */
class Statistics {
    // What is the dialogId we'll be using to serve a dialog for our player?
    public const DialogId = @counter(OnDialogResponse);

    // ---- STATISTICS TO BE LISTED ----------------------------------------------------------------
    // @todo: Show gang, gang-role, karma, register date

    new m_playerLevel[MAX_PLAYERS][22];

    // What's the current session time for this player?
    new m_sessionTime[MAX_PLAYERS][56];

    // Gather the total online time throughout all sessions of a player.
    new m_totalOnlineTime[MAX_PLAYERS][56];

    // How many kills did a player get?
    new m_totalKills[MAX_PLAYERS];

    // How many times did a player die?
    new m_totalDeaths[MAX_PLAYERS];

    // How many of those total kills are drive-by kills?
    new m_drivebyKills[MAX_PLAYERS];

    // How many of those total kills are heli kills?
    new m_heliKills[MAX_PLAYERS];

    // How many of those total kills are fightclub kills?
    new m_fightclubKills[MAX_PLAYERS];

    // How many of those total deaths are fightclub deaths?
    new m_fightclubDeaths[MAX_PLAYERS];

    // List the amount of achievements a player gathered.
    new m_earnedAchievements[MAX_PLAYERS];

    // List the amount of tags a player sprayed.
    new m_sprayedTags[MAX_PLAYERS];

    // How many minigames did a player win?
    new m_wonMinigames[MAX_PLAYERS];

    // How many cars did a player export so far?
    new m_exportedCars[MAX_PLAYERS];

    // How many reaction tests did a player beat so far?
    new m_reactionTests[MAX_PLAYERS];

    // Amount of carbombs a player bought in total.
    new m_carBombs[MAX_PLAYERS];

    // The player's bank account type: Normal or Premier.
    new m_bankType[MAX_PLAYERS][12];

    // Bank balance of a player.
    new m_bankBalance[MAX_PLAYERS][16];

    // ---- FUNCTIONS TO LIST STATISTICS -----------------------------------------------------------

    /**
     * Players can obtain their own statistics by using the /my stats command. We'll block the /p
     * counterpart of this, since we'd rather have players use /getstats for that.
     *
     * @param playerId Id of the player who executed this command.
     * @param subjectId Id of the player who this command should be applied to.
     * @command /my stats
     */
    @switch(PlayerCommand, "stats")
    public onPlayerStatisticsCommand(playerId, subjectId, params[]) {
        if (playerId != subjectId) {
            SendClientMessage(playerId, Color::Error, "Please use /getstats [player]!");
            return 1;
        }

        if (Player(playerId)->isRegistered() == false) {
            SendClientMessage(playerId, Color::Error,
                "You must be registered to view your statistics! Register your nickname at www.sa-mp.nl");
            return 1;
        }

        this->showStatisticsDialog(playerId, playerId);

        return 1;
        #pragma unused params
    }

    /**
     * Retrieving the stats of an other player is possible with /getstats.
     * 
     * @param playerId Id of the player who typed the command.
     * @param player Id or name of the player to get the stats for.
     * @command /getstats [player]
     */
    @command("getstats")
    public onGetStatsCommand(playerId, params[]) {
        if (!strlen(params)) {
            SendClientMessage(playerId, Color::Information, "Usage: /getstats [player]");
            return 1;
        }

        new subjectId = Command->playerParameter(params, 0, playerId);
        if (subjectId == Player::InvalidId)
            return 1;

        if (playerId == subjectId) {
            SendClientMessage(playerId, Color::Error, "Use /my stats for your own stats!");
            return 1;
        }

        if (Player(subjectId)->isRegistered() == false) {
            SendClientMessage(playerId, Color::Error, "This player does not seem to be registered.");
            return 1;
        }

        this->showStatisticsDialog(subjectId, playerId);

        return 1;
    }

    /**
     * Gather the statistics and fill up a nice dialog to show to the player.
     *
     * @param playerId Id of the player to gather the statistics from.
     * @param viewerId Id of the player to show the gathered statistics.
     * @param source Source of the click in OnPlayerClickPlayer.
     */
    public showStatisticsDialog(playerId, viewerId, source = 0) {
        new dialogCaption[64], dialogMessage[900];
        format(dialogCaption, sizeof(dialogCaption), "Statistics of %s (Id:%d)",
            Player(playerId)->nicknameString(), playerId);

        // Player level.
        format(m_playerLevel[playerId], sizeof(m_playerLevel), "Player");
        if (Player(playerId)->isRegular() == true)
            format(m_playerLevel[playerId], sizeof(m_playerLevel), "Regular Player");
        if (Player(playerId)->isVip() == true)
            format(m_playerLevel[playerId], sizeof(m_playerLevel), "Very Important Player");
        if (Player(playerId)->isDeveloper() == true)
            format(m_playerLevel[playerId], sizeof(m_playerLevel), "LVP Developer");
        if (Player(playerId)->isAdministrator() == true && UndercoverAdministrator(playerId)->isUndercoverAdministrator() == false)
            format(m_playerLevel[playerId], sizeof(m_playerLevel), "LVP Administrator");
        if (Player(playerId)->isManagement() == true && UndercoverAdministrator(playerId)->isUndercoverAdministrator() == false)
            format(m_playerLevel[playerId], sizeof(m_playerLevel), "LVP Management");

        // Session time.
        new sessionTime = Time->currentTime() - Player(playerId)->connectionTime();
        format(m_sessionTime[playerId], sizeof(m_sessionTime), "%d hours and %d minutes",
            sessionTime / 3600, (sessionTime % 3600) / 60);

        // Total online time.
        format(m_totalOnlineTime[playerId], sizeof(m_totalOnlineTime), "%d hours and %d minutes",
            gameplayhours[playerId], gameplayminutes[playerId]);

        // Total kills.
        m_totalKills[playerId] = MyKills[playerId];

        // Total deaths.
        m_totalDeaths[playerId] = MyDeaths[playerId];

        // Kill/death ratio.
        new Float: kdRatio;
        if (m_totalDeaths[playerId] != 0)
            kdRatio = floatdiv(m_totalKills[playerId], m_totalDeaths[playerId]);
        else
            kdRatio = m_totalKills[playerId];

        // Drive-by kills.
        m_drivebyKills[playerId] = MyDrivebys[playerId];

        // Heli kills.
        m_heliKills[playerId] = MyHeliKills[playerId];

#if Feature::DisableFightClub == 0
        // Fightclub kills.
        m_fightclubKills[playerId] = CFightClub__GetKillCount(playerId);

        // Fightclub deaths.
        m_fightclubDeaths[playerId] = CFightClub__GetDeathCount(playerId);
#endif

        // Fightclub kill/death ratio.
        new Float: fightclubKDRatio;
        if (m_fightclubDeaths[playerId] != 0)
            fightclubKDRatio = floatdiv(m_fightclubKills[playerId], m_fightclubDeaths[playerId]);
        else
            fightclubKDRatio = m_fightclubKills[playerId];

        // Earned achievements.
        new achievementCount;
        for (new achievement = 0; achievement < TotalAchievements; achievement++) {
            if (CAchieve_GetPlayerAchievement(playerId, achievement) == 1)
                achievementCount++;
        }
        m_earnedAchievements[playerId] = achievementCount;

        // Sprayed tags.
        m_sprayedTags[playerId] = sprayTagGetPlayerCount(playerId);

        // Minigames won.
        m_wonMinigames[playerId] = WonMinigame[playerId];

        // Exported cars.
        m_exportedCars[playerId] = playerVehExp[playerId];

        // Won reactiontests.
        m_reactionTests[playerId] = PlayerInfo[playerId][reactionTestWins];

        // Detonated carbombs.
        m_carBombs[playerId] = MyCarBombs[playerId];

        // Bank type.
        if (BankAccount(playerId)->type() == PremierBankAccount)
            format(m_bankType[playerId], sizeof(m_bankType), "Premier");
        else
            format(m_bankType[playerId], sizeof(m_bankType), "Normal");

        // Bank balance.
        FinancialUtilities->formatPrice(BankAccount(playerId)->balance(), m_bankBalance[playerId],
            sizeof(m_bankBalance));

        // Time to format our dialog message.
        format(dialogMessage, sizeof(dialogMessage),
            "{B4CCE8}Level: {FF8E02}%s\r\n{B4CCE8}Online time: {FF8E02}%s\r\n{B4CCE8}Total online time: {FF8E02}%s\r\n{B4CCE8}Kills: {FF8E02}%d\r\n{B4CCE8}Deaths: {FF8E02}%d\r\n{B4CCE8}K/D ratio: {FF8E02}%.2f\r\n",
            m_playerLevel[playerId], m_sessionTime[playerId], m_totalOnlineTime[playerId], m_totalKills[playerId],
            m_totalDeaths[playerId], kdRatio);

        format(dialogMessage, sizeof(dialogMessage),
            "%s{B4CCE8}Drive-by kills: {FF8E02}%d\r\n{B4CCE8}Heli kills: {FF8E02}%d\r\n{B4CCE8}Fightclub kills: {FF8E02}%d\r\n{B4CCE8}Fightclub deaths: {FF8E02}%d\r\n{B4CCE8}Fightclub K/D ratio: {FF8E02}%.2f\r\n",
            dialogMessage, m_drivebyKills[playerId], m_heliKills[playerId], m_fightclubKills[playerId],
            m_fightclubDeaths[playerId], fightclubKDRatio);

        format(dialogMessage, sizeof(dialogMessage),
            "%s{B4CCE8}Achievements: {FF8E02}%d / %d\r\n{B4CCE8}Spraytags: {FF8E02}%d / %d\r\n{B4CCE8}Minigames won: {FF8E02}%d\r\n{B4CCE8}Exports: {FF8E02}%d\r\n{B4CCE8}Reactiontests: {FF8E02}%d\r\n",
            dialogMessage, m_earnedAchievements[playerId], TotalAchievements-UnavailableTotalAchievements, m_sprayedTags[playerId],
            n_SprayTagCount, m_wonMinigames[playerId], m_exportedCars[playerId], m_reactionTests[playerId]);

        format(dialogMessage, sizeof(dialogMessage),
            "%s{B4CCE8}Carbombs detonated: {FF8E02}%d\r\n{B4CCE8}Bank account type: {FF8E02}%s\r\n{B4CCE8}Bank balance: {FF8E02}%s",
            dialogMessage, m_carBombs[playerId], m_bankType[playerId], m_bankBalance[playerId]);

        ShowPlayerDialog(viewerId, Statistics::DialogId, DIALOG_STYLE_MSGBOX, dialogCaption, dialogMessage, "Got it!", "");

        return 1;
        #pragma unused source
    }
};

/**
 * Forward the OnPlayerClickPlayer method to it's documented counterpart in the Statistics class,
 * where our implementation will reside.
 *
 * @param playerid Id of the player that clicked on a player on the scoreboard.
 * @param clickedplayerid Id of player that was clicked on.
 * @param source The source of the player's click.
 */
public OnPlayerClickPlayer(playerid, clickedplayerid, source) {
    if (Player(clickedplayerid)->isRegistered() == false) {
        if (playerid == clickedplayerid)
            SendClientMessage(playerid, Color::Error,
                "You must be registered to view your statistics! Register your nickname at www.sa-mp.nl");
        else
            SendClientMessage(playerid, Color::Error, "This player does not seem to be registered.");

        return 0;
    }

    else return Statistics->showStatisticsDialog(clickedplayerid, playerid, source);
}
