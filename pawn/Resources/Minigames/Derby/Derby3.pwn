// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/*******************************************************************************
                Las Venturas Playground v2.90 - Derby 2.
    This derby is a new derby to 2.90 and replaces the old (sucky)
    derby 3. Based off the SA:MP gamemode, RC Barnstorm, this derby
    consists of players spawning in rc barons.

*******************************************************************************/


#define DERBY3           3

derby_create(DERBY3)
{

    derby_set_id(DERBY3);

    derby_set_name("Tank Fights");

    derby_set_interior(0);

    derby_set_vehicle(432);

    derby_set_bounds(-1116.134, -1734.164, 436.2632, -680.1617);

    derby_toggle_blips(false);

    derby_countdown_mode(DERBY_COUNTDOWN_FREEZE);

    derby_add_spawn(-1483.8771, 1.1518, 14.1629, 135.3240);
    derby_add_spawn(-1470.0740, -91.3307, 14.1632, 73.0504);
    derby_add_spawn(-1519.4749, -154.1453, 14.1619, 73.0557);
    derby_add_spawn(-1585.9424, -222.8500, 14.1665, 1.9901);
    derby_add_spawn(-1643.1460, -177.5443, 14.1977, 353.7942);
    derby_add_spawn(-1527.2362, -175.8123, 14.1635, 17.8551);
    return 1;
}

