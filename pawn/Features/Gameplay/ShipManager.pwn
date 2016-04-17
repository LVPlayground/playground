// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

#define MAX_RAIL_OBJECTS 16

/**
 * To be able to detect what the state of the player is, we need to know what he is doing. This so we
 * can take action based on it.
 */
 enum PlayerShipActivity {
    // The player has no activity on the ship.
    Nothing,

    // The player is on the ship, walking.
    Walking,

    // The player has just left the ship.
    JustLeft
};

/**
 * The shipmanager takes care of a lot of things. Now you wonder, which "a lot of things": Well,
 * think about the main thing: make sure the player can safely idling. This includes temporarily
 * removing the players weapons, setting infinite health (and armor), can't shiplame and much more.
 *
 * @author Xander "Xanland" Hoogland <home@xanland.nl>
 */
class ShipManager {
    // The layer created here is to identify whether the player is on the ship.
    public const ShipLayerId = @counter(ZoneLayer);

    // How much money does the player standing on the ship needs to get per second.
    const ShipIdlingMoneyAmount = 50;

    // Since the ShipManager doesn't have an instance per player, we still need to be able to iden-
    // tify who just walked into a ship-related area.
    new PlayerShipActivity: m_activityOfPlayerOnShip[MAX_PLAYERS];

    // When players idle on the ship we collect their weapons. At leaving the ship we give
    // it all to them back. So we need to keep track of that.
    new m_playerSpawnWeapons_weaponId[MAX_PLAYERS][WeaponSlots+1];

    // Same for their ammo in their weapons.
    new m_playerSpawnWeapons_ammo[MAX_PLAYERS][WeaponSlots+1];

    // Keeps track whether the weaponinventory is saved.
    new bool: m_playerSpawnWeaponsSaved[MAX_PLAYERS];
    new bool: m_playerHealthAndArmourSaved[MAX_PLAYERS];

    // All of the back- and frontshiprailobjects so they can be en- and disabled.
    new DynamicObject: m_shipRailObjects[MAX_RAIL_OBJECTS];

    // We set their health and armour when they join the ship to infinite for protection. Ofcourse
    // at leaving they need to be set back so we have to remember that.
    new Float: m_playerHealthAndArmour[MAX_PLAYERS][2];

    // Is the shiprail already enabled or disabled. Since they move instead of dissappear, we have
    // to keep track of this.
    new bool: m_isTheShiprailEnabled;

    /**
     * In here we create the zones with the actual coördinates where the ship, the ramp of the ship
     * and the forbidden to fly-zones is/are. Also, the shiprail objects are initialized.
     */
    public __construct () {
        new Float: shipRelatedAreas[9][4] = {
            /* x1        y1         x2         y2       */
            { 1995.0000, 1516.0000, 2006.0000, 1569.0000 }, // Ship
            { 2005.0000, 1540.2500, 2024.0000, 1550.2500 }, // Shipramp
            { 2026.5000, 1540.5000, 2033.0000, 1551.0000 }, // In front of shipramp
            { 2023.7500, 1539.7500, 2026.5000, 1551.0000 }, // Poles
            { 2005.0000, 1550.0000, 2023.0000, 1569.0000 }, // Right-top
            { 1978.0000, 1500.0000, 1996.0000, 1569.0000 }, // Left-top, left, left-bottom
            { 1995.0000, 1500.0000, 2024.0000, 1516.0000 }, // Bottom, right-bottom
            { 2006.0000, 1516.0000, 2033.0000, 1540.5000 }, // Right (cars- and bikes-place)
            { 2033.0000, 1516.0000, 2055.0000, 1569.0000 }  // Sidewalk + road-side in front of ship
        };

        // Create a layer and the area for the ship itself and for the ramp in front of the ship.
        ZoneManager->createLayer(ShipManager::ShipLayerId);
        for (new coords = 0; coords < sizeof(shipRelatedAreas); ++coords)
            ZoneLayer(ShipManager::ShipLayerId)->createZone(shipRelatedAreas[coords][0], shipRelatedAreas[coords][2],
                shipRelatedAreas[coords][1], shipRelatedAreas[coords][3], 45.0 /* height */);

        // Create the shiprail objects.
        this->initializeObjects();
    }

