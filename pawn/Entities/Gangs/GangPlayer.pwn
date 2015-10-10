// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Player can be part of any gang during their in-game session. There is various information we
 * use to determine gang membership and ownership of each individual player.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class GangPlayer <playerId (MAX_PLAYERS)> {
    // Players can join a gang after they've been invited, which we need to keep track of.
    new m_inviteGangId;

    // What is the Id of the gang this player is currently part of?
    new m_gangId;

    // What is the role of this player in the gang they're a member of?
    new GangRole: m_gangRole;

    // When did this player join said gang (to determine the oldest member when ownership of the
    // gang changes, i.e. because of the founder disconnecting).
    new m_gangJoinTime;

    /**
     * When a player connects to Las Venturas Playground, we clear their gang information as they
     * shouldn't start off in a gang by default. The account system can request them to be in a gang
     * automatically if their account is set up to be.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect() {
        m_gangId = Gang::InvalidId;
        m_gangJoinTime = 0;
        m_inviteGangId = Gang::InvalidId;
        m_gangRole = GangMemberRole;
    }

    /**
     * When a player is part of a gang and then disconnects from the server, we have to inform the
     * members of the gang (and the gang itself) of their departure.
     */
    @list(OnPlayerDisconnect)
    public onPlayerDisconnect() {
        if (m_gangId == Gang::InvalidId)
            return;

        Gang(m_gangId)->onPlayerLeave(playerId);
    }

    /**
     * Returns the gang Id this player is part of. If they're not part of any gang at all, the
     * Gang::InvalidId constant will be returned instead.
     *
     * @todo This really should be inline, but can't be as Gang::sendMessageToMembers relies on it..
     * @return integer The Id of the gang this player is part of.
     */
    public gangId() {
        return (m_gangId);
    }

    /**
     * Resets the gang Id this player is part of. Changing the gang Id itself is only possible when
     * calling the onJoinedGang() method in this class.
     */
    public resetGangId() {
        m_gangId = Gang::InvalidId;
    }

    /**
     * Returns the role this player has in the gang they're part of. Temporary gangs will only be
     * using GangLeaderRole and GangMemberRole, but for persistent gangs more levels are available.
     *
     * @return GangRole The role the player has in the gang they're member of.
     */
    public GangRole: gangRole() {
        return (m_gangRole);
    }

    /**
     * Updates the role this player has in their gang. While this will never be called for persistent
     * gangs, temporary gangs change leader when the current leader leaves the server.
     *
     * @param role The new role this player has in their gang.
     */
    public setGangRole(GangRole: role) {
        m_gangRole = role;
    }

    /**
     * When the player joined a gang, we need to set their information to reflect it. Their join
     * time will be set to the current timestamp, unless they're leaving the gang, in which case
     * it will be reset to zero.
     *
     * @param gangId Id of the gang the player will be joining.
     * @param role The role this player will be having in said gang.
     */
    public onJoinedGang(gangId, GangRole: role) {
        if (gangId != Gang::InvalidId)
            m_gangJoinTime = Time->currentTime();
        else
            m_gangJoinTime = 0;

        m_gangId = gangId;
        m_gangRole = role;
    }

    /**
     * Retrieve the time when this player joined the last gang. This will be set to zero if they
     * are not part of any gang right now.
     *
     * @return integer Time (in seconds) when the player joined the gang they're in.
     */
    public gangJoinTime() {
        return (m_gangJoinTime);
    }

    /**
     * If the player has been invited to any gang, this method may be used to find that gang Id.
     *
     * @return integer Id of the gang this player has been invited to.
     */
    public inline invitedGangId() {
        return (m_inviteGangId);
    }

    /**
     * When a player has been invited to a gang we need to store this locally, to make sure that
     * it's known after they type /gang join -- for which an invitation is required.
     *
     * @param gangId Id of the gang they have been invited to.
     */
    public inline onInvitedToGang(gangId) {
        m_inviteGangId = gangId;
    }
};
