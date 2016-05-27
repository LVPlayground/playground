// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * In order to make testing Las Venturas Playground a little bit easier, most notably for the
 * developers, we have a series of commands which will only be available for beta tests.
 */
#if ReleaseSettings::EnableBetaCommands == 1
    #include "Features/Debug/BetaCommands.pwn"
#endif
