// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

forward OnHideIdentifyMessageForPlayer(playerId);

/**
 * After their first connection to the server, the first thing visible to players is the class
 * selection screen. This basically provides the first impression players get from Las Venturas
 * Playground, and, as such, we have to take good care in handling this.
 *
 * There are various scenarios possible, for each of which we have to give a good class selection
 * experience. The number of edge-cases possible here is interesting.
 *
 * 1) The player is not registered.
 *    Show the normal class selection, allowing the player to select a skin, after which they're
 *    able to spawn.
 *
 * 2) The player is registered.
 *    a) The player has a fixed skin stored to their account.
 *       Show the "fixed skin" version of the class select, which looks identical but doesn't allow
 *       the player to iterate through the available skins.
 *
 *    b) There is no fixed skin known for the player.
 *       The player needs to be able to identify and select a skin of their liking at the same time.
 *       After they identify, class selection will continue as usual. If they request to spawn prior
 *       to logging in to their account, show a message about why they can't do this.
 *
 *    If the player joined with a nickname that isn't theirs and wants to play as a guest, we'll
 *    reset the class selection scenario to be equal to step (1).
 *
 * Class selection can also be invoked after the player has already spawned, for example when they
 * press on the "F4" shortcut. This will always bring them in the (1) scenario. In case the Account
 * system is disabled, the player will always end up in the (1) scenario as well.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class SpawnManager <playerId (MAX_PLAYERS)> {
    // When no skin is known for a player, this value should be used.
    public const InvalidSkinId = -1;

    // The player may have pre-selected a skin, which we store here.
    new m_skinId;

    // We need a timer when the player clicks on Spawn while they need to identify.
    new m_identifyMessageTimer;

    // Is the player in "fixed mode", which happens when we know their skin?
    new bool: m_isInFixedClassSelection;

    // Has the player been in class selection at all? We need to track this because the client must
    // receive a reply from OnPlayerRequestClass, otherwise it'll jump to class selection later on.
    new bool: m_beforeInitialClassSelection;

    // Have we seen the first spawn of this player?
    new bool: m_hasSeenFirstSpawn;

    // ---------------------------------------------------------------------------------------------

    // Whether the player should have their position restored on spawn.
    new m_restoreOnSpawn;

    // Id of the interior in which the player should spawn next.
    new m_spawnInterior;

    // Coordinates of the position in Grand Theft Auto where the player should spawn.
    new Float: m_spawnPosition[3];

    // Facing angle of the position at which the player should spawn next.
    new Float: m_spawnRotation;

    // ---------------------------------------------------------------------------------------------

    /**
     * After a player connects to Las Venturas Playground, we'll default to showing them the class
     * selection screen. Under certain conditions, however, onRequestClass will not be invoked, and
     * we thus have to initialize basic settings in here.
     *
     * Because of important order of execution during a player's connection sequence, this method
     * will be invoked by Account::onPlayerConnect() rather than via an invocation list.
     */
    public onConnect() {
        Player(playerId)->setIsInClassSelection(true);
        this->setUpGameEnvironmentForClassSelection();

        NeedToIdentifyForSpawnMessage(playerId)->reset();

        m_skinId = SpawnManager::InvalidSkinId;
        m_identifyMessageTimer = -1;
        m_isInFixedClassSelection = false;
        m_beforeInitialClassSelection = true;
        m_hasSeenFirstSpawn = false;
        m_restoreOnSpawn = false;
        m_spawnInterior = -1;
    }

    /**
     * Returns the Skin Id of the given player. When no skin is known at this point, the constant
     * SpawnManager::InvalidSkinId will be returned.
     *
     * @return integer Id of the skin which has been selected by the player.
     */
    public skinId() {
        return (m_skinId);
    }

    /**
     * Requests that the player's state be restored on their next spawn.
     */
    public requestRestoreOnSpawn() {
        m_restoreOnSpawn = true;
    }

    /**
     * Updates the Skin Id used by the player to the given value. This will persist for future
     * play sessions as well if the player is registered. We'll also update the skin the player
     * currently has in-game, ensuring the right skin is being displayed.
     *
     * @param skinId Id of the skin which has been selected by the player.
     * @param forceUpdate Whether to force an update of the cached spawn info.
     */
    public setSkinId(skinId, bool: forceUpdate = false) {
        if (m_beforeInitialClassSelection || forceUpdate)
            SetSpawnInfo(playerId, 0, skinId, 1346.17, 2807.06, 10.82, 320.0, 0, 0, 0, 0, 0, 0);

        SetPlayerSkinEx(playerId, skinId);
        m_skinId = skinId;
    }

    /**
     * Updates the skinId of the player. But does not set it at the instant moment.
     * Will return false if an invalid skinId is given.
     *
     * @param skinId Id of the skin which has been selected.
     */
    public setSkinIdUponNextSpawn(skinId) {
        SetSpawnInfo(playerId, 0, skinId, 1346.17, 2807.06, 10.82, 320.0, 0, 0, 0, 0, 0, 0);

        m_skinId = skinId;
    }

    /**
     * When the MySQL server is local or for other reasons just responding very quickly, it is
     * possible that we know whether the player is registered before class selection commences. In
     * that case, spawn the player immediately, which will force a single-skin waiting scenario.
     *
     * @param classId Id of the class that they're trying to request.
     * @return boolean Is the player allowed to spawn with the current class?
     */
    public bool: onRequestClass(classId) {
        m_beforeInitialClassSelection = false;

        if (Player(playerId)->isRegistered() && !Player(playerId)->isLoggedIn()) {
            if (m_skinId != SpawnManager::InvalidSkinId) {
                SetSpawnInfo(playerId, 0, m_skinId, 1346.17, 2807.06, 10.82, 320.0, 0, 0, 0, 0, 0, 0);
                SpawnPlayer(playerId);
                return true;
            }
        }

        // They might have pressed F4, or went to class selection using another way.
        this->setUpGameEnvironmentForClassSelection();
        if (!Player(playerId)->isInClassSelection())
            Player(playerId)->setIsInClassSelection(true);

        #pragma unused classId
        return true;
    }

    /**
     * The player has requested to spawn in Las Venturas Playground, determine whether we can and
     * mark the player as being out of class selection. The player is not allowed to spawn when
     * they've registered, but have not yet logged in.
     *
     * @return boolean Is the player allowed to spawn?
     */
    public bool: onRequestSpawn() {
        if (Player(playerId)->isRegistered() && !Player(playerId)->isLoggedIn()) {
            this->showNeedToIdentifyMessage();
            return false;
        }

        // Only tear down the environment if the player was in class selection.
        if (Player(playerId)->isInClassSelection()) {
            this->tearDownGameEnvironmentForClassSelection();
            Player(playerId)->setIsInClassSelection(false);
        }

        return true;
    }

    /**
     * Invoked when a player has spawned in San Andreas. Because we want players to spawn in very
     * specific ways, order of invocating the other methods and functions is important. Internally
     * for this class, we make sure that the player does not spawn in the normal world before they
     * are logged in when they are registered.
     *
     * @return boolean False will force them to the class selection upon their next spawn.
     */
    public bool: onSpawn() {
        if (Player(playerId)->isRegistered() == true && Player(playerId)->isLoggedIn() == false) {
            this->setUpGameEnvironmentForClassSelection();
            if (m_skinId != SpawnManager::InvalidSkinId)
                SetPlayerSkin(playerId, m_skinId);

            m_isInFixedClassSelection = true;
            return true;
        }

        if (m_hasSeenFirstSpawn == false && Player(playerId)->isRegistered() == false)
            Interface->issueRegisterDialog(playerId);

        m_hasSeenFirstSpawn = true;
        if (Player(playerId)->isInClassSelection() == true) {
            this->tearDownGameEnvironmentForClassSelection();
            Player(playerId)->setIsInClassSelection(false);

            if (m_skinId != SpawnManager::InvalidSkinId)
                SetPlayerSkin(playerId, m_skinId);
        }

        // -----------------------------------------------------------------------------------------
        // Has JavaScript requested authority over this player's spawns?

        if (IsInvolvedInJavaScriptGame(playerId))
            return true;

        // -----------------------------------------------------------------------------------------

        // Is the player in jail? If they are, killing themselves will give them another two minutes
        // of jail time to enjoy. This will also apply when they reconnect to the server.
        if (JailController->isPlayerJailed(playerId) == true) {
            JailController->setUpJailEnvironmentForPlayer(playerId);
            JailController->jailPlayer(playerId, 2);
            return true;
        }

        // First we set a random spawn position for a player if they aren't participating in a minigame.
        SetPlayerSpawnPos(playerId);

        // Then the annotation is launched which will set the player's initial set of weapons, plus
        // change the spawn position if needed.
        Annotation::ExpandList<OnPlayerSpawn>(playerId);

        // Restore the player's state if this was requested by the JavaScript code.
        if (m_restoreOnSpawn) {
            OnSerializePlayerState(playerId, 0 /* serialize */, -1 /* restoreOnSpawn */);
            m_restoreOnSpawn = false;
        }

        // Finally, the OriginalOnPlayerSpawn function is launched, to set all old player settings
        // like weather, world, color, skin and more regarding their state (minigame or roaming).
        /// TODO: One day we shouldn't need this anymore.
        OriginalOnPlayerSpawn(playerId);

        // TODO: We'll probably want this in a unified spawn location manager.
        if (m_spawnInterior != /** invalid Id **/ -1) {
            this->restoreLocationOnSpawn();
            return true;
        }
        return true;
    }

    /**
     * If the player's nickname has been registered with Las Venturas Playground, their skin will
     * be preloaded while we may still be in the class selection. If the player hasn't been in class
     * selection at all yet, bail out. Otherwise we severely break the spawn procedure and will
     * cause the player to re-enter class selection (or spawn with Cj) on subsequent spawns.
     */
    @list(OnPlayerAccountAvailable)
    public onAccountAvailable() {
        if (m_skinId == SpawnManager::InvalidSkinId || m_beforeInitialClassSelection == true) {
            this->setUpGameEnvironmentForClassSelection();
            return;
        }

        SetSpawnInfo(playerId, 0, m_skinId, 1346.17, 2807.06, 10.82, 320.0, 0, 0, 0, 0, 0, 0);
        SpawnPlayer(playerId);
    }

    /**
     * When the player is registered and logged in to their account, in the case that the player has
     * a fixed skin with their account, we can now proceed to spawning them.
     */
    @list(OnPlayerLogin)
    public onLogin() {
        if (m_isInFixedClassSelection == false || m_hasSeenFirstSpawn == true)
            return;

        m_isInFixedClassSelection = false;
        if (m_skinId != SpawnManager::InvalidSkinId)
            SetSpawnInfo(playerId, 0, m_skinId, 1346.17, 2807.06, 10.82, 320.0, 0, 0, 0, 0, 0, 0);

        SpawnPlayer(playerId);
    }

    /**
     * If the player logs in as a guest and we've previously forced a single skin upon them, we have
     * to release this lock and allow free class selection once again.
     */
    @list(OnPlayerGuestLogin)
    public onGuestLogin() {
        if (m_isInFixedClassSelection == false)
            return;

        m_isInFixedClassSelection = false;
        ForceClassSelection(playerId);

        // The user needs to respawn in order to get to the Spawn Selection screen. Utilize the
        // player spectating functions to achieve this, as it'll give us a smooth transition.
        TogglePlayerSpectating(playerId, true);
        TogglePlayerSpectating(playerId, false);
    }

    /**
     * If we have a fixed spawn position in mind for the player, then let's be sure to spawn them
     * there instead of at a random position in the Grand Theft Auto world.
     */
    private restoreLocationOnSpawn() {
        SetPlayerVirtualWorld(playerId, World::MainWorld);
        SetPlayerInterior(playerId, m_spawnInterior);
        SetPlayerPos(playerId, m_spawnPosition[0], m_spawnPosition[1], m_spawnPosition[2]);
        SetPlayerFacingAngle(playerId, m_spawnRotation);
        TogglePlayerControllable(playerId, 1);
        SetCameraBehindPlayer(playerId);

        SetPlayerWeather(playerId, GetMainWorldWeatherId());
        TimeController->releasePlayerOverrideTime(playerId);

        // Be sure that we won't restore their location again next time.
        m_spawnInterior = -1;
    }

    /**
     * When a player is requesting a class, we'd like to display a fancy screen to them at a certain
     * position in San Andreas, which requires us to set up the weather, the time, the camera, the
     * player's own position, and so on.
     *
     * @note When updating the class selection location to be elsewhere, be sure to also update the
     *       location used in SetSpawnPosition in SpawnManager::onAccountAvailable().
     */
    private setUpGameEnvironmentForClassSelection() {
        SetPlayerPos(playerId, 1346.17, 2807.06, 10.82);
        SetPlayerCameraPos(playerId, 1349.85, 2810.12, 11.82);
        SetPlayerCameraLookAt(playerId, 1344.17, 2807.06, 11.32);
        SetPlayerFacingAngle(playerId, 320.0);
        SetPlayerVirtualWorld(playerId, World::WorldForClassSelection);
        TogglePlayerControllable(playerId, 0);

        /// @todo(Russell) This ought to be handled by the weather/time handler.
        TimeController->setPlayerOverrideTime(playerId, 17, 45);
        SetPlayerWeather(playerId, 17);
    }

    /**
     * After the class selection phase is over, we'd like to re-set the player's state and free up
     * any locks in Managers we've requested for them.
     */
    private tearDownGameEnvironmentForClassSelection() {
        TogglePlayerControllable(playerId, 1);
        SetPlayerVirtualWorld(playerId, World::MainWorld);
        m_isInFixedClassSelection = false;

        SetPlayerWeather(playerId, GetMainWorldWeatherId());
        TimeController->releasePlayerOverrideTime(playerId);
    }

    /**
     * Show a message next to the "Spawn" button informing the player of the need to identify to
     * their account before they'll be allowed to spawn. Otherwise it's just a button which for an
     * undefined button has no action attached to it, which would be confusing.
     */
    private showNeedToIdentifyMessage() {
        NeedToIdentifyForSpawnMessage(playerId)->show();
        if (m_identifyMessageTimer != -1)
            KillTimer(m_identifyMessageTimer);

        m_identifyMessageTimer = SetTimerEx("OnHideIdentifyMessageForPlayer", 2000, 0, "d", playerId);
    }

    /**
     * When the timeout has expired or the player is able to spawn for other reasons, we need to
     * remove the text-draw from their screen, and stop the timer if it's still pending.
     */
    public hideNeedToIdentifyMessage() {
        NeedToIdentifyForSpawnMessage(playerId)->hide();
        if (m_identifyMessageTimer != -1)
            KillTimer(m_identifyMessageTimer);

        m_identifyMessageTimer = -1;
    }
};

