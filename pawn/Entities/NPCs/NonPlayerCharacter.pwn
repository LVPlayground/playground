// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * How many non player characters should we be able to create in the system itself? This will
 * determine the hard limit by the NPC instances we'll create.
 */
const MaximumNonPlayerCharacterCount = 16;

/**
 * Any single non player character will be controlled from within this class. We'll fire the
 * required events to the features that own bots and contain the basic information for them to both
 * work correctly and allow them to be managed by the NPC Manager.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class NonPlayerCharacter <npcId (MaximumNonPlayerCharacterCount)> {
    // Id used to identify invalid non-player characters.
    public const InvalidId = INVALID_PLAYER_ID;

    // Id used to identify NPCs which have not been tied to a specific feature.
    const InvalidFeatureId = -1;

    // What is the current status of this non player character?
    new NonPlayerCharacterStatus: m_status = AvailableNpcStatus;

    // What is the Id of the player associated with this NPC?
    new m_playerId;

    // What is the nickname of the NPC as it should be connecting?
    new m_nickname[24];

    // What is the Id of the feature that owns this NPC?
    new m_featureId;

    // What is the feature-sided reference for identifying this NPC? This often is the instance.
    new m_featureReference;

    // The time at which the non player character was requested by the system.
    new m_requestTime;

    /**
     * Initialize this non player character's state with the given information. The Manager will
     * request the npc to be connected with the server, after which we'll be informed about that
     * event, and will switch to the Connected status.
     *
     * @param nickname Nickname of the NPC that we'll be owning.
     * @param script Name of the script which should be loaded for this NPC.
     * @param featureId Id of the feature that owns this bot, in case it shuts down.
     * @param featureReference Reference Id for within the system itself.
     */
    public initialize(nickname[], script[], featureId, featureReference) {
        m_status = ConnectingNpcStatus;
        m_playerId = Player::InvalidId;
        format(m_nickname, sizeof(m_nickname), "%s", nickname);
        m_featureId = featureId;
        m_featureReference = featureReference;
        m_requestTime = Time->currentTime();

        // Actually make the NPC join the server by asking SA-MP to do so.
        ConnectNPC(nickname, script);
    }

    /**
     * Disconnect this non-player character from the server. We'll kick the bot immediately and fake
     * the leaving message, as it's not of a player's interest to know that they were kicked.
     */
    public disconnect() {
        m_status = DisconnectingNpcStatus;
        Kick(m_playerId); // valid Kick() usage.
    }

    /**
     * Invoked when this non-player character requests a certain class. In most cases we'll just
     * want to return 1 here, but in case there are NPCs with special requirements we can override
     * that by invoking the OnNpcRequestClass switch list.
     *
     * @return integer Is the NPC able to spawn with this class, or should it be blocked?
     */
    public bool: onNonPlayerCharacterRequestClass() {
        return Annotation::ExpandSwitch<OnNpcRequestClass>(m_featureId, m_featureReference, m_playerId) != 0;
    }

    /**
     * Invoked when this non-player character is requesting to spawn in Las Venturas Playground. We
     * may have to set up additional settings about the bot here, which is why we'll broadcast the
     * OnNpcRequestSpawn switch list. Otherwise we'll simply allow it.
     *
     * @return integer Can the NPC be spawned into the world, or should it be blocked?
     */
    public bool: onNonPlayerCharacterRequestSpawn() {
        return Annotation::ExpandSwitch<OnNpcRequestSpawn>(m_featureId, m_featureReference, m_playerId) != 0;
    }

    /**
     * Invoked when this non-player character is about to be spawned in the world. The normal code
     * for setting up their position won't be called, so it's important to initialize them as part
     * of this method. It will broadcast the OnNpcSpawn() switch list.
     *
     * @return integer False if the NPC should be returned to class selection after the next spawn.
     */
    public bool: onNonPlayerCharacterSpawn() {
        ColorManager->setPlayerOverrideColor(m_playerId, Color::NonPlayerCharacterColor);

        return Annotation::ExpandSwitch<OnNpcSpawn>(m_featureId, m_featureReference, m_playerId) != 0;
    }

    /**
     * Marks this bot as being connected and sets the Id of the player which has been allocated to
     * handle this NPC.
     *
     * @param playerId Id of the player which represents this NPC.
     */
    public markAsBeingConnected(playerId) {
        m_status = ConnectedNpcStatus;
        m_playerId = playerId;

        // Announce that the non player character has been connected to the server.
        Annotation::ExpandSwitch<OnNpcConnect>(m_featureId, m_featureReference, m_playerId);
    }

    /**
     * Announces that this non-player character has disconnected from the servers. Features could
     * choose to implement automatic reconnection if they feel that may be useful.
     */
    public announceDisconnectionAndReset() {
        // Announce that the non player character has been been disconnected from the server.
        Annotation::ExpandSwitch<OnNpcDisconnect>(m_featureId, m_featureReference, m_playerId);

        m_status = AvailableNpcStatus;
        m_featureId = InvalidFeatureId;
    }

    /**
     * Announce that this non-player character could not connect to the server for a reason unknown
     * to us. Reset the status and system owner of this NPC to their initial state, to make sure
     * that the NPC will be seen as being available and won't be owned by and feature in LVP.
     */
    public announceFailedConnectionAndReset() {
        // Announce that the non player character has been failed to connect to the server.
        Annotation::ExpandSwitch<OnNpcConnectFailed>(m_featureId, m_featureReference, m_playerId);

        m_status = AvailableNpcStatus;
        m_featureId = InvalidFeatureId;
    }

    /**
     * Returns the Id of the player which handles this non-player character.
     *
     * @return integer Id of the player handling this NPC.
     */
    public inline playerId() {
        return m_playerId;
    }

    /**
     * Returns the array in which the nickname for this non player character has been stored. Do
     * not modify the value as it'll be returned by this method.
     *
     * @return string The nickname of this non-player character.
     */
    public inline nicknameString() {
        return m_nickname;
    }

    /**
     * Retrieve the current status of this non-player-character, which will also indicate whether
     * it's being used or not by one of LVP's sub-systems.
     *
     * @return NPCStatus The status of this NPC.
     */
    public inline NonPlayerCharacterStatus: status() {
        return (m_status);
    }

    /**
     * Retrieve the feature Id of the system that owns this NPC. This will be used to make sure that
     * we're able to shut down all NPCs belonging to a certain system in a single go.
     *
     * @return integer Id of the feature that owns this NPC.
     */
    public inline featureId() {
        return (m_featureId);
    }

    /**
     * Determine whether the connection timeout for this non player character has been exceeded,
     * which means that we won't no longer expect it to connect to the server.
     *
     * @return boolean Has the connection timeout for this bot exceeded?
     */
    public inline bool: hasConnectionTimedOut(timeOutSeconds) {
        return ((Time->currentTime() - m_requestTime) >= timeOutSeconds);
    }
};

// Temporary class to implement the callbacks until they have enough users.
class TemporaryNpcCallbacks {
    @switch(OnNpcRequestClass, -1)
    public onNpcRequestClass(referenceId, playerId) {
        #pragma unused referenceId, playerId
    }

    @switch(OnNpcRequestSpawn, -1)
    public onNpcRequestSpawn(referenceId, playerId) {
        #pragma unused referenceId, playerId
    }

    @switch(OnNpcConnect, -1)
    public onNpcConnect(referenceId, playerId) {
        #pragma unused referenceId, playerId
    }

    @switch(OnNpcConnectFailed, -1)
    public onNpcConnectFailed(referenceId, playerId) {
        #pragma unused referenceId, playerId
    }

    @switch(OnNpcDisconnect, -1)
    public onNpcDisconnect(referenceId, playerId) {
        #pragma unused referenceId, playerId
    }
};
