// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * It's fun to have several pick-ups around LVP that gives players benefits. These pick-ups come
 * in the form of "statues"; floating items placed in remote areas. Each statue has its own
 * advantage, rewarding the player carrying the statue after each clean kill. The advantages vary
 * from money, to health and ammo. Consecutive killing will result in higher rewards.
 *
 * Players can steal each other's statues by killing each other, but a player can only carry one
 * statue at a time.
 *
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 */
class StatuesManager {
    // We are a category of pickups and thus need to have our own Id with the pickup controller.
    public const StatueHandlerId = @counter(PickupHandler);

    // The Id that will be used as return values when no statue is being carried.
    public const InvalidStatue = -1;

    // Once a player picks up a statue we have to keep track of the amount of kills he makes.
    new m_statueKills[MAX_PLAYERS];

    // Keep track of the statue a player is currently holding.
    new m_currentStatue[MAX_PLAYERS] = StatuesManager::InvalidStatue;

    // The reward for an ammo statue kill is 50 pieces of ammunition for every weapon at start.
    const AmmoStatueReward = 50;

    // The reward for a armour statue kill is 5% of armour at start.
    const ArmourStatueReward = 5;

    // The reward for a health statue kill is 5% of health at start.
    const HealthStatueReward = 5;

    // The reward for a money statue kill is 50k in dollars at start.
    const MoneyStatueReward = 50000;

    // For each statue we need a list of details.
    enum statueDetails {
        Float: posX, /* x-position of the statue */
        Float: posY, /* y-position of the statue */
        Float: posZ, /* z-position of the statue */
        sModelId, /* pickup model Id */
        iconId, /* map icon Id */
        mapId, /* unique Id for created map icon by CreateDynamicMapIcon() */
        statueId /* unique Id for created pickup by PickupController->createPickup() */
    }

    // Gather all the statues info in one array.
    new m_statueInfo[4][statueDetails] = {
        //    posX        posY     posZ  sModelId  iconId  mapId  statueId
        {2845.6782, -2410.4414, 19.1922,     1254,      6,     0,       -1}, // Ammo Statue
        { -689.293,   1538.472,  82.685,     1242,     30,     0,       -1}, // Armour Statue
        {-2870.233,   2803.545, 250.589,     1240,     22,     0,       -1}, // Health Statue
        {-2611.399,  -2851.273,   2.863,     1274,     23,     0,       -1}  // Money Statue
    };

    /**
     * With help of the PickupController each statue with its own modelId is created. By using the
     * streamer plugin we are able to create a minimap icon for each statue, and stream this icon
     * over a very long distance (9999999).
     */
    public __construct() {
        for (new index = 0; index < sizeof(m_statueInfo); index++) {
            m_statueInfo[index][statueId] = PickupController->createPickup(StatuesManager::StatueHandlerId,
                m_statueInfo[index][sModelId], PersistentPickupType, m_statueInfo[index][posX],
                m_statueInfo[index][posY], m_statueInfo[index][posZ], 0);

            m_statueInfo[index][mapId] = CreateDynamicMapIcon(m_statueInfo[index][posX],
                m_statueInfo[index][posY], m_statueInfo[index][posZ], m_statueInfo[index][iconId],
                0, 0, 0, -1, 9999999);

            Streamer_SetIntData(STREAMER_TYPE_MAP_ICON, m_statueInfo[index][mapId], E_STREAMER_STYLE, 3);
        }
    }