/**
 * When a player requests to spawn, we'd like to forward that request to the Spawn Manager. There
 * are two exceptions to this, namely when the player is not connected (i.e. we're dealing with a
 * bug), or when the player is a non-playable character, in which case we'll need different logic.
 *
 * @param playerid Id of the player who has requested a class.
 * @param classid Id of the class which they've requested.
 * @return integer Is the player able to spawn with this class (1), or should it be blocked (0)?
 */
public OnPlayerRequestClass(playerid, classid) {
    if (Player(playerid)->isConnected() == false)
        return 0;

    Player(playerid)->verifyNonPlayerCharacter();
    if (Player(playerid)->isNonPlayerCharacter()) {
        new npcId = NPCManager->idForPlayer(playerid);
        if (npcId != Player::InvalidId)
            return _: NonPlayerCharacter(npcId)->onNonPlayerCharacterRequestClass();

        return 1;
    }

    return _: SpawnManager(playerid)->onRequestClass(classid);
}

/**
 * Forward the OnPlayerRequestSpawn callback to the Spawn Manager, unless the player who has
 * requested spawn is not connected to the server, or we're dealing with a non-playable character.
 *
 * @param playerid Id of the player who has requested to spawn.
 * @return integer Can the player be spawned into the world (1), or should it be blocked (0)?
 */
