// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Creating, sending, accepting and declining invitations for the FightClub should happen in a
 * seperate manager due to the 
 *
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 */
class FightClubInvitationManager {
    // Set the time duration in seconds after a FightClub invitation expires.
    const InvitationExpiryDuration = 15;

    // The matchId belonging to the sent out invitation.
    new m_invitationMatchId[MAX_PLAYERS];

    // Id of the player sending out invitations.
    new m_invitationInviterId[MAX_PLAYERS];

    // Save the timestamp upon invitation delivery to enable expiry after a certain duration.
    new m_invitationTimeStamp[MAX_PLAYERS];

    /**
     * After the fight settings has been set by the inviting player or gangleader, it's time to
     * spread out invitations to the rival player or gang. Invitations have a limited life-span of
     * 15 seconds before they expire. The inviter is able to cancel invitations.
     *
     * @param inviterId Id of the player or gang who has setup a match.
     * @param inviteeId Id of the player or gang to be invited.
     * @param matchId Id of the match holding all the corresponding match settings.
     * @param matchType Type of the match.
     */
    public setUpInvitations(inviterId, inviteeId, matchId, FightClubMatchType: matchType) {
        if (matchType != GangMatch) {
            m_invitationMatchId[inviteeId] = matchId;
            m_invitationInviterId[inviteeId] = inviterId;
            m_invitationTimeStamp[inviteeId] = Time->currentTime();

            // @TODO: Implement invitation textdraw card.
        }

        if (matchType == GangMatch) {
            // @TODO: Implement this.
        }

        return 1;
    }

    /**
     * Upon invitation timeout or cancelation we've to reset certain variables and inform various
     * players.
     *
     * @param inviteeId Id of the player to cancel the invitation for.
     */
    public cancelInvitation(inviteeId) {
        // @TODO: Implement this.
        #pragma unused inviteeId
    }

    /**
     * On every second tick we check for an open invitation for any player, which should be canceled
     * after a certain time duration if the invitee isn't responding.
     *
     * @param playerId Id of the player to check invitations for.
     */
    @list(SecondTimerPerPlayer)
    public onSecondTimerTick(playerId) {
        if (m_invitationMatchId[playerId] == FightClubManager::InvalidMatchId)
            return 0;

        if (Time->currentTime() - m_invitationTimeStamp[playerId] > InvitationExpiryDuration)
            this->cancelInvitation(playerId);

        return 1;
    }

    /**
     * Reset various variables for a connecting player.
     *
     * @param playerId Id of the player who connected to the server.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect(playerId) {
        m_invitationMatchId[playerId] = FightClubManager::InvalidMatchId;
        m_invitationInviterId[playerId] = Player::InvalidId;
        m_invitationTimeStamp[playerId] = 0;

        return 1;
    }
};
