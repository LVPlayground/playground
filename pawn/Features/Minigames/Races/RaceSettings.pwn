// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * How many race tracks can exist on Las Venturas Playground? This number will also be equal to the
 * highest possible race Id minus one. Not all of the race's data will be loaded immediately, as we
 * lazily fetch that information from the database.
 */
const MaximumNumberOfRaceTracks = 20;