    /**
     * Initializes the objects required for the ship manager. This will automatically mark the objects
     * as having been enabled, as they'll be visible to all players.
     */
    public initializeObjects() {
        m_shipRailObjects[0]  = CreateDynamicObject(3524, 2024.34375, 1540.39063, 10.28570,   0.00000,   0.00000,  84.02000);
        m_shipRailObjects[1]  = CreateDynamicObject(3524, 2025.82813, 1550.33594, 10.28570,   0.00000,   0.00000,  84.02000);
        m_shipRailObjects[2]  = CreateDynamicObject(3524, 2024.31055, 1541.67578, 10.70153,   0.00000,   0.00000,  91.00000);
        m_shipRailObjects[3]  = CreateDynamicObject(3524, 2024.47632, 1543.16333, 11.15969,   0.00000,   0.00000,  91.00000);
        m_shipRailObjects[4]  = CreateDynamicObject(3524, 2024.69275, 1544.52002, 11.69453,   0.00000,   0.00000,  91.00000);
        m_shipRailObjects[5]  = CreateDynamicObject(3524, 2024.92810, 1545.94910, 11.69450,   0.00000,   0.00000,  91.00000);
        m_shipRailObjects[6]  = CreateDynamicObject(3524, 2025.26184, 1547.43530, 11.15970,   0.00000,   0.00000,  91.00000);
        m_shipRailObjects[7]  = CreateDynamicObject(3524, 2025.51404, 1549.03674, 10.70150,   0.00000,   0.00000,  91.00000);
        m_shipRailObjects[8]  = CreateDynamicObject(3498, 2024.31055, 1541.67578,  8.01884,   0.00000,   0.00000,   0.00000);
        m_shipRailObjects[9]  = CreateDynamicObject(3498, 2024.47632, 1543.16333,  8.49240,   0.00000,   0.00000,   0.00000);
        m_shipRailObjects[10] = CreateDynamicObject(3498, 2024.69275, 1544.52002,  9.03468,   0.00000,   0.00000,   0.00000);
        m_shipRailObjects[11] = CreateDynamicObject(3498, 2024.92810, 1545.94910,  9.03470,   0.00000,   0.00000,   0.00000);
        m_shipRailObjects[12] = CreateDynamicObject(3498, 2025.26184, 1547.43530,  8.49240,   0.00000,   0.00000,   0.00000);
        m_shipRailObjects[13] = CreateDynamicObject(3498, 2025.51404, 1549.03674,  8.01880,   0.00000,   0.00000,   0.00000);
        m_shipRailObjects[14] = CreateDynamicObject(3524, 1996.29749, 1546.97449, 13.53652, 902.67804,  95.58006, 635.14844);
        m_shipRailObjects[15] = CreateDynamicObject(3524, 1996.22925, 1542.35950, 13.60226, 180.00000, -95.58010, -99.00000);

        m_isTheShiprailEnabled = true;
    }

