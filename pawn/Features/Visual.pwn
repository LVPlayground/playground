// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

// A control system for visual on-screen countdowns. There are two types of said control, namely one
// which is shared among players and a more prominent countdown which is specific to a player.
#include "Features/Visual/Countdown.pwn"

// In the Spawn Selection screen, players won't be able to click on the Spawn button until they have
// logged in to their account. We'd like to show them a message informing them of that fact.
#include "Features/Visual/NeedToIdentifyForSpawnMessage.pwn"

// The Visual Interface class curates the most basic interface elements of Las Venturas Playground,
// i.e. any logos and effects which should be on the player's screen for longer periods of time.
#include "Features/Visual/Interface.pwn"
