// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Non player characters are a cool way of improving the user experience. They could be guards for
 * animation, managing train, flight or taxi services or be great friends for our large share of
 * forever alone players. Using them has been unified in this class.
 *
 * Requesting a new player character for any given feature is a rather easy process. The class
 * implementing the feature (or controlling the feature's NPCs) can choose to implement a number of
 * switch-listed methods, which allows it to listen to events about the created NPC. The Manager
 * will take care of invocating these when it's appropriate.
 *
 * The following code gives an example as to how a simple NPC owning feature can be written. The
 * NPCManager and the NonPlayerCharacter class implementation will take care of routing all these
 * events to the right class, and the events will only be invoked in your class.
 *
 * class MyFeature {
 *     const MyFeatureId = @counter(NpcHandler);
 *     public __construct() {
 *         NPCManager->request("RussellBot", "russellbot.pwn", MyFeatureId, -1);
 *     }
 *
 *     @switch(OnNpcConnect, FeatureId)
 *     public onRussellBotConnected(playerId, reference) { }
 *
 *     @switch(OnNpcConnectFailed, FeatureId)
 *     public onRussellBotConnectionFailed(playerId, reference) { }
 *
 *     @switch(OnNpcDisconnect, FeatureId)
 *     public onRussellBotDisconnected(playerId, reference) { }
 * };
 *
 * If your feature owns several NPCs and it's being shut down, or needs to get rid of the owning
 * NPCs for other reasons, then you may want to call NPCManager->disconnectForFeature(), which
 * will disconnect all the individual NPCs for you.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class NPCManager {
    // After how many seconds should a connection attempt be considered as failed? This should be
    // a multiple of two, as we'll be using the two-second timer.
    const ConnectionTimeoutSeconds = 8;

    // Provides a fast O(1) mapping between a player Id and the associated NPC Id.
    new m_playerToNonPlayerCharacterMap[MAX_PLAYERS];

    /**
     * Request a bot based on its nickname and the script that it should be using. The non player
     * character will be connected with the default (empty) script and the given nickname, and will
     * be owned by the system as identified with the ownerId. If the bot has not connected after a
     * certain timeout, an event named OnNpcConnectionFailed will be triggered for the given owning
     * system Id.
     *
     * @param nickname Nickname that should be used for connecting this bot.
     * @param script Name of the script that should be used by the NPC, without .amx.
     * @param featureId Id of the system that owns this bot, as each bot needs to be owned.
     * @param featureReference Internal system reference number for referring to this bot.
     * @return boolean Has the bot successfully been requested?
     */
    public bool: request(nickname[], script[], featureId, featureReference = -1) {
        for (new npcId = 0; npcId < MaximumNonPlayerCharacterCount; ++npcId) {
            if (NonPlayerCharacter(npcId)->status() != AvailableNpcStatus)
                continue;

            // Initialize the non-player character by initializing data and connecting the NPC.
            NonPlayerCharacter(npcId)->initialize(nickname, script, featureId, featureReference);
            return true;
        }

        printf("[NPCManager] ERROR: Could not create the NPC '%s': no character slots available.", nickname);
        return false;
    }

    /**
     * Disconnect all non player characters owned by a certain feature. As each bot has an owner,
     * we can easily shut down all dependencies owned by a certain feature when it stops, which will
     * be the case for minigame-created NPCs.
     *
     * @param featureId Id of the owning feature that'll be shut down.
     */
    public requestDisconnectForFeature(featureId) {
        for (new npcId = 0; npcId < MaximumNonPlayerCharacterCount; ++npcId) {
            if (NonPlayerCharacter(npcId)->status() == AvailableNpcStatus)
                continue; // this bot is not currently in use.

            if (NonPlayerCharacter(npcId)->featureId() != featureId)
                continue; // this bot belongs to another feature.

            // Make the bot disconnect from the server.
            NonPlayerCharacter(npcId)->disconnect();
        }
    }

    /**
     * Returns the non-player character Id associated with the given player Id. If the playerId is
     * out of range *or* hasn't registered, NonPlayerCharacter::InvalidId will be returned.
     *
     * @param playerId Id of the player to get the NPC Id for.
     * @return integer Id of the NPC, or NonPlayerCharacter::InvalidId.
     */
    public inline idForPlayer(playerId) {
        return ((playerId >= 0 && playerId < MAX_PLAYERS) ? m_playerToNonPlayerCharacterMap[playerId] : NonPlayerCharacter::InvalidId);
    }

    /**
     * When a non-player character connects to the server, we need to identify the NPC as being
     * connected and inform the feature which requested this bot about it being available.
     *
     * @param playerId Id of the player who connected to the server, not always an NPC.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect(playerId) {
        m_playerToNonPlayerCharacterMap[playerId] = NonPlayerCharacter::InvalidId;
        if (Player(playerId)->isNonPlayerCharacter() == false)
            return;

        // Foward the call to NPCManager::onIndentifiedHuman(), which needs to do exactly the same
        // method as this one, aside from resetting data to its original value.
        this->onIndentifiedHuman(playerId);
    }

    /**
     * It is possible that players are being identified as a non-player characters in the
     * onPlayerConnect callback due to a SA-MP bug, while they're actually human. Let's correct it.
     *
     * @param playerId Id of the player who now was identified as being a human.
     */
    @list(OnIndentifiedHuman)
    public onIndentifiedHuman(playerId) {
        new npcId = NonPlayerCharacter::InvalidId;
        for (new currentNpcId = 0; currentNpcId < MaximumNonPlayerCharacterCount; ++currentNpcId) {
            if (strcmp(Player(playerId)->nicknameString(), NonPlayerCharacter(currentNpcId)->nicknameString()))
                continue; // the names do not match.

            npcId = currentNpcId;
            break;
        }

        if (npcId == NonPlayerCharacter::InvalidId)
            return; // this NPC isn't being handled by the NPC Manager..

        NonPlayerCharacter(npcId)->markAsBeingConnected(playerId);
        m_playerToNonPlayerCharacterMap[playerId] = npcId;
    }

    /**
     * Just like normal players, it is possible that NPCs randomly disconnect from the server as
     * well, for example as a consequence of timeouts. This method listens to all disconnections and
     * will check whether they're an NPC. If they are, handle their disconnection gracefully.
     *
     * @param playerId Id of the player who disconnected from the server, not always an NPC.
     */
    @list(OnPlayerDisconnect)
    public onPlayerDisconnect(playerId) {
        if (Player(playerId)->isNonPlayerCharacter() == false)
            return;

        new npcId = m_playerToNonPlayerCharacterMap[playerId];
        NonPlayerCharacter(npcId)->announceDisconnectionAndReset();

        m_playerToNonPlayerCharacterMap[playerId] = NonPlayerCharacter::InvalidId;
    }

    /**
     * Since NPC connections will time out after a certain number of seconds has passed, we need
     * to clean up their state and free them up for usage by future systems. Since this is a low
     * priority operation, we'll iterate over the NPC list every two seconds.
     */
    @list(TwoSecondTimer)
    public processControl() {
        for (new npcId = 0; npcId < MaximumNonPlayerCharacterCount; ++npcId) {
            if (NonPlayerCharacter(npcId)->status() != ConnectingNpcStatus)
                continue;

            if (NonPlayerCharacter(npcId)->hasConnectionTimedOut(ConnectionTimeoutSeconds) == false)
                continue;

            // The non-player character will distribute the announcement themselves.
            NonPlayerCharacter(npcId)->announceFailedConnectionAndReset();
        }
    }
};
