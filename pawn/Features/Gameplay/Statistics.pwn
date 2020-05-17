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

        new playerLevel[22], sessionTime[27], totalOnlineTime[27];

        // Player level.
        format(playerLevel, sizeof(playerLevel), "Player");
        if (Player(playerId)->isRegular() == true)
            format(playerLevel, sizeof(playerLevel), "Regular Player");
        if (Player(playerId)->isVip() == true)
            format(playerLevel, sizeof(playerLevel), "Very Important Player");
        if (Player(playerId)->isDeveloper() == true)
            format(playerLevel, sizeof(playerLevel), "LVP Developer");
        if (Player(playerId)->isAdministrator() == true && UndercoverAdministrator(playerId)->isUndercoverAdministrator() == false)
            format(playerLevel, sizeof(playerLevel), "LVP Administrator");
        if (Player(playerId)->isManagement() == true && UndercoverAdministrator(playerId)->isUndercoverAdministrator() == false)
            format(playerLevel, sizeof(playerLevel), "LVP Management");

        // Session time.
        new sessionTimeSeconds = Time->currentTime() - Player(playerId)->connectionTime();
        format(sessionTime, sizeof(sessionTime), "%d hours and %d minutes",
            sessionTimeSeconds / 3600, (sessionTimeSeconds % 3600) / 60);

        // Total online time.
        format(totalOnlineTime, sizeof(totalOnlineTime), "%d hours and %d minutes",
            gameplayhours[playerId], gameplayminutes[playerId]);

        // Kill/death ratio.
        new Float: kdRatio;
        if (MyDeaths[playerId] != 0)
            kdRatio = floatdiv(MyKills[playerId], MyDeaths[playerId]);
        else
            kdRatio = MyKills[playerId];

        new fightclubKills = 0;
        new fightclubDeaths = 0;

#if Feature::DisableFights == 0
        // Fightclub kills.
        fightclubKills = CFightClub__GetKillCount(playerId);

        // Fightclub deaths.
        fightclubDeaths = CFightClub__GetDeathCount(playerId);
#endif

        // Fightclub kill/death ratio.
        new Float: fightclubKDRatio;
        if (fightclubDeaths != 0)
            fightclubKDRatio = floatdiv(fightclubKills, fightclubDeaths);
        else
            fightclubKDRatio = fightclubKills;

        // Earned achievements.
        new achievementCount;
        for (new achievement = 0; achievement < TotalAchievements; achievement++) {
            if (CAchieve_GetPlayerAchievement(playerId, achievement) == 1)
                achievementCount++;
        }

        new bankBalance[32];
        GetAccountBalanceJS(playerId, bankBalance);

        // Time to format our dialog message.
        format(dialogMessage, sizeof(dialogMessage),
            "{B4CCE8}Level: {FF8E02}%s\r\n{B4CCE8}Session time: {FF8E02}%s\r\n{B4CCE8}Online time: {FF8E02}%s\r\n{B4CCE8}Bank balance: {FF8E02}%s\r\n{B4CCE8}Kills: {FF8E02}%d\r\n{B4CCE8}Deaths: {FF8E02}%d\r\n{B4CCE8}Ratio: {FF8E02}%.2f\r\n",
            playerLevel, sessionTime, totalOnlineTime, bankBalance, MyKills[playerId],
            MyDeaths[playerId], kdRatio);

        format(dialogMessage, sizeof(dialogMessage),
            "%s{B4CCE8}Drive-by kills: {FF8E02}%d\r\n{B4CCE8}Heli kills: {FF8E02}%d\r\n{B4CCE8}Fightclub kills: {FF8E02}%d\r\n{B4CCE8}Fightclub deaths: {FF8E02}%d\r\n{B4CCE8}Fightclub K/D ratio: {FF8E02}%.2f\r\n",
            dialogMessage, MyDrivebys[playerId], MyHeliKills[playerId], fightclubKills,
            fightclubDeaths, fightclubKDRatio);

        format(dialogMessage, sizeof(dialogMessage),
            "%s{B4CCE8}Achievements: {FF8E02}%d / %d\r\n{B4CCE8}Spraytags: {FF8E02}%d / %d\r\n{B4CCE8}Minigames won: {FF8E02}%d\r\n{B4CCE8}Exports: {FF8E02}%d\r\n{B4CCE8}Reaction Tests: {FF8E02}%d\r\n",
            dialogMessage, achievementCount, TotalAchievements-UnavailableTotalAchievements, sprayTagGetPlayerCount(playerId),
            n_SprayTagCount, WonMinigame[playerId], playerVehExp[playerId], PlayerInfo[playerId][reactionTestWins]);

        format(dialogMessage, sizeof(dialogMessage),
            "%s{B4CCE8}Carbombs detonated: {FF8E02}%d",
            dialogMessage, MyCarBombs[playerId]);

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
