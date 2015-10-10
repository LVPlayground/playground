// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * To what extend should the player's data be serialized? Features are able to request specific
 * parts of a player's state to be serialized. Some constants are also available for more common
 * composited serialization levels.
 */
enum SerializationLevel {
    // Serializes information about the player's location. This includes their position, rotation,
    // interior, and virtual world, although we currently force that to be the main world.
    LocationSerialization = 0x001,

    // Serializes the player's weapon state. Upon unserializing, whatever weapons they have will be
    // removed and the previous weapons will be re-instated.
    WeaponSerialization = 0x002,

    // ---------------------------------------------------------------------------------------------
    // Aggregate serialization levels.

    // A basic serialization will store a player's location and weapon state.
    BasicSerialization = LocationSerialization | WeaponSerialization,

    // Complete serializations are used when a player disconnects from Las Venturas Playground and
    // returns within ten minutes, allowing us to completely restore their state.
    CompleteSerialization = BasicSerialization,
};

/**
 * The player serialization system completely replaces the old "savehandler" system, used to take a
 * snapshot of a player's state for a limited amount of time. The system will both deal with players
 * who disconnect from the server and reconnect shortly after, as well as temporary situations
 * such as a player standing on the ship, or participating in a minigame.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class SerializationManager {
    // The serialization level key used in the serialization data.
    const SerializationLevelKey = "serlvl";

    /**
     * Serializes the player's state per the level passed on to this method. The returned value is
     * a serialization dataset Id which can be used to restore the player's state later on. When
     * calling this method, you gain OWNERSHIP of the data set. This means it's up to your feature
     * to destroy the set again.
     *
     * See the comments near entries in the SerializationLevel enumeration for information on what
     * kind of information each serialization level contains.
     *
     * @param playerId Id of the player to serialize the current state of.
     * @param level Granularity of information which should be stored in the dataset.
     * @return integer Id of the serialization data as it has been stored in memory.
     */
    public serializePlayer(playerId, SerializationLevel: level = BasicSerialization) {
        new serializationId = dataset_create();

        // Write the serialization level to the data set as we'll want to retrieve that later on.
        SerializationData(serializationId)->writeInteger(SerializationLevelKey, _: level);

        // Fire off an annotation list to all serialization listeners requesting them to push their
        // data to the set may it apply to the level as indicated by the caller.
        Annotation::ExpandList<OnSerializePlayer>(playerId, serializationId, level);

        return serializationId;
    }

    /**
     * Restores a player's state with that contained within the serialized data set. All features
     * with serializable data will be invoked and asked to restore the player's state.
     *
     * @param playerId Id of the player who's data should be unserialized.
     * @param serializationId Id of the data set which contains the player's data.
     * @return boolean Was the information of this player successfully restored?
     */
    public bool: restorePlayer(playerId, serializationId) {
        new SerializationLevel: level = SerializationLevel: SerializationData(serializationId)->readInteger(SerializationLevelKey);
        if (level == SerializationLevel: -1)
            return false; // we could not read the serialization level, invalid data set.

        // Fire off an annotation list to all handlers which can unserialize data. They will be
        // responsible for clearing whatever state the player previously had.
        Annotation::ExpandList<OnRestorePlayer>(playerId, serializationId, level);

        // Destroy the serialization Id to free up the memory it previously took.
        dataset_destroy(serializationId);
        return true;
    }
};
