// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * It's safe to assume that the roaming deathmatchers of Las Venturas Playground are prepared for a
 * fight, meaning one will always be carrying several weapons. If one player manages to kill an other,
 * it's nice to have some sort of reward in return. In this case, we'll be giving players the possibility
 * to obtain weapons and cash from the fallen fighters, which will appear as pick-ups around the player's
 * corpse. These pick-ups will only sustain for a limited duration before they're ultimately destroyed.
 *
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 */
class DropWeaponsCashHandler {
    // We are a category of pickups and thus need to have our own Id with the pickup controller.
    public const DroppedObjectHandlerId = @counter(PickupHandler);

    // We store the pickup Id of each weapon the killed player drops.
    new m_pickupWeaponPickupId[WeaponSlots][MAX_PLAYERS];

    // We store the weapon Id of each weapon the killed player drops.
    new m_pickupWeaponId[WeaponSlots][MAX_PLAYERS];

    // We store the ammo amount of each weapon the killed player drops.
    new m_pickupWeaponAmmo[WeaponSlots][MAX_PLAYERS];

    // The pick model Id for the briefcase object used for dropped cash.
    const CashPickupModelId = 1210;

    // We store the pickup Id of the cash object the killed player drops.
    new m_pickupCashPickupId[MAX_PLAYERS];

    // We store half the amount of cash the killed player drops.
    new m_pickupCashAmount[MAX_PLAYERS];

    // Keep track of the duration the pickups exists.
    new m_droppedObjectTimer[MAX_PLAYERS];

    /**
     * When a player picks up one of the dropped object pickups, we first have to decide which weapon
     * slot this weapon resides in. Then we check if the player is carrying the same weapon, or no
     * weapon at all. If true, the gun with corresponding ammo is given to the player.
     *
     * For cash, we just have to transfer the amount of money to the player who picked it up.
     *
     * @param playerId Id of the player who picked up the dropped weapon.
     * @param pickupId Id of the picked up weapon.
     * @param extraId Additional Id allowing features to route this pickup.
     */
    @switch(OnPlayerEnterPickup, DropWeaponsCashHandler::DroppedObjectHandlerId)
    public onPlayerPickUpStatue(playerId, pickupId, extraId) {
        new weaponId, ammunition;
        for (new player = 0; player <= PlayerManager->highestPlayerId(); player++) {
            // We find the pickupId related to a player's dropped weapon slot.
            for (new weaponSlot = 0; weaponSlot < WeaponSlots; ++weaponSlot) {
                // Determine the weapon slot.
                if (m_pickupWeaponPickupId[weaponSlot][player] != pickupId)
                    continue;

                new const armedWeapon = GetPlayerWeapon(player);

                // If the player carries no weapon in the desired weapon slot, we give him the weapon
                // and corresponding ammo. Else, we just raise the ammo for their weapon.
                GetPlayerWeaponData(playerId, weaponSlot, weaponId, ammunition);
                if (weaponId == 0)
                    GiveWeapon(playerId, m_pickupWeaponId[weaponSlot][player], m_pickupWeaponAmmo[weaponSlot][player]);
                else
                    GiveWeapon(playerId, weaponId, m_pickupWeaponAmmo[weaponSlot][player]);

                SetPlayerArmedWeapon(player, armedWeapon);

                // Destroy the pickup and reset all values.
                PickupController->destroyPickup(DropWeaponsCashHandler::DroppedObjectHandlerId,
                    m_pickupWeaponPickupId[weaponSlot][player]);

                m_pickupWeaponPickupId[weaponSlot][player] = PickupController::InvalidId;
                m_pickupWeaponId[weaponSlot][player] = 0;
                m_pickupWeaponAmmo[weaponSlot][player] = 0;
                return 1;
            }

            if (m_pickupCashPickupId[player] == pickupId) {
                GivePlayerMoney(playerId, m_pickupCashAmount[player]);  // percentage controled w/ DeathDropMoneyPercentage

                PickupController->destroyPickup(DropWeaponsCashHandler::DroppedObjectHandlerId,
                    m_pickupCashPickupId[player]);

                m_pickupCashPickupId[player] = PickupController::InvalidId;
                m_pickupCashAmount[player] = 0;
                return 1;
            }
        }

        return 1;
        #pragma unused extraId
    }

