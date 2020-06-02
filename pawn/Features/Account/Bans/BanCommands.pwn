// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * In order to disallow players from playing on Las Venturas Playground, we might have to 'push' them
 * out of the gamemode. This requires a set of commands for our crew members to work with, in case
 * a hacker or cheater needs to be removed from the server.
 *
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 */
class BanCommands {
    /**
     * A permanent removal of the player is in accordance with serious events like hacking and cheating.
     * The player is banned, and informed why, and won't be able to rejoin the server untill the crew
     * has unbanned the user or the ban expiration date has been reached.
     *
     * @param playerId Id of the player who typed the command.
     * @command /ban [player] [days=3] [reason]
     */
    @command("ban")
    public onBanCommand(playerId, params[]) {
        if (Player(playerId)->isAdministrator() == false)
            return 0;

        if (Command->parameterCount(params) < 2) {
            SendClientMessage(playerId, Color::Information, "Usage: /ban [player] [days=3] [reason]");
            return 1;
        }

        new subjectId = Command->playerParameter(params, 0, playerId);
        if (subjectId == Player::InvalidId)
            return 1;

        if (Player(subjectId)->isNonPlayerCharacter() == true) {
            SendClientMessage(playerId, Color::Error, "You can't ban an NPC!");
            return 1;
        }

        new durationLength[8], duration = (Command->integerParameter(params, 1) == -1) ?
            BanManager::DefaultBanDuration : Command->integerParameter(params, 1);
        if (duration < 1) {
            SendClientMessage(playerId, Color::Error, "Please input a valid ban duration, or leave empty for default.");
            return 1;
        }

        new subject[MAX_PLAYER_NAME+1], parameterOffset = 0;
        Command->stringParameter(params, 0, subject, sizeof(subject));
        parameterOffset = min(strlen(params), Command->startingIndexForParameter(params, 0)
            + strlen(subject) + 1);

        if (Command->integerParameter(params, 1) != -1) {
            Command->stringParameter(params, 1, durationLength, sizeof(durationLength));
            parameterOffset += strlen(durationLength) + 1;
        }

        if (strlen(params[parameterOffset]) == 0) {
            SendClientMessage(playerId, Color::Error, "Please input a valid ban reason.");
            return 1;
        }

        Player(subjectId)->ban(params[parameterOffset], playerId, duration);

        new administrator[MAX_PLAYER_NAME+1], message[256];
        Player(playerId)->nickname(administrator, sizeof(administrator));
        if (UndercoverAdministrator(playerId)->isUndercoverAdministrator()) {
            UndercoverAdministrator(playerId)->getOriginalUsername(administrator, sizeof(administrator));

            BanManager->setUndercoverKicked(playerId, true);
        }

        format(message, sizeof(message), "%s (Id:%d) has been banned by %s (Id:%d) for %d days: %s",
            Player(subjectId)->nicknameString(), subjectId, administrator, playerId, duration, params[parameterOffset]);
        Admin(Player::InvalidId, message);

        return 1;
    }

    /**
     * A temporary removal of the player is useful when the player's action isn't serious enough to
     * ban for. The player is removed from the game, and informed why. A simple restart of the user's
     * client will make them able to join again.
     *
     * @param playerId Id of the player who typed the command.
     * @command /kick [player] [reason]
     */
    @command("kick")
    public onKickCommand(playerId, params[]) {
        if (Player(playerId)->isAdministrator() == false)
            return 0;

        if (Command->parameterCount(params) < 2) {
            SendClientMessage(playerId, Color::Information, "Usage: /kick [player] [reason]");
            return 1;
        }

        new subjectId = Command->playerParameter(params, 0, playerId);
        if (subjectId == Player::InvalidId)
            return 1;

        if (Player(subjectId)->isNonPlayerCharacter() == true) {
            SendClientMessage(playerId, Color::Error, "You can't kick a NPC!");
            return 1;
        }

        new subject[MAX_PLAYER_NAME+1], parameterOffset = 0;
        Command->stringParameter(params, 0, subject, sizeof(subject));
        parameterOffset = min(strlen(params), Command->startingIndexForParameter(params, 0)
            + strlen(subject) + 1);

        Player(subjectId)->kick(params[parameterOffset], playerId);

        new administrator[MAX_PLAYER_NAME+1], message[256];
        Player(playerId)->nickname(administrator, sizeof(administrator));
        if (UndercoverAdministrator(playerId)->isUndercoverAdministrator()) {
            UndercoverAdministrator(playerId)->getOriginalUsername(administrator, sizeof(administrator));

            BanManager->setUndercoverKicked(playerId, true);
        }

        format(message, sizeof(message), "%s (Id:%d) has been kicked by %s (Id:%d): %s",
            Player(subjectId)->nicknameString(), subjectId, administrator, playerId, params[parameterOffset]);
        Admin(Player::InvalidId, message);

        return 1;
    }
};
