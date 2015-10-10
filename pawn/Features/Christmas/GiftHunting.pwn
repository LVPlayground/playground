// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * Gift Hunting is a Christmas-themed minigame. This class handles gift pickups and random presents.
 *
 * @author Manuele "Kase" Macchia <kaseify@gmail.com>
 */
class GiftHunting {
    // How many different kinds of gifts can be picked up?
    public const MaximumGiftTypes = 11;

    // How many gift positions are there?
    public const MaximumGiftPositions = 169;

    // File which contains gift positions data.
    const GiftDataFile = "data/gift_hunting_positions.json";

    // Id of Christmas box objects (five different kinds of box textures).
    new m_boxObjectId[5] = {19054, 19055, 19056, 19057, 19058};

    // A list of coordinates at which gifts may spawn.
    new Float: m_giftPosition[GiftHunting::MaximumGiftPositions][4];

    // Index of the last gift position.
    new m_latestGiftPosition;

    // Gift pickup object Id
    new m_objectId;

    // How many sets of gift coordinates have been registered with the gamemode?
    new m_giftPositionCount = 0;

    /**
     * The GiftHunting constructor will initialize gift positions, stored in a JSON file for convenience,
     * and spawn the first present for players to pick up. The JSON file contains a list of arrays of 
     * coordinates (X, Y, Z, angle) at which present pickups may appear.
     *
     * Data format example:
     *
     * "gifts": [
     *     [90.0, 80.0, 70.0, 180.0],
     *     [150.5, 10.0, -20.0, 0.0]
     * ]
     */
    public __construct() {
        new Node: giftsRootNode = JSON->parse(GiftDataFile);
        if (giftsRootNode == JSON::InvalidNode || JSON->getType(giftsRootNode) != JSONObject) {
            printf("[GiftHuntingController] ERROR: Unable to read the Gift Hunting present coordinates data.");
            return;
        }

        new Node: giftPositionList = JSON->find(giftsRootNode, "gifts");
        if (giftPositionList == JSON::InvalidNode || JSON->getType(giftPositionList) != JSONArray) {
            printf("[GiftHuntingController] ERROR: Unable to read the Gift Hunting present coordinates list.");
            return;
        }

        m_giftPositionCount = 0;
        for (new Node: currentGiftPosition = JSON->firstChild(giftPositionList); currentGiftPosition != JSON::InvalidNode; currentGiftPosition = JSON->next(currentGiftPosition)) {
            if (m_giftPositionCount >= GiftHunting::MaximumGiftPositions)
                break;

            new Node: giftLocationSetting = JSON->firstChild(currentGiftPosition);
            JSON->readFloat(giftLocationSetting, m_giftPosition[m_giftPositionCount][0]); // Coordinate X
            giftLocationSetting = JSON->next(giftLocationSetting);

            JSON->readFloat(giftLocationSetting, m_giftPosition[m_giftPositionCount][1]); // Coordinate Y
            giftLocationSetting = JSON->next(giftLocationSetting);

            JSON->readFloat(giftLocationSetting, m_giftPosition[m_giftPositionCount][2]); // Coordinate Z
            giftLocationSetting = JSON->next(giftLocationSetting);

            JSON->readFloat(giftLocationSetting, m_giftPosition[m_giftPositionCount][3]); // Coordinate Z angle

            if (giftLocationSetting == JSON::InvalidNode || JSON->getType(giftLocationSetting) != JSONFloat)
                return;

            ++m_giftPositionCount;
        }

        JSON->close();

        if (m_giftPositionCount == 0)
            printf("[GiftHuntingController] ERROR: Could not load any presents.");

        this->spawnNewPresent();
    }

    // Check if a gift has already been spawned, and if so, delete it, and then create a new one.
    public spawnNewPresent() {
        if (IsValidObject(m_objectId))
            DestroyObject(m_objectId);

        m_latestGiftPosition = random(GiftHunting::MaximumGiftPositions);
        m_objectId = CreateObject(m_boxObjectId[random(5)], m_giftPosition[m_latestGiftPosition][0], m_giftPosition[m_latestGiftPosition][1], m_giftPosition[m_latestGiftPosition][2], 0, 0, m_giftPosition[m_latestGiftPosition][3], 200);
    }

    /**
     * Checks every player's current position; if any given player is (very) close to the present,
     * he'll automatically get a gift! It also 
     *
     * @param playerId Id of the player we're checking the position of.
     */
    @list(SecondTimerPerPlayer)
    public checkPlayerPosition(playerId) {
        if (IsPlayerInRangeOfPoint(playerId, 3, m_giftPosition[m_latestGiftPosition][0], m_giftPosition[m_latestGiftPosition][1], m_giftPosition[m_latestGiftPosition][2])) {
            this->givePlayerPresent(playerId);
            SendClientMessageToAll(Color::Green, "------------------------");
            SendClientMessageToAll(Color::Red, "A present has been dropped by Santa somewhere in Las Venturas! Try to find it!");
            SendClientMessageToAll(Color::Green, "------------------------");
        }
    }

    /**
     * Gives the player a random present and spawns a new one after a 5 seconds delay.
     *
     * @param playerId Id of the player we're giving a present to.
     */
    public givePlayerPresent(playerId) {
        new presentName[20], notice[100];
        switch (random(GiftHunting::MaximumGiftTypes)) {
            case 0: { /* Jetpack */
                presentName = "jetpack";
                SetPlayerSpecialAction(playerId, SPECIAL_ACTION_USEJETPACK);
            }
            case 1: { /* Rocket launcher */
                presentName = "rocket launcher";
                GiveWeapon(playerId, 35, 5);
            }
            case 2: { /* Chainsaw */
                presentName = "chainsaw";
                GiveWeapon(playerId, 9, 1);
            }
            case 3: { /* Heat-seeker */
                presentName = "heat-seeker";
                GiveWeapon(playerId, 36, 5);
            }
            case 4: { /* Minigun */
                presentName = "minigun";
                GiveWeapon(playerId, 38, 100);
            }
            case 5: { /* Flamethrower */
                presentName = "flamethrower";
                GiveWeapon(playerId, 37, 100);
            }
            case 6: { /* Fire extinguisher */
                presentName = "fire extinguisher";
                GiveWeapon(playerId, 42, 5000);
            }
            case 7: { /* Knife */
                presentName = "knife";
                GiveWeapon(playerId, 4, 1);
            }
            case 8: { /* Money ($3,000,000) */
                presentName = "$3,000,000";
                GivePlayerMoney(playerId, 3000000);
            }
            case 9: { /* Money ($1,000,000) */
                presentName = "$1,000,000";
                GivePlayerMoney(playerId, 1000000);
            }
            case 10: { /* Money ($500,000) */
                presentName = "$500,000";
                GivePlayerMoney(playerId, 500000);
            }
        }

        format(notice, sizeof(notice), "* HO! HO! HO! You found one of Santa's presents! Enjoy your %s!", presentName);
        SendClientMessage(playerId, Color::Green, notice);

        this->spawnNewPresent();
    }
}
