// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Provides a textual mapping of the numeric pickup types exposed by San Andreas: Multiplayer in
 * order to make our code more readable. One of these needs to be used when creating pickups through
 * the Pickup Controller.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
enum PickupType {
    // The pickup will always exist in San Andreas, but default actions executed by GTA will be
    // disabled. This is most likely the pickup type you're looking for.
    PersistentPickupType = 1,
};
