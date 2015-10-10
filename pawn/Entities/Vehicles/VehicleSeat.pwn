// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Enumeration for which seat a player can be placed in, or is currently located in. This allows us
 * to move away from using more magic integers around the sourcecode.
 */
enum _: VehicleSeat {
    DriverSeat = 0,
    FrontPassengerSeat = 1,
    LeftBackPassenger = 2,
    RightBackPassenger = 3,

    // Ids 4 and higher are available for busses, but we don't reserve enumerations for that.
};
