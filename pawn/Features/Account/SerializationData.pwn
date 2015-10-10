// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * The SerializationData class is a small utility class for access to serialized data through LVP's
 * object model. Pass the serialization Id as the instance Id, and call the read/write functions as
 * you normally would.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class SerializationData <serializationId (1)> {
    // What is the Id of an invalid serialization data set?
    public const InvalidId = 0;

    /**
     * Creates a new data set and returns the handle Id to the caller.
     *
     * @return integer Id of the data set which is now available.
     */
    public static inline create() {
        return dataset_create();
    }

    /**
     * Destroys the current data set together with all the information stored within it.
     */
    public inline destroy() {
        dataset_destroy(serializationId);
    }

    /**
     * Reads an integer from the current serialization data set.
     *
     * @param field Name of the field under which this integer value has been stored.
     * @return integer The integer value which was stored in the data set.
     */
    public inline readInteger(field[]) {
        return dataset_read_integer(serializationId, field);
    }

    /**
     * Reads a float from the current serialization data set.
     *
     * @param field Name of the field under which the float value has been stored.
     * @return float The floating point value which was stored in the data set.
     */
    public inline Float: readFloat(field[]) {
        return dataset_read_float(serializationId, field);
    }

    /**
     * Stores an integer value in the current serialization data set.
     *
     * @param field Name of the field to store an integer under.
     * @param value Value of the integer as it should be stored in the data set.
     */
    public inline writeInteger(field[], value) {
        dataset_write_integer(serializationId, field, value);
    }

    /**
     * Stores a float value in the current serialization data set.
     *
     * @param field Name of the field to store a float under.
     * @param value Value of the float as it should be stored in the data set.
     */
    public inline writeFloat(field[], Float: value) {
        dataset_write_float(serializationId, field, value);
    }
};
