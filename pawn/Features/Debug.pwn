// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * As a useful aid in debugging overflow crashes, the server is able to connect any number of bots
 * during start-up. As a consequence of their presence, any actual human connecting to the server
 * will get at least the [number of bots] + 1 as their player Id.
 *
 * @feature Startup Bots
 * @category Debug
 * @author Russell Krupke <russell@sa-mp.nl>
 */
#include "Features/Debug/StartupBots.pwn"

/**
 * In order to make testing Las Venturas Playground a little bit easier, most notably for the
 * developers, we have a series of commands which will only be available for beta tests.
 */
#if ReleaseSettings::EnableBetaCommands == 1
    #include "Features/Debug/BetaCommands.pwn"
#endif
