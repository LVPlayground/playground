// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * Regarding quick or full deathmatch fights, several commands are needed to support this system.
 * Players are able to execute a short command for a quick 1-round player vs player match, or add
 * a parameter to get the full options. Users shouldn't get overwhelmed with options, two menus
 * should do.
 *
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 */
class FightClubCommands {
    /**
     * FightClub command for player vs player fights. No parameters passed will return the amount
     * of matches currently ongoing. Subcommands are handled in their appropriate methods.
     *
     * @param playerId Id of the player who typed the command.
     * @param params Further parameters they passed to the command.
     * @command /fc [accept/cancel/decline/watch] | [player?] [full]
     */
    @command("fc", "fight")
    public onFightCommand(playerId, params[]) {
        new parameterCount = Command->parameterCount(params), parameterIndex = 0,
            inviteePlayerId = Player::InvalidId;

        if (parameterCount >= 1) {
            inviteePlayerId = Command->playerParameter(params, 0);
            if (inviteePlayerId != Player::InvalidId)
                ++parameterIndex;
        }

        new operationName[16], parameterOffset = 0;
        if (inviteePlayerId == Player::InvalidId) {
            if (parameterCount >= 1) {
                Command->stringParameter(params, 0, operationName, sizeof(operationName));
                parameterOffset = min(strlen(params), Command->startingIndexForParameter(params, 0) + strlen(operationName) + 1);

                // See if any method is listening to the operation given by the player. If so, bail out.
                if (Annotation::ExpandSwitch<GenericFightClubCommand>(operationName, playerId, params[parameterOffset]) == 1)
                    return 1;
            }

            // No (valid) operation was given by the player, show them the usage information.
            SendClientMessage(playerId, Color::Information,
                "Use {40CCFF}/fc [player] {FFFFFF}to invite one for a quick 1-round match with default weapons (deagle, sawn-off shotgun, UZI).");
            SendClientMessage(playerId, Color::Information,
                " For full options, use {40CCFF}/fc [player] full{FFFFFF}. Match spectating can be done with {40CCFF}/fc watch{FFFFFF}.");

            return 1;
        }

        if (parameterIndex > 0) {
            Command->stringParameter(params, parameterIndex, operationName, sizeof(operationName));
            parameterOffset = min(strlen(params), Command->startingIndexForParameter(params, parameterIndex) + strlen(operationName) + 1);

            if (parameterCount == 1) {
                new matchId = FightClubManager->setUpMatch(QuickMatch);
                if (matchId != FightClubManager::InvalidMatchId)
                    FightClubInvitationManager->setUpInvitations(playerId, inviteePlayerId, matchId, QuickMatch);
                else
                    SendClientMessage(playerId, Color::Error, "The FightClub is currently full. Try again later!");

                return 1;
            }

            // See if any method is listening to the operation given by the player. If so, bail out.
            if (Annotation::ExpandSwitch<SpecificFightClubCommand>(operationName, playerId, inviteePlayerId, params[parameterOffset]) == 1)
                return 1;
        }

        // No (valid) operation was given by the player, show them the usage information.
        SendClientMessage(playerId, Color::Information,
            "Use {40CCFF}/fc [player] {FFFFFF}to invite one for a quick 1-round match with default weapons (deagle, sawn-off shotgun, UZI).");
        SendClientMessage(playerId, Color::Information,
            " For full options, use {40CCFF}/fc [player] full{FFFFFF}. Match spectating can be done with {40CCFF}/fc watch{FFFFFF}.");

        return 1;
    }

    /**
     * An invited player should be able to accept a FightClub invitation.
     *
     * @param playerId Id of the player who typed the command.
     * @command /fc accept
     */
    @switch(GenericFightClubCommand, "accept")
    public onFightAcceptCommand(playerId, params[]) {
        // TODO: Implement this.
        #pragma unused playerId, params
    }

    /**
     * Inviting players are able to cancel match invitations with this command. This command is only
     * available after sending out invitations, and before the match has started.
     *
     * @param playerId Id of the player who typed the command.
     * @command /fc cancel
     */
    @switch(GenericFightClubCommand, "cancel")
    public onFightCancelCommand(playerId, params[]) {
        // TODO: Implement this.
        #pragma unused playerId, params
    }

    /**
     * An invited player should be able to decline a FightClub invitation.
     *
     * @param playerId Id of the player who typed the command.
     * @command /fc decline
     */
    @switch(GenericFightClubCommand, "decline")
    public onFightDeclineCommand(playerId, params[]) {
        // TODO: Implement this.
        #pragma unused playerId, params
    }

    /**
     * Players willing to spectate a FightClub match are able to use this /fc watch command. The
     * command will take no input; upon execution it will show a dialog to the player listing the
     * current ongoing matches. The player is then able to pick between matches.
     *
     * @param playerId Id of the player who typed the command.
     * @command /fc watch
     */
    @switch(GenericFightClubCommand, "watch")
    public onFightWatchCommand(playerId, params[]) {
        // TODO: Implement this.
        #pragma unused playerId, params
    }

    /**
     * If a player wants to determine the weapons and amount of rounds for the fight, they're able
     * to use a parameter while executing the /fc command. This will lead to this method.
     *
     * @param playerId Id of the player who typed the command.
     * @command /fc [player] full
     */
    @switch(SpecificFightClubCommand, "full")
    public onFightFullCommand(playerId, inviteePlayerId, params[]) {
        // TODO: Implement this.
        #pragma unused playerId, inviteePlayerId, params
    }
};