    /**
     * Function to attach the statue to the player. First the pickup and minimap icon are removed,
     * then the statue is attached the player, just above his head.
     *
     * @param playerId Id of the player who the statue needs to be attached to.
     * @param pickupId Id of the statue that needs to be attached.
     */
    public attachStatueToPlayer(playerId, pickupId) {
        PickupController->destroyPickup(StatuesManager::StatueHandlerId, pickupId);

        for (new index = 0; index < sizeof(m_statueInfo); index++) {
            if (pickupId != m_statueInfo[index][statueId])
                continue;

            DestroyDynamicMapIcon(m_statueInfo[index][mapId]);

            // Player's current statue is equals the statue's unique sModelId.
            m_currentStatue[playerId] = m_statueInfo[index][sModelId];

            // Put a mini-statue above the player's right shoulder.
            SetPlayerAttachedObject(playerId, 2, m_statueInfo[index][sModelId], 1, 0.63, 0.05, -0.23,
                -178.69, 90.66, 0, 0.56, 0.46, 0.55);

            // Reset the statueId since the pickup has been destroyed.
            m_statueInfo[index][statueId] = PickupController::InvalidId;
        }

        return 1;
    }

    /**
     * Function to drop the statue and respawn it if necessary. If it only needs to be dropped, the
     * player's position is gathered and the statue is dropped there. Else, we respawn it.
     *
     * @param playerId Id of the player whose statue's gonna be dropped, and respawned if necessary.
     * @param statue sModelId of the statue carried by the player.
     * @param respawnStatue Boolean to mark if the statue needs to be respawned or just dropped.
     */
    public dropPlayerStatue(playerId, statue, bool: respawnStatue = false) {
        if (respawnStatue == false) {
            new Float: dropPosition[3];

            // Little hack to place the statue at ground level.
            GetPlayerPos(playerId, dropPosition[0], dropPosition[1], dropPosition[2]);
            SetPlayerPosFindZ(playerId, dropPosition[0], dropPosition[1], dropPosition[2]);
            GetPlayerPos(playerId, dropPosition[0], dropPosition[1], dropPosition[2]);

            for (new index = 0; index < sizeof(m_statueInfo); index++) {
                if (statue != m_statueInfo[index][sModelId])
                    continue;

                m_statueInfo[index][statueId] = PickupController->createPickup(StatuesManager::StatueHandlerId,
                    m_statueInfo[index][sModelId], PersistentPickupType, dropPosition[0], dropPosition[1], dropPosition[2], 0);
                m_statueInfo[index][mapId] = CreateDynamicMapIcon(dropPosition[0], dropPosition[1],
                    dropPosition[2], m_statueInfo[index][iconId], 0, 0, 0, -1, 9999999);
                Streamer_SetIntData(STREAMER_TYPE_MAP_ICON, m_statueInfo[index][mapId], E_STREAMER_STYLE, 3);
            }
        } else if (respawnStatue == true) {
            for (new index = 0; index < sizeof(m_statueInfo); index++) {
                if (statue != m_statueInfo[index][sModelId])
                    continue;

                m_statueInfo[index][statueId] = PickupController->createPickup(StatuesManager::StatueHandlerId,
                    m_statueInfo[index][sModelId], PersistentPickupType, m_statueInfo[index][posX],
                    m_statueInfo[index][posY], m_statueInfo[index][posZ], 0);
                m_statueInfo[index][mapId] = CreateDynamicMapIcon(m_statueInfo[index][posX],
                    m_statueInfo[index][posY], m_statueInfo[index][posZ], m_statueInfo[index][iconId],
                    0, 0, 0, -1, 9999999);
                Streamer_SetIntData(STREAMER_TYPE_MAP_ICON, m_statueInfo[index][mapId], E_STREAMER_STYLE, 3);
            }
        }

        m_currentStatue[playerId] = StatuesManager::InvalidStatue;
        m_statueKills[playerId] = 0;

        RemovePlayerAttachedObject(playerId, 2);

        return 1;
    }