    /**
     * When a player dies, we check for any weapons being carried and drop them accordingly. We only
     * process weapons from certain slots, since we don't want the ground to be scattered with a bunch
     * of random objects.
     *
     * @param playerId Id of the player who died.
     * @param killerId Id of the killer, or INVALID_PLAYER_ID if none.
     * @param reason Id of the reason for the playerId's death.
     */
    @list(OnPlayerDeath)
    public dropPlayerWeaponsCash(playerId, killerId, reason) {
        if (!IsPlayerInMainWorld(playerId))
            return 0;

        // First we run a little loop to destroy any existing pickups, which will be bugged if we don't.
        for (new weaponSlot = 0; weaponSlot < WeaponSlots; ++weaponSlot) {
            if (m_pickupWeaponPickupId[weaponSlot][playerId] == PickupController::InvalidId)
                continue;

            // Destroy the pickup and reset all values.
            PickupController->destroyPickup(DropWeaponsCashHandler::DroppedObjectHandlerId,
                m_pickupWeaponPickupId[weaponSlot][playerId]);

            m_pickupWeaponPickupId[weaponSlot][playerId] = PickupController::InvalidId;
            m_pickupWeaponId[weaponSlot][playerId] = 0;
            m_pickupWeaponAmmo[weaponSlot][playerId] = 0;
        }

        if (m_pickupCashPickupId[playerId] != PickupController::InvalidId) {
            PickupController->destroyPickup(DropWeaponsCashHandler::DroppedObjectHandlerId,
                m_pickupCashPickupId[playerId]);

            m_pickupCashPickupId[playerId] = PickupController::InvalidId;
            m_pickupCashAmount[playerId] = 0;
        }

        // Get the position of the killed player (playerId).
        new Float: dropPosition[3];
        GetPlayerPos(playerId, dropPosition[0], dropPosition[1], dropPosition[2]);

        // Check the popular weapon slots for any active weapons.
        for (new weaponSlot = 0; weaponSlot < WeaponSlots; ++weaponSlot) {
            // Only save the weapons from the popular slots (2 to 6, 8 and 9).
            if (weaponSlot <= 1 || weaponSlot == 7 || weaponSlot > 9)
                continue;

            GetPlayerWeaponData(playerId, weaponSlot, m_pickupWeaponId[weaponSlot][playerId],
                m_pickupWeaponAmmo[weaponSlot][playerId]);

            // Only handle slots which are actually occupied.
            if (m_pickupWeaponId[weaponSlot][playerId] == 0 || m_pickupWeaponAmmo[weaponSlot][playerId] == 0)
                continue;

            // Create the persistent pickups, and save the unique pickupId.
            m_pickupWeaponPickupId[weaponSlot][playerId] = PickupController->createPickup(
                DropWeaponsCashHandler::DroppedObjectHandlerId,
                WeaponUtilities->getWeaponModel(m_pickupWeaponId[weaponSlot][playerId]), PersistentPickupType,
                dropPosition[0] + random(5), dropPosition[1] + random(5), dropPosition[2],
                GetPlayerVirtualWorld(playerId));
        }

        // Create the persistent cash pickup, and save the unique pickupId.
        m_pickupCashPickupId[playerId] = PickupController->createPickup(DropWeaponsCashHandler::DroppedObjectHandlerId,
            CashPickupModelId, PersistentPickupType, dropPosition[0] + random(5), dropPosition[1] + random(5),
            dropPosition[2], GetPlayerVirtualWorld(playerId));

        // We save half of the dropped amount.
        m_pickupCashAmount[playerId] = floatround(float(GetPlayerMoney(playerId)) * (GetEconomyValue(DeathDropMoneyPercentage) / 100.0));

        m_droppedObjectTimer[playerId] = Time->currentTime();

        ResetPlayerWeapons(playerId);
        ResetPlayerMoney(playerId);

        return 1;
        #pragma unused killerId, reason
    }

