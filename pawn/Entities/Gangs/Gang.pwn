// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * A gang is a group of players that play together who, right now, share a private chat environment.
 * In future iterations more features will be added on top of this, including automated loading of
 * gangs from the database when a player has already joined one.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class Gang <gangId (MAX_GANGS)> {
    // Invalid Gang Id, used to determine whether a player is part of a gang.
    public const InvalidId = -1;

    // What is the maximum length of a gang name, in characters?
    public const MaximumNameLength = 32;

    // What is the name of this gang?
    new m_name[Gang::MaximumNameLength+1];

    // How many members are currently part of this gang?
    new m_playerCount;

    /**
     * When a gang has been created, we need to store the gang's information in the class scope so
     * it can be retrieved later on, by other systems as well.
     *
     * @param playerId Id of the player who's creating this gang.
     * @param name Name of the gang which we'll be dealing with.
     */
    public onCreateTemporaryGang(playerId, name[]) {
        format(m_name, sizeof(m_name), "%s", name);
        m_playerCount = 1;

        GangPlayer(playerId)->onJoinedGang(gangId, GangLeaderRole);

        // Set the gang color to the player's default color if the player is currently having the
        // admin/mod color.
        new adminColor = Color::AdministratorColor;
        if (ColorManager->playerColor(playerId) == adminColor)
            Gang(gangId)->setColor(ColorManager->defaultColorForPlayerId(playerId));
        else
            Gang(gangId)->setColor(ColorManager->playerColor(playerId));

        // Instrument how often a gang gets created on Las Venturas Playground.
        Instrumentation->recordActivity(GangCreatedActivity);
    }

    /**
     * When a member of the gang invited someone else to join the gang, we'll distribute a message
     * to all other players in the gang to make sure they're aware of this.
     *
     * @param playerId Id of the player who has been invited to join the gang.
     * @param memberId Id of the gang member who invited this person to the gang.
     */
    public onPlayerInvited(playerId, memberId) {
        new message[128];
        format(message, sizeof(message), "%s (%d) has invited %s (%d) to your gang (%s).",
            Player(memberId)->nicknameString(), memberId,
            Player(playerId)->nicknameString(), playerId, m_name);

        this->sendMessageToMembers(Color::Information, message);
    }

    /**
     * We'll have to announce the joining of a player to other gang members and mark the player as
     * being part of this gang, all of which will be done by this method.
     *
     * @param memberId Id of the player who has joined this gang.
     * @param role Role this player will be having in the gang.
     */
    public onPlayerJoin(memberId, GangRole: role) {
        new message[128];
        format(message, sizeof(message), "%s (%d) has joined your gang (%s)!",
            Player(memberId)->nicknameString(), memberId, m_name);

        // Instrument how often a player joins a gang on the server.
        Instrumentation->recordActivity(/** temporary gang **/ GangJoinedActivity);

        // Now inform all other members of the gang about this player joining it.
        this->sendMessageToMembers(Color::Information, message);
        ++m_playerCount;

        // Give the player the color associated with this gang to make them identifyable, and make
        // sure that we mark the player as being a member of this gang.
        ColorManager->setPlayerGangColor(memberId, GangSettings(gangId)->color());
        GangPlayer(memberId)->onJoinedGang(gangId, role);
    }

    /**
     * Players who are part of a gang have access to a private gang chat, which can be used when
     * they prefix their messages with an exclamation mark. This method handles such messages.
     *
     * @param memberId Id of the member who send a chat message to their gang.
     * @param text The message they wanted to distribute.
     */
    public onChatMessage(memberId, text[]) {
        new message[128];

        // First we distribute this message to members of the gang itself.
        format(message, sizeof(message), "* [%d] %s: %s", memberId, Player(memberId)->nicknameString(), text);
        this->sendMessageToMembers(Color::GangChat, message);

        // Distributing gang chat messages can exceed the scope of members and administrators and
        // includes administrators who have enabled this, and as a special property feature.
        new groupConversationPropertyId = PropertyManager->propertyForSpecialFeature(ReadGroupConversationsFeature);
        if (groupConversationPropertyId != Property::InvalidId) {
            new groupConversationPropertyOwner = Property(groupConversationPropertyId)->ownerId();
            if (groupConversationPropertyOwner != Player::InvalidId && GangPlayer(groupConversationPropertyOwner)->gangId() != gangId) {
                format(message, sizeof(message), "* (%s) %s: %s", m_name, Player(memberId)->nicknameString(), text);
                SendClientMessage(groupConversationPropertyOwner, Color::GangChat, message);
            }
        }

        for (new player = 0; player <= PlayerManager->highestPlayerId(); ++player) {
            if (Player(player)->isConnected() == false || Player(player)->isAdministrator() == false)
                continue; /* either not connected or not an administrator */

            if (GangPlayer(player)->gangId() == GangPlayer(memberId)->gangId())
                continue; /* let's not spam a crew member in the gang twice */

            if (MessageLevelsManager->getPlayerMessageLevel(player) < 2)
                continue; /* crew member doesn't want to read gang chats */

            format(message, sizeof(message), "* (%s) %s: %s", m_name, Player(memberId)->nicknameString(), text);
            SendClientMessage(player, Color::GangChat, message);
        }

        // Instrument how often players send a message to their fellow gang members.
        Instrumentation->recordActivity(GangMessageActivity);

        // And finally, share the contents of this message to those on IRC.
        format(message, sizeof(message), "%d %s %d %d %s %s", memberId, Player(memberId)->nicknameString(),
            gangId, strlen(m_name), m_name, text);
        IRC->broadcast(GangChatIrcMessage, message);
    }

    /**
     * When a member of the gang leaves, we have to announce this to all other players in the gang.
     * Moreso, when this player happened to own the gang, we may need to transfer ownership to
     * another member or stop the gang altogether, if no members are left anymore.
     *
     * @param memberId Id of the member who has left the gang.
     */
    public onPlayerLeave(memberId) {
        new GangRole: previousRole = GangPlayer(memberId)->gangRole();

        ColorManager->releasePlayerGangColor(memberId);
        GangPlayer(memberId)->resetGangId();

        // If no more players are left in the gang, then we stop the gang altogether.
        if (--m_playerCount <= 0)
            return;

        new message[128];
        format(message, sizeof(message), "%s (%d) has left your gang (%s).",
            Player(memberId)->nicknameString(), memberId, m_name);

        this->sendMessageToMembers(Color::Information, message);

        // If this member used to own the gang, we need to find the person who joined the gang after
        // them so they can transition to be the gang's leader.
        if (previousRole == GangLeaderRole) {
            new oldestMember = Player::InvalidId,
                memberJoinTime = Time->currentTime();

            for (new playerId = 0; playerId <= PlayerManager->highestPlayerId(); ++playerId) {
                if (GangPlayer(playerId)->gangId() != gangId)
                    continue; // they're not part of the gang.

                if (GangPlayer(gangId)->gangJoinTime() >= memberJoinTime)
                    continue; // they're not the oldest known player.

                memberJoinTime = GangPlayer(gangId)->gangJoinTime();
                oldestMember = playerId;
            }

            if (oldestMember == Player::InvalidId)
                return; // this should never be the case...

            format(message, sizeof(message), "Being the oldest member, %s (%d) has been made leader of the gang %s.",
                Player(oldestMember)->nicknameString(), oldestMember, m_name);

            this->sendMessageToMembers(Color::Information, message);
            GangPlayer(oldestMember)->setGangRole(GangLeaderRole);
        }
    }

    /**
     * Sets the color for both the gang and the markers and nametags for all the members of the gang,
     * irrespective of their level within it. For persistent gangs, the color will change in a
     * persistent manner as well, i.e. continue to be applied between sessions.
     *
     * @param color The color which the gang should be changing to.
     */
    public setColor(color) {
        GangSettings(gangId)->setColor(color);
        for (new playerId = 0; playerId <= PlayerManager->highestPlayerId(); playerId++) {
            if (GangPlayer(playerId)->gangId() != gangId)
                continue; // they're not part of the gang.

            ColorManager->setPlayerGangColor(playerId, color);
        }
    }

    /**
     * Transmit a message with a certain color to all members who currently are part of this gang.
     * Other message restrictions will not be kept in mind.
     *
     * @param color Color this message should be written in.
     * @param message The message that should be send to all the gang's players.
     */
    public sendMessageToMembers(color, message[]) {
        for (new playerId = 0; playerId <= PlayerManager->highestPlayerId(); ++playerId) {
            if (GangPlayer(playerId)->gangId() != gangId)
                continue;

            SendClientMessage(playerId, color, message);
        }
    }

    /**
     * Return whether this gang is available for usage. We do this based on the gang name, which
     * will be cleared after the last player leaves this gang.
     *
     * @return boolean Is the gang available for usage?
     */
    public inline bool: isAvailable() {
        return (m_playerCount <= 0);
    }

    /**
     * Returns the number of players that currently are member of this gang.
     *
     * @return integer The number of players who currently are a member of this gang.
     */
    public inline memberCount() {
        return (m_playerCount);
    }

    /**
     * Returns the name of this gang as a string. The name() method should be preferred over this
     * one because of variable ownership, but for comparisons this is faster.
     *
     * @return string Name of the gang.
     */
    public inline nameString() {
        return m_name;
    }
};
