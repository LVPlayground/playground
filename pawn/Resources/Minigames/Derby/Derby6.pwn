// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/*******************************************************************************
                Las Venturas Playground v2.90 - Derby 6.
    Consiting of hunters, this is a fun derby were players have to shoot
    eachother down.

*******************************************************************************/


#define DERBY6           6

derby_create(DERBY6)
{

    derby_set_id(DERBY6);

    derby_set_name("Hunter");

    derby_set_interior(0);

    derby_set_vehicle(425);

    derby_countdown_mode(DERBY_COUNTDOWN_FREEZE);

    derby_add_spawn(-74.0677,2490.2827,16.2115,271.0882);
    derby_add_spawn(153.8008,2549.7651,16.1754,187.7806);
    derby_add_spawn(255.8212,2454.8008,16.2116,13.3615);
    derby_add_spawn(428.6800,2506.9080,16.2114,83.3587);
    derby_add_spawn(351.7470,2622.3374,16.1083,180.1356);
    return 1;
}

