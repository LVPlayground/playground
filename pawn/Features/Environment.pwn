// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * We have various trains driving around Las Venturas Playground, each of which is being driven by
 * an automated non-player character. The same applies to the transportation planes, which are able
 * to fly players around San Andreas. The ServiceController is in charge of them.
 */
#include "Features/Environment/Services/ServiceSettings.pwn"
#include "Features/Environment/Services/Gunther.pwn"
#include "Features/Environment/Services/PlanePilot.pwn"
#include "Features/Environment/Services/TrainDriver.pwn"
#include "Features/Environment/Services/ServiceController.pwn"

/**
 * We'll want to keep track of whether the player is on a certain area of the map, for example in
 * a casino or in a pay and spray. Various helper classes are available to do just that.
 */
#include "Features/Environment/Area/CasinoArea.pwn"
#include "Features/Environment/Area/PayAndSprayShops.pwn"

#include "Features/Environment/Time/TimeController.pwn"

// The information beacons are part of the LVP environment to help out players.
//#include "Features/Environment/InformationBeaconController.pwn"

#include "Features/Environment/MapObjects.pwn"