    /**
     * When a player connects we reset his/her current statue, and statue kills value.
     *
     * @param playerId Id of the player who connected to the server.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect(playerId) {
        m_currentStatue[playerId] = StatuesManager::InvalidStatue;
        m_statueKills[playerId] = 0;

        return 1;
    }

    /**
     * If the player was carrying a statue on moment of disconnecting, a function is called to drop
     * the statue and respawn it.
     *
     * @param playerId Id of the player who disconnected from the server.
     */
    @list(OnPlayerDisconnect)
    public onPlayerDisconnect(playerId) {
        if (m_currentStatue[playerId] != StatuesManager::InvalidStatue) {
            new message[128];
            format(message, sizeof(message), "~r~~h~%s~w~ has left the server, the ~y~%s Statue~w~ has been respawned",
                Player(playerId)->nicknameString(),
                (m_currentStatue[playerId] == m_statueInfo[0][sModelId] ? "Ammo" :
                m_currentStatue[playerId] == m_statueInfo[1][sModelId] ? "Armour" :
                m_currentStatue[playerId] == m_statueInfo[2][sModelId] ? "Health" : "Money"));

            NewsController->show(message);
            this->dropPlayerStatue(playerId, m_currentStatue[playerId], true);
        }

        return 1;
    }

    /**
     * If a player picks up one of the statues scattered around LVP, we first check if the player is
     * already carrying one. When the latter is false, we attach the statue to the player, and
     * update his currentStatue status. The world is informed about this event, and the player who
     * picked up the statue is informed about the statue's ability.
     *
     * @param playerId Id of the player who picked up the statue.
     * @param pickupId Id of the picked up statue.
     * @param extraId Additional Id allowing features to route this pickup.
     */
    @switch(OnPlayerEnterPickup, StatuesManager::StatueHandlerId)
    public onPlayerPickUpStatue(playerId, pickupId, extraId) {
        if (m_currentStatue[playerId] != StatuesManager::InvalidStatue)
            return 0;

        new message[128];
        format(message, sizeof(message), "~r~~h~%s~w~ has picked up the ~y~%s Statue",
            Player(playerId)->nicknameString(), (pickupId == m_statueInfo[0][statueId] ? "Ammo" :
            pickupId == m_statueInfo[1][statueId] ? "Armour" :
            pickupId == m_statueInfo[2][statueId] ? "Health" : "Money"));
        NewsController->show(message);

        format(message, sizeof(message), "~y~%s Statue~n~~n~~w~You will receive ~b~%s~w~ for every player you kill!",
            (pickupId == m_statueInfo[0][statueId] ? "Ammo" : pickupId == m_statueInfo[1][statueId] ? "Armour" :
            pickupId == m_statueInfo[2][statueId] ? "Health" : "Money"),
            (pickupId == m_statueInfo[0][statueId] ? "ammo" : pickupId == m_statueInfo[1][statueId] ? "armour" :
            pickupId == m_statueInfo[2][statueId] ? "Health" : "money"));
        ShowBoxForPlayer(playerId, message);

        PlayerPlaySound(playerId, 1064, 0, 0, 0);
        this->attachStatueToPlayer(playerId, pickupId);

        return 1;
        #pragma unused extraId
    }

