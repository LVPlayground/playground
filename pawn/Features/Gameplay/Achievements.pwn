// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

// How many achievements exist in total?
#define TotalAchievements 66
// How many of them are unavailable
#define UnavailableTotalAchievements 13

/**
 * Players can get achievements simply by playing on Las Venturas Playground - anything from paying
 * certain amounts of tax to killing sprees, minigame wins and online time will grant them to you.
 * This class manages all achievements for all players.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class Achievements <playerId (MAX_PLAYERS)> {
    // What is the dialog Id to be used across the achievements dialogs?
    public const DialogId = @counter(OnDialogResponse);

    /**
     * When a player logs in to their account, it's the right time for us to kick off a request to
     * retrieve achievements from the database. The Achievements::onAchievementsAvailable method
     * will be invoked when results have been returned.
     */
    @list(OnPlayerLogin)
    public onPlayerLogin() {
        PlayerAchievementRequest->createForPlayer(playerId, Account(playerId)->userId());
    }

    /**
     * As we can't control when we'll be receiving information from the database, the request will
     * invoke this method in which we'll fill in all the achievements this player completed.
     *
     * @param resultId Id of the database result that contains the achievement information.
     */
    public onAchievementsAvailable(resultId) {
        if (DatabaseResult(resultId)->count() == 0)
            return; // the player doesn't have any achievements yet.

        while (DatabaseResult(resultId)->next())
            MarkAchievementAsAchievedForPlayer(DatabaseResult(resultId)->readInteger("achievementid"), playerId);
    }

    /**
     * Display a dialog which lists the achievements currently completed by the subject.
     *
     * @param playerId Id of the player who issued this command.
     * @param subjectId Id of the player who this command should be applied to.
     * @command /p [player] achievements
     * @command /my achievements
     */
    @switch(PlayerCommand, "achievements")
    public onPlayerAchievementsCommand(subjectId, params[]) {
        if (subjectId != playerId && Player(playerId)->isAdministrator() == false) 
            return 0;

        new dialogCaption[64], dialogMessage[4000], achievementCount;
        format(dialogCaption, sizeof(dialogCaption), "Achievements of %s (Id:%d)",
            Player(subjectId)->nicknameString(), subjectId);

        for (new achievement = 0; achievement < TotalAchievements; achievement++) {
            if (!strlen(DeprecatedAchievementString(achievement)))
                continue;

            format(dialogMessage, sizeof(dialogMessage), "%s{B4CCE8}#%d {%s}%s\r\n", dialogMessage,
                achievement,
                (DeprecatedAchievementIdCheck(subjectId, achievement) == 0) ? "B8B8B8" : "FF8E02",
                DeprecatedAchievementString(achievement));

            achievementCount++;
        }

        if (achievementCount == 0) {
            if (subjectId != playerId)
                SendClientMessage(playerId, Color::Error, "This player hasn't completed any achievements!");
            else
                SendClientMessage(playerId, Color::Error, "You haven't completed any achievements!");
            return 1;
        }

        ShowPlayerDialog(playerId, Achievements::DialogId, DIALOG_STYLE_LIST, dialogCaption, dialogMessage, "Okay", "");

        return 1;
        #pragma unused params
    }
};
