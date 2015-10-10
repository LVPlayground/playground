// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * Implements the commands associated with the jail controller, which allows administrators (both
 * in-game and remote ones) to control which players are currently in jail.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class JailCommands {
    /**
     * Players can be joined by moderators and higher through the /jail command, with at least the
     * offending player as a parameter. Staff will be informed about this action.
     *
     * @param playerId Id of the player who sent this command.
     * @param player Id or name of the player to jail.
     * @param duration The duration in minutes to jail the player for. Optional, default = 2.
     * @command /jail [player] [duration=2]
     */
    @command("jail")
    public onJailCommand(playerId, params[]) {
        if (Player(playerId)->isModerator() == false)
            return 0;

        new parameterCount = Command->parameterCount(params);
        if (parameterCount == 0) {
            SendClientMessage(playerId, Color::Information, "Usage: /jail [player] [duration=2]");
            return 1;
        }

        new offenderId = Command->playerParameter(params, 0, playerId);
        if (offenderId == Player::InvalidId)
            return 1;

        new duration = JailController::DefaultPunishmentDuration;
        if (parameterCount >= 2)
            duration = Command->integerParameter(params, 1);

        if (duration < 1) {
            SendClientMessage(playerId, Color::Information, "You can't jail someone for less then one minute.");
            return 1;
        }

        new message[128], durationText[10],
            bool: wasJailed = JailController->isPlayerJailed(offenderId);

        JailController->jailPlayer(offenderId, duration);
        Time->formatRemainingTime(JailController->remainingJailTimeForPlayer(offenderId), durationText,
            sizeof(durationText), /** force minutes **/ true);

        // Distribute a message to the moderator who executed this command.
        format(message, sizeof(message), "The player %s (Id:%d) will be in jail for another %s minutes.",
            Player(offenderId)->nicknameString(), offenderId, durationText);
        SendClientMessage(playerId, Color::Success, message);

        // Distribute a message to the offender about this.
        if (UndercoverAdministrator(playerId)->isUndercoverAdministrator()) {
            format(message, sizeof(message), "An administrator has jailed you for %s%d minutes.",
                wasJailed ? "another " : "", duration);
        } else {
            format(message, sizeof(message), "%s (Id:%d) has jailed you for %s%d minutes.",
                Player(playerId)->nicknameString(), playerId, wasJailed ? "another " : "", duration);
        }

        SendClientMessage(offenderId, Color::Error, message);
        SendClientMessage(offenderId, Color::Error, "Please read the /rules. If you have a question use @<message> to contact an administrator");

        // Distribute a message to all in-game staff about this.
        format(message, sizeof(message), "%s (Id:%d) jailed %s (Id:%d) for %d minutes.",
            Player(playerId)->nicknameString(), playerId, Player(offenderId)->nicknameString(), offenderId, duration);
        Admin(playerId, message);

        return 1;
    }

    /**
     * If a player has been accidentially jailed, or a member of the LVP Staff decides for any
     * reason that they can be unjailed, then the /unjail command will allow them to do so.
     *
     * @param playerId Id of the player who sent this command.
     * @param player Id or name of the player to unjail.
     * @command /unjail [player]
     */
    @command("unjail")
    public onUnjailCommand(playerId, params[]) {
        if (Player(playerId)->isModerator() == false)
            return 0;

        if (Command->parameterCount(params) == 0) {
            SendClientMessage(playerId, Color::Information, "Usage: /unjail [player]");
            return 1;
        }

        new offenderId = Command->playerParameter(params, 0, playerId);
        if (offenderId == Player::InvalidId)
            return 1;

        new message[128];
        if (JailController->isPlayerJailed(offenderId) == false) {
            format(message, sizeof(message), "%s (Id:%d) is not currently in jail.",
                Player(offenderId)->nicknameString(), offenderId);
            SendClientMessage(playerId, Color::Error, message);
            return 1;
        }

        JailController->unjailPlayer(offenderId);

        // Distribute a message to the moderator who executed this command.
        format(message, sizeof(message), "%s (Id:%d) has been released from jail.",
            Player(offenderId)->nicknameString(), offenderId);
        SendClientMessage(playerId, Color::Success, message);

        // Distribute a message to the offender about this.
        if (UndercoverAdministrator(playerId)->isUndercoverAdministrator())
            format(message, sizeof(message), "An administrator has released you from jail, effective immediately.");
        else {
            format(message, sizeof(message), "%s (Id:%d) has released you from jail, effective immediately.",
                Player(playerId)->nicknameString(), playerId);
        }

        SendClientMessage(offenderId, Color::Success, message);

        // Distribute a message to all in-game staff about this.
        format(message, sizeof(message), "%s (Id:%d) released %s (Id:%d) from jail.",
            Player(playerId)->nicknameString(), playerId, Player(offenderId)->nicknameString(), offenderId);
        Admin(playerId, message);

        return 1;
    }

    /**
     * It's possible for moderators to get an overview of the players who currently are in jail by
     * typing the /jailed command, which gives them a clear overview.
     *
     * @param playerId Id of the player who sent this command.
     * @param params Any further text that the player passed to the command. Unused.
     * @command /jailed
     */
    @command("jailed")
    public onJailedCommand(playerId, params[]) {
        if (Player(playerId)->isModerator() == false)
            return 0;

        SendClientMessage(playerId, Color::Information, "The current players are currently in jail:");

        new message[128], durationText[10], displayed = 0;
        for (new offenderId = 0; offenderId <= PlayerManager->highestPlayerId(); ++offenderId) {
            if (Player(offenderId)->isConnected() == false)
                continue; // the player is not connected to LVP.

            if (JailController->isPlayerJailed(offenderId) == false)
                continue; // the player is not in jail.

            ++displayed;
            Time->formatRemainingTime(JailController->remainingJailTimeForPlayer(offenderId), durationText,
                sizeof(durationText), /** force minutes **/ true);

            format(message, sizeof(message), "  %s (Id:%d) - {33CCFF}%s minutes remaining{FFFFFF}.",
                Player(offenderId)->nicknameString(), offenderId, durationText);
            SendClientMessage(playerId, Color::Information, message);
        }

        if (displayed == 0)
            SendClientMessage(playerId, Color::Information, "  No players are currently in jail.");

        return 1;
        #pragma unused params
    }

    // ---------------------------------------------------------------------------------------------

    /**
     * Allows players to be jailed through remote commands, for example commands originating from
     * IRC or an administrator using RCON (including the website).
     *
     * @param params Additional parameters passed on to this method.
     * @remotecommand jail [player] [duration=2]
     */
    @switch(RemoteCommand, "newjail")
    public onRemoteJailCommand(params[]) {
        // TODO: Implement this command.
        #pragma unused params
    }

    /**
     * Allows remote administrators to unjail any player by their Id or nickname.
     * 
     * @param params Additional parameters passed on to this method.
     * @remotecommand unjail [player]
     */
    @switch(RemoteCommand, "newunjail")
    public onRemoteUnjailCommand(params[]) {
        // TODO: Implement this command.
        #pragma unused params
    }

    /**
     * Allows remote administrators to get an overview of which players are currently in jail. We'll
     * include extra information here making it easier for them to unjail these players.
     *
     * @param params Additional parameters passed on to this method.
     * @remotecommand jailed
     */
    @switch(RemoteCommand, "newjailed")
    public onRemoteJailedCommand(params[]) {
        // TODO: Implement this command.
        #pragma unused params
    }
};