    /**
     * When a player carrying a statue dies, we check if he is participating in a minigame. If he is
     * not, but died in an interior, the statue is dropped and respawned. If het is not in a minigame,
     * and died exterior, the statue is dropped. In both situations the world and the player itself
     * are informed. When a player dies by the hand of someone carrying a statue, we have to update
     * his/her amount of statue kills and reward him according to the statue he is carrying.
     *
     * @param playerId Id of the player who died.
     * @param killerId Id of the killer, or INVALID_PLAYER_ID if there was none.
     * @param reason Reason (extended weapon Id) which caused this player to die.
     */
    @list(OnPlayerDeath)
    public onPlayerDeath(playerId, killerId, reason) {
        new message[128];

        // Check if the killed player (playerId) was carrying a statue.
        if (!IsPlayerInMinigame(playerId) && m_currentStatue[playerId] != StatuesManager::InvalidStatue) {
            if (GetPlayerInterior(playerId) != 0) {
                format(message, sizeof(message), "~r~~h~%s~w~ has died, the ~y~%s Statue~w~ has been respawned",
                    Player(playerId)->nicknameString(),
                    (m_currentStatue[playerId] == m_statueInfo[0][sModelId] ? "Ammo" :
                    m_currentStatue[playerId] == m_statueInfo[1][sModelId] ? "Armour" :
                    m_currentStatue[playerId] == m_statueInfo[2][sModelId] ? "Health" : "Money"));
                this->dropPlayerStatue(playerId, m_currentStatue[playerId], true);
            } else {
                format(message, sizeof(message), "~r~~h~%s~w~ has died and dropped the ~y~%s Statue~w~ at their location",
                    Player(playerId)->nicknameString(),
                    (m_currentStatue[playerId] == m_statueInfo[0][sModelId] ? "Ammo" :
                    m_currentStatue[playerId] == m_statueInfo[1][sModelId] ? "Armour" :
                    m_currentStatue[playerId] == m_statueInfo[2][sModelId] ? "Health" : "Money"));
                this->dropPlayerStatue(playerId, m_currentStatue[playerId], false);
            }
            NewsController->show(message);
            ShowBoxForPlayer(playerId, "~w~You lost your ~y~statue~w~!");
        }

        // Check if the killer (killerId) was carrying a statue, and did not suicide.
        if (killerId == Player::InvalidId)
            return 0;

        if (!IsPlayerInMinigame(killerId) && m_currentStatue[killerId] != StatuesManager::InvalidStatue) {
            m_statueKills[killerId]++;

            for (new index = 0; index < sizeof(m_statueInfo); index++) {
                if (m_currentStatue[killerId] != m_statueInfo[index][sModelId])
                    continue;

                if (index == 0) /* reward for ammo statue kill */ {
                    format(message, sizeof(message), "~r~Ammo Statue:~n~~y~%d Kills~n~~g~+ %d ammunition",
                        m_statueKills[killerId], (m_statueKills[killerId] * AmmoStatueReward));

                    new weaponId, ammunition;
                    for (new weaponSlot = 0; weaponSlot < WeaponSlots; ++weaponSlot) {
                        GetPlayerWeaponData(killerId, weaponSlot, weaponId, ammunition);
                        if (ammunition != 0)
                            GiveWeapon(killerId, weaponId, (m_statueKills[killerId] * AmmoStatueReward));
                    }
                } else if (index == 1) /* reward for armour statue kill */ {
                    format(message, sizeof(message), "~r~Armour Statue:~n~~y~%d Kills~n~~g~+ %d armour",
                        m_statueKills[killerId], (m_statueKills[killerId] * ArmourStatueReward));

                    new Float: armour;
                    GetPlayerArmour(killerId, armour);

                    if (armour < 100)
                        SetPlayerArmour(killerId, (armour + ((armour / 100) * (m_statueKills[killerId] * ArmourStatueReward))));
                } else if (index == 2) /* reward for health statue kill */ {
                    format(message, sizeof(message), "~r~Health Statue:~n~~y~%d Kills~n~~g~+ %d health",
                        m_statueKills[killerId], (m_statueKills[killerId] * HealthStatueReward));

                    new Float: health;
                    GetPlayerHealth(killerId, health);

                    if (health < 100)
                        SetPlayerHealth(killerId, (health + ((health / 100) * (m_statueKills[killerId] * HealthStatueReward))));
                } else if (index == 2) /* reward for money statue kill */ {
                    format(message, sizeof(message), "~r~Money Statue:~n~~y~%d Kills~n~~g~+ $%d",
                        m_statueKills[killerId], (m_statueKills[killerId] * MoneyStatueReward));

                    GivePlayerMoney(killerId, (m_statueKills[killerId] * MoneyStatueReward));
                }
            }
            GameTextForPlayer(killerId, message, 3000, 5);
        }

        return 1;
        #pragma unused reason
    }

    /**
     * Make a getter to check if a player is carrying a statue.
     *
     * @return integer -1 or the pickup model Id of the statue.
     */
    public inline hasStatue(playerId) {
        return (m_currentStatue[playerId]);
    }
};