public OnPlayerRequestSpawn(playerid) {
    if (Player(playerid)->isConnected() == false)
        return 0;

    if (Player(playerid)->isNonPlayerCharacter()) {
        new npcId = NPCManager->idForPlayer(playerid);
        if (npcId != Player::InvalidId)
            return _: NonPlayerCharacter(npcId)->onNonPlayerCharacterRequestSpawn();

        return 1;
    }

    return _: SpawnManager(playerid)->onRequestSpawn();
}

/**
 * We may be able to force a player back in class selection after they spawned, for example when
 * their account is registered and they have a fixed skin to spawn in.
 *
 * @param playerid Id of the player who is spawning.
 * @return integer False if the player should be returned to class selection after the next spawn.
 */
public OnPlayerSpawn(playerid) {
    if (Player(playerid)->isConnected() == false)
        return 0;

    if (Player(playerid)->isNonPlayerCharacter() == true) {
        new npcId = NPCManager->idForPlayer(playerid);
        if (npcId != Player::InvalidId)
            return _: NonPlayerCharacter(npcId)->onNonPlayerCharacterSpawn();

        SpawnNPCs(playerid);
        return 1;
    }

    return _: SpawnManager(playerid)->onSpawn();
}

/**
 * Two seconds after the last time the player clicked on the "Spawn" button, we'll need to hide the
 * message about them needing to identify prior to being able to spawn.
 */
public OnHideIdentifyMessageForPlayer(playerId) {
    if (Player(playerId)->isConnected() == false || !Player(playerId)->isInClassSelection())
        return 0;

    SpawnManager(playerId)->hideNeedToIdentifyMessage();
    return 1;
}

forward OnSetPlayerSkinId(playerId, skinId, bool: uponNextSpawn);
public OnSetPlayerSkinId(playerId, skinId, bool: uponNextSpawn) {
    if(uponNextSpawn) {
        SpawnManager(playerId)->setSkinIdUponNextSpawn(skinId);
    } else {
        SpawnManager(playerId)->setSkinId(skinId, true);
    }
}
