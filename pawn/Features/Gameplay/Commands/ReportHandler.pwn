/**
 * Copyright (c) 2006-2016 Las Venturas Playground
 *
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation; either version 2 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program; if
 * not, write to the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA
 * 02110-1301, USA.
 */

/**
 * To get more in line with other servers and have some more logic we are going to add the /report-
 * command again. It's easier for people to remember and most people already know this command from
 * other servers.
 *
 * @author Xander "Xanland" Hoogland <home@xanland.nl>
 */
class ReportHandler {
    /**
     * To send reports in the right direction people now have a special command for it again
     * 
     * @param playerId Id of the player who issued this command.
     * @param params Playername or -id who is perhaps cheating and what the cheat could be
     * @command /report [id/name] [presumed cheat]
     */
    @command("report")
    public onReportCommand(playerId, params[]) {
        if (Command->parameterCount(params) == 0) {
            SendClientMessage(playerId, Color::Information, "Usage: /report [suspected id/name] [cheat/reason]");
            return 1;
        }
        else if (Command->parameterCount(params) == 1) {
            SendClientMessage(playerId, Color::Information, "Please add the cheat/reason to your report.");
            return 1;
        }

        new suspectedPlayer[MAX_PLAYER_NAME + 1], suspectedPlayerId = INVALID_PLAYER_ID, report[128], parameterOffset = 0;
        Command->stringParameter(params, 0, suspectedPlayer, sizeof(suspectedPlayer));
        parameterOffset = min(strlen(params), Command->startingIndexForParameter(params, 0)
            + strlen(suspectedPlayer) + 1);

        // Block spamming of this user in the admin chat.
        SpamTracker->record(playerId, params[parameterOffset]);
        if (SpamTracker->isSpamming(playerId)) {
            SendClientMessage(playerId, Color::Error, "Please do not spam on Las Venturas Playground!");
            return 1;
        }

        // Let's try and find the suspect's name the player is reporting.
        if (PlayerManager->findPlayerByIdOrPartialName(suspectedPlayer, suspectedPlayerId) == PlayerFound) {
            format(report, sizeof(report), "* Report by %s (Id:%d): Suspected player: %s (Id:%d) - Cheat/reason: %s",
                Player(playerId)->nicknameString(), playerId, Player(suspectedPlayerId)->nicknameString(),
                suspectedPlayerId, params[parameterOffset]);
        } else // Just report the initial mentioned player Id or name.
            format(report, sizeof(report), "* Report by %s (Id:%d): Suspected player: %s - Cheat/reason: %s",
                Player(playerId)->nicknameString(), playerId, suspectedPlayer, params[parameterOffset]);

        for (new subjectId = 0; subjectId <= PlayerManager->highestPlayerId(); subjectId++) {
            if (Player(subjectId)->isConnected() == false || Player(subjectId)->isAdministrator() == false)
                continue;

            SendClientMessage(subjectId, Color::AdministratorColor, report);
        }

        if (Player(playerId)->isAdministrator() == false) {
            format(report, sizeof(report), "Your report has been delivered to the crew: {FFFFFF}Suspected player: %s - Cheat/reason: %s",
                suspectedPlayer, params[parameterOffset]);
            SendClientMessage(playerId, Color::Success, report);
        }

        format(report, sizeof(report), "%s %d %s %s", Player(playerId)->nicknameString(),
            playerId, suspectedPlayer, params[parameterOffset]);
        IRC->broadcast(ReportIrcMessage, report);

        return 1;
    }
};
