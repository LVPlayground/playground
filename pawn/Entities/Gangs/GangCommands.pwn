// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * The commands associated with the gang system will be implemented in this class. Each command has
 * it's own method, as has each sub-operation (i.e. /gang create).
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class GangCommands {
    /**
     * Creating, destroying or managing a gang is something a player can do through the /gang
     * command. Typing the command without a specific operation will show an overview of the
     * available options.
     *
     * @param playerId Id of the player who typed the command.
     * @param params Any further text that the player passed to the command.
     * @command /gang [color/info/invite/kick/leave]
     */
    @command("gang")
    public onGangCommand(playerId, params[]) {
        new operationName[16],
            parameterOffset = 0;

        if (Command->parameterCount(params) >= 1) {
            Command->stringParameter(params, 0, operationName, sizeof(operationName));
            parameterOffset = min(strlen(params), Command->startingIndexForParameter(params, 0) + strlen(operationName) + 1);

            // See if any method is listening to the operation given by the player. If so, bail out.
            if (Annotation::ExpandSwitch<GangCommand>(operationName, playerId, params[parameterOffset]) == 1)
                return 1;
        }

        if (GangPlayer(playerId)->gangId() != Gang::InvalidId) {
            if (GangPlayer(playerId)->gangRole() == GangLeaderRole)
                SendClientMessage(playerId, Color::Information, "Usage: /gang [color/info/invite/kick/leave]");
            else SendClientMessage(playerId, Color::Information, "Usage: /gang [info/invite/leave]");
        }

        else SendClientMessage(playerId, Color::Information, "Usage: /gang [create/info/join]");

        return 1;
    }

    /**
     * All that's currently needed to create a new gang is the gang's name. The player creating it
     * may not currently be in another gang, and we'll check whether another gang exists with the
     * given name, as that's not allowed either.
     *
     * @param playerId Id of the player who typed the command.
     * @param name The name to set for the gang.
     * @command /gang create [name]
     */
    @switch(GangCommand, "create")
    public onGangCreateCommand(playerId, params[]) {
        if (Command->parameterCount(params) == 0) {
            SendClientMessage(playerId, Color::Information, "Usage: /gang create [name]");
            return 1;
        }

        if (strlen(params) >= Gang::MaximumNameLength) {
            new message[128];
            format(message, sizeof(message), "Since your gang-name is %d characters, the name is too long. It can't be", strlen(params));
            SendClientMessage(playerId, Color::Error, message);

            format(message, sizeof(message), "longer than %d characters.", Gang::MaximumNameLength);
            SendClientMessage(playerId, Color::Error, message);
            return 1;
        }

        if (GangPlayer(playerId)->gangId() != Gang::InvalidId) {
            SendClientMessage(playerId, Color::Error,
                "You are already part of a gang. Leave it first before creating a new one by typing: \"/gang leave\".");
            return 1;
        }

        if (GangManager->findGangByName(params) != Gang::InvalidId) {
            SendClientMessage(playerId, Color::Error,
                "A gang with your chosen name already exists. Please either request to join it, or choose a different name for yours.");
            return 1;
        }

        if (GangManager->create(playerId, params) != Gang::InvalidId) {
            SendClientMessage(playerId, Color::Information, "Your gang has been created and you've been named as the gang's leader!");
            return 1;
        }

        // The gang could not be created, presumably because there are too many gangs already.
        SendClientMessage(playerId, Color::Error, "There was an error when creating the gang. Please report this with");
        SendClientMessage(playerId, Color::Error, "the developers on our forums, http://forum.sa-mp.nl/.");

        return 1;
    }

    /**
     * Players would highly like to know information about a gang. With this command and a gang-id
     * or -name they can get information about the gang.
     *
     * @param playerId Id of the player who typed the command.
     * @param gang Id or name of the gang to fetch info for.
     * @command /gang info [gang]
     */
    @switch(GangCommand, "info")
    public onGangInfoCommand(playerId, params[]) {
        if (Command->parameterCount(params) != 1) {
            SendClientMessage(playerId, Color::Information, "Usage: /gang info [gang]");
            return 1;
        }

        // Attempt to find the gang based on Id if the text is numeric.
        new gangId = Gang::InvalidId;
        if (IsNumeric(params)) {
            gangId = strval(params);
            if (gangId < 0 || gangId >= MAX_GANGS || Gang(gangId)->isAvailable() == true) {
                SendClientMessage(playerId, Color::Error, "No gang exists with the given Id.");
                return 1;
            }

        // Otherwise we'll try to find the gang based on the gang name.
        } else {
            gangId = GangManager->findGangByName(params);
            if (gangId == Gang::InvalidId) {
                SendClientMessage(playerId, Color::Error, "No gang could be found with the given name.");
                return 1;
            }
        }

        // Formatting and sending message for the gang's name and Id.
        new message[128], membersMessage[128];
        format(message, sizeof(message), "Members of the gang {%06x}%s (Id:%d){FFFFFF}:",
            GangSettings(gangId)->color() >>> 8, Gang(gangId)->nameString(), gangId);
        SendClientMessage(playerId, Color::Information, message);

        // TODO: Have a clear message separating gang leaders and managers from normal members.
        //       We probably need to store player Ids in arrays for each level first.

        // Go through all in-game players and if gang-member place them in the list.
        for (new userId = 0; userId <= PlayerManager->highestPlayerId(); userId++) {
            if (GangPlayer(userId)->gangId() != gangId)
                continue;

            format(message, sizeof(message), "  %s (%d), ", Player(userId)->nicknameString(), userId);
            strcat(membersMessage, message, sizeof(membersMessage));
        }

        membersMessage[max(strlen(membersMessage) - 2, 0)] = 0; // chopping off last ", "
        SendClientMessage(playerId, Color::Information, membersMessage);

        return 1;
    }

    /**
     * As member of a gang, it's possible to invite other people to join your gang by typing the
     * /gang invite command. The other player may not yet be in another gang, and will then receive
     * an invitation to join the gang the inviter is in. They can accept this by typing /gang join.
     *
     * @param playerId Id of the player who typed the command.
     * @param player Id or name of the inviting player.
     * @command /gang invite [player]
     */
    @switch(GangCommand, "invite")
    public onGangInviteCommand(playerId, params[]) {
        if (Command->parameterCount(params) != 1) {
            SendClientMessage(playerId, Color::Information, "Usage: /gang invite [player]");
            return 1;
        }

        if (GangPlayer(playerId)->gangId() == Gang::InvalidId) {
            SendClientMessage(playerId, Color::Error, "You need to be in a gang before you can invite other players.");
            return 1;
        }

        new inviteeId = Command->playerParameter(params, 0, playerId);
        if (inviteeId == Player::InvalidId)
            return 1;

        new gangId = GangPlayer(playerId)->gangId(),
            inviteeGangId = GangPlayer(inviteeId)->gangId(),
            message[128];

        if (inviteeGangId != Gang::InvalidId) {
            format(message, sizeof(message), "The player %s (%d) can't be invited as they're already in a gang: %s.",
            Player(inviteeId)->nicknameString(), inviteeId, Gang(inviteeGangId)->nameString());

            SendClientMessage(playerId, Color::Error, message);
            return 1;
        }

        Gang(gangId)->onPlayerInvited(inviteeId, playerId);
        GangPlayer(inviteeId)->onInvitedToGang(gangId);

        // Send a message to the invited person about this.
        format(message, sizeof(message), "You have been invited to the gang \"%s\" by %s (%d).",
            Gang(gangId)->nameString(), Player(playerId)->nicknameString(), playerId);
        SendClientMessage(inviteeId, Color::ActionRequired, message);
        SendClientMessage(inviteeId, Color::ActionRequired, "Type \"/gang join\" to accept this invitation.");

        return 1;
    }

    /**
     * Players can join a gang by typing the /gang join command, which will only be available after
     * they've been invited by a member of the gang through /gang invite. Members of the Staff can
     * join any gang at any time, by specifying a gang Id or name as a parameter to this command.
     *
     * @param playerId Id of the player who typed the command.
     * @param gang Id or name of the gang to join. Optional.
     * @command /gang join [gang]?
     */
    @switch(GangCommand, "join")
    public onGangJoinCommand(playerId, params[]) {
        new gangId = Gang::InvalidId;

        // If a parameter has been given, it might be an administrator forcefully joining a gang.
        if (Command->parameterCount(params) != 0) {
            if (Player(playerId)->isAdministrator() == false) {
                SendClientMessage(playerId, Color::Information, "Usage: /gang join");
                return 1;
            }

            // Attempt to find the gang based on Id if the text is numeric.
            if (IsNumeric(params)) {
                gangId = strval(params);
                if (gangId < 0 || gangId >= MAX_GANGS || Gang(gangId)->isAvailable() == true) {
                    SendClientMessage(playerId, Color::Error, "No gang exists with the given Id.");
                    return 1;
                }

            // Otherwise we'll try to find the gang based on the gang name.
            } else {
                gangId = GangManager->findGangByName(params);
                if (gangId == Gang::InvalidId) {
                    SendClientMessage(playerId, Color::Error, "No gang could be found with the given name.");
                    return 1;
                }
            }

        // Otherwise we'll try to see if the player had been invited to a gang.
        } else {
            gangId = GangPlayer(playerId)->invitedGangId();
            if (gangId == Gang::InvalidId) {
                SendClientMessage(playerId, Color::Error,
                    "You have not been invited to any gang, and therefore can't join one either.");
                return 1;
            }
        }

        // Join the gang. The Gang::onPlayerJoin() message will announce it to the gang and set up
        // to player's state to make sure they're member of the gang.
        new message[128];
        Gang(gangId)->onPlayerJoin(playerId, GangMemberRole);

        // Inform the player of their joining as well.
        format(message, sizeof(message), "You are now a member of the gang \"%s\". Welcome!", Gang(gangId)->nameString());
        SendClientMessage(playerId, Color::Information, message);

        return 1;
    }

    /**
     * The oldest member in a gang ("the leader") has the ability to remove other players from the
     * gang by typing the /gang kick command. This will immediately remove the player from the gang.
     *
     * @param playerId Id of the player who typed the command.
     * @param player Id or name of the player to kick.
     * @command /gang kick [player]
     */
    @switch(GangCommand, "kick")
    public onGangKickCommand(playerId, params[]) {
        if (GangPlayer(playerId)->gangId() == Gang::InvalidId) {
            SendClientMessage(playerId, Color::Error, "You need to be in a gang before you're able to lead it.");
            return 1;
        }

        new gangId = GangPlayer(playerId)->gangId(), message[128];
        if (GangPlayer(playerId)->gangRole() != GangLeaderRole) {
            SendClientMessage(playerId, Color::Error, "You need to be owner of the gang in order to kick people from it.");
            return 1;
        }

        new kickeeId = Command->playerParameter(params, 0, playerId);
        if (kickeeId == Player::InvalidId)
            return 1;

        if (GangPlayer(kickeeId)->gangId() != gangId) {
            format(message, sizeof(message), "You can't kick %s (Id:%d) from your gang, as they're in another gang.",
                Player(kickeeId)->nicknameString(), kickeeId);

            SendClientMessage(playerId, Color::Error, message);
            return 1;
        }

        // First, inform the person being kicked of their being removed.
        format(message, sizeof(message), "You've been kicked from the gang %s by %s (Id:%d).",
            Gang(gangId)->nameString(), Player(playerId)->nicknameString(), playerId);
        SendClientMessage(kickeeId, Color::Information, message);

        // Now tell the gang that the kickee will be leaving.
        Gang(gangId)->onPlayerLeave(kickeeId);

        return 1;
    }

    /**
     * Members of a gang can leave at any time by typing the /gang leave command. Their departure
     * will be announced to the gang and they will loose the set color and privileges.
     *
     * @param playerId Id of the player who typed the command.
     * @param params Any further text that the player passed to the command. Unused.
     * @command /gang leave
     */
    @switch(GangCommand, "leave")
    public onGangLeaveCommand(playerId, params[]) {
        if (GangPlayer(playerId)->gangId() == Gang::InvalidId) {
            SendClientMessage(playerId, Color::Error, "You need to be in a gang before you're able to leave it.");
            return 1;
        }

        new gangId = GangPlayer(playerId)->gangId(), message[128];

        format(message, sizeof(message), "You have left the gang %s.", Gang(gangId)->nameString());
        SendClientMessage(playerId, Color::Information, message);

        // Make the player actually leave the gang. This method will also taking care of inheriting
        // gang ownership and informing other members of the gang, if necessary.
        Gang(gangId)->onPlayerLeave(playerId);

        return 1;
        #pragma unused params
    }

    /**
     * Command which allows a gang leader to change the color of both the gang and all its members
     * on Las Venturas Playground. Alias for /gang colour.
     *
     * @param playerId Player who entered the /gang color command.
     * @param params Any further text that the player passed to the command. Unused.
     * @command /gang color
     */
    @switch(GangCommand, "color")
    public onGangColorCommand(playerId, params[]) {
        this->onGangColourCommand(playerId, params);

        return 1;
    }

    /**
     * Command which allows a gang leader to change the color of both the gang and all its members
     * on Las Venturas Playground. The given color has to be a traditional color Id, corrosponding
     * with the default colors we assign to players based on their Id.
     *
     * @param playerId Player who entered the /gang colour command.
     * @param params Any further text that the player passed to the command. Unused.
     * @command /gang colour
     */
    @switch(GangCommand, "colour")
    public onGangColourCommand(playerId, params[]) {
        if (GangPlayer(playerId)->gangId() == Gang::InvalidId || GangPlayer(playerId)->gangRole() != GangLeaderRole) {
            SendClientMessage(playerId, Color::Error, "You need to be leading a gang in order to change it's colour.");
            return 1;
        }

        // The color changing itself is done within the ColorPicker class.
        ColorPicker->showColorPicker(playerId, GangColor, GangPlayer(playerId)->gangId());

        return 1;
        #pragma unused params
    }

#if Feature::EnableFightClub == 1
    /**
     * Gang leaders are capable of setting up a gang vs gang match, which should result of loads of
     * fun. When executing the command, they're able to pick the weapon sets, amount of rounds and
     * fighting players. Recent sent out gang fight invitations can be canceled with /gang fight cancel.
     *
     * @param playerId Player who entered the command.
     * @param gangId Id of the gang to be invited for a gang fight.
     * @command /gang fight [accept/cancel/decline] | [gangId]
     */
    @switch(GangCommand, "fight")
    public onGangFightCommand(playerId, params[]) {
        if (GangPlayer(playerId)->gangId() == Gang::InvalidId || GangPlayer(playerId)->gangRole() != GangLeaderRole) {
            SendClientMessage(playerId, Color::Error, "You need to be leading a gang in order to set up a gang fight!");
            return 1;
        }

        // TODO: Implement this.

        return 1;
        #pragma unused params
    }
#endif

    /**
     * The /gangs command shows the requestee an overview of all the gangs which currently have
     * representation on the server, in order of being created.
     *
     * @param playerId Id of the player who typed the command.
     * @param params Any further text that the player passed to the command. Unused.
     * @command /gangs
     */
    @command("gangs")
    public onGangsCommand(playerId, params[]) {
        SendClientMessage(playerId, Color::Information, "The current gangs are currently represented on Las Venturas Playground:");

        new message[128], displayed = 0;
        for (new gangId = 0; gangId < MAX_GANGS; ++gangId) {
            if (Gang(gangId)->isAvailable() == true)
                continue;

            // The gang Id will be light grey, then a colored gang name and white number of members.
            format(message, sizeof(message), "  {CCCCCC}(%d) {%06x}%s {FFFFFF}- %d member%s", gangId,
                GangSettings(gangId)->color() >>> 8, Gang(gangId)->nameString(), Gang(gangId)->memberCount(),
                Gang(gangId)->memberCount() == 1 ? "" : "s");
            SendClientMessage(playerId, Color::Information, message);
            ++displayed;
        }

        // Show a separate message if no gangs have been created yet.
        if (displayed == 0)
            SendClientMessage(playerId, Color::Information, "  No gangs have been created yet..");

        return 1;
        #pragma unused params
    }

    /**
     * Displays a message informing the caller of this command about the gang which the player
     * currently is part of. The gang cannot be changed using this command.
     *
     * @param playerId Id of the player who wants to know the current gang.
     * @param subjectId Id of the player to know their gang involvement about.
     * @param params Any further text that the player passed to the command. Unused.
     * @command /p [player] gang
     */
    @switch(PlayerCommand, "gang")
    public onPlayerGangCommand(playerId, subjectId, params[]) {
        if (playerId == subjectId || Player(playerId)->isAdministrator() == false)
            return 0;

        new message[128], gangId = GangPlayer(subjectId)->gangId();
        if (gangId == Gang::InvalidId)
            format(message, sizeof(message), "%s (Id:%d) is not currently participating in a gang.",
                Player(subjectId)->nicknameString(), subjectId);
        else
            format(message, sizeof(message), "%s (Id:%d) is currently part of the %s (Id:%d) gang.",
                Player(subjectId)->nicknameString(), subjectId, Gang(gangId)->nameString(), gangId);

        SendClientMessage(playerId, Color::Information, message);

        return 1;
        #pragma unused params
    }

    /**
     * This command allows external services to observe which gangs are currently being represented
     * on Las Venturas Playground, by outputting a list of the created gangs.
     *
     * @param params The parameters passed on to the "gangs" command. Unused.
     * @remotecommand gangs
     */
    @switch(RemoteCommand, "gangs")
    public onRemoteGangsCommand(params[]) {
        for (new gangId = 0; gangId < MAX_GANGS; ++gangId) {
            if (Gang(gangId)->isAvailable() == true)
                continue;

            printf("id(%d), members(%d), name(%s)", gangId, Gang(gangId)->memberCount(), Gang(gangId)->nameString());
        }

        return 1;
        #pragma unused params
    }
};