    /**
     * When a player joins a server we need to be sure it is not identified as being on the ship. In
     * this method we keep track per player that he/she isn't.
     *
     * Also, unfortunately, due to the new ship blocker, we need to remove some objects, we do this
     * here.
     *
     * @param playerId Id of the player who just connected to the server.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect(playerId) {
        m_activityOfPlayerOnShip[playerId] = Nothing;
        m_playerSpawnWeaponsSaved[playerId] = false;
        m_playerHealthAndArmourSaved[playerId] = false;

        // Remove two objects which are in the way.
        RemoveBuildingForPlayer(playerId, 3524, 2024.3438, 1540.3906, 11.3125, 0.25);
        RemoveBuildingForPlayer(playerId, 3524, 2025.8281, 1550.3359, 11.3594, 0.25);
    }

    /**
     * With the zone-manager we can identify whether someone is on the ship. If that is the case we
     * can apply the ShipManager-related features on the player.
     *
     * @param playerId Id of the player who just entered the ship.
     * @param zoneId Id of the zone in the layer which they just entered.
     */
    @switch(OnPlayerEnterZone, ShipManager::ShipLayerId)
    public onPlayerEnterShip(playerId, zoneId) {
        if (MapObjects->isActive()) return 1;
        if (GetPlayerVirtualWorld(playerId) != 0) return 1;

        if (zoneId <= 1) {
            this->respawnPlayerVehicle(playerId);

            if (!LegacyIsKillTimeActivated()) {
                if (DamageManager(playerId)->isPlayerFighting() == true) {
                    SetPlayerPos(playerId, 2034.85, 1545.15, 10.82);
                    SetPlayerFacingAngle(playerId, 275.44);

                    ShowBoxForPlayer(playerId,
                        "You have recently been in a gunfight, therefore cannot enter the ship at this moment");

                    return 1;
                }

                if (m_playerSpawnWeaponsSaved[playerId] == false && m_playerHealthAndArmourSaved[playerId] == false) {
                    this->storeSpawnWeapons(playerId);

                    new Float: health, Float: armour;
                    GetPlayerHealth(playerId, health);
                    m_playerHealthAndArmour[playerId][0] = health;
                    SetPlayerHealth(playerId, 99999);

                    GetPlayerArmour(playerId, armour);
                    m_playerHealthAndArmour[playerId][1] = armour;

                    m_playerSpawnWeaponsSaved[playerId] = true;
                    m_playerHealthAndArmourSaved[playerId] = true;
                }
            }

            m_activityOfPlayerOnShip[playerId] = Walking;
        }

        if (zoneId > 1) {
            this->respawnPlayerVehicle(playerId);
            if (m_playerSpawnWeaponsSaved[playerId] == false && !LegacyIsKillTimeActivated()) {
                this->storeSpawnWeapons(playerId);
                m_playerSpawnWeaponsSaved[playerId] = true;
            }
            m_activityOfPlayerOnShip[playerId] = JustLeft;
        }

        if (zoneId == 3) {
            new Float: position[3];
            GetPlayerPos(playerId, position[0], position[1], position[2]);

            if (position[2] >= 13 && Player(playerId)->isAdministrator() == false) {
                SetPlayerPos(playerId, position[0] + 2, position[1], 10.84);
                SendClientMessage(playerId, Color::Error, "You cannot stand on the ship-poles.");
            }
        }

        return 1;
    }

    /**
     * To prevent people shooting other people from the ship, since it is an safe area, we tempora-
     * rily remove their weapons. Ofcourse they will get them back when they leave.
     *
     * @param playerId Id of the player to temporarily save and remove the weapons from.
     */
    public storeSpawnWeapons(playerId) {
        if (Player(playerId)->isAdministrator() == true)
            return 0;

        for (new weaponSlot = 0; weaponSlot < WeaponSlots; ++weaponSlot)
            GetPlayerWeaponData(playerId, weaponSlot, m_playerSpawnWeapons_weaponId[playerId][weaponSlot],
                m_playerSpawnWeapons_ammo[playerId][weaponSlot]);

        m_playerSpawnWeapons_weaponId[playerId][WeaponSlots] = GetPlayerWeapon(playerId);
        ResetPlayerWeapons(playerId);

        return 1;
    }

    /**
     * Since walking on the ship temporarily removes the player's weapons, we give them back when
     * they left.
     *
     * @param playerId Id of the player to give the weapons back to.
     */
    public restoreSpawnWeapons(playerId) {
        if (Player(playerId)->isAdministrator() == true)
            return 0;

        ResetPlayerWeapons(playerId);
        for (new weaponSlot = 0; weaponSlot < WeaponSlots; ++weaponSlot) {
            if (m_playerSpawnWeapons_weaponId[playerId][weaponSlot] == 0 || m_playerSpawnWeapons_ammo[playerId][weaponSlot] == 0)
                continue;

            GiveWeapon(playerId, m_playerSpawnWeapons_weaponId[playerId][weaponSlot],
                m_playerSpawnWeapons_ammo[playerId][weaponSlot]);
        }

        SetPlayerArmedWeapon(playerId, m_playerSpawnWeapons_weaponId[playerId][WeaponSlots]);

        return 1;
    }

