// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Sending a player to jail is a way of punishment, as we severely limit their in-game experience
 * for a certain amount of time. The player must wait until they're released from jail before most
 * functionality starts working again.
 *
 * Starting with LVP 8.3, the jail itself is located on the infamous jail island again. We may spend
 * some time fancying it up later on, for example by adding some basic features for people to do
 * whilst spending time in the jail.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class JailController {
    // How long (in minutes) is the default punishment when jailing a player?
    public const DefaultPunishmentDuration = 2;

    // When is a certain player going to be released? This is stored as a unix timestamp, and can be
    // updated on various events, for example when they attempt to /kill themselves.
    new m_playerUnjailTime[MAX_PLAYERS];

    // Did a player minimize their game? If so, we store the remaining time based on when they
    // minimized their game and will compensate for this when they bring it back to front.
    new m_playerMinimizedRemainingTime[MAX_PLAYERS];

    // We show a countdown to the player when they're in jail, for the sake of clarifying how much
    // time they've got left. It will be a properly formatted timer.
    new PlayerText: m_playerCountdownTextdraw[MAX_PLAYERS] = { PlayerText: INVALID_TEXT_DRAW, ... };

    // How many players are currently jailed? If there are none, we can avoid iterate over them.
    new m_playersInJailCount;

    /**
     * Initialises the jail island by creating the required objects at the given position. While the
     * objects are available in every virtual world, we don't have to be too worried about random
     * players flying to it given that it's quite far out. And if they do: good on them.
     */
    public __construct() {
        CreateDynamicObject(16258, 8960.983398, -9786.468872, -50.529314, 0, 0, 0); // island
        CreateDynamicObject(1457, 9021.906250, -9807.963745, 3.681673, 0, 0, 214); // house
        CreateDynamicObject(1458, 9024.158691, -9804.576172, 2.175830, 0, 0, 67); // cart
        CreateDynamicObject(629, 9019.310059, -9807.492188, 2.131221, 0, 0, 0); // palm tree 1
        CreateDynamicObject(634, 9027.553223, -9807.359863, 2.138400, 0, 0, 0); // palm tree 2
        CreateDynamicObject(649, 9024.651367, -9812.646729, 1.970251, 0, 0, 0); // palm tree 3
        CreateDynamicObject(745, 9017.110840, -9812.443359, 2.121156, 0, 0, 44); // double rocks
        CreateDynamicObject(749, 9029.167969, -9805.763306, 2.157157, 0, 0, 0); // rock pillar
        CreateDynamicObject(647, 9031.881348, -9805.360229, 3.354165, 0, 0, 0); // bushes
        CreateDynamicObject(746, 9021.827637, -9798.800049, 2.087549, 0, 0, 0); // three rocks
        CreateDynamicObject(1807, 9019.273926, -9807.252563, 2.570417, 0, 0, 327); // stack of pots
        CreateDynamicObject(1643, 9017.040527, -9803.878052, 2.042194, 0, 0, 0); // beach towel
        CreateDynamicObject(760, 9015.209961, -9801.858887, 2.387444, 0, 0, 0); // plants
        CreateDynamicObject(758, 9029.072754, -9815.813965, 2.113303, 0, 0, 0); // single rock
    }

    /**
     * Called when a player connects to Las Venturas Playground. Reset their data in the Jail
     * controller to make sure we don't accidentially jail them without proper cause.
     *
     * @param playerId Id of the player who connected to Las Venturas Playground.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect(playerId) {
        m_playerUnjailTime[playerId] = 0;
        m_playerMinimizedRemainingTime[playerId] = 0;
        m_playerCountdownTextdraw[playerId] = PlayerText: INVALID_TEXT_DRAW;

        return 1;
    }

    /**
     * We keep track of how many players are currently jailed so we can avoid iterating over all of
     * them if it's not necessary. Data will be reset in onPlayerConnect, no need to do that twice.
     *
     * @param playerId Id of the player who disconnected from the server.
     */
    @list(OnPlayerDisconnect)
    public onPlayerDisconnect(playerId) {
        if (m_playerUnjailTime[playerId] != 0)
            --m_playersInJailCount;

        return 1;
    }

    /**
     * Returns whether a player, indicated by their Id, has already been jailed.
     *
     * @param playerId Id of the player to check whether they're in jail for.
     * @return boolean Is this player already in jail?
     */
    public bool: isPlayerJailed(playerId) {
        return (m_playerUnjailTime[playerId] > 0);
    }

    /**
     * Returns the number of seconds a player has to remain in jail before their punishment ends. We
     * recommend formatting the return value for improved readability.
     *
     * @param playerId Id of the player to check how long they need to be in jail for.
     * @return integer Number of seconds this player has to spend in jail.
     */
    public remainingJailTimeForPlayer(playerId) {
        if (this->isPlayerJailed(playerId) == false)
            return 0;

        return m_playerUnjailTime[playerId] - Time->currentTime();
    }

    /**
     * Put a player in jail for the given amount of minutes, as specified in the duration parameter.
     * If the player already is in jail, the time will be added to their current punishment.
     *
     * @param playerId Id of the player who has to be put in jail.
     * @param duration Duration, in minutes, of their intended punishment.
     */
    public jailPlayer(playerId, duration) {
        new totalDuration = this->remainingJailTimeForPlayer(playerId) + 60 * duration,
            bool: wasJailed = this->isPlayerJailed(playerId);

        m_playerUnjailTime[playerId] = Time->currentTime() + totalDuration;

        if (wasJailed == false) { // we have to set up their jail environment.
            this->setUpJailEnvironmentForPlayer(playerId, totalDuration);
            ++m_playersInJailCount;
        }

        // Enable godmode for the jailed player to avoid buggy death-situations.
        SetPlayerHealth(playerId, 99999);

        // Update the player's state to indicate that they're jailed.
        PlayerState(playerId)->updateState(JailedPlayerState);

        return 1;
    }

    /**
     * Immediately unjails and re-spawns the given player. This method can be called by one of the
     * various commands, but will also be called automatically when it's time to unjail the player.
     *
     * @param playerId Id of the player who should be unjailed.
     */
    public unjailPlayer(playerId) {
        PlayerTextDrawDestroy(playerId, m_playerCountdownTextdraw[playerId]);
        m_playerCountdownTextdraw[playerId] = PlayerText: INVALID_TEXT_DRAW;

        m_playerUnjailTime[playerId] = 0;
        m_playerMinimizedRemainingTime[playerId] = 0;
        --m_playersInJailCount;

        // Disable godmode.
        SetPlayerHealth(playerId, 100);

        // Release the player's state, which will allow them to use commands again.
        PlayerState(playerId)->releaseState();

        // Reset the spawn weapons owned by this player, which is a consequence of being jailed (see
        // ticket #759 for more information).
        SpawnWeaponManager(playerId)->onPlayerConnect();

        // Release their override time, since we'd like them to participate in the world again.
        TimeController->releasePlayerOverrideTime(playerId);

        // Spawn the player in the main world again. The weather, time and virtual world will be
        // automatically set by the random-position spawner.
        SpawnPlayer(playerId);

        return 1;
    }

    /**
     * Marks a player as currently being in jail, without actually setting up their environment. We
     * use this for players who connect to LVP while being in jail, but who are still in class
     * selection (or elsewhere non-teleportable) when we get informed they should be in jail.
     *
     * @param playerId Id of the player who's meant to be in jail.
     * @param duration Number of seconds the player has left in jail.
     */
    public markPlayerAsBeingInJail(playerId, duration) {
        m_playerUnjailTime[playerId] = Time->currentTime() + duration;
        ++m_playersInJailCount;

        // Update the player's state to indicate that they're jailed.
        PlayerState(playerId)->updateState(JailedPlayerState);

        return 1;
    }

    /**
     * Creates the environment in which we jail people for a certain player. We teleport them to the
     * island, put them in the right world and create the textdraw which displays the countdown.
     *
     * @param playerId Id of the player to set up the environment for.
     * @param duration Number of seconds this player is going to be in jail for.
     */
    public setUpJailEnvironmentForPlayer(playerId, duration = 0) {
        SetPlayerVirtualWorld(playerId, World->personalWorldForPlayer(playerId));
        SetPlayerPos(playerId, 8991.62, -9793.03, 1.5);
        SetPlayerFacingAngle(playerId, 255.0);
        SetPlayerWeather(playerId, 18);
        SetPlayerInterior(playerId, 0);
        ResetPlayerWeapons(playerId);

        TimeController->setPlayerOverrideTime(playerId, 17, 15);

        if (m_playerCountdownTextdraw[playerId] != PlayerText: INVALID_TEXT_DRAW)
            return 0; // we don't need to create the textdraw again.

        // Format the remaining punishment time so we can display it.
        new punishmentTimeText[8];
        Time->formatRemainingTime(duration, punishmentTimeText, sizeof(punishmentTimeText), true);

        // We need to create the textdraw which displays the player's remaining punishment time.
        m_playerCountdownTextdraw[playerId] = CreatePlayerTextDraw(playerId, 457.0, 66.0, punishmentTimeText);
        PlayerTextDrawAlignment(playerId, m_playerCountdownTextdraw[playerId], 2);
        PlayerTextDrawColor(playerId, m_playerCountdownTextdraw[playerId], Color::White);
        PlayerTextDrawBoxColor(playerId, m_playerCountdownTextdraw[playerId], Color::LightRedBackground);
        PlayerTextDrawUseBox(playerId, m_playerCountdownTextdraw[playerId], 1);
        PlayerTextDrawFont(playerId, m_playerCountdownTextdraw[playerId], 1);
        PlayerTextDrawTextSize(playerId, m_playerCountdownTextdraw[playerId], 0.0, 64.0);
        PlayerTextDrawLetterSize(playerId, m_playerCountdownTextdraw[playerId], 0.51, 2.3);
        PlayerTextDrawSetOutline(playerId, m_playerCountdownTextdraw[playerId], 1);

        // And show the text-draw to the player, so they know how much time they've got left.
        PlayerTextDrawShow(playerId, m_playerCountdownTextdraw[playerId]);

        return 1;
    }

    /**
     * Iterate over each in-game player every second --but only when someone is in jail-- to see if
     * we have to unjail them. Also update the countdowns for those currently in jail.
     */
    @list(SecondTimer)
    public onSecondTimerTick() {
        if (m_playersInJailCount == 0)
            return 0; // no players are currently in jail.

        new remainingTimeText[8], currentTime = Time->currentTime();
        for (new playerId = 0; playerId <= PlayerManager->highestPlayerId(); ++playerId) {
            if (Player(playerId)->isConnected() == false)
                continue; // the player is not connected.

            if (m_playerUnjailTime[playerId] == 0)
                continue; // the player is not jailed

            new remainingTime = m_playerUnjailTime[playerId] - currentTime;

            // If the player has minimized their game, increase their jail time so they won't be
            // unjailed without actually having to sit out the punishment.
            if (IsPlayerMinimized(playerId)) {
                if (m_playerMinimizedRemainingTime[playerId] == 0)
                    m_playerMinimizedRemainingTime[playerId] = remainingTime;

                ++m_playerUnjailTime[playerId]; // keep the timer roughly in sync

            // When they then bring the game to front again, recalculate their remaining time.
            } else if (m_playerMinimizedRemainingTime[playerId] != 0) {
                m_playerUnjailTime[playerId] = Time->currentTime() + m_playerMinimizedRemainingTime[playerId];
                remainingTime = m_playerUnjailTime[playerId] - currentTime;

                m_playerMinimizedRemainingTime[playerId] = 0;
            }

            // Keep godmode in place.
            SetPlayerHealth(playerId, 99999);

            // Automatically unjail them when they served their jail time. We'll have compensated
            // for potential minimizing of Grand Theft Auto: San Andreas now.
            if (remainingTime < 0 && !IsPlayerMinimized(playerId)) {
                SendClientMessage(playerId, Color::Success, "You have been released from jail because your punishment is over.");
                format(message, sizeof(message), "%s(%d) has been released from jail because his/her punishment time was over.",Player(playerId)->nicknameString(), playerId);
                Admin(playerId, message); 
                this->unjailPlayer(playerId);
                continue;
            }

            // Otherwise we'll just update the player's countdown display.
            Time->formatRemainingTime(remainingTime, remainingTimeText, sizeof(remainingTimeText), true);
            PlayerTextDrawSetString(playerId, m_playerCountdownTextdraw[playerId], remainingTimeText);
        }

        return 1;
    }
};