    /**
     * Destroy the pickups 15 seconds after creation if they still haven't been picked up.
     *
     * @param playerId Id of the player who were are doing this check for.
     */
    @list(SecondTimerPerPlayer)
    public processDroppedWeapons(playerId) {
        if (m_droppedObjectTimer[playerId] != 0 && Time->currentTime() - m_droppedObjectTimer[playerId] > 15) {
            for (new weaponSlot = 0; weaponSlot < WeaponSlots; ++weaponSlot) {
                if (m_pickupWeaponPickupId[weaponSlot][playerId] == PickupController::InvalidId)
                    continue;

                // Destroy the pickup and reset all values.
                PickupController->destroyPickup(DropWeaponsCashHandler::DroppedObjectHandlerId,
                    m_pickupWeaponPickupId[weaponSlot][playerId]);

                m_pickupWeaponPickupId[weaponSlot][playerId] = PickupController::InvalidId;
                m_pickupWeaponId[weaponSlot][playerId] = 0;
                m_pickupWeaponAmmo[weaponSlot][playerId] = 0;
            }

            if (m_pickupCashPickupId[playerId] != PickupController::InvalidId) {
                PickupController->destroyPickup(DropWeaponsCashHandler::DroppedObjectHandlerId,
                    m_pickupCashPickupId[playerId]);

                m_pickupCashPickupId[playerId] = PickupController::InvalidId;
                m_pickupCashAmount[playerId] = 0;
            }

            m_droppedObjectTimer[playerId] = 0;
        }

        return 1;
    }

    /**
     * Reset all the values related to weapon pickups to their default value. This will be called 
     * when a player joins the server.
     *
     * @param playerId Id of the player connecting to the server.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect(playerId) {
        for (new weaponSlot = 0; weaponSlot < WeaponSlots; ++weaponSlot) {
            m_pickupWeaponPickupId[weaponSlot][playerId] = PickupController::InvalidId;
            m_pickupWeaponId[weaponSlot][playerId] = 0;
            m_pickupWeaponAmmo[weaponSlot][playerId] = 0;
        }

        m_pickupCashPickupId[playerId] = PickupController::InvalidId;
        m_pickupCashAmount[playerId] = 0;

        m_droppedObjectTimer[playerId] = 0;

        return 1;
    }

    /**
     * Reset all the values related to weapon pickups to their default value when a player disconnects
     * from the server. We do this check because pickups might still be active when a player leaves.
     *
     * @param playerId Id of the player disconnecting from the server.
     */
    @list(OnPlayerDisconnect)
    public onPlayerDisconnect(playerId) {
        for (new weaponSlot = 0; weaponSlot < WeaponSlots; ++weaponSlot) {
            if (m_pickupWeaponPickupId[weaponSlot][playerId] != PickupController::InvalidId) {
                PickupController->destroyPickup(DropWeaponsCashHandler::DroppedObjectHandlerId,
                    m_pickupWeaponPickupId[weaponSlot][playerId]);
                m_pickupWeaponPickupId[weaponSlot][playerId] = PickupController::InvalidId;
            }

            m_pickupWeaponId[weaponSlot][playerId] = 0;
            m_pickupWeaponAmmo[weaponSlot][playerId] = 0;
        }

        if (m_pickupCashPickupId[playerId] != PickupController::InvalidId) {
            PickupController->destroyPickup(DropWeaponsCashHandler::DroppedObjectHandlerId,
                m_pickupCashPickupId[playerId]);

            m_pickupCashPickupId[playerId] = PickupController::InvalidId;
        }

        m_pickupCashAmount[playerId] = 0;

        m_droppedObjectTimer[playerId] = 0;

        return 1;
    }
};
