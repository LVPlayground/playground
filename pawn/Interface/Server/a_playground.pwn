// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * Dataset functions
 *
 * It's possible to store arbitrary amounts of data using the dataset functions. Create a new data
 * set and push data to it, in any of the scalar types supported by Pawn. When you need the data
 * again, simply read data from the set again using the available natives.
 */
native dataset_create();
native dataset_destroy(dataId);

native dataset_write_integer(dataId, key[], value);
native dataset_write_float(dataId, key[], Float: value);
native dataset_write_string(dataId, key[], value[]);

native dataset_read_integer(dataId, key[]);
native Float: dataset_read_float(dataId, key[]);
native dataset_read_string(dataId, key[], buffer[], bufferSize=sizeof(buffer));

/**
 * Serializable player states
 *
 * We serialize the player states when a player disconnects, and store the player's IP address and
 * nickname as the key, with the dataset Id containing their state as the value. Provide fast
 * methods for storing and finding this data. These features take OWNERSHIP of the datasets passed
 * in the arguments, so there will be no further need to call dataset_destroy().
 */
native player_serializable_state_set(nickname[], ip[], dataId, expireTime=300);
native player_serializable_state_find(nickname[], ip[]);

/**
 * Maintenance functions
 *
 * The playground_prune() method should be called every minute or so, giving the plugin a chance to
 * clean up its internal state and storage.
 */
native playground_prune(bool: reset = false);
