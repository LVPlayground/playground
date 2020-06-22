// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * The account system has support for a few commands as well, which may be used by the more advanced
 * players and administrators to gain finer control. An example of this is /modlogin, which can be
 * used by administrators to log in on different names than their own.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class AccountCommands {
    /**
     * Even after an administrator has started as a player, it's possible to log in to their account
     * by using the /modlogin command. We'll launch a normal login flow, except that it won't restore
     * the account's statistics. Instead, it will only apply their player level.
     *
     * @param playerId Id of the player who typed the command.
     * @param username A registered LVP username with administrator rights.
     * @param password The password used for this username.
     * @command /modlogin [username] [password]
     */
    @command("modlogin")
    public onModLoginCommand(playerId, params[]) {
        if (Command->parameterCount(params) != 2) {
            SendClientMessage(playerId, Color::Information, "Usage: /modlogin [username] [password]");
            return 1;
        }

        if (UndercoverAdministrator(playerId)->isUndercoverAdministrator() == true) {
            SendClientMessage(playerId, Color::Error, "You are already logged in as an undercover administrator.");
            return 1;
        }

        if (!Player(playerId)->isRegistered()) {
            SendClientMessage(playerId, Color::Error, "You can only use /modlogin when signed in to another account.");
            return 1;
        }

        new username[32], password[32];
        Command->stringParameter(params, 0, username, sizeof(username));
        Command->stringParameter(params, 1, password, sizeof(password));

        Account(playerId)->requestModLogin(username, password);

        return 1;
    }

    /**
     * Players can get bugged sometimes, meaning it may be convenient for LVP crew to force a
     * reconnect on that player. Actually we are kicking the player here, without registering it as
     * a kick.
     *
     * @param playerId Id of the player who typed the command.
     * @param player Id or name of the player to force a reconnect for.
     * @command /reconnect [player]
     */
    @command("reconnect")
    public onReconnectCommand(playerId, params[]) {
        if (Player(playerId)->isAdministrator() == false)
            return 0;

        if (!strlen(params)) {
            SendClientMessage(playerId, Color::Information, "Usage: /reconnect [player]");
            return 1;
        }

        new victimId = Command->playerParameter(params, 0, playerId);
        if (victimId == Player::InvalidId)
            return 1;

        if (Player(victimId)->isNonPlayerCharacter()) {
            SendClientMessage(playerId, Color::Error, "You can't force a NPC to reconnect!");
            return 1;
        }

        new notice[128];
        format(notice, sizeof(notice), "%s (Id:%d) has been successfully forced to reconnect.",
            Player(victimId)->nicknameString(), victimId);
        SendClientMessage(playerId, Color::Success, notice);

        format(notice, sizeof(notice), "%s (Id:%d) forced %s (Id:%d) to reconnect.",
            Player(playerId)->nicknameString(), playerId, Player(victimId)->nicknameString(), victimId);
        Admin(playerId, notice);

        SendClientMessage(victimId, Color::Information, "Oops.. seems like you're bugged! Please reconnect!");

        CSave__OnPlayerDisconnect(victimId);

        Player(victimId)->scheduleKick(ForceReconnectKickReason, "");
        return 1;
    }

    /**
     * Retrieval of a player's Id is covenient when a lot of players are around.
     *
     * @param playerId Id of the player who typed the command.
     * @param player Id or name of the player to retrieve the Id for.
     * @command /getid [player]
     */
    @command("getid")
    public onGetIdCommand(playerId, params[]) {
        if (Command->parameterCount(params) == 0) {
            SendClientMessage(playerId, Color::Information, "Usage: /getid [player]");
            return 1;
        }

        new subjectId = Command->playerParameter(params, 0, playerId);
        if (subjectId == Player::InvalidId)
            return 1;

        new message[128];
        format(message, sizeof(message), "Id found: {FF8E02}[%d]{FFFFFF} - {FF8E02}%s{FFFFFF}.", subjectId,
            Player(subjectId)->nicknameString());
        SendClientMessage(playerId, Color::Information, message);

        return 1;
    }
};