    /**
     * To keep the ship clear of vehicles we need to check if a vehicle is in a specific zone and
     * thus should be respawned.
     *
     * @param playerId Id of the player to possibly respawn a vehicle for.
     */
    public respawnPlayerVehicle(playerId) {
        if (Player(playerId)->isAdministrator() == true)
            return 0;

        new vehicleId = GetPlayerVehicleID(playerId),
            modelId = GetVehicleModel(vehicleId);

        if (GetPlayerState(playerId) == PLAYER_STATE_DRIVER) {
            if (VehicleModel->isAirplane(modelId) == true || VehicleModel->isHelicopter(modelId) == true)
                SendClientMessage(playerId, Color::Error, "Flyable vehicles are not allowed around the ship!");
            else
                SendClientMessage(playerId, Color::Error, "Vehicles are not allowed on the ship!");

            SetVehicleToRespawn(vehicleId);

            return 1;
        }

        return 0;
    }

    /**
     * A player leaving the ship should get his state restored.
     *
     * @param playerId Id of the player who just left the ship.
     * @param zoneId Id of the zone in the layer which they just left.
     */
    @switch(OnPlayerLeaveZone, ShipManager::ShipLayerId)
    public onPlayerLeaveShip(playerId, zoneId) {
        if (MapObjects->isActive()) return 1;
        if (GetPlayerVirtualWorld(playerId) != 0) return 1;

        if (m_playerSpawnWeaponsSaved[playerId] == true && zoneId > 1 && m_activityOfPlayerOnShip[playerId] == JustLeft) {
            this->restoreSpawnWeapons(playerId);
            m_playerSpawnWeaponsSaved[playerId] = false;
        }

        m_activityOfPlayerOnShip[playerId] = JustLeft;

        return 1;
    }

    /**
     * To keep this class very clean we call per timer different methods. Doing it this way we keep
     * it very clear in which method we handle which activity.
     *
     * @param playerId Id of the player to handle shipactivity for.
     */
    @list(SecondTimerPerPlayer)
    public handleShipActivity(playerId) {
        if (m_activityOfPlayerOnShip[playerId] == Nothing)
            return 0;

        if (m_activityOfPlayerOnShip[playerId] == JustLeft && (m_playerSpawnWeaponsSaved[playerId] == true && m_playerHealthAndArmourSaved[playerId] == true)) {
            if (!LegacyIsKillTimeActivated() && !IsPlayerInMinigame(playerId)) {
                this->restoreSpawnWeapons(playerId);

                SetPlayerHealth(playerId, m_playerHealthAndArmour[playerId][0]);
                SetPlayerArmour(playerId, m_playerHealthAndArmour[playerId][1]);
                m_playerSpawnWeaponsSaved[playerId] = false;
                m_playerHealthAndArmourSaved[playerId] = false;
            }

            m_activityOfPlayerOnShip[playerId] = Nothing;

        } else if (m_activityOfPlayerOnShip[playerId] == Walking) {
            if (GetPlayerVirtualWorld(playerId) != 0) {
                m_activityOfPlayerOnShip[playerId] = JustLeft;
                return 1;
            }

            this->issueMoneyToPlayer(playerId);

            if (Player(playerId)->isAdministrator() == false) {
                if (!LegacyIsKillTimeActivated()) {
                    ResetPlayerWeapons(playerId);
                    if (m_playerSpawnWeaponsSaved[playerId] == false && m_playerHealthAndArmourSaved[playerId] == false) {
                        this->storeSpawnWeapons(playerId);

                        new Float: health, Float: armour;
                        GetPlayerHealth(playerId, health);
                        m_playerHealthAndArmour[playerId][0] = health;
                        SetPlayerHealth(playerId, 99999);

                        GetPlayerArmour(playerId, armour);
                        m_playerHealthAndArmour[playerId][1] = armour;

                        m_playerSpawnWeaponsSaved[playerId] = true;
                        m_playerHealthAndArmourSaved[playerId] = true;
                    }
                } else {
                    if (m_playerSpawnWeaponsSaved[playerId] == true && m_playerHealthAndArmourSaved[playerId] == true) {
                        this->restoreSpawnWeapons(playerId);

                        SetPlayerHealth(playerId, m_playerHealthAndArmour[playerId][0]);
                        SetPlayerArmour(playerId, m_playerHealthAndArmour[playerId][1]);
                        m_playerSpawnWeaponsSaved[playerId] = false;
                        m_playerHealthAndArmourSaved[playerId] = false;
                    }
                }

                this->respawnPlayerVehicle(playerId);
            }
        }

        return 1;
    }

