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

/**
 * Time and weather on Las Venturas Playground is moving to a much more complicated system than it
 * ever had before, in which each player has a personalized environment based on where they are.
 */
#if Feature::EnableTimeProgression == 1
#include "Features/Environment/EnvironmentSettings.pwn"

#include "Features/Environment/Environment.pwn"

// The EnvironmentTile class encapsulates all more specific functionality in a much simpler class
// with convenient accessors. It needs to be declared after all the sub-system classes.
#include "Features/Environment/EnvironmentTile.pwn"

// Players will get their environment information updated based on their per-system settings and
// location. We process updates for each player every few seconds for better accuracy.
#include "Features/Environment/EnvironmentPlayer.pwn"
#endif

#include "Features/Environment/Time/TimeController.pwn"

// The information beacons are part of the LVP environment to help out players.
//#include "Features/Environment/InformationBeaconController.pwn"
// -------------------------------------------------------------------------------------------------

// TODO(Russell): Deprecated, remove these once we plucked the interesting bits.
#if 0
    #include "Features/Environment/Weather.pwn"
#endif
