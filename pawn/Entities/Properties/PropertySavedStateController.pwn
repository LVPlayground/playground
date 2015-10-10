// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * It's not unlikely that a player runs into a crash or timeout while playing SA-MP. This would
 * normally take away all their properties, which obviously is a bad user experience. In order to
 * make sure they have some time to reconnect, we save their property state for a limited amount of
 * time. Upon fast reconnect, they'll get their properties back.
 *
 * We store a certain amount of "state sets". Each set can be used by one player, and we cycle
 * through them, updating the oldest one. The Property Manager then re-assigns the properties to the
 * player again, unless it has been bought by another player in the meantime.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class PropertySavedStateController {
    // The number of state sets to store, i.e. slots to store property state in.
    const StateCollectionSize = 10;

    // After how many seconds will the staved property state for a user expire? Even if we can find
    // a player's information, after this threshold we simply won't return it anymore.
    const StateExpireTimeSeconds = 600;

    // An Id to indicate invalid slots in the state collection.
    const InvalidSlotId = -1;

    // The hash value belonging to the owner of a certain slot. It needs to reflect the computed
    // value by the hashForPlayer() method in this class.
    new m_hash[StateCollectionSize];

    // We store the time at which we wrote the data for this property because it times out after a
    // certain amount of time, as indicated by the StateExpireTimeSeconds constant.
    new m_storageTime[StateCollectionSize];

    // The properties which were owned by a player.
    new m_ownedProperties[StateCollectionSize][MAX_PROPERTIES];

    /**
     * Computes a hash value for the combination of the player's nickname and their IP address.
     *
     * @param playerId Id of the player to compute a hash for.
     * @return integer The computed hash value for this player.
     */
    private hashForPlayer(playerId) {
        new hashBuffer[MAX_PLAYER_NAME + /** size of ip address **/ 15 + /** null terminator **/ 1];
        new nameOffset = GetPlayerName(playerId, hashBuffer, sizeof(hashBuffer));
        strins(hashBuffer, Player(playerId)->ipAddressString(), nameOffset);

        return Command->hash(hashBuffer);
    }

    /**
     * Retrieves the stored properties for this player in the "properties" argument, which is
     * assumed to be of size player's property limit + 1.
     *
     * @param playerId Id of the player to retrieve stored properties for.
     * @param properties An array to store the retrieved properties in.
     * @return boolean Whether we were able to return any properties for this player.
     */
    public bool: retrieveForPlayer(playerId, properties[]) {
        new playerHash = this->hashForPlayer(playerId);
        new stateSlot = InvalidSlotId;

        // Try to locate the slot in the state collection which this player occupies.
        for (new slotId = 0; slotId < StateCollectionSize; ++slotId) {
            if (m_hash[slotId] != playerHash)
                continue;

            stateSlot = slotId;
            break;
        }

        // If no slot could be found, then clearly we don't have information on them.
        if (stateSlot == InvalidSlotId)
            return false;

        m_hash[stateSlot] = 0; // mark this slot as being available.

        // If the stored data in this slot is too old, then we won't return information either.
        if ((Time->currentTime() - m_storageTime[stateSlot]) > StateExpireTimeSeconds)
            return false;

        // Yay, we can restore the properties for this player. Well, unless another player bought
        // them in the meantime. But that's the job of the Property Manager.
        new propertyIndex = 0;
        for (; propertyIndex < MAX_PROPERTIES; ++propertyIndex) {
            properties[propertyIndex] = m_ownedProperties[stateSlot][propertyIndex];
            if (properties[propertyIndex] == Property::InvalidId)
                break;
        }

        properties[propertyIndex] = Property::InvalidId;
        return true;
    }

    /**
     * Stores the properties for the given player, made available in the properties array, in the
     * oldest entry available in the current state controller. We guarantee that the data for this
     * player will be stored in the saved state controller.
     *
     * @param playerId Id of the player for which we'll be storing property information.
     * @param properties An array of properties currently owned by this player.
     */
    public storeForPlayer(playerId, properties[]) {
        new oldestSlotTime = Time->currentTime(), stateSlot = 0;
        for (new slotId = 0; slotId < StateCollectionSize; ++slotId) {
            if (oldestSlotTime > m_storageTime[slotId]) {
                oldestSlotTime = m_storageTime[slotId];
                stateSlot = slotId;
            }

            if (m_hash[slotId] == 0) {
                stateSlot = slotId;
                break;
            }
        }

        // We're now guaranteed to have a slot available in stateSlot. Either an available one, or
        // the oldest one which we'll re-use. Fill it with our data, please.
        m_hash[stateSlot] = this->hashForPlayer(playerId);
        for (new propertyIndex = 0; propertyIndex < MAX_PROPERTIES; ++propertyIndex) {
            m_ownedProperties[stateSlot][propertyIndex] = properties[propertyIndex];
            if (properties[propertyIndex] == Property::InvalidId)
                break;
        }

        m_storageTime[stateSlot] = Time->currentTime();
    }
};