    /**
     * When standing on the ship every player gets some money. In here we expand the timer so the
     * player gets his money every second.
     *
     * @param playerId Id of the player who we issue money to
     */
    public issueMoneyToPlayer(playerId) {
        // Yes, also Gunther deserves his loan!
        GivePlayerMoney(playerId, ShipIdlingMoneyAmount);

        // VIPs get the same amount twice a second.
        if (Player(playerId)->isVip() == true)
            GivePlayerMoney(playerId, ShipIdlingMoneyAmount);
    }

    /**
     * To have a bit more fun, administrators and management have the possibility to enable and dis-
     * able the shiprail.
     *
     * @param params If it should be enabled or disabled.
     */
    @switch(SetCommand, "shiprail")
    public onSetShiprailCommand(playerId, params[]) {
        new setShiprailToState[4], adminMessage[128];
        if (Command->parameterCount(params) >= 1) {
            Command->stringParameter(params, 0, setShiprailToState, sizeof(setShiprailToState));

            if (strcmp(setShiprailToState, "on", true) == 0 && m_isTheShiprailEnabled == false) {
                this->enableShiprail(true);

                SendClientMessage(playerId, Color::Success, "Shiprail enabled.");

                format(adminMessage, sizeof(adminMessage), "%s (Id:%d) has enabled the ship-rail object.", Player(playerId)->nicknameString(), playerId);
                Admin(playerId, adminMessage);

                return 1;
            } else if (strcmp(setShiprailToState, "off", true) == 0 && m_isTheShiprailEnabled == true) {
                this->enableShiprail(false);

                SendClientMessage(playerId, Color::Success, "Shiprail disabled.");

                format(adminMessage, sizeof(adminMessage), "%s (Id:%d) has disabled the ship-rail object.", Player(playerId)->nicknameString(), playerId);
                Admin(playerId, adminMessage);

                return 1;
            }
        }

        SendClientMessage(playerId, Color::Information, "Usage: /set shiprail [on/off]");

        return 1;
    }

    /**
     * The actual visual change of the state of the shiprail happens here.
     *
     * @param enable Whether the shiprail should be enabled.
     */
    public enableShiprail(bool: enable = true) {
        if (MapObjects->isActive()) return 1;

        new Float: sroX, Float: sroY, Float: sroZ;

        if (enable) {
            if (m_isTheShiprailEnabled)
                return 0;

            for (new shipRailObject = 0; shipRailObject < MAX_RAIL_OBJECTS; ++shipRailObject) {
                GetDynamicObjectPos(m_shipRailObjects[shipRailObject], sroX, sroY, sroZ);
                MoveDynamicObject(m_shipRailObjects[shipRailObject], sroX - 1.0, sroY, sroZ + 5.4, 3);
            }

            m_isTheShiprailEnabled = true;
        }

        else {
            if (!m_isTheShiprailEnabled)
                return 0;

            for (new shipRailObject = 0; shipRailObject < MAX_RAIL_OBJECTS; ++shipRailObject) {
                GetDynamicObjectPos(m_shipRailObjects[shipRailObject], sroX, sroY, sroZ);
                MoveDynamicObject(m_shipRailObjects[shipRailObject], sroX + 1.0, sroY, sroZ - 5.4, 3);
            }

            m_isTheShiprailEnabled = false;
        }

        return 1;
    }

    /**
     * Toggles functionality of the ship manager depending on whether the map objects experiment has
     * been |enabled|. This may result in destruction of a number of objects.
     */
    public toggleMapObjects(bool: enabled) {
        if (!enabled) {
            this->initializeObjects();
            return;
        }

        for (new shipRailObject = 0; shipRailObject < MAX_RAIL_OBJECTS; ++shipRailObject)
            DestroyDynamicObject(m_shipRailObjects[shipRailObject]);
    }

    /** 
     * Checks if the given playerId is walking on the ship.
     *
     * @param playerId Id of the player who could be on the ship
     */
    public bool: isPlayerWalkingOnShip(playerId) {
        if (Player(playerId)->isConnected() == false)
            return false;

        if (m_activityOfPlayerOnShip[playerId] == Walking)
            return true;

        return false;
    }
};
