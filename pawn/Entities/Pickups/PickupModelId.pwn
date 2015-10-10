// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * In order to avoid having random model Ids scaterred all over the gamemode, we provide a mapping
 * between model Ids and textual representations describing said model.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
enum _: PickupModelId {
    // The blue house pickup is used to represent properties in Las Venturas Playground which are
    // currently being owned by a player on the server.
    BlueHousePickupId = 1272,

    // A green house pickup is used to represent a property which is available for purchase.
    GreenHousePickupId = 1273,

    // The rampage skull pickup is used to represent an ammunation checkpoint.
    AmmunationSkullPickupId = 1254,

    // The dollar pickup is used to represent the main bank checkpoint.
    MainBankDollarPickupId = 1274,

    // The information icon pickup is used to represent the information beacon.
    InformationBeaconPickupId = 1239
};
