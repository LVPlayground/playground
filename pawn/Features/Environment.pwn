// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * We have various trains driving around Las Venturas Playground, each of which is being driven by
 * an automated non-player character. The same applies to the transportation planes, which are able
 * to fly players around San Andreas. The ServiceController is in charge of them.
 */
#include "Features/Environment/Services/ServiceSettings.pwn"
#include "Features/Environment/Services/TrainDriver.pwn"
#include "Features/Environment/Services/ServiceController.pwn"

#include "Features/Environment/Time/TimeController.pwn"
